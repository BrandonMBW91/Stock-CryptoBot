import { alpacaClient } from './src/utils/AlpacaClient.js';
import { ScalpingStrategy } from './src/strategies/ScalpingStrategy.js';
import { DayTradingStrategy } from './src/strategies/DayTradingStrategy.js';
import { SwingTradingStrategy } from './src/strategies/SwingTradingStrategy.js';
import { config } from './src/utils/ConfigManager.js';
import chalk from 'chalk';

class BacktestEngine {
  constructor() {
    this.strategies = [];
    this.results = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      totalLoss: 0,
      maxDrawdown: 0,
      tradeHistory: [],
      strategyResults: {}
    };
    this.initialCapital = 10000; // Simulated starting capital
    this.currentCapital = this.initialCapital;
    this.peakCapital = this.initialCapital;
  }

  async initialize() {
    console.log(chalk.hex('#00D9FF')('╔════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.hex('#00D9FF')('║') + chalk.hex('#FFD700').bold('           BACKTESTING MODE - TRADING BOT v2.0               ') + chalk.hex('#00D9FF')('║'));
    console.log(chalk.hex('#00D9FF')('╚════════════════════════════════════════════════════════════════╝'));
    console.log();

    await alpacaClient.initialize();
    console.log(chalk.green('✓') + ' Alpaca client connected');

    if (config.strategies.scalping.enabled) {
      this.strategies.push(new ScalpingStrategy());
      console.log(chalk.green('✓') + ' Scalping strategy loaded');
    }

    if (config.strategies.dayTrading.enabled) {
      this.strategies.push(new DayTradingStrategy());
      console.log(chalk.green('✓') + ' Day trading strategy loaded');
    }

    if (config.strategies.swingTrading.enabled) {
      this.strategies.push(new SwingTradingStrategy());
      console.log(chalk.green('✓') + ' Swing trading strategy loaded');
    }

    // Initialize strategy results
    this.strategies.forEach(strategy => {
      this.results.strategyResults[strategy.name] = {
        trades: 0,
        wins: 0,
        losses: 0,
        profit: 0
      };
    });

    console.log();
  }

  async runBacktest(symbols, startDate, endDate) {
    console.log(chalk.cyan('Starting backtest...'));
    console.log(chalk.gray(`Period: ${startDate} to ${endDate}`));
    console.log(chalk.gray(`Symbols: ${symbols.join(', ')}`));
    console.log(chalk.gray(`Initial Capital: $${this.initialCapital.toFixed(2)}`));
    console.log();

    for (const symbol of symbols) {
      console.log(chalk.yellow(`\nBacktesting ${symbol}...`));

      for (const strategy of this.strategies) {
        await this.backtestSymbolWithStrategy(symbol, strategy, startDate, endDate);
      }
    }

    this.displayResults();
  }

  async backtestSymbolWithStrategy(symbol, strategy, startDate, endDate) {
    try {
      // Fetch historical data for the strategy's timeframe
      const timeframe = strategy.timeframe;
      const bars = await alpacaClient.getHistoricalBars(symbol, timeframe, startDate, endDate, 1000);

      if (!bars || bars.length < 50) {
        console.log(chalk.gray(`  ⊘ ${strategy.name}: Not enough data`));
        return;
      }

      let signalCount = 0;
      let tradeCount = 0;

      // Simulate strategy analysis on historical bars
      for (let i = 50; i < bars.length - 1; i++) {
        const historicalBars = bars.slice(0, i + 1);
        const currentPrice = bars[i].c;
        const nextPrice = bars[i + 1].c; // Future price for simulation

        // Analyze with the strategy
        const signal = await strategy.analyze(symbol, historicalBars, alpacaClient);

        if (signal.signal !== 'NEUTRAL' && signal.strength >= 70) {
          signalCount++;

          // Simulate trade execution
          if (signal.signal === 'BUY') {
            const positionSize = this.currentCapital * 0.1; // 10% of capital per trade
            const qty = Math.floor(positionSize / currentPrice);

            if (qty >= 1) {
              // Calculate simulated stop-loss and take-profit
              const stopLossPercent = 2; // 2% stop-loss
              const takeProfitPercent = 4; // 4% take-profit (2:1 R/R)

              const stopLossPrice = currentPrice * (1 - stopLossPercent / 100);
              const takeProfitPrice = currentPrice * (1 + takeProfitPercent / 100);

              // Check if trade would have hit SL or TP
              let exitPrice = nextPrice;
              let tradeResult = 'NEUTRAL';

              if (nextPrice <= stopLossPrice) {
                exitPrice = stopLossPrice;
                tradeResult = 'LOSS';
              } else if (nextPrice >= takeProfitPrice) {
                exitPrice = takeProfitPrice;
                tradeResult = 'WIN';
              }

              // Only count completed trades (hit SL or TP)
              if (tradeResult !== 'NEUTRAL') {
                const profit = (exitPrice - currentPrice) * qty;
                this.currentCapital += profit;

                // Track peak for drawdown
                if (this.currentCapital > this.peakCapital) {
                  this.peakCapital = this.currentCapital;
                }

                // Calculate drawdown
                const drawdown = ((this.peakCapital - this.currentCapital) / this.peakCapital) * 100;
                if (drawdown > this.results.maxDrawdown) {
                  this.results.maxDrawdown = drawdown;
                }

                // Record trade
                this.results.totalTrades++;
                tradeCount++;
                this.results.strategyResults[strategy.name].trades++;

                if (tradeResult === 'WIN') {
                  this.results.winningTrades++;
                  this.results.strategyResults[strategy.name].wins++;
                  this.results.totalProfit += profit;
                  this.results.strategyResults[strategy.name].profit += profit;
                } else {
                  this.results.losingTrades++;
                  this.results.strategyResults[strategy.name].losses++;
                  this.results.totalLoss += Math.abs(profit);
                  this.results.strategyResults[strategy.name].profit += profit;
                }

                this.results.tradeHistory.push({
                  symbol,
                  strategy: strategy.name,
                  entry: currentPrice,
                  exit: exitPrice,
                  qty,
                  profit,
                  result: tradeResult,
                  timestamp: bars[i].t
                });
              }
            }
          }
        }
      }

      if (tradeCount > 0) {
        console.log(chalk.green(`  ✓ ${strategy.name}: ${signalCount} signals, ${tradeCount} completed trades`));
      } else if (signalCount > 0) {
        console.log(chalk.gray(`  ○ ${strategy.name}: ${signalCount} signals, 0 completed trades`));
      } else {
        console.log(chalk.gray(`  ⊘ ${strategy.name}: No signals`));
      }

    } catch (error) {
      console.log(chalk.red(`  ✗ ${strategy.name}: Error - ${error.message}`));
    }
  }

  displayResults() {
    console.log();
    console.log(chalk.hex('#00D9FF')('═'.repeat(64)));
    console.log(chalk.hex('#FFD700').bold('                     BACKTEST RESULTS'));
    console.log(chalk.hex('#00D9FF')('═'.repeat(64)));
    console.log();

    // Overall performance
    const totalPL = this.currentCapital - this.initialCapital;
    const totalReturn = ((this.currentCapital - this.initialCapital) / this.initialCapital) * 100;
    const winRate = this.results.totalTrades > 0
      ? (this.results.winningTrades / this.results.totalTrades) * 100
      : 0;
    const avgWin = this.results.winningTrades > 0
      ? this.results.totalProfit / this.results.winningTrades
      : 0;
    const avgLoss = this.results.losingTrades > 0
      ? this.results.totalLoss / this.results.losingTrades
      : 0;
    const profitFactor = this.results.totalLoss > 0
      ? this.results.totalProfit / this.results.totalLoss
      : 0;

    console.log(chalk.cyan('📊 Overall Performance'));
    console.log(chalk.gray('─'.repeat(64)));
    console.log(chalk.white('  Initial Capital:   ') + chalk.yellow(`$${this.initialCapital.toFixed(2)}`));
    console.log(chalk.white('  Final Capital:     ') + chalk.yellow(`$${this.currentCapital.toFixed(2)}`));
    console.log(chalk.white('  Total P/L:         ') + (totalPL >= 0 ? chalk.green : chalk.red)(`${totalPL >= 0 ? '+' : ''}$${totalPL.toFixed(2)}`));
    console.log(chalk.white('  Total Return:      ') + (totalReturn >= 0 ? chalk.green : chalk.red)(`${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`));
    console.log(chalk.white('  Max Drawdown:      ') + chalk.red(`${this.results.maxDrawdown.toFixed(2)}%`));
    console.log();

    console.log(chalk.cyan('📈 Trade Statistics'));
    console.log(chalk.gray('─'.repeat(64)));
    console.log(chalk.white('  Total Trades:      ') + chalk.yellow(this.results.totalTrades));
    console.log(chalk.white('  Winning Trades:    ') + chalk.green(this.results.winningTrades));
    console.log(chalk.white('  Losing Trades:     ') + chalk.red(this.results.losingTrades));
    console.log(chalk.white('  Win Rate:          ') + chalk.hex('#FFD700')(`${winRate.toFixed(2)}%`));
    console.log(chalk.white('  Average Win:       ') + chalk.green(`$${avgWin.toFixed(2)}`));
    console.log(chalk.white('  Average Loss:      ') + chalk.red(`$${avgLoss.toFixed(2)}`));
    console.log(chalk.white('  Profit Factor:     ') + chalk.yellow(profitFactor.toFixed(2)));
    console.log();

    // Strategy breakdown
    console.log(chalk.cyan('🎯 Strategy Breakdown'));
    console.log(chalk.gray('─'.repeat(64)));

    this.strategies.forEach(strategy => {
      const stratResults = this.results.strategyResults[strategy.name];
      const stratWinRate = stratResults.trades > 0
        ? (stratResults.wins / stratResults.trades) * 100
        : 0;

      console.log(chalk.yellow(`\n  ${strategy.name}:`));
      console.log(chalk.white('    Trades:   ') + chalk.white(stratResults.trades));
      console.log(chalk.white('    Win Rate: ') + chalk.hex('#FFD700')(`${stratWinRate.toFixed(2)}%`));
      console.log(chalk.white('    P/L:      ') + (stratResults.profit >= 0 ? chalk.green : chalk.red)(`${stratResults.profit >= 0 ? '+' : ''}$${stratResults.profit.toFixed(2)}`));
    });

    console.log();
    console.log(chalk.hex('#00D9FF')('═'.repeat(64)));
    console.log();

    // Display recent trades
    if (this.results.tradeHistory.length > 0) {
      console.log(chalk.cyan('📋 Last 10 Trades:'));
      console.log(chalk.gray('─'.repeat(64)));

      const recentTrades = this.results.tradeHistory.slice(-10).reverse();
      recentTrades.forEach(trade => {
        const plColor = trade.result === 'WIN' ? chalk.green : chalk.red;
        const icon = trade.result === 'WIN' ? '✓' : '✗';

        console.log(
          chalk.gray(`  ${icon} `) +
          chalk.yellow(trade.symbol.padEnd(8)) +
          chalk.white(trade.strategy.padEnd(18)) +
          chalk.gray('Entry: ') + chalk.white(`$${trade.entry.toFixed(2)}`.padEnd(10)) +
          chalk.gray('Exit: ') + chalk.white(`$${trade.exit.toFixed(2)}`.padEnd(10)) +
          chalk.gray('P/L: ') + plColor(`${trade.profit >= 0 ? '+' : ''}$${trade.profit.toFixed(2)}`)
        );
      });

      console.log();
    }

    // Recommendations
    console.log(chalk.cyan('💡 Recommendations:'));
    console.log(chalk.gray('─'.repeat(64)));

    if (winRate < 40) {
      console.log(chalk.red('  ⚠ Low win rate detected. Consider adjusting strategy parameters.'));
    } else if (winRate >= 50) {
      console.log(chalk.green('  ✓ Good win rate! Strategies are performing well.'));
    }

    if (this.results.maxDrawdown > 20) {
      console.log(chalk.red('  ⚠ High drawdown. Consider implementing stricter risk management.'));
    } else if (this.results.maxDrawdown < 10) {
      console.log(chalk.green('  ✓ Low drawdown. Risk management is effective.'));
    }

    if (profitFactor > 1.5) {
      console.log(chalk.green('  ✓ Excellent profit factor! Strategies are profitable.'));
    } else if (profitFactor < 1) {
      console.log(chalk.red('  ⚠ Profit factor below 1. Strategies need optimization.'));
    }

    if (totalReturn < 0) {
      console.log(chalk.red('  ⚠ Negative returns. DO NOT use these settings for live trading.'));
    } else if (totalReturn > 10) {
      console.log(chalk.green('  ✓ Strong returns. Consider live trading with reduced position sizes.'));
    }

    console.log();
  }
}

// Main execution
async function main() {
  const backtester = new BacktestEngine();

  await backtester.initialize();

  // Configure backtest parameters
  const symbols = ['BTCUSD', 'ETHUSD', 'SPY', 'QQQ', 'TSLA']; // Test subset
  const endDate = new Date(); // Today
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Last 30 days

  await backtester.runBacktest(
    symbols,
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  );

  console.log(chalk.yellow('Backtest complete!'));
  console.log(chalk.gray('Tip: Adjust parameters in backtest.js to test different periods or symbols.'));
  console.log();

  process.exit(0);
}

main().catch(error => {
  console.error(chalk.red('Backtest failed:'), error.message);
  process.exit(1);
});
