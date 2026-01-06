import axios from 'axios';
import { config } from './ConfigManager.js';

class DiscordNotifier {
  async sendWebhook(webhookUrl, embed) {
    try {
      await axios.post(webhookUrl, {
        embeds: [embed]
      });
    } catch (error) {
      console.error('Failed to send Discord notification:', error.message);
    }
  }

  async sendTradeNotification(trade) {
    const embed = {
      title: `${trade.action} ORDER EXECUTED`,
      color: trade.action === 'BUY' ? 0x00ff00 : trade.action === 'SELL' ? 0xff0000 : 0xffaa00,
      fields: [
        { name: 'Symbol', value: trade.symbol, inline: true },
        { name: 'Quantity', value: String(trade.qty), inline: true },
        { name: 'Type', value: trade.type.toUpperCase(), inline: true }
      ],
      timestamp: new Date().toISOString()
    };

    if (trade.stopLoss) {
      embed.fields.push({ name: 'Stop Loss', value: `$${trade.stopLoss.toFixed(2)}`, inline: true });
    }

    if (trade.takeProfit) {
      embed.fields.push({ name: 'Take Profit', value: `$${trade.takeProfit.toFixed(2)}`, inline: true });
    }

    if (trade.strategy) {
      embed.fields.push({ name: 'Strategy', value: trade.strategy, inline: true });
    }

    await this.sendWebhook(config.discord.tradeWebhook, embed);
  }

  async sendError(title, error) {
    const embed = {
      title: `ERROR: ${title}`,
      description: error.message || String(error),
      color: 0xff0000,
      fields: [
        { name: 'Stack', value: error.stack ? error.stack.substring(0, 1000) : 'N/A' }
      ],
      timestamp: new Date().toISOString()
    };

    await this.sendWebhook(config.discord.errorWebhook, embed);
  }

  async sendDailySummary(summary) {
    const embed = {
      title: 'DAILY TRADING SUMMARY',
      color: summary.totalPL >= 0 ? 0x00ff00 : 0xff0000,
      fields: [
        { name: 'Total Trades', value: String(summary.totalTrades), inline: true },
        { name: 'Winning Trades', value: String(summary.winningTrades), inline: true },
        { name: 'Losing Trades', value: String(summary.losingTrades), inline: true },
        { name: 'Win Rate', value: `${summary.winRate.toFixed(2)}%`, inline: true },
        { name: 'Total P/L', value: `$${summary.totalPL.toFixed(2)}`, inline: true },
        { name: 'P/L %', value: `${summary.totalPLPercent.toFixed(2)}%`, inline: true },
        { name: 'Starting Equity', value: `$${summary.startingEquity.toFixed(2)}`, inline: true },
        { name: 'Ending Equity', value: `$${summary.endingEquity.toFixed(2)}`, inline: true },
        { name: 'Open Positions', value: String(summary.openPositions), inline: true }
      ],
      timestamp: new Date().toISOString()
    };

    if (summary.topWinner) {
      embed.fields.push({
        name: 'Top Winner',
        value: `${summary.topWinner.symbol}: $${summary.topWinner.pl.toFixed(2)}`,
        inline: true
      });
    }

    if (summary.topLoser) {
      embed.fields.push({
        name: 'Top Loser',
        value: `${summary.topLoser.symbol}: $${summary.topLoser.pl.toFixed(2)}`,
        inline: true
      });
    }

    await this.sendWebhook(config.discord.summaryWebhook, embed);
  }

  async sendStartup(info) {
    const embed = {
      title: 'TRADING BOT STARTED',
      color: 0x0099ff,
      fields: [
        { name: 'Mode', value: info.mode, inline: true },
        { name: 'Portfolio Value', value: `$${info.portfolioValue.toFixed(2)}`, inline: true },
        { name: 'Buying Power', value: `$${info.buyingPower.toFixed(2)}`, inline: true },
        { name: 'Crypto Assets', value: info.cryptoAssets.join(', ') },
        { name: 'Stock Assets', value: info.stockAssets.join(', ') },
        { name: 'Active Strategies', value: info.strategies.join(', ') }
      ],
      timestamp: new Date().toISOString()
    };

    await this.sendWebhook(config.discord.tradeWebhook, embed);
  }

  async sendShutdown(reason) {
    const embed = {
      title: 'TRADING BOT SHUTDOWN',
      description: reason,
      color: 0xff9900,
      timestamp: new Date().toISOString()
    };

    await this.sendWebhook(config.discord.tradeWebhook, embed);
  }
}

export const discordNotifier = new DiscordNotifier();
