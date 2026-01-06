export class BaseStrategy {
  constructor(name, timeframe) {
    this.name = name;
    this.timeframe = timeframe;
    this.enabled = true;
    this.trades = [];
  }

  async analyze(symbol, bars) {
    throw new Error('analyze() must be implemented by subclass');
  }

  async execute(symbol, signal, alpacaClient, riskManager) {
    throw new Error('execute() must be implemented by subclass');
  }

  recordTrade(trade) {
    this.trades.push({
      ...trade,
      timestamp: new Date()
    });
  }

  getPerformance() {
    const winningTrades = this.trades.filter(t => t.pl > 0);
    const losingTrades = this.trades.filter(t => t.pl < 0);
    const totalPL = this.trades.reduce((sum, t) => sum + (t.pl || 0), 0);

    return {
      totalTrades: this.trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: this.trades.length > 0 ? (winningTrades.length / this.trades.length) * 100 : 0,
      totalPL: totalPL
    };
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  isEnabled() {
    return this.enabled;
  }
}
