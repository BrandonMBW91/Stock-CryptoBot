import { RSI, MACD, SMA, EMA, BollingerBands, ATR } from 'technicalindicators';

export class TechnicalAnalysis {
  constructor() {
    this.cache = new Map();
  }

  prepareData(bars) {
    return {
      close: bars.map(b => b.ClosePrice || b.c),
      high: bars.map(b => b.HighPrice || b.h),
      low: bars.map(b => b.LowPrice || b.l),
      open: bars.map(b => b.OpenPrice || b.o),
      volume: bars.map(b => b.Volume || b.v)
    };
  }

  calculateRSI(bars, period = 14) {
    const data = this.prepareData(bars);
    const rsiValues = RSI.calculate({
      values: data.close,
      period: period
    });
    return rsiValues[rsiValues.length - 1];
  }

  calculateMACD(bars, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const data = this.prepareData(bars);
    const macdValues = MACD.calculate({
      values: data.close,
      fastPeriod: fastPeriod,
      slowPeriod: slowPeriod,
      signalPeriod: signalPeriod,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });
    return macdValues[macdValues.length - 1];
  }

  calculateSMA(bars, period = 20) {
    const data = this.prepareData(bars);
    const smaValues = SMA.calculate({
      values: data.close,
      period: period
    });
    return smaValues[smaValues.length - 1];
  }

  calculateEMA(bars, period = 9) {
    const data = this.prepareData(bars);
    const emaValues = EMA.calculate({
      values: data.close,
      period: period
    });
    return emaValues[emaValues.length - 1];
  }

  calculateBollingerBands(bars, period = 20, stdDev = 2) {
    const data = this.prepareData(bars);
    const bbValues = BollingerBands.calculate({
      values: data.close,
      period: period,
      stdDev: stdDev
    });
    return bbValues[bbValues.length - 1];
  }

  calculateATR(bars, period = 14) {
    const data = this.prepareData(bars);
    const atrValues = ATR.calculate({
      high: data.high,
      low: data.low,
      close: data.close,
      period: period
    });
    return atrValues[atrValues.length - 1];
  }

  analyzeVolume(bars) {
    const data = this.prepareData(bars);
    const recentVolume = data.volume.slice(-10);
    const avgVolume = recentVolume.reduce((a, b) => a + b, 0) / recentVolume.length;
    const currentVolume = data.volume[data.volume.length - 1];

    return {
      current: currentVolume,
      average: avgVolume,
      ratio: currentVolume / avgVolume,
      isHighVolume: currentVolume > avgVolume * 1.5
    };
  }

  detectTrend(bars, shortPeriod = 20, longPeriod = 50) {
    const shortMA = this.calculateSMA(bars, shortPeriod);
    const longMA = this.calculateSMA(bars, longPeriod);

    if (shortMA > longMA) {
      return 'UPTREND';
    } else if (shortMA < longMA) {
      return 'DOWNTREND';
    }
    return 'SIDEWAYS';
  }

  detectSupport(bars, lookback = 20) {
    const data = this.prepareData(bars);
    const recentLows = data.low.slice(-lookback);
    return Math.min(...recentLows);
  }

  detectResistance(bars, lookback = 20) {
    const data = this.prepareData(bars);
    const recentHighs = data.high.slice(-lookback);
    return Math.max(...recentHighs);
  }

  analyzeMultiTimeframe(symbol, bars1m, bars5m, bars4h) {
    const analysis = {
      symbol: symbol,
      timestamp: new Date(),
      scalping: null,
      dayTrading: null,
      swingTrading: null,
      overall: null
    };

    if (bars1m && bars1m.length >= 50) {
      analysis.scalping = this.analyzeScalping(bars1m);
    }

    if (bars5m && bars5m.length >= 50) {
      analysis.dayTrading = this.analyzeDayTrading(bars5m);
    }

    if (bars4h && bars4h.length >= 50) {
      analysis.swingTrading = this.analyzeSwingTrading(bars4h);
    }

    analysis.overall = this.combineSignals(analysis);

    return analysis;
  }

  analyzeScalping(bars) {
    const rsi = this.calculateRSI(bars, 14);
    const ema = this.calculateEMA(bars, 9);
    const volume = this.analyzeVolume(bars);
    const data = this.prepareData(bars);
    const currentPrice = data.close[data.close.length - 1];

    let signal = 'NEUTRAL';
    let strength = 0;

    if (rsi < 30 && currentPrice < ema && volume.isHighVolume) {
      signal = 'BUY';
      strength = Math.min(100, (30 - rsi) * 2 + 20);
    } else if (rsi > 70 && currentPrice > ema && volume.isHighVolume) {
      signal = 'SELL';
      strength = Math.min(100, (rsi - 70) * 2 + 20);
    }

    return {
      signal: signal,
      strength: strength,
      rsi: rsi,
      ema: ema,
      price: currentPrice,
      volume: volume
    };
  }

  analyzeDayTrading(bars) {
    const rsi = this.calculateRSI(bars, 14);
    const macd = this.calculateMACD(bars, 12, 26, 9);
    const sma = this.calculateSMA(bars, 20);
    const volume = this.analyzeVolume(bars);
    const data = this.prepareData(bars);
    const currentPrice = data.close[data.close.length - 1];
    const trend = this.detectTrend(bars);

    let signal = 'NEUTRAL';
    let strength = 0;

    if (
      macd &&
      macd.MACD > macd.signal &&
      rsi > 40 && rsi < 60 &&
      currentPrice > sma &&
      trend === 'UPTREND' &&
      volume.isHighVolume
    ) {
      signal = 'BUY';
      strength = 70;
    } else if (
      macd &&
      macd.MACD < macd.signal &&
      rsi > 40 && rsi < 60 &&
      currentPrice < sma &&
      trend === 'DOWNTREND' &&
      volume.isHighVolume
    ) {
      signal = 'SELL';
      strength = 70;
    }

    return {
      signal: signal,
      strength: strength,
      rsi: rsi,
      macd: macd,
      sma: sma,
      price: currentPrice,
      trend: trend,
      volume: volume
    };
  }

  analyzeSwingTrading(bars) {
    const rsi = this.calculateRSI(bars, 14);
    const sma50 = this.calculateSMA(bars, 50);
    const sma200 = this.calculateSMA(bars, 200);
    const bb = this.calculateBollingerBands(bars, 20, 2);
    const data = this.prepareData(bars);
    const currentPrice = data.close[data.close.length - 1];
    const trend = this.detectTrend(bars, 50, 200);

    let signal = 'NEUTRAL';
    let strength = 0;

    if (
      sma50 > sma200 &&
      currentPrice < bb.lower &&
      rsi < 40 &&
      trend === 'UPTREND'
    ) {
      signal = 'BUY';
      strength = 80;
    } else if (
      sma50 < sma200 &&
      currentPrice > bb.upper &&
      rsi > 60 &&
      trend === 'DOWNTREND'
    ) {
      signal = 'SELL';
      strength = 80;
    }

    return {
      signal: signal,
      strength: strength,
      rsi: rsi,
      sma50: sma50,
      sma200: sma200,
      bollingerBands: bb,
      price: currentPrice,
      trend: trend
    };
  }

  combineSignals(analysis) {
    const signals = [];
    let totalStrength = 0;
    let count = 0;

    if (analysis.scalping && analysis.scalping.signal !== 'NEUTRAL') {
      signals.push({ signal: analysis.scalping.signal, strength: analysis.scalping.strength, strategy: 'scalping' });
      totalStrength += analysis.scalping.strength;
      count++;
    }

    if (analysis.dayTrading && analysis.dayTrading.signal !== 'NEUTRAL') {
      signals.push({ signal: analysis.dayTrading.signal, strength: analysis.dayTrading.strength, strategy: 'dayTrading' });
      totalStrength += analysis.dayTrading.strength;
      count++;
    }

    if (analysis.swingTrading && analysis.swingTrading.signal !== 'NEUTRAL') {
      signals.push({ signal: analysis.swingTrading.signal, strength: analysis.swingTrading.strength, strategy: 'swingTrading' });
      totalStrength += analysis.swingTrading.strength;
      count++;
    }

    if (count === 0) {
      return { signal: 'NEUTRAL', strength: 0, consensus: false };
    }

    const buySignals = signals.filter(s => s.signal === 'BUY').length;
    const sellSignals = signals.filter(s => s.signal === 'SELL').length;

    let overallSignal = 'NEUTRAL';
    let consensus = false;

    if (buySignals > sellSignals && buySignals >= 2) {
      overallSignal = 'BUY';
      consensus = true;
    } else if (sellSignals > buySignals && sellSignals >= 2) {
      overallSignal = 'SELL';
      consensus = true;
    }

    return {
      signal: overallSignal,
      strength: totalStrength / count,
      consensus: consensus,
      signals: signals
    };
  }
}

export const technicalAnalysis = new TechnicalAnalysis();
