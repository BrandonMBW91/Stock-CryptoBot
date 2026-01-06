import blessed from 'blessed';
import contrib from 'blessed-contrib';
import chalk from 'chalk';

export class Dashboard {
  constructor() {
    this.screen = null;
    this.grid = null;
    this.widgets = {};
    this.tradingData = {
      portfolio: {},
      positions: [],
      recentTrades: [],
      signals: []
    };
  }

  initialize() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Alpaca Trading Bot Dashboard',
      fullUnicode: true
    });

    this.grid = new contrib.grid({
      rows: 12,
      cols: 12,
      screen: this.screen
    });

    this.widgets.portfolioBox = this.grid.set(0, 0, 3, 4, blessed.box, {
      label: ' Portfolio Overview ',
      border: { type: 'line', fg: 'cyan' },
      style: {
        fg: 'white',
        border: { fg: 'cyan' }
      }
    });

    this.widgets.positionsTable = this.grid.set(0, 4, 6, 8, contrib.table, {
      label: ' Open Positions ',
      keys: true,
      interactive: false,
      columnSpacing: 2,
      columnWidth: [12, 8, 10, 10, 10, 10]
    });

    this.widgets.dailyStatsBox = this.grid.set(3, 0, 3, 4, blessed.box, {
      label: ' Daily Statistics ',
      border: { type: 'line', fg: 'yellow' },
      style: {
        fg: 'white',
        border: { fg: 'yellow' }
      }
    });

    this.widgets.signalsBox = this.grid.set(6, 0, 6, 6, blessed.box, {
      label: ' Recent Signals ',
      border: { type: 'line', fg: 'magenta' },
      style: {
        fg: 'white',
        border: { fg: 'magenta' }
      },
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: ' ',
        bg: 'blue'
      }
    });

    this.widgets.tradesBox = this.grid.set(6, 6, 6, 6, blessed.box, {
      label: ' Recent Trades ',
      border: { type: 'line', fg: 'green' },
      style: {
        fg: 'white',
        border: { fg: 'green' }
      },
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: ' ',
        bg: 'blue'
      }
    });

    this.widgets.logBox = this.grid.set(6, 0, 6, 12, blessed.log, {
      label: ' System Log ',
      border: { type: 'line', fg: 'white' },
      style: {
        fg: 'white',
        border: { fg: 'white' }
      },
      scrollback: 100,
      scrollOnInput: true,
      hidden: true
    });

    this.screen.key(['escape', 'q', 'C-c'], () => {
      return process.exit(0);
    });

    this.screen.key(['l'], () => {
      this.toggleLog();
    });

    this.render();
  }

  toggleLog() {
    if (this.widgets.logBox.hidden) {
      this.widgets.signalsBox.hide();
      this.widgets.tradesBox.hide();
      this.widgets.logBox.show();
    } else {
      this.widgets.logBox.hide();
      this.widgets.signalsBox.show();
      this.widgets.tradesBox.show();
    }
    this.render();
  }

  updatePortfolio(data) {
    this.tradingData.portfolio = data;

    const plColor = data.dailyPL >= 0 ? 'green' : 'red';
    const plSymbol = data.dailyPL >= 0 ? '+' : '';

    const content = `
  Equity:        ${chalk.cyan('$' + data.equity.toFixed(2))}
  Buying Power:  ${chalk.yellow('$' + data.buyingPower.toFixed(2))}

  Daily P/L:     ${chalk[plColor](plSymbol + '$' + data.dailyPL.toFixed(2))}
  Daily P/L %:   ${chalk[plColor](plSymbol + data.dailyPLPercent.toFixed(2) + '%')}

  Positions:     ${data.positions}
  Max Positions: ${data.maxPositions || 10}

  Status:        ${data.emergencyStop ? chalk.red('EMERGENCY STOP') : chalk.green('ACTIVE')}
    `;

    this.widgets.portfolioBox.setContent(content);
  }

  updateDailyStats(stats) {
    const winRate = stats.totalTrades > 0 ? stats.winRate.toFixed(2) : '0.00';
    const plColor = stats.totalPL >= 0 ? 'green' : 'red';
    const plSymbol = stats.totalPL >= 0 ? '+' : '';

    const content = `
  Total Trades:    ${chalk.cyan(stats.totalTrades)}
  Winning Trades:  ${chalk.green(stats.winningTrades)}
  Losing Trades:   ${chalk.red(stats.losingTrades)}
  Win Rate:        ${chalk.yellow(winRate + '%')}

  Total P/L:       ${chalk[plColor](plSymbol + '$' + stats.totalPL.toFixed(2))}
    `;

    this.widgets.dailyStatsBox.setContent(content);
  }

  updatePositions(positions) {
    this.tradingData.positions = positions;

    const headers = ['Symbol', 'Qty', 'Entry', 'Current', 'P/L $', 'P/L %'];
    const data = positions.map(pos => {
      const pl = parseFloat(pos.unrealized_pl);
      const plPercent = parseFloat(pos.unrealized_plpc) * 100;

      return [
        pos.symbol,
        pos.qty,
        '$' + parseFloat(pos.avg_entry_price).toFixed(2),
        '$' + parseFloat(pos.current_price).toFixed(2),
        (pl >= 0 ? '+' : '') + '$' + pl.toFixed(2),
        (plPercent >= 0 ? '+' : '') + plPercent.toFixed(2) + '%'
      ];
    });

    if (data.length === 0) {
      data.push(['No open positions', '', '', '', '', '']);
    }

    this.widgets.positionsTable.setData({
      headers: headers,
      data: data
    });
  }

  addSignal(signal) {
    this.tradingData.signals.unshift(signal);
    if (this.tradingData.signals.length > 50) {
      this.tradingData.signals = this.tradingData.signals.slice(0, 50);
    }

    const lines = this.tradingData.signals.map(s => {
      const time = new Date(s.timestamp).toLocaleTimeString();
      const signalColor = s.signal === 'BUY' ? 'green' : s.signal === 'SELL' ? 'red' : 'yellow';

      return `${chalk.gray(time)} ${chalk[signalColor](s.signal.padEnd(6))} ${chalk.cyan(s.symbol.padEnd(10))} ${s.strategy.padEnd(15)} ${chalk.yellow('Strength: ' + s.strength.toFixed(0))}`;
    }).join('\n');

    this.widgets.signalsBox.setContent(lines);
  }

  addTrade(trade) {
    this.tradingData.recentTrades.unshift(trade);
    if (this.tradingData.recentTrades.length > 50) {
      this.tradingData.recentTrades = this.tradingData.recentTrades.slice(0, 50);
    }

    const lines = this.tradingData.recentTrades.map(t => {
      const time = new Date(t.timestamp).toLocaleTimeString();
      const actionColor = t.action === 'BUY' ? 'green' : 'red';

      return `${chalk.gray(time)} ${chalk[actionColor](t.action.padEnd(6))} ${chalk.cyan(t.symbol.padEnd(10))} Qty: ${t.qty}`;
    }).join('\n');

    this.widgets.tradesBox.setContent(lines);
  }

  log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    let coloredMessage = message;

    if (level === 'error') {
      coloredMessage = chalk.red(message);
    } else if (level === 'warn') {
      coloredMessage = chalk.yellow(message);
    } else if (level === 'success') {
      coloredMessage = chalk.green(message);
    }

    this.widgets.logBox.log(`${chalk.gray(timestamp)} ${coloredMessage}`);
  }

  render() {
    this.screen.render();
  }

  destroy() {
    if (this.screen) {
      this.screen.destroy();
    }
  }
}

export const dashboard = new Dashboard();
