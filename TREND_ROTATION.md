# 🔄 Intelligent Trend Rotation System

## Overview

Your trading bot now features an **intelligent trend rotation system** that automatically identifies and trades only the assets with the strongest upward momentum. This maximizes profitability by focusing on the hottest assets in the market.

## How It Works

### 1. Multi-Factor Scoring System

Every 4 hours, the bot analyzes ALL configured assets (11 cryptos + 10 stocks) using a sophisticated 100-point scoring system:

#### **Price Momentum (0-30 points)**
- Short-term momentum (24-hour price change on 1-hour chart)
- Medium-term momentum (7-day price change on daily chart)
- Rewards: Strong upward price movement
- Penalizes: Downward trends

#### **Trend Strength (0-20 points)**
- Price position vs SMA20 and SMA50
- Golden cross detection (SMA20 > SMA50)
- Consistent uptrend validation
- Rewards: Strong, sustained trends

#### **Volume Strength (0-15 points)**
- Volume ratio vs average
- High volume = high interest/momentum
- Rewards: 2x+ average volume

#### **Technical Indicators (0-20 points)**
- RSI analysis (1-hour and daily)
- MACD crossover detection
- Optimal entry conditions
- Rewards: Healthy momentum without overbought conditions

#### **Volatility Bonus (0-15 points)**
- ATR-based volatility measurement
- Higher volatility = more trading opportunities
- Rewards: 2-3%+ daily volatility

### 2. Asset Selection

After scoring all assets:
- **Top 50%** of assets are selected (minimum 5 assets)
- Only assets scoring **60+** are considered "trending"
- Bot focuses trading on these high-scoring assets only
- Low-performing assets are automatically excluded

### 3. Market Sentiment Analysis

The system calculates overall market sentiment:
- **Crypto Sentiment**: Average score of all crypto assets
- **Stock Sentiment**: Average score of all stock assets
- **Labels**: VERY BULLISH, BULLISH, NEUTRAL, BEARISH, VERY BEARISH

### 4. Automatic Rotation

- **Initial Analysis**: Runs when bot starts
- **Periodic Rotation**: Every 4 hours (configurable)
- **Discord Notifications**: Sent on each rotation with:
  - New active trading symbols
  - Market sentiment levels
  - Top 3 crypto and stock picks

## Benefits

### 🎯 Higher Win Rate
Trade only assets with proven upward momentum

### 💰 Better Returns
Focus capital on the hottest performers

### 📊 Dynamic Adaptation
Automatically adjusts to changing market conditions

### 🚀 Momentum Riding
Catches trending assets early

### 🛡️ Risk Reduction
Avoids downtrending or stagnant assets

## Example Rotation

**Before Rotation (Trading ALL 21 assets):**
- BTCUSD, ETHUSD, DOGEUSD, LTCUSD, SOLUSD, AVAXUSD, AAVEUSD, LINKUSD, DOTUSD, UNIUSD, SHIBUSD
- SPY, QQQ, AAPL, MSFT, GOOGL, AMZN, TSLA, NVDA, META, AMD

**After Trend Analysis (Top 10 trending):**
- BTCUSD (Score: 85) ⭐ VERY BULLISH
- ETHUSD (Score: 78) ⭐ BULLISH
- SOLUSD (Score: 82) ⭐ VERY BULLISH
- NVDA (Score: 88) ⭐ VERY BULLISH
- TSLA (Score: 75) ⭐ BULLISH
- QQQ (Score: 72) ⭐ BULLISH
- AAPL (Score: 70) ⭐ BULLISH
- META (Score: 68) ⭐ BULLISH
- MSFT (Score: 65) ⭐ BULLISH
- LINKUSD (Score: 63) ⭐ BULLISH

**Excluded (Low scores):**
- DOGEUSD (Score: 42) - Sideways
- SHIBUSD (Score: 38) - Downtrend
- AMD (Score: 45) - Weak momentum
- etc.

## Configuration

In `config.json`, you can adjust:

```json
"trading": {
  "trendRotationEnabled": true,        // Enable/disable rotation
  "trendRotationIntervalHours": 4,     // How often to rotate (hours)
  "minTrendingAssets": 5               // Minimum assets to trade
}
```

## What You'll See

### On Startup:
```
Running initial trend analysis...
Analyzing market trends for symbol rotation...
Found 10 trending assets:
  1. NVDA - Score: 88.0
  2. BTCUSD - Score: 85.0
  3. SOLUSD - Score: 82.0
  ...
Market Sentiment - Crypto: VERY BULLISH, Stocks: BULLISH
```

### Discord Notification:
```
🔄 Symbol Rotation Complete

Active Assets: BTCUSD, ETHUSD, SOLUSD, NVDA, TSLA, QQQ, AAPL, META, MSFT, LINKUSD

Crypto Sentiment: VERY BULLISH
Stock Sentiment: BULLISH

Top Crypto: BTCUSD, SOLUSD, ETHUSD
Top Stocks: NVDA, TSLA, QQQ
```

## Advanced Features

### Fallback Protection
If trend analysis fails, bot automatically falls back to trading all configured assets.

### Real-time Adaptation
- Bull market: More assets score high, bot trades more
- Bear market: Fewer assets score high, bot becomes selective
- Sideways market: Only strongest movers are traded

### Asset Class Balancing
System ensures representation from both crypto and stocks based on their individual performance.

## Tips for Best Results

1. **Let it run**: Initial rotation happens at startup
2. **Monitor Discord**: Check rotation notifications to see what's trending
3. **Adjust interval**: Change rotation frequency based on market volatility
4. **Trust the system**: Algorithm is designed to find the best opportunities

## Scoring Breakdown Example

**NVDA - Total Score: 88/100**
- Momentum: 28/30 (Strong 24h and 7d gains)
- Trend: 20/20 (Perfect golden cross, price above SMAs)
- Volume: 12/15 (1.8x average volume)
- Technical: 18/20 (Healthy RSI, bullish MACD)
- Volatility: 10/15 (Good 2.5% daily movement)

## Disable Trend Rotation

If you prefer to trade all assets without rotation:

1. Open `config.json`
2. Set `"trendRotationEnabled": false`
3. Restart the bot

The bot will then trade ALL configured assets regardless of trend.

---

**This feature gives your bot a significant edge by trading smart, not hard!** 🚀
