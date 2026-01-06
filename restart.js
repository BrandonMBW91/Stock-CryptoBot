import { spawn } from 'child_process';
import chalk from 'chalk';
import { appendFileSync } from 'fs';

const LOG_FILE = './restart.log';
const MAX_RESTARTS_PER_HOUR = 10;
const RESTART_DELAY_MS = 5000; // 5 seconds

let restartHistory = [];
let botProcess = null;
let isShuttingDown = false;

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

  // Write to log file
  try {
    appendFileSync(LOG_FILE, logMessage);
  } catch (error) {
    console.error('Failed to write to log file:', error.message);
  }

  // Console output with colors
  const now = new Date().toLocaleTimeString();
  let prefix = chalk.gray(`[${now}]`) + ' ';

  switch(level) {
    case 'success':
      prefix += chalk.green('✓ RESTART');
      break;
    case 'error':
      prefix += chalk.red('✗ RESTART');
      break;
    case 'warn':
      prefix += chalk.yellow('⚠ RESTART');
      break;
    case 'info':
    default:
      prefix += chalk.blue('ℹ RESTART');
      break;
  }

  console.log(prefix + ' ' + message);
}

function cleanOldRestarts() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  restartHistory = restartHistory.filter(time => time > oneHourAgo);
}

function canRestart() {
  cleanOldRestarts();

  if (restartHistory.length >= MAX_RESTARTS_PER_HOUR) {
    log(`Restart limit reached (${MAX_RESTARTS_PER_HOUR} restarts per hour). Bot will not auto-restart.`, 'error');
    log('Please investigate the issue manually.', 'error');
    return false;
  }

  return true;
}

function startBot() {
  if (isShuttingDown) {
    log('Shutdown in progress, not starting bot', 'warn');
    return;
  }

  log('Starting trading bot...', 'info');

  // Spawn the bot process
  botProcess = spawn('node', ['src/index.js'], {
    stdio: 'inherit',
    shell: true
  });

  botProcess.on('exit', (code, signal) => {
    if (isShuttingDown) {
      log('Bot stopped cleanly during shutdown', 'info');
      process.exit(0);
      return;
    }

    if (code === 0) {
      log('Bot exited normally (code 0)', 'info');
      log('Not restarting (manual stop detected)', 'info');
      process.exit(0);
    } else if (signal === 'SIGINT' || signal === 'SIGTERM') {
      log(`Bot stopped by signal: ${signal}`, 'info');
      log('Not restarting (manual stop detected)', 'info');
      process.exit(0);
    } else {
      log(`Bot crashed with exit code: ${code}, signal: ${signal}`, 'error');

      if (canRestart()) {
        restartHistory.push(Date.now());
        log(`Restarting in ${RESTART_DELAY_MS / 1000} seconds... (${restartHistory.length}/${MAX_RESTARTS_PER_HOUR} restarts this hour)`, 'warn');

        setTimeout(() => {
          startBot();
        }, RESTART_DELAY_MS);
      } else {
        log('Auto-restart disabled due to too many failures', 'error');
        process.exit(1);
      }
    }
  });

  botProcess.on('error', (error) => {
    log(`Failed to start bot: ${error.message}`, 'error');

    if (canRestart()) {
      restartHistory.push(Date.now());
      log(`Retrying in ${RESTART_DELAY_MS / 1000} seconds...`, 'warn');

      setTimeout(() => {
        startBot();
      }, RESTART_DELAY_MS);
    } else {
      log('Auto-restart disabled due to too many failures', 'error');
      process.exit(1);
    }
  });
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('Received SIGINT, shutting down gracefully...', 'warn');
  isShuttingDown = true;

  if (botProcess) {
    log('Stopping bot process...', 'info');
    botProcess.kill('SIGINT');

    // Give bot 10 seconds to shut down gracefully
    setTimeout(() => {
      if (botProcess) {
        log('Force killing bot process', 'error');
        botProcess.kill('SIGKILL');
      }
      process.exit(0);
    }, 10000);
  } else {
    process.exit(0);
  }
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down gracefully...', 'warn');
  isShuttingDown = true;

  if (botProcess) {
    botProcess.kill('SIGTERM');
  }

  setTimeout(() => {
    process.exit(0);
  }, 10000);
});

// Print banner
console.log();
console.log(chalk.hex('#00D9FF')('╔════════════════════════════════════════════════════════════════╗'));
console.log(chalk.hex('#00D9FF')('║') + chalk.hex('#FFD700').bold('           AUTO-RESTART WRAPPER - TRADING BOT v2.0            ') + chalk.hex('#00D9FF')('║'));
console.log(chalk.hex('#00D9FF')('╚════════════════════════════════════════════════════════════════╝'));
console.log();
console.log(chalk.cyan('Features:'));
console.log(chalk.gray('  • Automatic restart on crash'));
console.log(chalk.gray(`  • Maximum ${MAX_RESTARTS_PER_HOUR} restarts per hour`));
console.log(chalk.gray(`  • ${RESTART_DELAY_MS / 1000} second delay between restarts`));
console.log(chalk.gray('  • Graceful shutdown on Ctrl+C'));
console.log(chalk.gray('  • Logging to restart.log'));
console.log();
console.log(chalk.yellow('Press Ctrl+C to stop the bot and wrapper'));
console.log(chalk.gray('─'.repeat(64)));
console.log();

// Start the bot
startBot();
