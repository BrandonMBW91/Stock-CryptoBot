import { historicalDataManager } from './src/core/HistoricalDataManager.js';
import chalk from 'chalk';

console.clear();

console.log(chalk.hex('#00D9FF')('╔═══════════════════════════════════════════════════════════════════════════════════╗'));
console.log(chalk.hex('#00D9FF')('║') + chalk.hex('#FFD700').bold('                        TRADING HISTORY VIEWER                                 ') + chalk.hex('#00D9FF')('║'));
console.log(chalk.hex('#00D9FF')('╚═══════════════════════════════════════════════════════════════════════════════════╝'));
console.log('');

const summary = historicalDataManager.getDataSummary();
const lifetime = summary.lifetimeStats;
const today = summary.todayStats;

// Lifetime Statistics
console.log(chalk.hex('#FFD700').bold('═══ LIFETIME STATISTICS ═══'));
console.log('');

const lifetimePLColor = lifetime.totalPL >= 0 ? chalk.green : chalk.red;
console.log(chalk.cyan('Total P/L:          ') + lifetimePLColor.bold(`${lifetime.totalPL >= 0 ? '+' : ''}$${lifetime.totalPL.toFixed(2)}`));
console.log(chalk.cyan('Total Trades:       ') + chalk.white(lifetime.totalTrades));
console.log(chalk.cyan('Winning Trades:     ') + chalk.green(lifetime.winningTrades) + chalk.gray(` (${lifetime.winningTrades > 0 ? ((lifetime.winningTrades / lifetime.totalTrades) * 100).toFixed(1) : 0}%)`));
console.log(chalk.cyan('Losing Trades:      ') + chalk.red(lifetime.losingTrades) + chalk.gray(` (${lifetime.losingTrades > 0 ? ((lifetime.losingTrades / lifetime.totalTrades) * 100).toFixed(1) : 0}%)`));
console.log(chalk.cyan('Win Rate:           ') + chalk.yellow(`${lifetime.winRate.toFixed(2)}%`));
console.log(chalk.cyan('Start Date:         ') + chalk.white(lifetime.startDate ? new Date(lifetime.startDate).toLocaleString() : 'N/A'));
console.log(chalk.cyan('Last Updated:       ') + chalk.white(lifetime.lastUpdated ? new Date(lifetime.lastUpdated).toLocaleString() : 'N/A'));
console.log(chalk.cyan('Total Days Traded:  ') + chalk.white(summary.totalDaysTraded));
console.log('');

// Today's Statistics
console.log(chalk.hex('#FFD700').bold('═══ TODAY\'S STATISTICS ═══'));
console.log('');

const todayPLColor = today.totalPL >= 0 ? chalk.green : chalk.red;
console.log(chalk.cyan('Today\'s P/L:        ') + todayPLColor.bold(`${today.totalPL >= 0 ? '+' : ''}$${today.totalPL.toFixed(2)}`));
console.log(chalk.cyan('Today\'s Trades:     ') + chalk.white(today.totalTrades));
console.log(chalk.cyan('Winning Trades:     ') + chalk.green(today.winningTrades));
console.log(chalk.cyan('Losing Trades:      ') + chalk.red(today.losingTrades));
console.log(chalk.cyan('Win Rate:           ') + chalk.yellow(`${today.winRate.toFixed(2)}%`));
console.log('');

// Recent Week Performance
console.log(chalk.hex('#FFD700').bold('═══ LAST 7 DAYS PERFORMANCE ═══'));
console.log('');

const recentDays = summary.recentWeek;
if (recentDays.length > 0) {
  console.log(chalk.cyan('Date'.padEnd(15)) + chalk.cyan('Trades'.padEnd(10)) + chalk.cyan('W/L'.padEnd(10)) + chalk.cyan('Win Rate'.padEnd(12)) + chalk.cyan('P/L'));
  console.log(chalk.gray('─'.repeat(80)));

  recentDays.forEach(day => {
    const dayPLColor = day.totalPL >= 0 ? chalk.green : chalk.red;
    console.log(
      chalk.white(day.date.padEnd(15)) +
      chalk.white(day.totalTrades.toString().padEnd(10)) +
      chalk.green(day.winningTrades.toString()) + chalk.gray('/') + chalk.red(day.losingTrades.toString().padEnd(8)) +
      chalk.yellow(`${day.winRate.toFixed(1)}%`.padEnd(12)) +
      dayPLColor.bold(`${day.totalPL >= 0 ? '+' : ''}$${day.totalPL.toFixed(2)}`)
    );
  });
} else {
  console.log(chalk.gray('No trading history available'));
}

console.log('');

// Top Winners
console.log(chalk.hex('#FFD700').bold('═══ TOP 5 WINNING TRADES ═══'));
console.log('');

const topWinners = historicalDataManager.getTopWinners(5);
if (topWinners.length > 0) {
  console.log(chalk.cyan('Symbol'.padEnd(10)) + chalk.cyan('Entry'.padEnd(12)) + chalk.cyan('Exit'.padEnd(12)) + chalk.cyan('P/L %'.padEnd(12)) + chalk.cyan('P/L $'));
  console.log(chalk.gray('─'.repeat(80)));

  topWinners.forEach(trade => {
    console.log(
      chalk.yellow(trade.symbol.padEnd(10)) +
      chalk.white(`$${trade.entryPrice.toFixed(2)}`.padEnd(12)) +
      chalk.white(`$${trade.exitPrice.toFixed(2)}`.padEnd(12)) +
      chalk.green(`+${trade.plPercent.toFixed(2)}%`.padEnd(12)) +
      chalk.green.bold(`+$${trade.pl.toFixed(2)}`)
    );
  });
} else {
  console.log(chalk.gray('No winning trades yet'));
}

console.log('');

// Top Losers
console.log(chalk.hex('#FFD700').bold('═══ TOP 5 LOSING TRADES ═══'));
console.log('');

const topLosers = historicalDataManager.getTopLosers(5);
if (topLosers.length > 0) {
  console.log(chalk.cyan('Symbol'.padEnd(10)) + chalk.cyan('Entry'.padEnd(12)) + chalk.cyan('Exit'.padEnd(12)) + chalk.cyan('P/L %'.padEnd(12)) + chalk.cyan('P/L $'));
  console.log(chalk.gray('─'.repeat(80)));

  topLosers.forEach(trade => {
    console.log(
      chalk.yellow(trade.symbol.padEnd(10)) +
      chalk.white(`$${trade.entryPrice.toFixed(2)}`.padEnd(12)) +
      chalk.white(`$${trade.exitPrice.toFixed(2)}`.padEnd(12)) +
      chalk.red(`${trade.plPercent.toFixed(2)}%`.padEnd(12)) +
      chalk.red.bold(`$${trade.pl.toFixed(2)}`)
    );
  });
} else {
  console.log(chalk.gray('No losing trades yet'));
}

console.log('');
console.log(chalk.hex('#00D9FF')('═'.repeat(83)));
console.log(chalk.gray(`History file location: ${process.cwd()}\\trading-history.json`));
console.log(chalk.gray(`Total closed positions tracked: ${summary.totalClosedPositions}`));
console.log(chalk.hex('#00D9FF')('═'.repeat(83)));
