import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ConfigManager {
  constructor() {
    this.configPath = path.join(__dirname, '../../config.json');
    this.config = null;
    this.load();
  }

  load() {
    try {
      const data = fs.readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(data);
    } catch (error) {
      console.error('Failed to load config:', error);
      throw error;
    }
  }

  save() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }

  get(key) {
    return key.split('.').reduce((obj, k) => obj?.[k], this.config);
  }

  set(key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, k) => obj[k] = obj[k] || {}, this.config);
    target[lastKey] = value;
    this.save();
  }

  get alpaca() {
    return this.config.alpaca;
  }

  get discord() {
    return this.config.discord;
  }

  get trading() {
    return this.config.trading;
  }

  get assets() {
    return this.config.assets;
  }

  get strategies() {
    return this.config.strategies;
  }

  get schedule() {
    return this.config.schedule;
  }
}

export const config = new ConfigManager();
