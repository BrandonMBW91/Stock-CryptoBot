# Setup Guide - Alpaca Trading Bot

## Step 1: Install Node.js

1. Download Node.js from: https://nodejs.org/
2. Choose the **LTS version** (Long Term Support)
3. Run the installer
4. Accept all defaults
5. Restart your computer after installation

## Step 2: Verify Installation

Open PowerShell or Command Prompt and run:
```bash
node --version
npm --version
```

You should see version numbers (e.g., v18.17.0 or higher).

## Step 3: Install Dependencies

1. Open PowerShell
2. Navigate to the bot directory:
```bash
cd C:\Users\micha\Desktop\Bot
```

3. Install all dependencies:
```bash
npm install
```

This will install:
- @alpacahq/alpaca-trade-api - Alpaca API client
- axios - HTTP requests for Discord webhooks
- chalk - Terminal colors
- blessed & blessed-contrib - Terminal UI
- technicalindicators - Technical analysis library
- moment-timezone - Time zone handling
- ws - WebSocket support

## Step 4: Configure the Bot

The bot is already configured with your:
- Alpaca API credentials
- Discord webhooks
- Trading parameters ($1500 starting capital)
- Asset lists (11 cryptos + 10 stocks)
- Risk management settings

**No additional configuration needed!**

## Step 5: Start the Bot

### Option A: Use the Batch File (Easiest)
Double-click `start.bat` in the Bot folder

### Option B: Use PowerShell
```bash
cd C:\Users\micha\Desktop\Bot
npm start
```

## Step 6: Monitor the Bot

The dashboard will show:
- Portfolio value and daily P/L
- Open positions with live P/L
- Recent trading signals
- Executed trades
- Daily statistics

### Keyboard Controls:
- **ESC** or **Q** or **Ctrl+C**: Stop the bot
- **L**: Toggle system log view

## Important Notes

### LIVE TRADING WARNING
- The bot is configured for LIVE trading with REAL MONEY
- It will start trading immediately when launched
- Monitor it closely, especially in the first few hours

### To Enable Paper Trading (Recommended for Testing):
1. Open `config.json`
2. Find `"paper": false`
3. Change to `"paper": true`
4. Save and restart the bot

### Daily Summary
- The bot sends a daily summary to Discord at end of trading
- You can manually trigger it by stopping the bot

### Emergency Stop
- If daily loss exceeds 5%, bot automatically stops trading
- All open orders are cancelled
- You'll receive a Discord notification

### Market Hours
- **Crypto**: Trades 24/7
- **Stocks**: Only during market hours (9:30 AM - 4:00 PM ET)
- Bot automatically detects market hours

## Troubleshooting

### "Cannot find module" error
Run: `npm install`

### Dashboard not displaying correctly
- Use Windows Terminal (recommended) or PowerShell
- Avoid Command Prompt (cmd.exe)
- Ensure console window is large enough

### No trades executing
- Check if market is open (for stocks)
- Verify sufficient buying power
- Check logs in `logs/` folder
- Review Discord error notifications

### Rate limiting errors
- Alpaca has rate limits
- Bot is configured to analyze every minute
- Errors are logged but won't crash the bot

## File Structure

```
Bot/
├── config.json           # Your configuration
├── start.bat             # Windows startup script
├── README.md             # Documentation
├── SETUP_GUIDE.md        # This file
├── package.json          # Dependencies
├── src/                  # Source code
└── logs/                 # Log files (created on first run)
```

## Discord Notifications

You'll receive notifications on three channels:

1. **Trade Notifications**: Every buy/sell order
2. **Error Alerts**: Any errors or issues
3. **Daily Summary**: Performance report each day

## Monitoring

### Real-time via Dashboard
The PowerShell dashboard shows everything live

### Discord
Check your webhook channels for notifications

### Logs
Check `logs/` directory:
- `main_YYYY-MM-DD.log` - General operations
- `trades_YYYY-MM-DD.log` - All trades
- `errors_YYYY-MM-DD.log` - Errors only

## Next Steps

1. Install Node.js
2. Run `npm install`
3. **IMPORTANT**: Consider enabling paper trading first
4. Run `npm start` or use `start.bat`
5. Monitor the dashboard
6. Check Discord for notifications

## Support

If you encounter issues:
1. Check the error logs in `logs/` directory
2. Check Discord error webhook
3. Review the system log in dashboard (press 'L')
4. Verify Alpaca API credentials are correct

## Safety Tips

- Start with paper trading to test
- Monitor the bot regularly
- Don't risk more than you can afford to lose
- Keep your API keys secure
- Review logs daily
- Set up stop-loss and take-profit properly
- Understand market volatility

Good luck with your trading bot!
