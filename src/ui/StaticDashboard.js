import chalk from 'chalk';

export class StaticDashboard {
  constructor() {
    this.initialized = false;
  }

  initialize() {
    console.clear();
    this.printBanner();
    console.log(chalk.gray('─'.repeat(120)));
    console.log(chalk.cyan('Bot initialized. Live updates will appear below...'));
    console.log(chalk.gray('─'.repeat(120)));
    console.log();
    this.initialized = true;
  }

  printBanner() {
    console.log();
    console.log(chalk.hex('#00D9FF')('╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.hex('#00D9FF')('║') + chalk.hex('#FFD700').bold('                           🚀 ALPACA TRADING BOT v2.0 - LIVE TRADING 🚀                                       ') + chalk.hex('#00D9FF')('║'));
    console.log(chalk.hex('#00D9FF')('╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝'));
    console.log();
  }

  updatePortfolio(data) {
    if (!this.initialized) return;

    const plColor = data.dailyPL >= 0 ? chalk.green : chalk.red;
    const plSymbol = data.dailyPL >= 0 ? '▲' : '▼';
    const statusIcon = data.emergencyStop ? '🛑' : '✅';

    console.log(
      chalk.gray(`[${new Date().toLocaleTimeString()}]`) + ' ' +
      chalk.cyan('💰 Portfolio:') + ' ' +
      chalk.yellow(`$${data.equity.toFixed(2)}`) + ' ' +
      chalk.gray('│') + ' ' +
      chalk.cyan('P/L:') + ' ' +
      plSymbol + ' ' + plColor.bold(`$${Math.abs(data.dailyPL).toFixed(2)}`) + ' ' +
      plColor(`(${data.dailyPLPercent >= 0 ? '+' : ''}${data.dailyPLPercent.toFixed(2)}%)`) + ' ' +
      chalk.gray('│') + ' ' +
      chalk.cyan('Positions:') + ' ' +
      chalk.yellow(`${data.positions}/${data.maxPositions}`) + ' ' +
      chalk.gray('│') + ' ' +
      statusIcon + ' ' +
      (data.emergencyStop ? chalk.red('STOPPED') : chalk.green('ACTIVE'))
    );
  }

  updateDailyStats(stats) {
    // Only log when stats actually change
  }

  updatePositions(positions) {
    if (!this.initialized || !positions || positions.length === 0) return;

    console.log();
    console.log(chalk.hex('#FFD700')('📈 OPEN POSITIONS:'));
    positions.slice(0, 10).forEach(pos => {
      const pl = parseFloat(pos.unrealized_pl);
      const plPercent = parseFloat(pos.unrealized_plpc) * 100;
      const plColor = pl >= 0 ? chalk.green : chalk.red;
      const icon = pl >= 0 ? '📈' : '📉';

      console.log(
        '  ' + icon + ' ' +
        chalk.yellow(pos.symbol.padEnd(8)) +
        chalk.white(`Qty: ${pos.qty}`.padEnd(12)) +
        chalk.gray('Entry: ') + chalk.white(`$${parseFloat(pos.avg_entry_price).toFixed(2)}`.padEnd(10)) +
        chalk.gray('Current: ') + chalk.white(`$${parseFloat(pos.current_price).toFixed(2)}`.padEnd(10)) +
        chalk.gray('P/L: ') + plColor.bold(`${pl >= 0 ? '+' : ''}$${pl.toFixed(2)}`.padEnd(10)) +
        plColor(`(${plPercent >= 0 ? '+' : ''}${plPercent.toFixed(2)}%)`)
      );
    });
    console.log();
  }

  addSignal(signal) {
    if (!this.initialized) return;

    const time = new Date(signal.timestamp).toLocaleTimeString();
    const signalColor = signal.signal === 'BUY' ? chalk.green : signal.signal === 'SELL' ? chalk.red : chalk.yellow;
    const icon = signal.signal === 'BUY' ? '📈' : signal.signal === 'SELL' ? '📉' : '⚠️';

    console.log(
      chalk.gray(`[${time}]`) + ' ' +
      chalk.blue('SIGNAL') + ' ' +
      icon + ' ' +
      signalColor.bold(signal.signal.padEnd(4)) + ' ' +
      chalk.yellow(signal.symbol.padEnd(8)) + ' ' +
      chalk.gray('Strategy: ') + chalk.white(signal.strategy.padEnd(15)) + ' ' +
      chalk.cyan('Strength: ') + chalk.white(signal.strength.toFixed(0))
    );
  }

  addTrade(trade) {
    if (!this.initialized) return;

    const time = new Date(trade.timestamp).toLocaleTimeString();
    const actionColor = trade.action === 'BUY' ? chalk.green : chalk.red;
    const icon = trade.action === 'BUY' ? '🟢' : '🔴';

    console.log(
      chalk.gray(`[${time}]`) + ' ' +
      chalk.magenta.bold('TRADE') + ' ' +
      icon + ' ' +
      actionColor.bold(trade.action.padEnd(4)) + ' ' +
      chalk.yellow.bold(trade.symbol.padEnd(8)) + ' ' +
      chalk.cyan('Qty: ') + chalk.white(trade.qty)
    );
  }

  log(message, level = 'info') {
    if (!this.initialized && level !== 'info') return;

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
    // Don't re-render, just update data as it comes
  }

  destroy() {
    console.log();
    console.log(chalk.yellow('═'.repeat(120)));
    console.log(chalk.yellow('Bot stopped at: ' + new Date().toLocaleString()));
    console.log(chalk.yellow('═'.repeat(120)));
  }
}

export const dashboard = new StaticDashboard();
