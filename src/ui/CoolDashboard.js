import chalk from 'chalk';

export class CoolDashboard {
  constructor() {
    this.tradingData = {
      portfolio: {},
      positions: [],
      recentTrades: [],
      signals: [],
      dailyStats: {}
    };
    this.frameCount = 0;
  }

  initialize() {
    console.clear();
    this.render();
  }

  getGradient(text, startColor, endColor) {
    // Simple gradient effect
    const colors = [
      chalk.hex(startColor),
      chalk.hex(this.interpolateColor(startColor, endColor, 0.5)),
      chalk.hex(endColor)
    ];
    const third = Math.floor(text.length / 3);
    return colors[0](text.slice(0, third)) +
           colors[1](text.slice(third, third * 2)) +
           colors[2](text.slice(third * 2));
  }

  interpolateColor(color1, color2, factor) {
    const c1 = parseInt(color1.replace('#', ''), 16);
    const c2 = parseInt(color2.replace('#', ''), 16);
    const r1 = (c1 >> 16) & 0xff;
    const g1 = (c1 >> 8) & 0xff;
    const b1 = c1 & 0xff;
    const r2 = (c2 >> 16) & 0xff;
    const g2 = (c2 >> 8) & 0xff;
    const b2 = c2 & 0xff;
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  getProgressBar(percent, width = 30, filled = '█', empty = '░') {
    const fillCount = Math.round((percent / 100) * width);
    const emptyCount = width - fillCount;

    let color;
    if (percent >= 80) color = chalk.green;
    else if (percent >= 50) color = chalk.yellow;
    else if (percent >= 30) color = chalk.hex('#FFA500');
    else color = chalk.red;

    return color(filled.repeat(fillCount)) + chalk.gray(empty.repeat(emptyCount));
  }

  getSpinner() {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    return chalk.cyan(frames[this.frameCount % frames.length]);
  }

  refresh() {
    this.frameCount++;
    console.clear();

    // Header
    this.printBanner();

    // Main content in two columns
    this.printTopSection();
    this.printMiddleSection();
    this.printBottomSection();

    // Footer
    this.printFooter();
  }

  printBanner() {
    const banner = `
╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                                                   ║
║     ${this.getGradient('███╗   ███╗ █████╗ ██████╗ ██╗  ██╗███████╗████████╗    ██████╗  ██████╗ ████████╗', '#00D9FF', '#0055FF')}     ║
║     ${this.getGradient('████╗ ████║██╔══██╗██╔══██╗██║ ██╔╝██╔════╝╚══██╔══╝    ██╔══██╗██╔═══██╗╚══██╔══╝', '#00D9FF', '#0055FF')}     ║
║     ${this.getGradient('██╔████╔██║███████║██████╔╝█████╔╝ █████╗     ██║       ██████╔╝██║   ██║   ██║   ', '#00D9FF', '#0055FF')}     ║
║     ${this.getGradient('██║╚██╔╝██║██╔══██║██╔══██╗██╔═██╗ ██╔══╝     ██║       ██╔══██╗██║   ██║   ██║   ', '#00D9FF', '#0055FF')}     ║
║     ${this.getGradient('██║ ╚═╝ ██║██║  ██║██║  ██║██║  ██╗███████╗   ██║       ██████╔╝╚██████╔╝   ██║   ', '#00D9FF', '#0055FF')}     ║
║     ${this.getGradient('╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝       ╚═════╝  ╚═════╝    ╚═╝   ', '#00D9FF', '#0055FF')}     ║
║                                                                                                                   ║
║                            ${chalk.hex('#FFD700').bold('⚡ ALPACA TRADING BOT v2.0 - LIVE TRADING ⚡')}                             ║
║                                                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
`;
    console.log(banner);
  }

  printTopSection() {
    const p = this.tradingData.portfolio;
    const s = this.tradingData.dailyStats;

    if (!p.equity) return;

    const plColor = p.dailyPL >= 0 ? chalk.green : chalk.red;
    const plSymbol = p.dailyPL >= 0 ? '▲' : '▼';
    const statusIcon = p.emergencyStop ? '🛑' : '✅';
    const statusColor = p.emergencyStop ? chalk.red : chalk.green;
    const statusText = p.emergencyStop ? 'EMERGENCY STOP' : 'ACTIVE';

    // Calculate position usage percentage
    const positionUsage = (p.positions / (p.maxPositions || 10)) * 100;

    console.log(chalk.hex('#00D9FF')('╔═══════════════════════════════════════════════════╦═══════════════════════════════════════════════════╗'));
    console.log(
      chalk.hex('#00D9FF')('║ ') +
      chalk.hex('#FFD700').bold('💰 PORTFOLIO STATUS') +
      ' '.repeat(28) +
      chalk.hex('#00D9FF')('║ ') +
      chalk.hex('#FFD700').bold('📊 DAILY PERFORMANCE') +
      ' '.repeat(25) +
      chalk.hex('#00D9FF')('║')
    );
    console.log(chalk.hex('#00D9FF')('╠═══════════════════════════════════════════════════╬═══════════════════════════════════════════════════╣'));

    // Left column - Portfolio
    console.log(
      chalk.hex('#00D9FF')('║ ') +
      chalk.cyan('Status: ') + statusIcon + ' ' + statusColor.bold(statusText.padEnd(14)) + ' '.repeat(17) +
      chalk.hex('#00D9FF')('║ ') +
      chalk.cyan('Total Trades: ') + chalk.yellow((s.totalTrades || 0).toString().padEnd(10)) + ' '.repeat(23) +
      chalk.hex('#00D9FF')('║')
    );

    console.log(
      chalk.hex('#00D9FF')('║ ') +
      chalk.cyan('Equity: ') + chalk.hex('#00FF00').bold(`$${p.equity.toFixed(2)}`.padEnd(20)) + ' '.repeat(21) +
      chalk.hex('#00D9FF')('║ ') +
      chalk.cyan('Wins: ') + chalk.green((s.winningTrades || 0).toString().padEnd(5)) +
      chalk.cyan(' Losses: ') + chalk.red((s.losingTrades || 0).toString().padEnd(5)) + ' '.repeat(19) +
      chalk.hex('#00D9FF')('║')
    );

    console.log(
      chalk.hex('#00D9FF')('║ ') +
      chalk.cyan('Buying Power: ') + chalk.yellow(`$${p.buyingPower.toFixed(2)}`.padEnd(14)) + ' '.repeat(21) +
      chalk.hex('#00D9FF')('║ ') +
      chalk.cyan('Win Rate: ') + chalk.hex('#FFD700')(`${(s.winRate || 0).toFixed(1)}%`.padEnd(10)) + ' '.repeat(27) +
      chalk.hex('#00D9FF')('║')
    );

    console.log(
      chalk.hex('#00D9FF')('║ ') +
      chalk.cyan('Daily P/L: ') + plSymbol + ' ' + plColor.bold(`$${Math.abs(p.dailyPL).toFixed(2)}`.padEnd(12)) +
      plColor(`(${p.dailyPLPercent >= 0 ? '+' : ''}${p.dailyPLPercent.toFixed(2)}%)`.padEnd(10)) + ' '.repeat(6) +
      chalk.hex('#00D9FF')('║ ') +
      chalk.cyan('Total P/L: ') + plColor.bold(`${p.dailyPL >= 0 ? '+' : ''}$${(s.totalPL || 0).toFixed(2)}`.padEnd(15)) + ' '.repeat(20) +
      chalk.hex('#00D9FF')('║')
    );

    console.log(
      chalk.hex('#00D9FF')('║ ') +
      chalk.cyan('Positions: ') + chalk.yellow(`${p.positions}/${p.maxPositions || 10}`.padEnd(10)) + ' '.repeat(29) +
      chalk.hex('#00D9FF')('║ ') +
      chalk.cyan('Activity: ') + this.getSpinner() + chalk.gray(' Analyzing markets...'.padEnd(25)) + ' '.repeat(9) +
      chalk.hex('#00D9FF')('║')
    );

    console.log(
      chalk.hex('#00D9FF')('║ ') +
      this.getProgressBar(positionUsage, 48) + ' ' +
      chalk.gray(`${positionUsage.toFixed(0)}%`) + ' ' +
      chalk.hex('#00D9FF')('║ ') +
      ' '.repeat(49) +
      chalk.hex('#00D9FF')('║')
    );

    console.log(chalk.hex('#00D9FF')('╚═══════════════════════════════════════════════════╩═══════════════════════════════════════════════════╝'));
    console.log();
  }

  printMiddleSection() {
    console.log(chalk.hex('#00D9FF')('╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.hex('#00D9FF')('║ ') + chalk.hex('#FFD700').bold('📈 OPEN POSITIONS') + ' '.repeat(90) + chalk.hex('#00D9FF')('║'));
    console.log(chalk.hex('#00D9FF')('╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣'));

    if (this.tradingData.positions.length === 0) {
      console.log(chalk.hex('#00D9FF')('║ ') + chalk.gray('No open positions'.padEnd(109)) + chalk.hex('#00D9FF')('║'));
    } else {
      console.log(
        chalk.hex('#00D9FF')('║ ') +
        chalk.cyan('SYMBOL'.padEnd(10)) +
        chalk.cyan('QTY'.padEnd(8)) +
        chalk.cyan('ENTRY'.padEnd(12)) +
        chalk.cyan('CURRENT'.padEnd(12)) +
        chalk.cyan('P/L $'.padEnd(14)) +
        chalk.cyan('P/L %'.padEnd(12)) +
        chalk.cyan('VALUE'.padEnd(14)) +
        chalk.cyan('STATUS'.padEnd(27)) +
        chalk.hex('#00D9FF')('║')
      );
      console.log(chalk.hex('#00D9FF')('║ ') + chalk.gray('─'.repeat(109)) + chalk.hex('#00D9FF')('║'));

      this.tradingData.positions.slice(0, 8).forEach(pos => {
        const pl = parseFloat(pos.unrealized_pl);
        const plPercent = parseFloat(pos.unrealized_plpc) * 100;
        const plColor = pl >= 0 ? chalk.green : chalk.red;
        const plIcon = pl >= 0 ? '📈' : '📉';
        const currentPrice = parseFloat(pos.current_price);
        const value = currentPrice * Math.abs(parseFloat(pos.qty));

        // Mini progress bar for P/L
        const plBarWidth = 15;
        const plBarPercent = Math.min(Math.abs(plPercent), 10);
        const plBar = this.getProgressBar(plBarPercent * 10, plBarWidth);

        console.log(
          chalk.hex('#00D9FF')('║ ') +
          chalk.yellow(pos.symbol.padEnd(10)) +
          chalk.white(pos.qty.toString().padEnd(8)) +
          chalk.white(`$${parseFloat(pos.avg_entry_price).toFixed(2)}`.padEnd(12)) +
          chalk.white(`$${currentPrice.toFixed(2)}`.padEnd(12)) +
          plColor.bold(`${pl >= 0 ? '+' : ''}$${pl.toFixed(2)}`.padEnd(14)) +
          plColor.bold(`${plPercent >= 0 ? '+' : ''}${plPercent.toFixed(2)}%`.padEnd(12)) +
          chalk.white(`$${value.toFixed(2)}`.padEnd(14)) +
          plIcon + ' ' + plBar + ' '.repeat(8) +
          chalk.hex('#00D9FF')('║')
        );
      });
    }

    console.log(chalk.hex('#00D9FF')('╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝'));
    console.log();
  }

  printBottomSection() {
    console.log(chalk.hex('#00D9FF')('╔═══════════════════════════════════════════════════╦═══════════════════════════════════════════════════╗'));
    console.log(
      chalk.hex('#00D9FF')('║ ') +
      chalk.hex('#FFD700').bold('🎯 RECENT SIGNALS (Last 5)') +
      ' '.repeat(22) +
      chalk.hex('#00D9FF')('║ ') +
      chalk.hex('#FFD700').bold('💼 RECENT TRADES (Last 5)') +
      ' '.repeat(23) +
      chalk.hex('#00D9FF')('║')
    );
    console.log(chalk.hex('#00D9FF')('╠═══════════════════════════════════════════════════╬═══════════════════════════════════════════════════╣'));

    // Signals on left
    const maxRows = 5;
    for (let i = 0; i < maxRows; i++) {
      let leftContent = ' '.repeat(49);
      let rightContent = ' '.repeat(49);

      // Left: Signals
      if (i < this.tradingData.signals.length) {
        const s = this.tradingData.signals[i];
        const time = new Date(s.timestamp).toLocaleTimeString();
        const signalColor = s.signal === 'BUY' ? chalk.green : s.signal === 'SELL' ? chalk.red : chalk.yellow;
        const icon = s.signal === 'BUY' ? '📈' : '📉';

        leftContent =
          chalk.gray(time.slice(0, 8).padEnd(9)) +
          icon + ' ' +
          signalColor.bold(s.signal.padEnd(4)) + ' ' +
          chalk.yellow(s.symbol.padEnd(8)) + ' ' +
          chalk.white(`${s.strength.toFixed(0)}`.padEnd(3)) + ' ' +
          chalk.gray(s.strategy.slice(0, 13).padEnd(13));
      } else if (i === 0 && this.tradingData.signals.length === 0) {
        leftContent = chalk.gray('No signals detected yet'.padEnd(49));
      }

      // Right: Trades
      if (i < this.tradingData.recentTrades.length) {
        const t = this.tradingData.recentTrades[i];
        const time = new Date(t.timestamp).toLocaleTimeString();
        const actionColor = t.action === 'BUY' ? chalk.green : chalk.red;
        const icon = t.action === 'BUY' ? '🟢' : '🔴';

        rightContent =
          chalk.gray(time.slice(0, 8).padEnd(9)) +
          icon + ' ' +
          actionColor.bold(t.action.padEnd(4)) + ' ' +
          chalk.yellow(t.symbol.padEnd(8)) + ' ' +
          chalk.white(`Qty: ${t.qty}`.padEnd(20));
      } else if (i === 0 && this.tradingData.recentTrades.length === 0) {
        rightContent = chalk.gray('No trades executed yet'.padEnd(49));
      }

      console.log(
        chalk.hex('#00D9FF')('║ ') + leftContent +
        chalk.hex('#00D9FF')('║ ') + rightContent +
        chalk.hex('#00D9FF')('║')
      );
    }

    console.log(chalk.hex('#00D9FF')('╚═══════════════════════════════════════════════════╩═══════════════════════════════════════════════════╝'));
  }

  printFooter() {
    const now = new Date();
    console.log();
    console.log(
      chalk.gray('  [Ctrl+C] Stop  │  ') +
      chalk.cyan('Refresh: Every 5s  │  ') +
      chalk.yellow(now.toLocaleDateString() + ' ' + now.toLocaleTimeString()) +
      chalk.gray('  │  ') +
      this.getSpinner() + chalk.cyan(' Live')
    );
    console.log();
  }

  updatePortfolio(data) {
    this.tradingData.portfolio = data;
  }

  updateDailyStats(stats) {
    this.tradingData.dailyStats = stats;
  }

  updatePositions(positions) {
    this.tradingData.positions = positions;
  }

  addSignal(signal) {
    this.tradingData.signals.unshift(signal);
    if (this.tradingData.signals.length > 20) {
      this.tradingData.signals = this.tradingData.signals.slice(0, 20);
    }
  }

  addTrade(trade) {
    this.tradingData.recentTrades.unshift(trade);
    if (this.tradingData.recentTrades.length > 20) {
      this.tradingData.recentTrades = this.tradingData.recentTrades.slice(0, 20);
    }
  }

  log(message, level = 'info') {
    // Silent for clean dashboard
  }

  render() {
    this.refresh();
  }

  destroy() {
    // Nothing to clean up
  }
}

export const dashboard = new CoolDashboard();
