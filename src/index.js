import { tradingEngine } from './core/TradingEngine.js';
import { logger } from './utils/Logger.js';

async function main() {
  try {
    logger.info('Starting Alpaca Trading Bot...');

    await tradingEngine.initialize();

    await tradingEngine.start();

    process.on('SIGINT', async () => {
      logger.warn('Received SIGINT, shutting down gracefully...');
      await tradingEngine.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.warn('Received SIGTERM, shutting down gracefully...');
      await tradingEngine.stop();
      process.exit(0);
    });

    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught Exception:', error);
      await tradingEngine.stop();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      logger.error('Unhandled Rejection:', reason);
      await tradingEngine.stop();
      process.exit(1);
    });

  } catch (error) {
    logger.error('Fatal error during startup:', error);
    process.exit(1);
  }
}

main();
