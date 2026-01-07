// Quick debug script to check if bot is generating signals
import { appendFileSync, writeFileSync } from 'fs';

const DEBUG_FILE = './bot-debug.txt';

// Clear debug file
writeFileSync(DEBUG_FILE, `=== Bot Debug Log Started at ${new Date().toLocaleString()} ===\n\n`);

export function logDebug(message) {
  const timestamp = new Date().toLocaleTimeString();
  const logLine = `[${timestamp}] ${message}\n`;
  appendFileSync(DEBUG_FILE, logLine);
  console.log(logLine); // Also to console
}

console.log('Debug logging initialized. Check bot-debug.txt file.');
