/**
 * Système de logging centralisé
 * Permet de structurer et centraliser tous les logs de l'application
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogContext {
  prefix?: string;
  level?: LogLevel;
  timestamp?: boolean;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isDebugMode = 
    typeof window !== 'undefined' &&
    (window.location.search.includes('debug=true') ||
      process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true');

  private formatMessage(level: LogLevel, prefix: string, message: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
    return `[${timestamp}] [${level}] [${prefix}] ${message}${formattedArgs}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (level === LogLevel.DEBUG) {
      return this.isDevelopment || this.isDebugMode;
    }
    return true;
  }

  debug(prefix: string, message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, prefix, message, ...args));
    }
  }

  info(prefix: string, message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, prefix, message, ...args));
    }
  }

  warn(prefix: string, message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, prefix, message, ...args));
    }
  }

  error(prefix: string, message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error(
        this.formatMessage(LogLevel.ERROR, prefix, message, ...args),
        errorMessage,
        errorStack ? `\n${errorStack}` : ''
      );
    }
  }
}

export const logger = new Logger();

/**
 * Helper pour créer un logger avec un préfixe
 */
export function createLogger(prefix: string) {
  return {
    debug: (message: string, ...args: unknown[]) => logger.debug(prefix, message, ...args),
    info: (message: string, ...args: unknown[]) => logger.info(prefix, message, ...args),
    warn: (message: string, ...args: unknown[]) => logger.warn(prefix, message, ...args),
    error: (message: string, error?: Error | unknown, ...args: unknown[]) =>
      logger.error(prefix, message, error, ...args),
  };
}

