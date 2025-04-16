/**
 * Logger utility for BoomPay Shopify Integration
 * 
 * Provides standardized logging functionality across the application
 * 
 * @module utils/logger
 */

/**
 * Simple logger implementation
 * In a production environment, this would be replaced with a more robust solution
 * like Winston or Pino
 */
class Logger {
  /**
   * Log levels
   * @private
   */
  constructor(level = 'info') {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    this.currentLevel = 'info';
    this.setLevel(level);
  }

  /**
   * Sets the current log level
   * 
   * @param {string} level - Log level (error, warn, info, debug)
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.currentLevel = level;
    }
  }

  /**
   * Checks if the given level should be logged based on current level
   * 
   * @param {string} level - Log level to check
   * @returns {boolean} Whether the level should be logged
   * @private
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.currentLevel];
  }

  /**
   * Formats a log message with metadata
   * 
   * @param {string} message - Log message
   * @param {Object} [metadata] - Additional metadata
   * @returns {string} Formatted log message
   * @private
   */
  formatMessage(message, metadata) {
    const timestamp = new Date().toISOString();
    let formattedMessage = `[${timestamp}] ${message}`;
    
    if (metadata) {
      formattedMessage += ` ${JSON.stringify(metadata)}`;
    }
    
    return formattedMessage;
  }

  /**
   * Logs an error message
   * 
   * @param {string} message - Log message
   * @param {Object} [metadata] - Additional metadata
   */
  error(message, metadata) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage(message, metadata));
    }
  }

  /**
   * Logs a warning message
   * 
   * @param {string} message - Log message
   * @param {Object} [metadata] - Additional metadata
   */
  warn(message, metadata) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage(message, metadata));
    }
  }

  /**
   * Logs an info message
   * 
   * @param {string} message - Log message
   * @param {Object} [metadata] - Additional metadata
   */
  info(message, metadata) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage(message, metadata));
    }
  }

  /**
   * Logs a debug message
   * 
   * @param {string} message - Log message
   * @param {Object} [metadata] - Additional metadata
   */
  debug(message, metadata) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage(message, metadata));
    }
  }
}

// Create and export a singleton logger instance
const logger = new Logger(process.env.LOG_LEVEL || 'info');
module.exports = logger;
