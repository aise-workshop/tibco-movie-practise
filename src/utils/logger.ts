/**
 * Logger utility for the application
 */

import chalk from 'chalk';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  enableColors: boolean;
  enableTimestamp: boolean;
  prefix?: string;
}

/**
 * Simple logger utility
 */
export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: process.env.VERBOSE === 'true' ? LogLevel.DEBUG : LogLevel.INFO,
      enableColors: true,
      enableTimestamp: true,
      ...config,
    };
  }

  /**
   * Log debug message
   */
  debug(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.DEBUG) {
      this.log(LogLevel.DEBUG, message, ...args);
    }
  }

  /**
   * Log info message
   */
  info(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.INFO) {
      this.log(LogLevel.INFO, message, ...args);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.WARN) {
      this.log(LogLevel.WARN, message, ...args);
    }
  }

  /**
   * Log error message
   */
  error(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.ERROR) {
      this.log(LogLevel.ERROR, message, ...args);
    }
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    let output = '';

    // Add timestamp
    if (this.config.enableTimestamp) {
      const timestamp = new Date().toISOString();
      output += `[${timestamp}] `;
    }

    // Add prefix
    if (this.config.prefix) {
      output += `[${this.config.prefix}] `;
    }

    // Add level
    const levelStr = LogLevel[level];
    if (this.config.enableColors) {
      switch (level) {
        case LogLevel.DEBUG:
          output += chalk.gray(`[${levelStr}]`);
          break;
        case LogLevel.INFO:
          output += chalk.blue(`[${levelStr}]`);
          break;
        case LogLevel.WARN:
          output += chalk.yellow(`[${levelStr}]`);
          break;
        case LogLevel.ERROR:
          output += chalk.red(`[${levelStr}]`);
          break;
      }
    } else {
      output += `[${levelStr}]`;
    }

    // Add message
    output += ` ${message}`;

    // Output to appropriate stream
    if (level >= LogLevel.ERROR) {
      console.error(output, ...args);
    } else {
      console.log(output, ...args);
    }
  }
}

// Default logger instance
export const logger = new Logger();
