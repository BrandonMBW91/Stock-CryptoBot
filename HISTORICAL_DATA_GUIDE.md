# Trading Bot - Historical Data System

## Overview

The trading bot now includes a comprehensive historical data persistence system that ensures your P/L, win/loss statistics, and all closed positions are saved to disk. This means **true lifetime tracking** across bot restarts.

## Features

### 📊 Lifetime Statistics
- **Total P/L**: Cumulative profit/loss across all trading sessions
- **Total Trades**: All trades ever executed
- **Win/Loss Counts**: Winning and losing trades tracked separately
- **Win Rate**: Overall success rate percentage
- **Start Date**: When you first started trading with this bot

### 📅 Daily Records
- Each trading day is tracked separately
- Daily P/L, trade counts, and win rates
- Individual trade records per day
- Historical data preserved indefinitely

### 💾 Persistent Storage
All data is automatically saved to `trading-history.json` in your bot's root directory. This file:
- Updates automatically after each trade closes
- Survives bot restarts
- Can be backed up or exported
- Contains complete trade history

## Data Structure

The `trading-history.json` file contains:

```json
{
  "lifetime": {
    "totalPL": 0,
    "totalTrades": 0,
    "winningTrades": 0,
    "losingTrades": 0,
    "winRate": 0,
    "startDate": "2026-01-11T12:00:00.000Z",
    "lastUpdated": "2026-01-11T12:00:00.000Z"
  },
  "dailyRecords": {
    "2026-01-11": {
      "date": "2026-01-11",
      "totalPL": 0,
      "totalTrades": 0,
      "winningTrades": 0,
      "losingTrades": 0,
      "winRate": 0,
      "trades": []
    }
  },
  "closedPositions": [],
  "lastSaveTime": "2026-01-11T12:00:00.000Z"
}
```

## Dashboard Display

The in-place dashboard now shows both **today's** and **lifetime** statistics:

### Daily Performance Section
- **Today**: Shows today's trade count and P/L
- **All-Time**: Shows lifetime trade count and total P/L
- **Today W/L**: Winning/losing trades for today
- **All W/L**: Lifetime winning/losing trades
- **Today Rate**: Today's win rate percentage
- **All Rate**: Lifetime win rate percentage

### Example Dashboard View
```
║ PORTFOLIO STATUS                               ║ DAILY PERFORMANCE                              ║
║ Status: [ACTIVE]                               ║ Today: 5 trades  All-Time: 127                 ║
║ Equity: $25,450.32                             ║ Today W/L: 3/2  All W/L: 89/38                 ║
║ Buying Power: $15,320.50                       ║ Today Rate: 60.0%  All Rate: 70.1%             ║
║ Daily P/L: +$250.00 (+0.99%)                   ║ Today P/L: +$250.00  All P/L: +$3,450.32       ║
```

## Viewing Historical Data

### Method 1: View History Report (Recommended)
Run the history viewer script to see a detailed report:

```bash
npm run history
```

This displays:
- Lifetime statistics summary
- Today's performance
- Last 7 days performance table
- Top 5 winning trades
- Top 5 losing trades
- File location and total positions tracked

### Method 2: View Raw Data
Open the `trading-history.json` file directly:

```bash
notepad trading-history.json
```

### Method 3: Dashboard (Live)
The main bot dashboard shows lifetime stats in real-time while the bot is running.

## API Methods

The `HistoricalDataManager` provides several useful methods:

```javascript
import { historicalDataManager } from './src/core/HistoricalDataManager.js';

// Get lifetime statistics
const lifetime = historicalDataManager.getLifetimeStats();

// Get today's statistics
const today = historicalDataManager.getTodayStats();

// Get specific date statistics
const dateStats = historicalDataManager.getDateStats('2026-01-11');

// Get recent days (default: 7)
const recentWeek = historicalDataManager.getRecentDays(7);

// Get monthly summary
const monthly = historicalDataManager.getMonthlyStats(2026, 1);

// Get all closed positions
const allTrades = historicalDataManager.getAllClosedPositions();

// Get top winners/losers
const topWinners = historicalDataManager.getTopWinners(10);
const topLosers = historicalDataManager.getTopLosers(10);

// Get complete data summary
const summary = historicalDataManager.getDataSummary();

// Export all history as JSON string
const exportData = historicalDataManager.exportHistory();
```

## Data Backup

### Manual Backup
Simply copy the `trading-history.json` file to a safe location:

```bash
copy trading-history.json trading-history-backup-2026-01-11.json
```

### Automated Backup (Recommended)
Create a scheduled task or script to periodically backup your history file to cloud storage or a backup directory.

## Data Recovery

If you need to restore from a backup:

1. Stop the bot
2. Replace `trading-history.json` with your backup file
3. Restart the bot

The bot will automatically load the historical data on startup.

## Important Notes

### ⚠️ Data Integrity
- The history file is written after **every closed position**
- Do not edit the file manually while the bot is running
- Always backup before making manual edits

### 🔄 Bot Restarts
- Historical data persists across bot restarts
- Lifetime statistics continue from where they left off
- No data loss between sessions

### 📈 Performance Impact
- File writes are efficient (< 1ms)
- Minimal impact on bot performance
- Data is saved in compact JSON format

### 🗄️ Storage Considerations
- Each closed position uses ~200 bytes
- 10,000 trades ≈ 2 MB file size
- Daily records add negligible overhead

## Troubleshooting

### History file not found
On first run, the bot creates a new `trading-history.json` file. This is normal.

### Statistics seem incorrect
1. Check the `trading-history.json` file exists
2. Verify the file is not corrupted (valid JSON)
3. Check file permissions (read/write access)

### Want to reset history
1. Stop the bot
2. Delete or rename `trading-history.json`
3. Restart the bot (a fresh history file will be created)

### Migrating existing data
If you had trades before implementing this system, they won't appear in the history file. The lifetime tracking starts from when this feature was first activated.

## File Location

The history file is always located at:
```
C:\Users\micha\Desktop\Bot\trading-history.json
```

## Summary

With this historical data system, you can:
- ✅ Track true lifetime P/L across all sessions
- ✅ See detailed daily performance records
- ✅ Analyze your best and worst trades
- ✅ Review performance trends over time
- ✅ Export data for external analysis
- ✅ Maintain complete audit trail of all trades

Your trading history is now permanent and survives bot restarts, giving you complete visibility into your trading performance over time.
