import chalk from 'chalk';

export class EnhancedDashboard {
  constructor() {
    this.tradingData = {
      portfolio: {},
      positions: [],
      recentTrades: [],
      signals: [],
      dailyStats: {}
    };
    this.updateInterval = null;
    this.animationFrame = 0;
    this.lastUpdate = new Date();
  }

  initialize() {
    console.clear();
    // Don't auto-refresh - let TradingEngine control the refresh cycle
    // Just update animation frame for loading indicators
    this.updateInterval = setInterval(() => {
      this.animationFrame++;
    }, 100); // Update animation frame only, not full refresh
  }

  getLoadingBar(percent) {
    const barLength = 20;
    const filled = Math.round((percent / 100) * barLength);
    const empty = barLength - filled;

    let bar = '';
    for (let i = 0; i < filled; i++) {
      bar += '█';
    }
    for (let i = 0; i < empty; i++) {
      bar += '░';
    }

    return bar;
  }

  getSparkline(value, max) {
    const bars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    const index = Math.min(Math.floor((value / max) * bars.length), bars.length - 1);
    return bars[index];
  }

  getAnimatedDots() {
    const dots = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    return dots[this.animationFrame % dots.length];
  }

  refresh() {
    console.clear();
    this.printBanner();
    this.printSystemStatus();
    this.printPortfolio();
    this.printPerformanceMetrics();
    this.printPositions();
    this.printSignalsAndTrades();
    this.printFooter();
  }

  printBanner() {
    const gradient = [
      chalk.hex('#00D9FF'),
      chalk.hex('#00B8FF'),
      chalk.hex('#0097FF'),
      chalk.hex('#0076FF'),
      chalk.hex('#0055FF')
    ];

    console.log('');
    console.log(gradient[0]('╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗'));
    console.log(gradient[1]('║') + gradient[2].bold('                          🚀 ALPACA TRADING BOT v2.0 - LIVE TRADING 🚀                          ') + gradient[1]('║'));
    console.log(gradient[3]('╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝'));
    console.log('');
  }

  printSystemStatus() {
    const p = this.tradingData.portfolio;
    const statusColor = p.emergencyStop ? chalk.red : chalk.green;
    const status = p.emergencyStop ? '🛑 EMERGENCY STOP' : '✅ ACTIVE';
    const spinner = this.getAnimatedDots();

    const uptime = Math.floor((new Date() - this.lastUpdate) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    console.log(chalk.hex('#FFD700')('┌─ SYSTEM STATUS ') + chalk.gray('─'.repeat(80)) + chalk.hex('#FFD700')('┐'));
    console.log(
      chalk.white('│ ') +
      chalk.cyan('Status: ') + statusColor.bold(status.padEnd(25)) +
      chalk.cyan('Trading: ') + chalk.yellow(spinner + ' ANALYZING'.padEnd(20)) +
      chalk.cyan('Uptime: ') + chalk.magenta(`${hours}h ${minutes}m ${seconds}s`.padEnd(15)) +
      chalk.white('│')
    );
    console.log(chalk.hex('#FFD700')('└') + chalk.gray('─'.repeat(99)) + chalk.hex('#FFD700')('┘'));
    console.log('');
  }

  printPortfolio() {
    const p = this.tradingData.portfolio;
    if (!p.equity) return;

    const plColor = p.dailyPL >= 0 ? chalk.hex('#00FF00') : chalk.hex('#FF0000');
    const plSymbol = p.dailyPL >= 0 ? '▲' : '▼';
    const plPercent = Math.abs(p.dailyPLPercent);
    const plBar = this.getLoadingBar(Math.min(plPercent * 10, 100));

    console.log(chalk.hex('#00D9FF')('┌─ 💰 PORTFOLIO OVERVIEW ') + chalk.gray('─'.repeat(73)) + chalk.hex('#00D9FF')('┐'));

    // Row 1
    console.log(
      chalk.white('│ ') +
      chalk.hex('#FFD700')('💵 Equity:        ') + chalk.hex('#00FF00').bold(`$${p.equity.toFixed(2)}`.padEnd(15)) +
      chalk.hex('#FFD700')('💳 Buying Power:  ') + chalk.hex('#FFAA00').bold(`$${p.buyingPower.toFixed(2)}`.padEnd(15)) +
      chalk.hex('#FFD700')('📊 Positions:     ') + chalk.cyan.bold(`${p.positions}/${p.maxPositions || 10}`.padEnd(10)) +
      chalk.white('│')
    );

    // Row 2 - Daily P/L with bar
    console.log(
      chalk.white('│ ') +
      chalk.hex('#FFD700')('📈 Daily P/L:     ') + plColor.bold(`${plSymbol} $${Math.abs(p.dailyPL).toFixed(2)}`.padEnd(15)) +
      chalk.hex('#FFD700')('📊 Daily %:       ') + plColor.bold(`${plSymbol} ${plPercent.toFixed(2)}%`.padEnd(15)) +
      plColor(plBar.padEnd(12)) +
      chalk.white('│')
    );

    console.log(chalk.hex('#00D9FF')('└') + chalk.gray('─'.repeat(99)) + chalk.hex('#00D9FF')('┘'));
    console.log('');
  }

  printPerformanceMetrics() {
    const s = this.tradingData.dailyStats;
    if (!s || s.totalTrades === undefined) {
      s.totalTrades = 0;
      s.winningTrades = 0;
      s.losingTrades = 0;
      s.winRate = 0;
      s.totalPL = 0;
    }

    const winRateBar = this.getLoadingBar(s.winRate);
    const winRateColor = s.winRate >= 60 ? chalk.green : s.winRate >= 40 ? chalk.yellow : chalk.red;
    const plColor = s.totalPL >= 0 ? chalk.hex('#00FF00') : chalk.hex('#FF0000');
    const plSymbol = s.totalPL >= 0 ? '▲' : '▼';

    console.log(chalk.hex('#FF00FF')('┌─ 📊 PERFORMANCE METRICS ') + chalk.gray('─'.repeat(71)) + chalk.hex('#FF00FF')('┐'));

    console.log(
      chalk.white('│ ') +
      chalk.hex('#FFD700')('🎯 Total Trades:  ') + chalk.cyan.bold(`${s.totalTrades}`.padEnd(12)) +
      chalk.hex('#FFD700')('✅ Wins:          ') + chalk.green.bold(`${s.winningTrades}`.padEnd(12)) +
      chalk.hex('#FFD700')('❌ Losses:        ') + chalk.red.bold(`${s.losingTrades}`.padEnd(12)) +
      chalk.white('│')
    );

    console.log(
      chalk.white('│ ') +
      chalk.hex('#FFD700')('🏆 Win Rate:      ') + winRateColor.bold(`${s.winRate.toFixed(1)}%`.padEnd(12)) +
      winRateColor(winRateBar.padEnd(20)) +
      chalk.hex('#FFD700')('💰 Total P/L:     ') + plColor.bold(`${plSymbol} $${Math.abs(s.totalPL).toFixed(2)}`.padEnd(15)) +
      chalk.white('│')
    );

    console.log(chalk.hex('#FF00FF')('└') + chalk.gray('─'.repeat(99)) + chalk.hex('#FF00FF')('┘'));
    console.log('');
  }

  printPositions() {
    console.log(chalk.hex('#FFAA00')('┌─ 📈 OPEN POSITIONS ') + chalk.gray('─'.repeat(76)) + chalk.hex('#FFAA00')('┐'));

    if (this.tradingData.positions.length === 0) {
      console.log(chalk.white('│ ') + chalk.gray.italic('   No open positions - Ready to trade!'.padEnd(97)) + chalk.white('│'));
    } else {
      console.log(
        chalk.white('│ ') +
        chalk.hex('#00D9FF').bold('Symbol'.padEnd(12)) +
        chalk.hex('#00D9FF').bold('Qty'.padEnd(8)) +
        chalk.hex('#00D9FF').bold('Entry'.padEnd(12)) +
        chalk.hex('#00D9FF').bold('Current'.padEnd(12)) +
        chalk.hex('#00D9FF').bold('P/L $'.padEnd(14)) +
        chalk.hex('#00D9FF').bold('P/L %'.padEnd(12)) +
        chalk.hex('#00D9FF').bold('Chart'.padEnd(25)) +
        chalk.white('│')
      );
      console.log(chalk.white('│ ') + chalk.gray('─'.repeat(97)) + chalk.white('│'));

      this.tradingData.positions.slice(0, 8).forEach(pos => {
        const pl = parseFloat(pos.unrealized_pl);
        const plPercent = parseFloat(pos.unrealized_plpc) * 100;
        const plColor = pl >= 0 ? chalk.hex('#00FF00') : chalk.hex('#FF0000');
        const arrow = pl >= 0 ? '▲' : '▼';
        const plBar = this.getLoadingBar(Math.min(Math.abs(plPercent) * 10, 100));

        console.log(
          chalk.white('│ ') +
          chalk.yellow.bold(pos.symbol.padEnd(12)) +
          chalk.white(pos.qty.padEnd(8)) +
          chalk.cyan(`$${parseFloat(pos.avg_entry_price).toFixed(2)}`.padEnd(12)) +
          chalk.magenta(`$${parseFloat(pos.current_price).toFixed(2)}`.padEnd(12)) +
          plColor.bold(`${arrow} $${Math.abs(pl).toFixed(2)}`.padEnd(14)) +
          plColor.bold(`${arrow} ${Math.abs(plPercent).toFixed(2)}%`.padEnd(12)) +
          plColor(plBar.padEnd(25)) +
          chalk.white('│')
        );
      });
    }

    console.log(chalk.hex('#FFAA00')('└') + chalk.gray('─'.repeat(99)) + chalk.hex('#FFAA00')('┘'));
    console.log('');
  }

  printSignalsAndTrades() {
    console.log(
      chalk.hex('#FF00FF')('┌─ 🎯 RECENT SIGNALS ') + chalk.gray('─'.repeat(33)) + chalk.hex('#FF00FF')('┐') + '  ' +
      chalk.hex('#00FF00')('┌─ 📝 RECENT TRADES ') + chalk.gray('─'.repeat(33)) + chalk.hex('#00FF00')('┐')
    );

    const maxRows = 5;
    for (let i = 0; i < maxRows; i++) {
      let signalLine = '';
      let tradeLine = '';

      // Signals
      if (i < this.tradingData.signals.length) {
        const s = this.tradingData.signals[i];
        const time = new Date(s.timestamp).toLocaleTimeString('en-US', { hour12: false });
        const signalColor = s.signal === 'BUY' ? chalk.green : s.signal === 'SELL' ? chalk.red : chalk.yellow;
        const icon = s.signal === 'BUY' ? '🟢' : s.signal === 'SELL' ? '🔴' : '🟡';

        signalLine = chalk.white('│ ') +
          chalk.gray(time.padEnd(10)) +
          signalColor.bold(icon + ' ' + s.signal.padEnd(6)) +
          chalk.cyan(s.symbol.padEnd(10)) +
          chalk.magenta(`${s.strength.toFixed(0)}%`.padEnd(5)) +
          chalk.white('│');
      } else {
        signalLine = chalk.white('│ ') + ' '.repeat(53) + chalk.white('│');
      }

      // Trades
      if (i < this.tradingData.recentTrades.length) {
        const t = this.tradingData.recentTrades[i];
        const time = new Date(t.timestamp).toLocaleTimeString('en-US', { hour12: false });
        const actionColor = t.action === 'BUY' ? chalk.green : chalk.red;
        const icon = t.action === 'BUY' ? '💰' : '💸';

        tradeLine = chalk.white('│ ') +
          chalk.gray(time.padEnd(10)) +
          actionColor.bold(icon + ' ' + t.action.padEnd(6)) +
          chalk.yellow(t.symbol.padEnd(10)) +
          chalk.white(`x${t.qty}`.padEnd(8)) +
          chalk.white('│');
      } else {
        tradeLine = chalk.white('│ ') + ' '.repeat(53) + chalk.white('│');
      }

      console.log(signalLine + '  ' + tradeLine);
    }

    console.log(
      chalk.hex('#FF00FF')('└') + chalk.gray('─'.repeat(53)) + chalk.hex('#FF00FF')('┘') + '  ' +
      chalk.hex('#00FF00')('└') + chalk.gray('─'.repeat(53)) + chalk.hex('#00FF00')('┘')
    );
    console.log('');
  }

  printFooter() {
    const now = new Date();
    const timeString = now.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    console.log(chalk.gray('─'.repeat(101)));
    console.log(
      chalk.hex('#00D9FF')('⚡ Live Updates ') +
      chalk.gray('│ ') +
      chalk.hex('#FFD700')('[Ctrl+C]') + chalk.white(' Stop Bot ') +
      chalk.gray('│ ') +
      chalk.magenta('🕐 ' + timeString) +
      chalk.gray(' │ ') +
      chalk.cyan('Made with ❤️  by AI')
    );
    console.log(chalk.gray('─'.repeat(101)));
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
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

export const dashboard = new EnhancedDashboard();
