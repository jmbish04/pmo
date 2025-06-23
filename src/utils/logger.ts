/**
 * Logger Utility
 * 
 * This module provides a centralized logging system for the ClickUp
 * Planner Worker. It handles different log levels, formatting, and
 * can be extended to support various logging backends.
 * 
 * Features:
 * - Multiple log levels (debug, info, warn, error)
 * - Structured logging with metadata
 * - Cloudflare Workers compatible
 * - Extensible for different backends
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
  error?: Error;
}

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  /**
   * Log a debug message
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log an info message
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log a warning message
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata, error);
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
    if (level < this.level) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
      error
    };

    this.output(entry);
  }

  /**
   * Output the log entry
   */
  private output(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp;
    const message = entry.message;
    
    let output = `[${timestamp}] ${levelName}: ${message}`;
    
    if (entry.metadata) {
      output += ` ${JSON.stringify(entry.metadata)}`;
    }
    
    if (entry.error) {
      output += `\nError: ${entry.error.message}\nStack: ${entry.error.stack}`;
    }

    // Use console methods for Cloudflare Workers
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(output);
        break;
      case LogLevel.INFO:
        console.info(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.ERROR:
        console.error(output);
        break;
    }
  }

  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }
}

// Create and export a default logger instance
export const logger = new Logger(LogLevel.INFO);

// Export the Logger class for custom instances
export { Logger };

// Logger utility for handling unknown error types

export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

export function logError(message: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(message, error);
  } else {
    console.error(message, String(error));
  }
}

export function logWarn(message: string, data?: unknown): void {
  if (data !== undefined) {
    console.warn(message, data);
  } else {
    console.warn(message);
  }
}

export function logInfo(message: string, data?: unknown): void {
  if (data !== undefined) {
    console.info(message, data);
  } else {
    console.info(message);
  }
} 