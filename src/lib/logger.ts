/**
 * Centralized Logging System for CarConfigurator
 * Provides structured logging with levels and context
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogContext {
  component?: string
  userId?: string
  action?: string
  [key: string]: unknown
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: Error
}

class Logger {
  private logLevel: LogLevel
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    // Set log level based on environment
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error
    }
  }

  private writeLog(logEntry: LogEntry): void {
    const { timestamp, level, message, context, error } = logEntry
    const levelStr = LogLevel[level]

    if (this.isDevelopment) {
      // In development: use console with colors
      const prefix = `[${timestamp}] ${levelStr}:`

      switch (level) {
        case LogLevel.DEBUG:
          console.debug(`🔍 ${prefix}`, message, context || '', error || '')
          break
        case LogLevel.INFO:
          console.info(`ℹ️ ${prefix}`, message, context || '', error || '')
          break
        case LogLevel.WARN:
          console.warn(`⚠️ ${prefix}`, message, context || '', error || '')
          break
        case LogLevel.ERROR:
          console.error(`❌ ${prefix}`, message, context || '', error || '')
          break
      }
    } else {
      // In production: structured JSON logging
      const logData = {
        timestamp,
        level: levelStr,
        message,
        ...context,
        ...(error && {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          }
        })
      }
      console.log(JSON.stringify(logData))
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.writeLog(this.formatLog(LogLevel.DEBUG, message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.writeLog(this.formatLog(LogLevel.INFO, message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.writeLog(this.formatLog(LogLevel.WARN, message, context))
    }
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.writeLog(this.formatLog(LogLevel.ERROR, message, context, error))
    }
  }

  // Convenience methods for common use cases
  auth(message: string, userId?: string, action?: string): void {
    this.info(message, { component: 'auth', userId, action })
  }

  api(message: string, endpoint?: string, method?: string, userId?: string): void {
    this.info(message, { component: 'api', endpoint, method, userId })
  }

  db(message: string, operation?: string, table?: string): void {
    this.debug(message, { component: 'database', operation, table })
  }

  security(message: string, context?: LogContext, error?: Error): void {
    this.error(message, { component: 'security', ...context }, error)
  }
}

// Export singleton instance
export const logger = new Logger()

// Export convenience function for quick migration from console.log
export const log = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  auth: logger.auth.bind(logger),
  api: logger.api.bind(logger),
  db: logger.db.bind(logger),
  security: logger.security.bind(logger)
}
