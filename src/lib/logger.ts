/**
 * Structured Logging System with Winston
 * Provides comprehensive logging with proper levels and formatting
 */

import winston from 'winston'
import path from 'path'

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
}

// Define colors for each log level
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
}

// Tell winston that you want to link the colors
winston.addColors(logColors)

// Create custom format for development
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
)

// Create custom format for production
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Determine log directory
const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs')

// Create transports array
const transports: winston.transport[] = []

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat
  })
)

// File transports (only in production or if LOG_TO_FILE is set)
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  )

  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  )

  // HTTP log file (for API requests)
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'http.log'),
      level: 'http',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  )
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels: logLevels,
  format: productionFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: productionFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: productionFormat
    })
  ]
})

// Create specialized logger methods
interface LogContext {
  userId?: string
  requestId?: string
  ip?: string
  userAgent?: string
  method?: string
  url?: string
  statusCode?: number
  responseTime?: number
  [key: string]: any
}

class Logger {
  private winston: winston.Logger

  constructor(winstonLogger: winston.Logger) {
    this.winston = winstonLogger
  }

  // Error logging
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const logData: any = { message, ...context }
    
    if (error) {
      if (error instanceof Error) {
        logData.error = {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      } else {
        logData.error = error
      }
    }

    this.winston.error(logData)
  }

  // Warning logging
  warn(message: string, context?: LogContext): void {
    this.winston.warn({ message, ...context })
  }

  // Info logging
  info(message: string, context?: LogContext): void {
    this.winston.info({ message, ...context })
  }

  // HTTP request logging
  http(message: string, context?: LogContext): void {
    this.winston.http({ message, ...context })
  }

  // Debug logging
  debug(message: string, context?: LogContext): void {
    this.winston.debug({ message, ...context })
  }

  // Security-related logging
  security(message: string, context?: LogContext): void {
    this.winston.warn({ 
      message: `[SECURITY] ${message}`, 
      securityEvent: true,
      ...context 
    })
  }

  // Authentication logging
  auth(message: string, context?: LogContext): void {
    this.winston.info({ 
      message: `[AUTH] ${message}`, 
      authEvent: true,
      ...context 
    })
  }

  // Database operation logging
  database(message: string, context?: LogContext): void {
    this.winston.debug({ 
      message: `[DB] ${message}`, 
      databaseEvent: true,
      ...context 
    })
  }

  // API request logging
  api(message: string, context?: LogContext): void {
    this.winston.http({ 
      message: `[API] ${message}`, 
      apiEvent: true,
      ...context 
    })
  }

  // Performance logging
  performance(message: string, context?: LogContext): void {
    this.winston.info({ 
      message: `[PERF] ${message}`, 
      performanceEvent: true,
      ...context 
    })
  }

  // Task operation logging
  task(message: string, context?: LogContext): void {
    this.winston.info({ 
      message: `[TASK] ${message}`, 
      taskEvent: true,
      ...context 
    })
  }

  // Workspace operation logging
  workspace(message: string, context?: LogContext): void {
    this.winston.info({ 
      message: `[WORKSPACE] ${message}`, 
      workspaceEvent: true,
      ...context 
    })
  }

  // Raw winston logger access
  get raw(): winston.Logger {
    return this.winston
  }
}

// Export the logger instance
export const log = new Logger(logger)

// Export types
export type { LogContext }

// Utility functions
export function createRequestLogger(req: Request | any) {
  const requestId = crypto.randomUUID()
  const baseContext: LogContext = {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers?.get?.('user-agent') || req.headers?.['user-agent'],
    ip: req.headers?.get?.('x-forwarded-for') || req.headers?.['x-forwarded-for'] || 'unknown'
  }

  return {
    requestId,
    log: (level: 'info' | 'error' | 'warn' | 'debug', message: string, context?: LogContext) => {
      log[level](message, { ...baseContext, ...context })
    },
    error: (message: string, error?: Error | unknown, context?: LogContext) => {
      log.error(message, error, { ...baseContext, ...context })
    },
    info: (message: string, context?: LogContext) => {
      log.info(message, { ...baseContext, ...context })
    },
    warn: (message: string, context?: LogContext) => {
      log.warn(message, { ...baseContext, ...context })
    },
    debug: (message: string, context?: LogContext) => {
      log.debug(message, { ...baseContext, ...context })
    }
  }
}

// Performance timing utility
export function performanceTimer(name: string) {
  const start = Date.now()
  
  return {
    end: (context?: LogContext) => {
      const duration = Date.now() - start
      log.performance(`${name} completed in ${duration}ms`, { 
        duration, 
        operation: name,
        ...context 
      })
      return duration
    }
  }
}

// Error boundary logger
export function logError(error: Error, context?: LogContext): void {
  log.error('Unhandled error occurred', error, context)
}

// API route wrapper with logging
export function withLogging<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  routeName: string
) {
  return async (...args: T): Promise<Response> => {
    const timer = performanceTimer(`API ${routeName}`)
    const requestLogger = createRequestLogger(args[0] as Request)
    
    try {
      requestLogger.info(`API ${routeName} started`)
      const response = await handler(...args)
      
      const duration = timer.end({
        statusCode: response.status,
        routeName
      })
      
      requestLogger.info(`API ${routeName} completed`, {
        statusCode: response.status,
        duration
      })
      
      return response
    } catch (error) {
      timer.end()
      requestLogger.error(`API ${routeName} failed`, error, { routeName })
      throw error
    }
  }
}

// Graceful shutdown logging
process.on('SIGINT', () => {
  log.info('Received SIGINT. Graceful shutdown...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  log.info('Received SIGTERM. Graceful shutdown...')
  process.exit(0)
})

// Log startup
log.info('Logger initialized', {
  level: logger.level,
  environment: process.env.NODE_ENV || 'development',
  logToFile: process.env.LOG_TO_FILE === 'true' || process.env.NODE_ENV === 'production'
})