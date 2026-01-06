import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Logger {
  constructor() {
    this.logsDir = path.join(__dirname, '../../logs');
    this.ensureLogsDirectory();
  }

  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  getLogFilePath(type = 'main') {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logsDir, `${type}_${date}.log`);
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (data) {
      logMessage += `\n${JSON.stringify(data, null, 2)}`;
    }

    return logMessage;
  }

  writeToFile(filePath, message) {
    try {
      fs.appendFileSync(filePath, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  info(message, data = null) {
    const logMessage = this.formatMessage('info', message, data);
    console.log(logMessage);
    this.writeToFile(this.getLogFilePath('main'), logMessage);
  }

  warn(message, data = null) {
    const logMessage = this.formatMessage('warn', message, data);
    console.warn(logMessage);
    this.writeToFile(this.getLogFilePath('main'), logMessage);
  }

  error(message, error = null) {
    const errorData = error ? {
      message: error.message,
      stack: error.stack
    } : null;

    const logMessage = this.formatMessage('error', message, errorData);
    console.error(logMessage);
    this.writeToFile(this.getLogFilePath('errors'), logMessage);
  }

  trade(message, tradeData) {
    const logMessage = this.formatMessage('trade', message, tradeData);
    console.log(logMessage);
    this.writeToFile(this.getLogFilePath('trades'), logMessage);
  }

  success(message, data = null) {
    const logMessage = this.formatMessage('success', message, data);
    console.log(logMessage);
    this.writeToFile(this.getLogFilePath('main'), logMessage);
  }
}

export const logger = new Logger();
