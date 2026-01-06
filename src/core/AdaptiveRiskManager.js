import { config } from '../utils/ConfigManager.js';
import { alpacaClient } from '../utils/AlpacaClient.js';
import { discordNotifier } from '../utils/DiscordNotifier.js';
import { technicalAnalysis } from '../analysis/TechnicalAnalysis.js';

export class AdaptiveRiskManager {
  constructor() {
    this.startingEquity = 0;
    this.dailyStartEquity = 0;
    this.maxPositions = config.trading.maxConcurrentPositions;
    this.basePositionSizePercent = config.trading.maxPositionSizePercent;
    this.baseStopLossPercent = config.trading.stopLossPercent;
    this.baseTakeProfitPercent = config.trading.takeProfitPercent;
    this.dailyLossLimitPercent = config.trading.dailyLossLimitPercent;
    this.positionCount = 0;
    this.dailyTrades = [];
    this.isEmergencyStop = false;
    this.marketSentiment = null;
    this.symbolLocks = new Map();
    this.consecutiveLosses = 0;
    this.currentPositionSizeMultiplier = 1.0;
    this.portfolioHeat = 0;
    this.maxPortfolioHeat = 15; // Max 15% total risk
  }

  async initialize() {
    const account = await alpacaClient.getAccount();
    this.startingEquity = parseFloat(account.equity);
    this.dailyStartEquity = parseFloat(account.last_equity);
    await this.updatePositionCount();
  }

  async updatePositionCount() {
    await alpacaClient.updatePositions();
    this.positionCount = alpacaClient.positions.size;
    await this.calculatePortfolioHeat();
  }

  // SYMBOL LOCKING - Prevents conflicts
  acquireLock(symbol, strategy, timeout = 60000) {
    const existing = this.symbolLocks.get(symbol);

    if (existing && Date.now() - existing.timestamp < timeout) {
      console.log(`Symbol ${symbol} locked by ${existing.strategy}`);
      return false;
    }

    this.symbolLocks.set(symbol, {
      strategy: strategy,
      timestamp: Date.now()
    });

    return true;
  }

  releaseLock(symbol) {
    this.symbolLocks.delete(symbol);
  }

  cleanExpiredLocks() {
    const now = Date.now();
    for (const [symbol, lock] of this.symbolLocks.entries()) {
      if (now - lock.timestamp > 60000) {
        this.symbolLocks.delete(symbol);
      }
    }
  }

  // ADAPTIVE STOP-LOSS based on ATR (volatility)
  async calculateAdaptiveStopLoss(symbol, entryPrice, bars) {
    const atr = technicalAnalysis.calculateATR(bars, 14);

    if (!atr || isNaN(atr)) {
      console.log(`Adaptive SL for ${symbol}: ${this.baseStopLossPercent.toFixed(2)}% (using base, ATR unavailable)`);
      return entryPrice * (1 - this.baseStopLossPercent / 100);
    }

    // ATR-based stop: 2x ATR or min 2%
    const atrPercent = (atr / entryPrice) * 100;
    const stopLossPercent = Math.max(atrPercent * 2, this.baseStopLossPercent);

    // Cap at 5% max
    const finalStopLossPercent = Math.min(stopLossPercent, 5);

    console.log(`Adaptive SL for ${symbol}: ${finalStopLossPercent.toFixed(2)}% (ATR: ${atrPercent.toFixed(2)}%)`);

    return entryPrice * (1 - finalStopLossPercent / 100);
  }

  // ADAPTIVE TAKE-PROFIT based on volatility
  async calculateAdaptiveTakeProfit(symbol, entryPrice, bars) {
    const atr = technicalAnalysis.calculateATR(bars, 14);

    if (!atr || isNaN(atr)) {
      console.log(`Adaptive TP for ${symbol}: ${this.baseTakeProfitPercent.toFixed(2)}% (using base, ATR unavailable)`);
      return entryPrice * (1 + this.baseTakeProfitPercent / 100);
    }

    // ATR-based target: 3x ATR or min 3%
    const atrPercent = (atr / entryPrice) * 100;
    const takeProfitPercent = Math.max(atrPercent * 3, this.baseTakeProfitPercent);

    // Cap at 10% max for realistic targets
    const finalTakeProfitPercent = Math.min(takeProfitPercent, 10);

    console.log(`Adaptive TP for ${symbol}: ${finalTakeProfitPercent.toFixed(2)}% (ATR: ${atrPercent.toFixed(2)}%)`);

    return entryPrice * (1 + finalTakeProfitPercent / 100);
  }

  // DRAWDOWN PROTECTION - Reduce size after losses
  recordTradeResult(isWin) {
    if (isWin) {
      this.consecutiveLosses = 0;
      this.currentPositionSizeMultiplier = 1.0;
    } else {
      this.consecutiveLosses++;

      if (this.consecutiveLosses >= 2) {
        this.currentPositionSizeMultiplier = 0.66; // 10% -> 6.6%
        console.log(`Drawdown protection: Position size reduced to ${(this.basePositionSizePercent * this.currentPositionSizeMultiplier).toFixed(1)}%`);
      }

      if (this.consecutiveLosses >= 3) {
        this.currentPositionSizeMultiplier = 0.33; // 10% -> 3.3%
        console.log(`⚠️ 3 consecutive losses! Position size reduced to ${(this.basePositionSizePercent * this.currentPositionSizeMultiplier).toFixed(1)}%`);
      }

      if (this.consecutiveLosses >= 5) {
        this.triggerEmergencyStop('5 consecutive losses - pausing trading for 1 hour');
        setTimeout(() => {
          this.resetEmergencyStop();
          this.consecutiveLosses = 0;
          this.currentPositionSizeMultiplier = 1.0;
        }, 60 * 60 * 1000); // 1 hour
      }
    }
  }

  // SENTIMENT-BASED POSITION SIZING
  updateSentiment(sentiment) {
    this.marketSentiment = sentiment;
  }

  getSentimentMultiplier() {
    if (!this.marketSentiment) return 1.0;

    const overall = this.marketSentiment.overall;

    if (overall >= 70) return 1.2; // VERY BULLISH: +20%
    if (overall >= 60) return 1.1; // BULLISH: +10%
    if (overall >= 40) return 1.0; // NEUTRAL
    if (overall >= 30) return 0.8; // BEARISH: -20%
    return 0.6; // VERY BEARISH: -40%
  }

  // PORTFOLIO HEAT MANAGEMENT
  async calculatePortfolioHeat() {
    await alpacaClient.updatePositions();
    const positions = Array.from(alpacaClient.positions.values());

    let totalHeat = 0;

    for (const pos of positions) {
      const entryPrice = parseFloat(pos.avg_entry_price);
      const currentPrice = parseFloat(pos.current_price);
      const qty = Math.abs(parseFloat(pos.qty));

      // Estimate stop-loss distance (assume 2.5% for existing positions)
      const stopLossDistance = entryPrice * (this.baseStopLossPercent / 100);
      const positionRisk = stopLossDistance * qty;

      // Convert to portfolio percentage
      const riskPercent = (positionRisk / this.startingEquity) * 100;
      totalHeat += riskPercent;
    }

    this.portfolioHeat = totalHeat;
    return totalHeat;
  }

  async canOpenPosition(estimatedStopLossPercent = 2.5) {
    await this.updatePositionCount();

    if (this.isEmergencyStop) {
      console.log('Emergency stop active - no new positions allowed');
      return false;
    }

    if (this.positionCount >= this.maxPositions) {
      console.log(`Max positions reached (${this.maxPositions})`);
      return false;
    }

    // Portfolio heat check
    const newPositionHeat = estimatedStopLossPercent;
    if (this.portfolioHeat + newPositionHeat > this.maxPortfolioHeat) {
      console.log(`Portfolio heat too high: ${this.portfolioHeat.toFixed(1)}% + ${newPositionHeat}% > ${this.maxPortfolioHeat}%`);
      return false;
    }

    const account = await alpacaClient.getAccount();
    const currentEquity = parseFloat(account.equity);
    const dailyPL = currentEquity - this.dailyStartEquity;
    const dailyPLPercent = (dailyPL / this.dailyStartEquity) * 100;

    if (dailyPLPercent <= -this.dailyLossLimitPercent) {
      await this.triggerEmergencyStop(`Daily loss limit reached: ${dailyPLPercent.toFixed(2)}%`);
      return false;
    }

    const buyingPower = parseFloat(account.buying_power);
    if (buyingPower < 100) {
      console.log('Insufficient buying power');
      return false;
    }

    return true;
  }

  async calculatePositionSize(currentPrice) {
    const account = await alpacaClient.getAccount();
    const portfolioValue = parseFloat(account.equity);

    // Base size
    let positionSizePercent = this.basePositionSizePercent;

    // Apply drawdown protection multiplier
    positionSizePercent *= this.currentPositionSizeMultiplier;

    // Apply sentiment multiplier
    positionSizePercent *= this.getSentimentMultiplier();

    console.log(`Position size: ${this.basePositionSizePercent}% * ${this.currentPositionSizeMultiplier.toFixed(2)} (drawdown) * ${this.getSentimentMultiplier().toFixed(2)} (sentiment) = ${positionSizePercent.toFixed(2)}%`);

    const maxPositionValue = portfolioValue * (positionSizePercent / 100);
    const buyingPower = parseFloat(account.buying_power);
    const availableCapital = Math.min(maxPositionValue, buyingPower);

    return availableCapital * 0.95;
  }

  async checkDailyLossLimit() {
    const account = await alpacaClient.getAccount();
    const currentEquity = parseFloat(account.equity);
    const dailyPL = currentEquity - this.dailyStartEquity;
    const dailyPLPercent = (dailyPL / this.dailyStartEquity) * 100;

    if (dailyPLPercent <= -this.dailyLossLimitPercent) {
      await this.triggerEmergencyStop(`Daily loss limit reached: ${dailyPLPercent.toFixed(2)}%`);
      return false;
    }

    return true;
  }

  async triggerEmergencyStop(reason) {
    this.isEmergencyStop = true;
    console.log(`🛑 EMERGENCY STOP TRIGGERED: ${reason}`);

    try {
      await alpacaClient.cancelAllOrders();
      await discordNotifier.sendError('EMERGENCY STOP TRIGGERED', new Error(reason));
    } catch (error) {
      console.error('Error during emergency stop:', error);
    }
  }

  resetEmergencyStop() {
    this.isEmergencyStop = false;
    console.log('Emergency stop reset');
  }

  async resetDailyCounters() {
    const account = await alpacaClient.getAccount();
    this.dailyStartEquity = parseFloat(account.equity);
    this.dailyTrades = [];
    this.isEmergencyStop = false;
    this.consecutiveLosses = 0;
    this.currentPositionSizeMultiplier = 1.0;
    console.log('Daily counters reset');
  }

  recordTrade(trade) {
    this.dailyTrades.push({
      ...trade,
      timestamp: new Date()
    });
  }

  getDailyStats() {
    const winningTrades = this.dailyTrades.filter(t => t.pl && t.pl > 0);
    const losingTrades = this.dailyTrades.filter(t => t.pl && t.pl < 0);
    const totalPL = this.dailyTrades.reduce((sum, t) => sum + (t.pl || 0), 0);

    return {
      totalTrades: this.dailyTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: this.dailyTrades.length > 0 ? (winningTrades.length / this.dailyTrades.length) * 100 : 0,
      totalPL: totalPL,
      currentPositions: this.positionCount
    };
  }

  async getPortfolioSummary() {
    const account = await alpacaClient.getAccount();
    const currentEquity = parseFloat(account.equity);
    const dailyPL = currentEquity - this.dailyStartEquity;
    const dailyPLPercent = (dailyPL / this.dailyStartEquity) * 100;

    return {
      equity: currentEquity,
      buyingPower: parseFloat(account.buying_power),
      dailyPL: dailyPL,
      dailyPLPercent: dailyPLPercent,
      positions: this.positionCount,
      trades: this.dailyTrades.length,
      emergencyStop: this.isEmergencyStop,
      portfolioHeat: this.portfolioHeat,
      consecutiveLosses: this.consecutiveLosses,
      positionSizeMultiplier: this.currentPositionSizeMultiplier
    };
  }
}

export const adaptiveRiskManager = new AdaptiveRiskManager();
