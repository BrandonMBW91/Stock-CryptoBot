# Alpaca Trading Bot

A sophisticated multi-strategy trading bot for Alpaca Markets supporting both cryptocurrency and stock trading with real-time monitoring, risk management, and Discord notifications.

## Features

- **🔄 Intelligent Trend Rotation** ⭐ NEW!
  - Automatically analyzes ALL assets every 4 hours
  - 100-point scoring system (momentum, trend, volume, technicals, volatility)
  - Focuses trading on top 50% trending assets
  - Market sentiment analysis (BULLISH/BEARISH)
  - Discord notifications on each rotation
  - Maximizes profits by trading only hot assets

- **Multi-Strategy Trading**
  - Scalping (1-minute timeframe)
  - Day Trading (5-minute timeframe)
  - Swing Trading (4-hour timeframe)

- **Advanced Technical Analysis**
  - RSI, MACD, Moving Averages
  - Bollinger Bands, ATR
  - Volume analysis
  - Multi-timeframe confirmation

- **Risk Management**
  - Position sizing (15% max per trade)
  - Stop-loss (2.5%) and take-profit (5%) automation
  - Daily loss limits (5%)
  - Maximum concurrent positions (10)
  - Emergency stop mechanism

- **Real-Time Monitoring**
  - Beautiful enhanced PowerShell HUD dashboard
  - Animated progress bars and indicators
  - Live portfolio tracking with color coding
  - Position monitoring with visual charts
  - Signal detection display
  - Recent trades log

- **Discord Integration**
  - Trade notifications
  - Error alerts
  - Daily performance summaries
  - Trend rotation updates

- **Market Hours Detection**
  - Automatic market hours tracking
  - 24/7 crypto trading
  - Stock trading during market hours only

## Supported Assets

### Cryptocurrencies
- BTC/USD, ETH/USD, DOGE/USD, LTC/USD, SOL/USD
- AVAX/USD, AAVE/USD, LINK/USD, DOT/USD, UNI/USD, SHIB/USD

### Stocks
- SPY, QQQ, AAPL, MSFT, GOOGL, AMZN, TSLA, NVDA, META, AMD

## Installation

1. Install Node.js (version 18 or higher)

2. Install dependencies:
```bash
npm install
```

3. Configure your settings in `config.json`:
   - Alpaca API credentials
   - Discord webhook URLs
   - Trading parameters
   - Asset lists
   - Strategy settings

## Configuration

Edit `config.json` to customize:

- **Trading Parameters**
  - Starting capital
  - Position size limits
  - Stop-loss/take-profit percentages
  - Daily loss limits

- **Strategies**
  - Enable/disable specific strategies
  - Adjust indicator periods
  - Modify signal thresholds

- **Assets**
  - Add/remove cryptocurrencies
  - Add/remove stocks

## Usage

### Start the Bot

```bash
npm start
```

### Dashboard Controls

- **ESC / Q / Ctrl+C**: Quit the bot
- **L**: Toggle system log view

### Dashboard Panels

1. **Portfolio Overview**: Shows equity, buying power, daily P/L, position count
2. **Open Positions**: Live table of current positions with P/L
3. **Daily Statistics**: Trade count, win rate, total P/L
4. **Recent Signals**: Latest trading signals from all strategies
5. **Recent Trades**: Executed trades log

## Risk Management

The bot includes multiple safety mechanisms:

1. **Position Limits**: Maximum 10 concurrent positions
2. **Position Sizing**: Each position limited to 15% of portfolio
3. **Stop-Loss**: Automatic 2.5% stop-loss on all trades
4. **Take-Profit**: Automatic 5% take-profit targets
5. **Daily Loss Limit**: Trading stops if daily loss exceeds 5%
6. **Emergency Stop**: Manual and automatic emergency stop capability

## Strategy Details

### Scalping Strategy
- Timeframe: 1 minute
- Indicators: RSI (14), EMA (9), Volume
- Entry: RSI oversold/overbought with high volume confirmation
- Target: Quick 5% gains

### Day Trading Strategy
- Timeframe: 5 minutes
- Indicators: RSI (14), MACD (12,26,9), SMA (20)
- Entry: MACD crossover + trend confirmation + volume
- Target: 5% gains with trend following

### Swing Trading Strategy
- Timeframe: 4 hours
- Indicators: RSI (14), SMA (50, 200), Bollinger Bands
- Entry: Price near Bollinger bands + SMA trend confirmation
- Target: 10% gains (wider stops and targets)

## Discord Notifications

The bot sends notifications for:

1. **Trade Notifications**: Every buy/sell order executed
2. **Error Alerts**: System errors and failures
3. **Daily Summaries**: End-of-day performance report with:
   - Total trades and win rate
   - P/L and P/L percentage
   - Top winners and losers
   - Open positions

## Logging

Logs are saved in the `logs/` directory:

- `main_YYYY-MM-DD.log`: General operations
- `trades_YYYY-MM-DD.log`: All trade executions
- `errors_YYYY-MM-DD.log`: Error tracking

## Warning

**IMPORTANT**: This bot trades with REAL MONEY.

- Start with small amounts
- Monitor the bot regularly
- Understand the strategies before running
- Review all configuration settings
- Be aware that trading involves risk of loss
- Past performance does not guarantee future results

## Trading Mode

The bot is currently configured for **LIVE TRADING** with real money. To switch to paper trading:

1. Open `config.json`
2. Change `"paper": false` to `"paper": true`
3. Restart the bot

## Support

For issues or questions:
1. Check the logs in the `logs/` directory
2. Review Discord error notifications
3. Check the system log in the dashboard (press 'L')

## Architecture

```
Bot/
├── config.json              # Configuration file
├── package.json             # Dependencies
├── src/
│   ├── index.js            # Main entry point
│   ├── analysis/
│   │   └── TechnicalAnalysis.js    # Technical indicators
│   ├── core/
│   │   ├── TradingEngine.js        # Main trading logic
│   │   ├── RiskManager.js          # Risk management
│   │   └── PortfolioTracker.js     # Portfolio tracking
│   ├── strategies/
│   │   ├── BaseStrategy.js         # Strategy base class
│   │   ├── ScalpingStrategy.js     # Scalping implementation
│   │   ├── DayTradingStrategy.js   # Day trading implementation
│   │   └── SwingTradingStrategy.js # Swing trading implementation
│   ├── ui/
│   │   └── Dashboard.js            # PowerShell HUD
│   └── utils/
│       ├── AlpacaClient.js         # Alpaca API wrapper
│       ├── ConfigManager.js        # Config management
│       ├── DiscordNotifier.js      # Discord webhooks
│       ├── MarketHours.js          # Market hours detection
│       └── Logger.js               # Logging system
└── logs/                            # Log files
```

## License

MIT

## Disclaimer

This software is for educational purposes. Use at your own risk. The authors are not responsible for any financial losses incurred through the use of this bot.
