import { config } from '../utils/ConfigManager.js';
import { alpacaClient } from '../utils/AlpacaClient.js';
import { discordNotifier } from '../utils/DiscordNotifier.js';

export class RiskManager {
  constructor() {
    this.startingEquity = 0;
    this.dailyStartEquity = 0;
    this.maxPositions = config.trading.maxConcurrentPositions;
    this.maxPositionSizePercent = config.trading.maxPositionSizePercent;
    this.stopLossPercent = config.trading.stopLossPercent;
    this.dailyLossLimitPercent = config.trading.dailyLossLimitPercent;
    this.positionCount = 0;
    this.dailyTrades = [];
    this.isEmergencyStop = false;
    this.marketSentiment = null;
    this.symbolLocks = new Map(); // Symbol locking for decision exclusivity
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
  }

  async canOpenPosition() {
    await this.updatePositionCount();

    if (this.isEmergencyStop) {
      console.log('Emergency stop active - no new positions allowed');
      return false;
    }

    if (this.positionCount >= this.maxPositions) {
      console.log(`Max positions reached (${this.maxPositions})`);
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

    const maxPositionValue = portfolioValue * (this.maxPositionSizePercent / 100);

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

    console.log(`EMERGENCY STOP TRIGGERED: ${reason}`);

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
      emergencyStop: this.isEmergencyStop
    };
  }
}

export const riskManager = new RiskManager();
