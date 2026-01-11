import { discordNotifier } from '../utils/DiscordNotifier.js';
import { historicalDataManager } from './HistoricalDataManager.js';

export class PortfolioTracker {
  constructor() {
    this.trades = [];
    this.dailyTrades = [];
    this.closedPositions = [];
    this.allTimeClosedPositions = []; // Lifetime tracking (in-memory)
    this.realizedPL = 0;
    this.dailyRealizedPL = 0;
    this.startingEquity = 0;
    this.dailyStartEquity = 0;
    this.openPositionMap = new Map(); // Track entry details for realized P/L
    this.client = null; // Will be set by TradingEngine
  }

  setClient(client) {
    this.client = client;
  }

  async initialize() {
    if (!this.client) {
      throw new Error('PortfolioTracker: Client not set. Call setClient() first.');
    }
    const account = await this.client.getAccount();
    this.startingEquity = parseFloat(account.equity);
    this.dailyStartEquity = parseFloat(account.last_equity || account.equity);
  }

  recordTrade(trade) {
    const tradeRecord = {
      ...trade,
      timestamp: new Date()
    };

    this.trades.push(tradeRecord);
    this.dailyTrades.push(tradeRecord);

    // Track entry for realized P/L calculation
    if (trade.action === 'BUY' || trade.side === 'buy') {
      this.openPositionMap.set(trade.symbol, {
        entryPrice: trade.price,
        qty: trade.qty || 1,
        timestamp: new Date()
      });
    }
  }

  recordClosedPosition(symbol, exitPrice, qty) {
    const entry = this.openPositionMap.get(symbol);

    if (!entry) {
      console.log(`Warning: No entry found for ${symbol}, cannot calculate realized P/L`);
      return;
    }

    const realizedPL = (exitPrice - entry.entryPrice) * qty;
    const realizedPLPercent = ((exitPrice - entry.entryPrice) / entry.entryPrice) * 100;

    const closedPos = {
      symbol: symbol,
      qty: qty,
      entryPrice: entry.entryPrice,
      exitPrice: exitPrice,
      pl: realizedPL,
      plPercent: realizedPLPercent,
      holdTime: new Date() - entry.timestamp,
      timestamp: new Date()
    };

    this.closedPositions.push(closedPos);
    this.allTimeClosedPositions.push(closedPos); // Track lifetime (in-memory)
    this.realizedPL += realizedPL;
    this.dailyRealizedPL += realizedPL;

    // Save to persistent historical data
    historicalDataManager.recordClosedPosition(closedPos);

    // Remove from open positions
    this.openPositionMap.delete(symbol);

    console.log(`Realized P/L for ${symbol}: $${realizedPL.toFixed(2)} (${realizedPLPercent.toFixed(2)}%)`);
  }

  async getPortfolioSummary() {
    const account = await this.client.getAccount();
    await this.client.updatePositions();

    const currentEquity = parseFloat(account.equity);
    const buyingPower = parseFloat(account.buying_power);
    const dailyPL = currentEquity - this.dailyStartEquity;
    const dailyPLPercent = (dailyPL / this.dailyStartEquity) * 100;

    const openPositions = Array.from(this.client.positions.values());

    return {
      equity: currentEquity,
      buyingPower: buyingPower,
      dailyPL: dailyPL,
      dailyPLPercent: dailyPLPercent,
      positions: openPositions.length,
      openPositions: openPositions
    };
  }

  getDailyStats() {
    const winningTrades = this.closedPositions.filter(p => p.pl > 0);
    const losingTrades = this.closedPositions.filter(p => p.pl < 0);

    // Get lifetime stats from persistent storage
    const lifetimeStats = historicalDataManager.getLifetimeStats();
    const todayStats = historicalDataManager.getTodayStats();

    let topWinner = null;
    let topLoser = null;

    if (winningTrades.length > 0) {
      topWinner = winningTrades.reduce((max, p) => p.pl > max.pl ? p : max);
    }

    if (losingTrades.length > 0) {
      topLoser = losingTrades.reduce((min, p) => p.pl < min.pl ? p : min);
    }

    return {
      // Today's stats (in-memory)
      totalTrades: this.closedPositions.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: this.closedPositions.length > 0 ? (winningTrades.length / this.closedPositions.length) * 100 : 0,
      totalPL: this.dailyRealizedPL,
      realizedPL: this.dailyRealizedPL,
      topWinner: topWinner,
      topLoser: topLoser,
      // Lifetime stats from persistent storage
      lifetimeTotal: lifetimeStats.totalTrades,
      lifetimeWins: lifetimeStats.winningTrades,
      lifetimeLosses: lifetimeStats.losingTrades,
      lifetimeWinRate: lifetimeStats.winRate,
      lifetimeTotalPL: lifetimeStats.totalPL,
      // Today's stats from persistent storage (for verification)
      todayTotalFromHistory: todayStats.totalTrades,
      todayPLFromHistory: todayStats.totalPL
    };
  }

  getTotalRealizedPL() {
    return this.realizedPL;
  }

  getDailyRealizedPL() {
    return this.dailyRealizedPL;
  }

  async sendDailySummary() {
    const summary = this.getDailyStats();
    const portfolio = await this.getPortfolioSummary();

    const summaryData = {
      ...summary,
      startingEquity: this.dailyStartEquity,
      endingEquity: portfolio.equity,
      totalPLPercent: portfolio.dailyPLPercent,
      openPositions: portfolio.positions
    };

    await discordNotifier.sendDailySummary(summaryData);
  }

  resetDaily() {
    this.dailyTrades = [];
    this.closedPositions = [];
    this.dailyRealizedPL = 0;
    this.dailyStartEquity = this.startingEquity;
  }

  getAllTrades() {
    return this.trades;
  }

  getDailyTrades() {
    return this.dailyTrades;
  }

  getClosedPositions() {
    return this.closedPositions;
  }
}

export const portfolioTracker = new PortfolioTracker();
