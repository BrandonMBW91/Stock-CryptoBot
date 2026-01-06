import { alpacaClient } from '../utils/AlpacaClient.js';
import { technicalAnalysis } from './TechnicalAnalysis.js';
import { config } from '../utils/ConfigManager.js';

export class TrendAnalyzer {
  constructor() {
    this.assetScores = new Map();
    this.trendingAssets = [];
    this.lastAnalysis = null;
    this.minTrendScore = 60; // Minimum score to be considered trending
  }

  async analyzeAllAssets() {
    // console.log('Analyzing market trends for symbol rotation...');

    const allAssets = [...config.assets.crypto, ...config.assets.stocks];
    const scores = [];

    for (const symbol of allAssets) {
      const score = await this.analyzeAssetTrend(symbol);
      if (score !== null) {
        scores.push({ symbol, score });
        this.assetScores.set(symbol, score);
      }
    }

    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);

    // Take top performers (50% of assets or minimum 5)
    const topCount = Math.max(Math.ceil(allAssets.length * 0.5), 5);
    this.trendingAssets = scores.slice(0, topCount).map(s => s.symbol);

    this.lastAnalysis = new Date();

    // console.log(`Found ${this.trendingAssets.length} trending assets:`);
    // this.trendingAssets.forEach((symbol, index) => {
    //   const score = this.assetScores.get(symbol);
    //   console.log(`  ${index + 1}. ${symbol} - Score: ${score.toFixed(1)}`);
    // });

    return this.trendingAssets;
  }

  async analyzeAssetTrend(symbol) {
    try {
      // Get multiple timeframes for comprehensive analysis
      const bars1h = await alpacaClient.getBars(symbol, '1Hour', 100);
      const bars1d = await alpacaClient.getBars(symbol, '1Day', 50);

      if (!bars1h || bars1h.length < 50 || !bars1d || bars1d.length < 20) {
        return null;
      }

      let score = 50; // Start at neutral

      // 1. Price Momentum (0-30 points)
      const momentumScore = this.calculateMomentumScore(bars1h, bars1d);
      score += momentumScore;

      // 2. Trend Strength (0-20 points)
      const trendScore = this.calculateTrendScore(bars1d);
      score += trendScore;

      // 3. Volume Strength (0-15 points)
      const volumeScore = this.calculateVolumeScore(bars1h);
      score += volumeScore;

      // 4. Technical Indicators (0-20 points)
      const technicalScore = this.calculateTechnicalScore(bars1h, bars1d);
      score += technicalScore;

      // 5. Volatility Bonus (0-15 points) - Higher volatility = more opportunity
      const volatilityScore = this.calculateVolatilityScore(bars1h);
      score += volatilityScore;

      return Math.min(score, 100); // Cap at 100
    } catch (error) {
      console.log(`Error analyzing trend for ${symbol}: ${error.message}`);
      return null;
    }
  }

  calculateMomentumScore(bars1h, bars1d) {
    const data1h = technicalAnalysis.prepareData(bars1h);
    const data1d = technicalAnalysis.prepareData(bars1d);

    let score = 0;

    // Short-term momentum (1-hour)
    const price1h_current = data1h.close[data1h.close.length - 1];
    const price1h_24ago = data1h.close[Math.max(0, data1h.close.length - 24)];
    const change1h = ((price1h_current - price1h_24ago) / price1h_24ago) * 100;

    if (change1h > 5) score += 15;
    else if (change1h > 2) score += 10;
    else if (change1h > 0) score += 5;
    else if (change1h < -2) score -= 5;

    // Medium-term momentum (daily)
    const price1d_current = data1d.close[data1d.close.length - 1];
    const price1d_7ago = data1d.close[Math.max(0, data1d.close.length - 7)];
    const change1d = ((price1d_current - price1d_7ago) / price1d_7ago) * 100;

    if (change1d > 10) score += 15;
    else if (change1d > 5) score += 10;
    else if (change1d > 0) score += 5;
    else if (change1d < -5) score -= 5;

    return score;
  }

  calculateTrendScore(bars1d) {
    const sma20 = technicalAnalysis.calculateSMA(bars1d, 20);
    const sma50 = technicalAnalysis.calculateSMA(bars1d, 50);
    const data = technicalAnalysis.prepareData(bars1d);
    const currentPrice = data.close[data.close.length - 1];

    let score = 0;

    // Price above both SMAs
    if (currentPrice > sma20 && currentPrice > sma50) {
      score += 10;
    }

    // Golden cross (SMA20 > SMA50)
    if (sma20 > sma50) {
      score += 10;
    }

    // Strong uptrend (price consistently above SMA20)
    const pricesAboveSMA = data.close.slice(-10).filter((p, i) => {
      const sma = technicalAnalysis.calculateSMA(bars1d.slice(0, -9 + i), 20);
      return p > sma;
    });

    if (pricesAboveSMA.length >= 8) {
      score += 5;
    }

    return score;
  }

  calculateVolumeScore(bars1h) {
    const volumeAnalysis = technicalAnalysis.analyzeVolume(bars1h);

    let score = 0;

    // High volume is good (indicates interest)
    if (volumeAnalysis.ratio > 2.0) {
      score += 15;
    } else if (volumeAnalysis.ratio > 1.5) {
      score += 10;
    } else if (volumeAnalysis.ratio > 1.2) {
      score += 5;
    }

    return score;
  }

  calculateTechnicalScore(bars1h, bars1d) {
    let score = 0;

    // RSI analysis (1-hour)
    const rsi1h = technicalAnalysis.calculateRSI(bars1h, 14);
    if (rsi1h > 40 && rsi1h < 70) {
      score += 5; // Healthy momentum, not overbought
    } else if (rsi1h >= 70) {
      score += 3; // Strong but overbought
    }

    // MACD analysis (daily)
    const macd1d = technicalAnalysis.calculateMACD(bars1d, 12, 26, 9);
    if (macd1d && macd1d.MACD > macd1d.signal) {
      score += 8; // Bullish MACD
    }

    // RSI analysis (daily)
    const rsi1d = technicalAnalysis.calculateRSI(bars1d, 14);
    if (rsi1d > 50 && rsi1d < 75) {
      score += 7; // Strong upward momentum
    }

    return score;
  }

  calculateVolatilityScore(bars1h) {
    const atr = technicalAnalysis.calculateATR(bars1h, 14);
    const data = technicalAnalysis.prepareData(bars1h);
    const currentPrice = data.close[data.close.length - 1];

    const volatilityPercent = (atr / currentPrice) * 100;

    let score = 0;

    // Higher volatility = more trading opportunities
    if (volatilityPercent > 3) {
      score += 15;
    } else if (volatilityPercent > 2) {
      score += 10;
    } else if (volatilityPercent > 1) {
      score += 5;
    }

    return score;
  }

  getTrendingAssets() {
    return this.trendingAssets;
  }

  getAssetScore(symbol) {
    return this.assetScores.get(symbol) || 0;
  }

  shouldReanalyze() {
    if (!this.lastAnalysis) return true;

    const hoursSinceAnalysis = (new Date() - this.lastAnalysis) / (1000 * 60 * 60);

    // Reanalyze every 4 hours for crypto, every day for stocks
    return hoursSinceAnalysis >= 4;
  }

  getTopCrypto(count = 5) {
    const cryptoAssets = this.trendingAssets.filter(symbol =>
      config.assets.crypto.includes(symbol)
    );
    return cryptoAssets.slice(0, count);
  }

  getTopStocks(count = 5) {
    const stockAssets = this.trendingAssets.filter(symbol =>
      config.assets.stocks.includes(symbol)
    );
    return stockAssets.slice(0, count);
  }

  async getMarketSentiment() {
    const cryptoScores = [];
    const stockScores = [];

    this.assetScores.forEach((score, symbol) => {
      if (config.assets.crypto.includes(symbol)) {
        cryptoScores.push(score);
      } else if (config.assets.stocks.includes(symbol)) {
        stockScores.push(score);
      }
    });

    const avgCryptoScore = cryptoScores.length > 0
      ? cryptoScores.reduce((a, b) => a + b, 0) / cryptoScores.length
      : 50;

    const avgStockScore = stockScores.length > 0
      ? stockScores.reduce((a, b) => a + b, 0) / stockScores.length
      : 50;

    return {
      crypto: avgCryptoScore,
      stocks: avgStockScore,
      overall: (avgCryptoScore + avgStockScore) / 2,
      cryptoSentiment: this.getSentimentLabel(avgCryptoScore),
      stocksSentiment: this.getSentimentLabel(avgStockScore)
    };
  }

  getSentimentLabel(score) {
    if (score >= 70) return 'VERY BULLISH';
    if (score >= 60) return 'BULLISH';
    if (score >= 50) return 'NEUTRAL';
    if (score >= 40) return 'BEARISH';
    return 'VERY BEARISH';
  }
}

export const trendAnalyzer = new TrendAnalyzer();
