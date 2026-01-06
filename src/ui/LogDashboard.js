import chalk from 'chalk';

export class LogDashboard {
  constructor() {
    this.lastStats = null;
  }

  initialize() {
    console.clear();
    console.log(chalk.cyan('═'.repeat(100)));
    console.log(chalk.cyan.bold('                        ALPACA TRADING BOT v2.0 - LIVE TRADING                          '));
    console.log(chalk.cyan('═'.repeat(100)));
    console.log(chalk.gray('Bot started at: ' + new Date().toLocaleString()));
    console.log(chalk.gray('Updates will be logged below as they happen...\n'));
  }

  updatePortfolio(data) {
    // Only log significant changes
  }

  updateDailyStats(stats) {
    // Only log once when stats actually change
    if (!this.lastStats ||
        this.lastStats.totalTrades !== stats.totalTrades ||
        Math.abs(this.lastStats.totalPL - stats.totalPL) > 0.01) {

      this.lastStats = stats;
      this.logStats(stats);
    }
  }

  logStats(stats) {
    const plColor = stats.totalPL >= 0 ? 'green' : 'red';
    const plSymbol = stats.totalPL >= 0 ? '+' : '';

    console.log(chalk.gray('─'.repeat(100)));
    console.log(
      chalk.cyan('Daily Stats: ') +
      chalk.yellow(`Trades: ${stats.totalTrades}`) + chalk.gray(' | ') +
      chalk.green(`Wins: ${stats.winningTrades}`) + chalk.gray(' | ') +
      chalk.red(`Losses: ${stats.losingTrades}`) + chalk.gray(' | ') +
      chalk.yellow(`Win Rate: ${stats.winRate.toFixed(1)}%`) + chalk.gray(' | ') +
      chalk[plColor](`P/L: ${plSymbol}$${stats.totalPL.toFixed(2)}`)
    );
  }

  updatePositions(positions) {
    // Silent - positions are tracked through trades
  }

  addSignal(signal) {
    const time = new Date(signal.timestamp).toLocaleTimeString();
    const signalColor = signal.signal === 'BUY' ? 'green' : signal.signal === 'SELL' ? 'red' : 'yellow';

    console.log(
      chalk.gray(`[${time}]`) + ' ' +
      chalk.blue('SIGNAL') + ' ' +
      chalk[signalColor].bold(signal.signal.padEnd(4)) + ' ' +
      chalk.yellow(signal.symbol.padEnd(8)) + ' ' +
      chalk.gray(signal.strategy.padEnd(15)) + ' ' +
      chalk.white(`Strength: ${signal.strength.toFixed(0)}`)
    );
  }

  addTrade(trade) {
    const time = new Date(trade.timestamp).toLocaleTimeString();
    const actionColor = trade.action === 'BUY' ? 'green' : 'red';

    console.log(
      chalk.gray(`[${time}]`) + ' ' +
      chalk.magenta('TRADE') + ' ' +
      chalk[actionColor].bold(trade.action.padEnd(4)) + ' ' +
      chalk.yellow(trade.symbol.padEnd(8)) + ' ' +
      chalk.white(`Qty: ${trade.qty}`)
    );
  }

  log(message, level = 'info') {
    const time = new Date().toLocaleTimeString();
    let prefix = chalk.gray(`[${time}]`) + ' ';

    switch(level) {
      case 'success':
        prefix += chalk.green('✓');
        break;
      case 'error':
        prefix += chalk.red('✗');
        break;
      case 'warn':
        prefix += chalk.yellow('⚠');
        break;
      case 'info':
      default:
        prefix += chalk.blue('ℹ');
        break;
    }

    console.log(prefix + ' ' + message);
  }

  render() {
    // No need to re-render, we log as things happen
  }

  destroy() {
    console.log(chalk.yellow('\nBot stopped at: ' + new Date().toLocaleString()));
  }
}

export const dashboard = new LogDashboard();
