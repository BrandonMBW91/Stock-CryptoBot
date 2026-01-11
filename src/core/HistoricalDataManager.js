import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export class HistoricalDataManager {
  constructor() {
    this.historyFile = join(process.cwd(), 'trading-history.json');
    this.data = {
      lifetime: {
        totalPL: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        startDate: null,
        lastUpdated: null
      },
      dailyRecords: {},
      closedPositions: [],
      lastSaveTime: null
    };
    this.loadHistory();
  }

  loadHistory() {
    try {
      if (existsSync(this.historyFile)) {
        const fileContent = readFileSync(this.historyFile, 'utf8');
        this.data = JSON.parse(fileContent);
        console.log(`✅ Loaded trading history: ${this.data.closedPositions.length} lifetime trades`);
      } else {
        console.log('📝 No existing trading history found, starting fresh');
        this.data.lifetime.startDate = new Date().toISOString();
        this.saveHistory();
      }
    } catch (error) {
      console.error('❌ Error loading trading history:', error.message);
      console.log('Starting with fresh history data');
      this.data.lifetime.startDate = new Date().toISOString();
    }
  }

  saveHistory() {
    try {
      this.data.lastSaveTime = new Date().toISOString();
      this.data.lifetime.lastUpdated = new Date().toISOString();
      writeFileSync(this.historyFile, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      console.error('❌ Error saving trading history:', error.message);
    }
  }

  recordClosedPosition(position) {
    const today = this.getTodayKey();

    // Add to closed positions array
    this.data.closedPositions.push({
      ...position,
      date: new Date().toISOString()
    });

    // Update lifetime stats
    this.data.lifetime.totalPL += position.pl;
    this.data.lifetime.totalTrades += 1;

    if (position.pl > 0) {
      this.data.lifetime.winningTrades += 1;
    } else if (position.pl < 0) {
      this.data.lifetime.losingTrades += 1;
    }

    this.data.lifetime.winRate = this.data.lifetime.totalTrades > 0
      ? (this.data.lifetime.winningTrades / this.data.lifetime.totalTrades) * 100
      : 0;

    // Update daily record
    if (!this.data.dailyRecords[today]) {
      this.data.dailyRecords[today] = {
        date: today,
        totalPL: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        trades: []
      };
    }

    const dailyRecord = this.data.dailyRecords[today];
    dailyRecord.totalPL += position.pl;
    dailyRecord.totalTrades += 1;

    if (position.pl > 0) {
      dailyRecord.winningTrades += 1;
    } else if (position.pl < 0) {
      dailyRecord.losingTrades += 1;
    }

    dailyRecord.winRate = dailyRecord.totalTrades > 0
      ? (dailyRecord.winningTrades / dailyRecord.totalTrades) * 100
      : 0;

    dailyRecord.trades.push({
      symbol: position.symbol,
      pl: position.pl,
      plPercent: position.plPercent,
      timestamp: position.timestamp
    });

    // Save to file
    this.saveHistory();
  }

  getTodayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getLifetimeStats() {
    return {
      ...this.data.lifetime,
      totalClosedPositions: this.data.closedPositions.length
    };
  }

  getTodayStats() {
    const today = this.getTodayKey();
    return this.data.dailyRecords[today] || {
      date: today,
      totalPL: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      trades: []
    };
  }

  getDateStats(dateKey) {
    return this.data.dailyRecords[dateKey] || null;
  }

  getAllDailyRecords() {
    return this.data.dailyRecords;
  }

  getRecentDays(days = 7) {
    const records = [];
    const allDates = Object.keys(this.data.dailyRecords).sort().reverse();

    for (let i = 0; i < Math.min(days, allDates.length); i++) {
      const dateKey = allDates[i];
      records.push({
        date: dateKey,
        ...this.data.dailyRecords[dateKey]
      });
    }

    return records;
  }

  getMonthlyStats(year, month) {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const monthlyRecords = Object.keys(this.data.dailyRecords)
      .filter(key => key.startsWith(monthKey))
      .map(key => this.data.dailyRecords[key]);

    if (monthlyRecords.length === 0) {
      return null;
    }

    const stats = {
      year,
      month,
      totalPL: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      tradingDays: monthlyRecords.length
    };

    monthlyRecords.forEach(day => {
      stats.totalPL += day.totalPL;
      stats.totalTrades += day.totalTrades;
      stats.winningTrades += day.winningTrades;
      stats.losingTrades += day.losingTrades;
    });

    stats.winRate = stats.totalTrades > 0
      ? (stats.winningTrades / stats.totalTrades) * 100
      : 0;

    return stats;
  }

  getAllClosedPositions() {
    return this.data.closedPositions;
  }

  getTopWinners(limit = 10) {
    return [...this.data.closedPositions]
      .filter(p => p.pl > 0)
      .sort((a, b) => b.pl - a.pl)
      .slice(0, limit);
  }

  getTopLosers(limit = 10) {
    return [...this.data.closedPositions]
      .filter(p => p.pl < 0)
      .sort((a, b) => a.pl - b.pl)
      .slice(0, limit);
  }

  resetDailyData() {
    // This is called at start of new trading day
    // Historical data is preserved, only in-memory daily tracking resets
    console.log('📅 New trading day started');
  }

  exportHistory() {
    return JSON.stringify(this.data, null, 2);
  }

  getDataSummary() {
    return {
      lifetimeStats: this.getLifetimeStats(),
      todayStats: this.getTodayStats(),
      recentWeek: this.getRecentDays(7),
      totalClosedPositions: this.data.closedPositions.length,
      oldestTrade: this.data.closedPositions[0]?.date || null,
      newestTrade: this.data.closedPositions[this.data.closedPositions.length - 1]?.date || null,
      totalDaysTraded: Object.keys(this.data.dailyRecords).length
    };
  }
}

export const historicalDataManager = new HistoricalDataManager();
