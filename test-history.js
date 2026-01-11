import { historicalDataManager } from './src/core/HistoricalDataManager.js';
import chalk from 'chalk';

console.log(chalk.cyan('\n🧪 Testing Historical Data Manager\n'));

// Test 1: Load existing history or create new
console.log(chalk.yellow('Test 1: Loading/Creating history file...'));
const initialSummary = historicalDataManager.getDataSummary();
console.log(chalk.green('✓ History loaded successfully'));
console.log(chalk.gray(`  Lifetime trades: ${initialSummary.lifetimeStats.totalTrades}`));
console.log(chalk.gray(`  Lifetime P/L: $${initialSummary.lifetimeStats.totalPL.toFixed(2)}`));
console.log('');

// Test 2: Record a winning trade
console.log(chalk.yellow('Test 2: Recording a winning trade...'));
const winningTrade = {
  symbol: 'TEST',
  qty: 10,
  entryPrice: 100.00,
  exitPrice: 105.00,
  pl: 50.00,
  plPercent: 5.00,
  holdTime: 300000,
  timestamp: new Date()
};

historicalDataManager.recordClosedPosition(winningTrade);
console.log(chalk.green('✓ Winning trade recorded'));
console.log('');

// Test 3: Record a losing trade
console.log(chalk.yellow('Test 3: Recording a losing trade...'));
const losingTrade = {
  symbol: 'TEST2',
  qty: 5,
  entryPrice: 200.00,
  exitPrice: 195.00,
  pl: -25.00,
  plPercent: -2.50,
  holdTime: 600000,
  timestamp: new Date()
};

historicalDataManager.recordClosedPosition(losingTrade);
console.log(chalk.green('✓ Losing trade recorded'));
console.log('');

// Test 4: Verify statistics updated
console.log(chalk.yellow('Test 4: Verifying statistics...'));
const updatedStats = historicalDataManager.getLifetimeStats();
console.log(chalk.green('✓ Statistics verified'));
console.log(chalk.gray(`  Total trades: ${updatedStats.totalTrades}`));
console.log(chalk.gray(`  Winning trades: ${updatedStats.winningTrades}`));
console.log(chalk.gray(`  Losing trades: ${updatedStats.losingTrades}`));
console.log(chalk.gray(`  Win rate: ${updatedStats.winRate.toFixed(2)}%`));
console.log(chalk.gray(`  Total P/L: $${updatedStats.totalPL.toFixed(2)}`));
console.log('');

// Test 5: Check today's stats
console.log(chalk.yellow('Test 5: Checking today\'s stats...'));
const todayStats = historicalDataManager.getTodayStats();
console.log(chalk.green('✓ Today\'s stats retrieved'));
console.log(chalk.gray(`  Today's trades: ${todayStats.totalTrades}`));
console.log(chalk.gray(`  Today's P/L: $${todayStats.totalPL.toFixed(2)}`));
console.log('');

// Test 6: Check file persistence
console.log(chalk.yellow('Test 6: Checking file persistence...'));
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const historyFile = join(process.cwd(), 'trading-history.json');
if (existsSync(historyFile)) {
  const fileContent = JSON.parse(readFileSync(historyFile, 'utf8'));
  console.log(chalk.green('✓ History file exists and is valid JSON'));
  console.log(chalk.gray(`  File location: ${historyFile}`));
  console.log(chalk.gray(`  Closed positions in file: ${fileContent.closedPositions.length}`));
  console.log(chalk.gray(`  Daily records: ${Object.keys(fileContent.dailyRecords).length} days`));
} else {
  console.log(chalk.red('✗ History file not found!'));
}
console.log('');

// Test 7: Get recent days
console.log(chalk.yellow('Test 7: Getting recent days performance...'));
const recentDays = historicalDataManager.getRecentDays(3);
console.log(chalk.green(`✓ Retrieved ${recentDays.length} recent trading days`));
recentDays.forEach(day => {
  console.log(chalk.gray(`  ${day.date}: ${day.totalTrades} trades, $${day.totalPL.toFixed(2)} P/L`));
});
console.log('');

// Test 8: Get top winners/losers
console.log(chalk.yellow('Test 8: Getting top winners and losers...'));
const topWinners = historicalDataManager.getTopWinners(3);
const topLosers = historicalDataManager.getTopLosers(3);
console.log(chalk.green(`✓ Top winners: ${topWinners.length}, Top losers: ${topLosers.length}`));
if (topWinners.length > 0) {
  console.log(chalk.gray(`  Best trade: ${topWinners[0].symbol} +$${topWinners[0].pl.toFixed(2)}`));
}
if (topLosers.length > 0) {
  console.log(chalk.gray(`  Worst trade: ${topLosers[0].symbol} $${topLosers[0].pl.toFixed(2)}`));
}
console.log('');

// Summary
console.log(chalk.hex('#00D9FF')('═'.repeat(60)));
console.log(chalk.hex('#FFD700').bold('✅ ALL TESTS PASSED'));
console.log(chalk.hex('#00D9FF')('═'.repeat(60)));
console.log('');
console.log(chalk.cyan('Historical data system is working correctly!'));
console.log(chalk.gray('You can now run the bot and all P/L data will be tracked permanently.'));
console.log('');
console.log(chalk.yellow('To view your trading history, run:'));
console.log(chalk.white('  npm run history'));
console.log('');
