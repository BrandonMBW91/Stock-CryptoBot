import chalk from 'chalk';
import { marketHours } from '../utils/MarketHours.js';

export class InPlaceDashboard {
  constructor() {
    this.tradingData = {
      portfolio: {},
      positions: [],
      recentTrades: [],
      signals: [],
      dailyStats: {},
      hotSignals: [],
      marketHeat: []
    };
    this.frameCount = 0;
    this.nextAnalysisTime = null;
    this.platformName = 'ALPACA'; // Default, can be changed
    this.tradingMode = 'LIVE TRADING';
  }

  setPlatform(platform, mode) {
    this.platformName = platform;
    this.tradingMode = mode;
  }

  initialize() {
    console.clear();
    // Hide cursor
    process.stdout.write('\x1B[?25l');
    this.render();
  }

  moveCursor(row, col) {
    process.stdout.write(`\x1B[${row};${col}H`);
  }

  clearLine() {
    process.stdout.write('\x1B[2K');
  }

  getProgressBar(percent, width = 30) {
    const filled = Math.min(width, Math.max(0, Math.round((percent / 100) * width)));
    const empty = Math.max(0, width - filled);

    let color;
    if (percent >= 80) color = chalk.green;
    else if (percent >= 50) color = chalk.yellow;
    else if (percent >= 30) color = chalk.hex('#FFA500');
    else color = chalk.red;

    return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  getSpinner() {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    return chalk.cyan(frames[this.frameCount % frames.length]);
  }

  getHeatBar(percent, width = 20) {
    const filled = Math.min(width, Math.max(0, Math.round((percent / 100) * width)));
    const empty = Math.max(0, width - filled);

    let color;
    if (percent >= 90) color = chalk.hex('#FF0000'); // Red hot
    else if (percent >= 75) color = chalk.hex('#FF4500'); // Orange red
    else if (percent >= 60) color = chalk.hex('#FFA500'); // Orange
    else if (percent >= 40) color = chalk.hex('#FFD700'); // Gold
    else color = chalk.hex('#4169E1'); // Cool blue

    return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  getTemperatureIcon(percent) {
    if (percent >= 90) return chalk.hex('#FF0000')('🔥'); // Super hot
    if (percent >= 75) return chalk.hex('#FF4500')('🌡️'); // Hot
    if (percent >= 60) return chalk.hex('#FFA500')('♨️'); // Warm
    if (percent >= 40) return chalk.hex('#FFD700')('💨'); // Mild
    return chalk.hex('#4169E1')('❄️'); // Cold
  }

  // Helper to ensure exact column width (49 chars for each column)
  padColumn(content, width = 49) {
    // Strip ANSI codes to measure actual length
    const stripped = content.replace(/\x1B\[[0-9;]*m/g, '');

    // Count emoji characters (they take 2 visual spaces but count as 1-2 chars)
    // Common emojis used in dashboard
    const emojiCount = (stripped.match(/[💰📊✅🛑▲▼🔥⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏🌡️♨️💨❄️📈📉🟢🔴🎯💼🔒🟡]/g) || []).length;

    // Adjust for emoji width (each emoji takes roughly 1 extra space)
    const visualLength = stripped.length + emojiCount;
    const padding = Math.max(0, width - visualLength);
    return content + ' '.repeat(padding);
  }

  render() {
    try {
      this.frameCount++;

      // Move to top-left
      this.moveCursor(1, 1);

      const lines = [];

    // Banner - Dynamic based on platform
    const title = `🚀 ${this.platformName} TRADING BOT v2.0 - ${this.tradingMode} 🚀`;
    const titlePadding = Math.floor((116 - title.length) / 2); // 116 is inner width
    const paddedTitle = ' '.repeat(titlePadding) + title + ' '.repeat(116 - title.length - titlePadding);
    lines.push(chalk.hex('#00D9FF')('╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗'));
    lines.push(chalk.hex('#00D9FF')('║') + chalk.hex('#FFD700').bold(paddedTitle) + chalk.hex('#00D9FF')('║'));
    lines.push(chalk.hex('#00D9FF')('╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝'));
    lines.push('');

    // Portfolio & Stats
    const p = this.tradingData.portfolio;
    const s = this.tradingData.dailyStats;

    if (p.equity) {
      const plColor = p.dailyPL >= 0 ? chalk.green : chalk.red;
      const plSymbol = p.dailyPL >= 0 ? '+' : '-';
      const statusColor = p.emergencyStop ? chalk.red : chalk.green;
      const statusText = p.emergencyStop ? 'EMERGENCY STOP' : 'ACTIVE';
      const positionUsage = (p.positions / (p.maxPositions || 10)) * 100;

      lines.push(chalk.hex('#00D9FF')('╔═══════════════════════════════════════════════════╦═══════════════════════════════════════════════════╗'));

      const leftHeader = this.padColumn(chalk.hex('#FFD700').bold('PORTFOLIO STATUS'));
      const rightHeader = this.padColumn(chalk.hex('#FFD700').bold('DAILY PERFORMANCE'));
      lines.push(chalk.hex('#00D9FF')('║ ') + leftHeader + chalk.hex('#00D9FF')('║ ') + rightHeader + chalk.hex('#00D9FF')('║'));

      lines.push(chalk.hex('#00D9FF')('╠═══════════════════════════════════════════════════╬═══════════════════════════════════════════════════╣'));

      // Status with badge styling
      const statusBadge = p.emergencyStop ? chalk.bgRed.white.bold(' STOPPED ') : chalk.bgGreen.black.bold(' ACTIVE ');
      const leftRow1 = this.padColumn(chalk.hex('#00D9FF')('Status: ') + statusBadge);
      const rightRow1 = this.padColumn(chalk.hex('#00D9FF')('Today: ') + chalk.hex('#FFD700').bold((s.totalTrades || 0)) + chalk.gray(' trades  ') + chalk.hex('#00D9FF')('All-Time: ') + chalk.hex('#FFD700').bold((s.lifetimeTotal || 0)));
      lines.push(chalk.hex('#00D9FF')('║ ') + leftRow1 + chalk.hex('#00D9FF')('║ ') + rightRow1 + chalk.hex('#00D9FF')('║'));

      // Equity with vibrant colors
      const equityColor = p.dailyPL >= 0 ? chalk.hex('#00FF88') : chalk.hex('#FF6B6B');
      const leftRow2 = this.padColumn(chalk.hex('#00D9FF')('Equity: ') + equityColor.bold(`$${p.equity.toFixed(2)}`));
      const rightRow2 = this.padColumn(chalk.hex('#00D9FF')('Today W/L: ') + chalk.hex('#00FF88')((s.winningTrades || 0)) + chalk.hex('#666666')('/') + chalk.hex('#FF6B6B')((s.losingTrades || 0)) + chalk.gray('  ') + chalk.hex('#00D9FF')('All W/L: ') + chalk.hex('#00FF88')((s.lifetimeWins || 0)) + chalk.hex('#666666')('/') + chalk.hex('#FF6B6B')((s.lifetimeLosses || 0)));
      lines.push(chalk.hex('#00D9FF')('║ ') + leftRow2 + chalk.hex('#00D9FF')('║ ') + rightRow2 + chalk.hex('#00D9FF')('║'));

      // Buying power with cyan highlight
      const leftRow3 = this.padColumn(chalk.hex('#00D9FF')('Buying Power: ') + chalk.hex('#4ECDC4').bold(`$${p.buyingPower.toFixed(2)}`));
      const rightRow3 = this.padColumn(chalk.hex('#00D9FF')('Today Rate: ') + chalk.hex('#FFD700').bold(`${(s.winRate || 0).toFixed(1)}%`) + chalk.gray('  ') + chalk.hex('#00D9FF')('All Rate: ') + chalk.hex('#FFD700').bold(`${(s.lifetimeWinRate || 0).toFixed(1)}%`));
      lines.push(chalk.hex('#00D9FF')('║ ') + leftRow3 + chalk.hex('#00D9FF')('║ ') + rightRow3 + chalk.hex('#00D9FF')('║'));

      // P/L with enhanced colors
      const plColorEnhanced = p.dailyPL >= 0 ? chalk.hex('#00FF88') : chalk.hex('#FF6B6B');
      const lifetimePLColor = (s.lifetimeTotalPL || 0) >= 0 ? chalk.hex('#00FF88') : chalk.hex('#FF6B6B');
      const leftRow4 = this.padColumn(chalk.hex('#00D9FF')('Daily P/L: ') + plColorEnhanced.bold(`${plSymbol}$${Math.abs(p.dailyPL).toFixed(2)}`) + ' ' + plColorEnhanced(`(${p.dailyPLPercent >= 0 ? '+' : ''}${p.dailyPLPercent.toFixed(2)}%)`));
      const rightRow4 = this.padColumn(chalk.hex('#00D9FF')('Today P/L: ') + plColorEnhanced.bold(`${p.dailyPL >= 0 ? '+' : ''}$${(s.totalPL || 0).toFixed(2)}`) + chalk.gray('  ') + chalk.hex('#00D9FF')('All P/L: ') + lifetimePLColor.bold(`${(s.lifetimeTotalPL || 0) >= 0 ? '+' : ''}$${(s.lifetimeTotalPL || 0).toFixed(2)}`));
      lines.push(chalk.hex('#00D9FF')('║ ') + leftRow4 + chalk.hex('#00D9FF')('║ ') + rightRow4 + chalk.hex('#00D9FF')('║'));

      const leftRow5 = this.padColumn(chalk.hex('#00D9FF')('Positions: ') + chalk.hex('#FFD700').bold(`${p.positions}`) + chalk.gray('/') + chalk.hex('#666666')(`${p.maxPositions || 10}`));

      // Market status with colorful badges
      const isOpen = marketHours.isMarketOpen();
      const isPreMarket = marketHours.isPreMarket();
      const isWeekend = marketHours.isWeekend();

      let marketStatusText = '';
      if (isWeekend) {
        const timeUntil = marketHours.getTimeUntilMarketOpen();
        marketStatusText = chalk.hex('#00D9FF')('Market: ') + chalk.hex('#666666')(`CLOSED ${timeUntil.hours}h ${timeUntil.minutes}m`);
      } else if (isOpen) {
        const timeUntil = marketHours.getTimeUntilMarketClose();
        marketStatusText = chalk.hex('#00D9FF')('Market: ') + chalk.hex('#00FF88').bold(`OPEN `) + chalk.hex('#00FF88')(`${timeUntil.hours}h ${timeUntil.minutes}m`);
      } else if (isPreMarket) {
        const timeUntil = marketHours.getTimeUntilMarketOpen();
        marketStatusText = chalk.hex('#00D9FF')('Market: ') + chalk.hex('#FFD700')(`PRE ${timeUntil.hours}h ${timeUntil.minutes}m`);
      } else {
        const timeUntil = marketHours.getTimeUntilMarketOpen();
        marketStatusText = chalk.hex('#00D9FF')('Market: ') + chalk.hex('#666666')(`CLOSED ${timeUntil.hours}h ${timeUntil.minutes}m`);
      }

      const rightRow5 = this.padColumn(marketStatusText);
      lines.push(chalk.hex('#00D9FF')('║ ') + leftRow5 + chalk.hex('#00D9FF')('║ ') + rightRow5 + chalk.hex('#00D9FF')('║'));

      const leftRow6 = this.padColumn(this.getProgressBar(positionUsage, 45) + ' ' + chalk.gray(`${positionUsage.toFixed(0)}%`));

      // Trade indicator - compact
      let activityText = '';
      const hotSignalCount = this.tradingData.hotSignals.length;

      if (hotSignalCount > 0) {
        activityText = chalk.cyan('Scan: ') + chalk.red.bold(`${hotSignalCount} HOT SIGNALS`);
      } else if (this.nextAnalysisTime) {
        const secondsUntil = Math.max(0, Math.floor((this.nextAnalysisTime - Date.now()) / 1000));
        activityText = chalk.cyan('Scan: ') + this.getSpinner() + chalk.gray(` ${secondsUntil}s`);
      } else {
        activityText = chalk.cyan('Scan: ') + this.getSpinner() + chalk.gray(' analyzing');
      }

      const rightRow6 = this.padColumn(activityText);
      lines.push(chalk.hex('#00D9FF')('║ ') + leftRow6 + chalk.hex('#00D9FF')('║ ') + rightRow6 + chalk.hex('#00D9FF')('║'));

      lines.push(chalk.hex('#00D9FF')('╚═══════════════════════════════════════════════════╩═══════════════════════════════════════════════════╝'));
    } else {
      lines.push(chalk.gray('Loading portfolio data...'));
      for (let i = 0; i < 8; i++) lines.push('');
    }

    lines.push('');

    // Positions and Market Heat side by side
    lines.push(chalk.hex('#00D9FF')('╔═══════════════════════════════════════════════════╦═══════════════════════════════════════════════════╗'));

    const leftHeader = this.padColumn(chalk.hex('#FFD700').bold('OPEN POSITIONS'));
    const rightHeader = this.padColumn(chalk.hex('#FFD700').bold('MARKET HEAT'));
    lines.push(chalk.hex('#00D9FF')('║ ') + leftHeader + chalk.hex('#00D9FF')('║ ') + rightHeader + chalk.hex('#00D9FF')('║'));

    lines.push(chalk.hex('#00D9FF')('╠═══════════════════════════════════════════════════╬═══════════════════════════════════════════════════╣'));

    // Get positions and heat data
    const maxRows = 8;

    for (let i = 0; i < maxRows; i++) {
      let leftContent = '';
      let rightContent = '';

      // Left side - Positions
      if (i === 0) {
        if (this.tradingData.positions.length === 0) {
          leftContent = chalk.gray('No open positions');
        } else {
          leftContent = chalk.cyan('SYM') + '  ' + chalk.cyan('QTY') + '   ' + chalk.cyan('ENTRY') + '    ' + chalk.cyan('P/L $') + '      ' + chalk.cyan('P/L %');
        }
      } else if (i === 1 && this.tradingData.positions.length > 0) {
        leftContent = chalk.gray('─'.repeat(49));
      } else if (i >= 2 && this.tradingData.positions.length > 0) {
        const posIndex = i - 2;
        if (posIndex < this.tradingData.positions.length) {
          const pos = this.tradingData.positions[posIndex];
          const pl = parseFloat(pos.unrealized_pl);
          const plPercent = parseFloat(pos.unrealized_plpc) * 100;
          const plColor = pl >= 0 ? chalk.green : chalk.red;
          const plIcon = pl >= 0 ? '+' : '-';

          leftContent =
            plIcon + ' ' +
            chalk.yellow(pos.symbol.padEnd(5)) + ' ' +
            chalk.white(pos.qty.toString().padEnd(4)) + ' ' +
            chalk.white(`$${parseFloat(pos.avg_entry_price).toFixed(2)}`.padEnd(8)) + ' ' +
            plColor(`${pl >= 0 ? '+' : ''}$${pl.toFixed(2)}`.padEnd(9)) + ' ' +
            plColor(`${plPercent >= 0 ? '+' : ''}${plPercent.toFixed(1)}%`);
        }
      }

      // Right side - Market Heat
      if (i === 0) {
        if (this.tradingData.marketHeat.length === 0) {
          rightContent = chalk.gray('Scanning for opportunities...');
        } else {
          rightContent = chalk.cyan('SYMBOL') + '   ' + chalk.cyan('DIR') + '   ' + chalk.cyan('STR') + '  ' + chalk.cyan('HEAT');
        }
      } else if (i === 1 && this.tradingData.marketHeat.length > 0) {
        rightContent = chalk.gray('─'.repeat(49));
      } else if (i >= 2 && this.tradingData.marketHeat.length > 0) {
        const heatIndex = i - 2;
        if (heatIndex < this.tradingData.marketHeat.length) {
          const heat = this.tradingData.marketHeat[heatIndex];
          const signalColor = heat.direction === 'BUY' ? chalk.green : chalk.red;
          const heatPercent = (heat.strength / 55) * 100;
          const heatBar = this.getHeatBar(heatPercent, 12);
          const tempIcon = this.getTemperatureIcon(heatPercent);

          rightContent =
            chalk.yellow(heat.symbol.padEnd(8)) + ' ' +
            signalColor(heat.direction.slice(0,3).padEnd(4)) + ' ' +
            chalk.white(heat.strength.toFixed(0).padEnd(3)) + ' ' +
            tempIcon + heatBar;
        }
      }

      const leftPadded = this.padColumn(leftContent);
      const rightPadded = this.padColumn(rightContent);
      lines.push(chalk.hex('#00D9FF')('║ ') + leftPadded + chalk.hex('#00D9FF')('║ ') + rightPadded + chalk.hex('#00D9FF')('║'));
    }

    lines.push(chalk.hex('#00D9FF')('╚═══════════════════════════════════════════════════╩═══════════════════════════════════════════════════╝'));
    lines.push('');

    // Signals and Trades
    lines.push(chalk.hex('#00D9FF')('╔═══════════════════════════════════════════════════╦═══════════════════════════════════════════════════╗'));
    lines.push(
      chalk.hex('#00D9FF')('║ ') + chalk.hex('#FFD700').bold('🎯 RECENT SIGNALS (Last 5)') + ' '.repeat(22) +
      chalk.hex('#00D9FF')('║ ') + chalk.hex('#FFD700').bold('💼 RECENT TRADES (Last 5)') + ' '.repeat(23) + chalk.hex('#00D9FF')('║')
    );
    lines.push(chalk.hex('#00D9FF')('╠═══════════════════════════════════════════════════╬═══════════════════════════════════════════════════╣'));

    for (let i = 0; i < 5; i++) {
      let leftContent = ' '.repeat(49);
      let rightContent = ' '.repeat(49);

      if (i < this.tradingData.signals.length) {
        const s = this.tradingData.signals[i];
        const time = new Date(s.timestamp).toLocaleTimeString();
        const signalColor = s.signal === 'BUY' ? chalk.green : s.signal === 'SELL' ? chalk.red : chalk.yellow;
        const icon = s.signal === 'BUY' ? '📈' : '📉';

        leftContent =
          chalk.gray(time.slice(0, 8).padEnd(9)) + icon + ' ' + signalColor.bold(s.signal.padEnd(4)) + ' ' +
          chalk.yellow(s.symbol.padEnd(8)) + ' ' + chalk.white(`${s.strength.toFixed(0)}`.padEnd(3)) + ' ' +
          chalk.gray(s.strategy.slice(0, 13).padEnd(13));
      } else if (i === 0 && this.tradingData.signals.length === 0) {
        leftContent = chalk.gray('No signals detected yet'.padEnd(49));
      }

      if (i < this.tradingData.recentTrades.length) {
        const t = this.tradingData.recentTrades[i];
        const time = new Date(t.timestamp).toLocaleTimeString();
        const actionColor = t.action === 'BUY' ? chalk.green : chalk.red;
        const icon = t.action === 'BUY' ? '🟢' : '🔴';

        rightContent =
          chalk.gray(time.slice(0, 8).padEnd(9)) + icon + ' ' + actionColor.bold(t.action.padEnd(4)) + ' ' +
          chalk.yellow(t.symbol.padEnd(8)) + ' ' + chalk.white(`Qty: ${t.qty}`.padEnd(20));
      } else if (i === 0 && this.tradingData.recentTrades.length === 0) {
        rightContent = chalk.gray('No trades executed yet'.padEnd(49));
      }

      lines.push(chalk.hex('#00D9FF')('║ ') + leftContent + chalk.hex('#00D9FF')('║ ') + rightContent + chalk.hex('#00D9FF')('║'));
    }

    lines.push(chalk.hex('#00D9FF')('╚═══════════════════════════════════════════════════╩═══════════════════════════════════════════════════╝'));

    // Footer
    const now = new Date();
    lines.push('');
    lines.push(
      chalk.gray('  [Ctrl+C] Stop  │  ') + chalk.cyan('Auto-update: Every 1s  │  ') +
      chalk.yellow(now.toLocaleDateString() + ' ' + now.toLocaleTimeString()) +
      chalk.gray('  │  ') + this.getSpinner() + chalk.cyan(' Live')
    );

      // Print all lines
      for (let i = 0; i < lines.length; i++) {
        this.moveCursor(i + 1, 1);
        this.clearLine();
        process.stdout.write(lines[i]);
      }
    } catch (error) {
      // Silently log render errors to avoid breaking the dashboard
      import('fs').then(({ appendFileSync }) => {
        try {
          appendFileSync('./bot-debug.txt', `[${new Date().toLocaleTimeString()}] Dashboard render error: ${error.message}\n`);
        } catch (e) {}
      });
    }
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

    // Track hot signals (strength >= 50, approaching trade threshold of 55)
    if (signal.strength >= 50) {
      this.tradingData.hotSignals.unshift(signal);
      if (this.tradingData.hotSignals.length > 5) {
        this.tradingData.hotSignals = this.tradingData.hotSignals.slice(0, 5);
      }
    }
  }

  clearHotSignals() {
    this.tradingData.hotSignals = [];
  }

  setNextAnalysisTime(timestamp) {
    this.nextAnalysisTime = timestamp;
  }

  updateMarketHeat(heatData) {
    // heatData should be array of: { symbol, direction, strength, indicator }
    // Show signals in the "warming up" zone (20-54) before they reach trade threshold (55+)
    const debugLog = (msg) => {
      import('node:fs').then(({ appendFileSync }) => {
        try {
          appendFileSync('./bot-debug.txt', `[${new Date().toLocaleTimeString()}] ${msg}\n`);
        } catch (e) {}
      }).catch(() => {});
    };

    debugLog(`📊 updateMarketHeat called with ${heatData.length} items`);

    const filtered = heatData.filter(h => h.strength >= 20);
    debugLog(`📊 After filter (>=20): ${filtered.length} items`);

    this.tradingData.marketHeat = filtered
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 10);

    debugLog(`📊 Final marketHeat array: ${this.tradingData.marketHeat.length} items`);
    if (this.tradingData.marketHeat.length > 0) {
      debugLog(`📊 Market Heat contents: ${this.tradingData.marketHeat.map(h => `${h.symbol}:${h.strength.toFixed(0)}`).join(', ')}`);
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

  destroy() {
    // Show cursor
    process.stdout.write('\x1B[?25h');
  }
}

export const dashboard = new InPlaceDashboard();
