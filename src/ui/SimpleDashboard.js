import chalk from 'chalk';

export class SimpleDashboard {
  constructor() {
    this.tradingData = {
      portfolio: {},
      positions: [],
      recentTrades: [],
      signals: []
    };
    this.updateInterval = null;
  }

  initialize() {
    console.clear();
    this.printHeader();
    // Don't auto-refresh - TradingEngine will call render() when needed
  }

  printHeader() {
    console.log(chalk.cyan('═'.repeat(100)));
    console.log(chalk.cyan.bold('                        ALPACA TRADING BOT - LIVE DASHBOARD                          '));
    console.log(chalk.cyan('═'.repeat(100)));
  }

  refresh() {
    console.clear();
    this.printHeader();
    this.printPortfolio();
    this.printDailyStats();
    this.printPositions();
    this.printRecentSignals();
    this.printRecentTrades();
    this.printControls();
  }

  printPortfolio() {
    const p = this.tradingData.portfolio;
    if (!p.equity) return;

    const plColor = p.dailyPL >= 0 ? 'green' : 'red';
    const plSymbol = p.dailyPL >= 0 ? '+' : '';
    const statusColor = p.emergencyStop ? 'red' : 'green';
    const status = p.emergencyStop ? 'EMERGENCY STOP' : 'ACTIVE';

    console.log(chalk.white.bold('\n┌─── PORTFOLIO OVERVIEW ───────────────────────────────────────────────────────────┐'));
    console.log(chalk.white('│ ') + chalk.cyan('Equity: ') + chalk.yellow(`$${p.equity.toFixed(2)}`.padEnd(15)) +
                chalk.white('│ ') + chalk.cyan('Buying Power: ') + chalk.yellow(`$${p.buyingPower.toFixed(2)}`.padEnd(15)) +
                chalk.white('│ ') + chalk.cyan('Positions: ') + chalk.yellow(`${p.positions}/${p.maxPositions || 10}`.padEnd(10)) + chalk.white('│'));
    console.log(chalk.white('│ ') + chalk.cyan('Daily P/L: ') + chalk[plColor](`${plSymbol}$${p.dailyPL.toFixed(2)}`.padEnd(15)) +
                chalk.white('│ ') + chalk.cyan('Daily P/L %: ') + chalk[plColor](`${plSymbol}${p.dailyPLPercent.toFixed(2)}%`.padEnd(15)) +
                chalk.white('│ ') + chalk.cyan('Status: ') + chalk[statusColor](status.padEnd(15)) + chalk.white('│'));
    console.log(chalk.white('└──────────────────────────────────────────────────────────────────────────────────┘'));
  }

  printDailyStats() {
    const s = this.tradingData.dailyStats;
    if (!s) return;

    const plColor = s.totalPL >= 0 ? 'green' : 'red';
    const plSymbol = s.totalPL >= 0 ? '+' : '';

    console.log(chalk.white.bold('\n┌─── DAILY STATISTICS ─────────────────────────────────────────────────────────────┐'));
    console.log(chalk.white('│ ') + chalk.cyan('Total Trades: ') + chalk.yellow(`${s.totalTrades}`.padEnd(10)) +
                chalk.white('│ ') + chalk.cyan('Winning: ') + chalk.green(`${s.winningTrades}`.padEnd(10)) +
                chalk.white('│ ') + chalk.cyan('Losing: ') + chalk.red(`${s.losingTrades}`.padEnd(10)) +
                chalk.white('│ ') + chalk.cyan('Win Rate: ') + chalk.yellow(`${s.winRate.toFixed(2)}%`.padEnd(10)) + chalk.white('│'));
    console.log(chalk.white('│ ') + chalk.cyan('Total P/L: ') + chalk[plColor](`${plSymbol}$${s.totalPL.toFixed(2)}`.padEnd(20)) + chalk.white('│'.padStart(55)));
    console.log(chalk.white('└──────────────────────────────────────────────────────────────────────────────────┘'));
  }

  printPositions() {
    console.log(chalk.white.bold('\n┌─── OPEN POSITIONS ───────────────────────────────────────────────────────────────┐'));

    if (this.tradingData.positions.length === 0) {
      console.log(chalk.white('│ ') + chalk.gray('No open positions'.padEnd(82)) + chalk.white('│'));
    } else {
      console.log(chalk.white('│ ') +
                  chalk.cyan('Symbol'.padEnd(12)) +
                  chalk.cyan('Qty'.padEnd(10)) +
                  chalk.cyan('Entry'.padEnd(12)) +
                  chalk.cyan('Current'.padEnd(12)) +
                  chalk.cyan('P/L $'.padEnd(12)) +
                  chalk.cyan('P/L %'.padEnd(12)) +
                  chalk.white('│'));
      console.log(chalk.white('│ ') + chalk.gray('─'.repeat(82)) + chalk.white('│'));

      this.tradingData.positions.slice(0, 5).forEach(pos => {
        const pl = parseFloat(pos.unrealized_pl);
        const plPercent = parseFloat(pos.unrealized_plpc) * 100;
        const plColor = pl >= 0 ? 'green' : 'red';

        console.log(chalk.white('│ ') +
                    chalk.yellow(pos.symbol.padEnd(12)) +
                    chalk.white(pos.qty.padEnd(10)) +
                    chalk.white(`$${parseFloat(pos.avg_entry_price).toFixed(2)}`.padEnd(12)) +
                    chalk.white(`$${parseFloat(pos.current_price).toFixed(2)}`.padEnd(12)) +
                    chalk[plColor](`${pl >= 0 ? '+' : ''}$${pl.toFixed(2)}`.padEnd(12)) +
                    chalk[plColor](`${plPercent >= 0 ? '+' : ''}${plPercent.toFixed(2)}%`.padEnd(12)) +
                    chalk.white('│'));
      });
    }

    console.log(chalk.white('└──────────────────────────────────────────────────────────────────────────────────┘'));
  }

  printRecentSignals() {
    console.log(chalk.white.bold('\n┌─── RECENT SIGNALS (Last 5) ──────────────────────────────────────────────────────┐'));

    if (this.tradingData.signals.length === 0) {
      console.log(chalk.white('│ ') + chalk.gray('No signals yet'.padEnd(82)) + chalk.white('│'));
    } else {
      this.tradingData.signals.slice(0, 5).forEach(s => {
        const time = new Date(s.timestamp).toLocaleTimeString();
        const signalColor = s.signal === 'BUY' ? 'green' : s.signal === 'SELL' ? 'red' : 'yellow';

        const line = `${time.padEnd(12)} ${chalk[signalColor](s.signal.padEnd(6))} ${s.symbol.padEnd(12)} ${s.strategy.padEnd(20)} Strength: ${s.strength.toFixed(0)}`;
        console.log(chalk.white('│ ') + line.padEnd(82) + chalk.white('│'));
      });
    }

    console.log(chalk.white('└──────────────────────────────────────────────────────────────────────────────────┘'));
  }

  printRecentTrades() {
    console.log(chalk.white.bold('\n┌─── RECENT TRADES (Last 5) ───────────────────────────────────────────────────────┐'));

    if (this.tradingData.recentTrades.length === 0) {
      console.log(chalk.white('│ ') + chalk.gray('No trades yet'.padEnd(82)) + chalk.white('│'));
    } else {
      this.tradingData.recentTrades.slice(0, 5).forEach(t => {
        const time = new Date(t.timestamp).toLocaleTimeString();
        const actionColor = t.action === 'BUY' ? 'green' : 'red';

        const line = `${time.padEnd(12)} ${chalk[actionColor](t.action.padEnd(6))} ${t.symbol.padEnd(12)} Qty: ${t.qty}`;
        console.log(chalk.white('│ ') + line.padEnd(82) + chalk.white('│'));
      });
    }

    console.log(chalk.white('└──────────────────────────────────────────────────────────────────────────────────┘'));
  }

  printControls() {
    console.log(chalk.gray('\n[Ctrl+C] Stop Bot  |  Auto-refresh every 2 seconds  |  ' + new Date().toLocaleString()));
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
    // Simple console log for debugging
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

export const dashboard = new SimpleDashboard();
