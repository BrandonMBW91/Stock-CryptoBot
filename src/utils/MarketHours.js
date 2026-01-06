import moment from 'moment-timezone';
import { config } from './ConfigManager.js';

export class MarketHours {
  constructor() {
    this.timezone = config.schedule.timezone;
  }

  isMarketOpen() {
    const now = moment().tz(this.timezone);
    const dayOfWeek = now.day();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    const marketOpen = moment.tz(this.timezone).set({
      hour: 9,
      minute: 30,
      second: 0
    });

    const marketClose = moment.tz(this.timezone).set({
      hour: 16,
      minute: 0,
      second: 0
    });

    return now.isBetween(marketOpen, marketClose);
  }

  getNextMarketOpen() {
    let next = moment().tz(this.timezone).set({
      hour: 9,
      minute: 30,
      second: 0
    });

    if (next.isBefore(moment().tz(this.timezone))) {
      next.add(1, 'day');
    }

    while (next.day() === 0 || next.day() === 6) {
      next.add(1, 'day');
    }

    return next;
  }

  getNextMarketClose() {
    const now = moment().tz(this.timezone);
    const close = moment.tz(this.timezone).set({
      hour: 16,
      minute: 0,
      second: 0
    });

    if (close.isBefore(now)) {
      return this.getNextMarketOpen().set({
        hour: 16,
        minute: 0,
        second: 0
      });
    }

    return close;
  }

  getTimeUntilMarketOpen() {
    const now = moment().tz(this.timezone);
    const nextOpen = this.getNextMarketOpen();
    const duration = moment.duration(nextOpen.diff(now));

    return {
      hours: Math.floor(duration.asHours()),
      minutes: duration.minutes(),
      seconds: duration.seconds()
    };
  }

  getTimeUntilMarketClose() {
    const now = moment().tz(this.timezone);
    const nextClose = this.getNextMarketClose();
    const duration = moment.duration(nextClose.diff(now));

    return {
      hours: Math.floor(duration.asHours()),
      minutes: duration.minutes(),
      seconds: duration.seconds()
    };
  }

  shouldTradeStocks() {
    if (!config.schedule.stocksMarketHoursOnly) {
      return true;
    }

    return this.isMarketOpen();
  }

  shouldTradeCrypto() {
    if (!config.schedule.cryptoEnabled) {
      return false;
    }

    if (config.schedule.crypto24_7) {
      return true;
    }

    return this.isMarketOpen();
  }

  isWeekend() {
    const now = moment().tz(this.timezone);
    const dayOfWeek = now.day();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  getCurrentTimeString() {
    return moment().tz(this.timezone).format('YYYY-MM-DD HH:mm:ss z');
  }
}

export const marketHours = new MarketHours();
