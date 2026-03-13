import { logSystem } from '../services/logSystem';

export const logger = {
  log: (...args: any[]) => {
    if (__DEV__) {
      console.log('[LOG]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (__DEV__) {
      console.warn('[WARN]', ...args);
    }
    const message = args?.[0] != null ? String(args[0]) : 'warn';
    void logSystem.enqueue('warn', message, args?.[1] != null ? String(args[1]) : null, { args });
  },
  error: (...args: any[]) => {
    // In production, this could be sent to Sentry or another error reporting service
    if (__DEV__) {
      console.error('[ERROR]', ...args);
    } else {
      // Production error logging (e.g., Sentry.captureException(args[0]))
    }
    const message = args?.[0] != null ? String(args[0]) : 'error';
    void logSystem.enqueue('error', message, args?.[1] != null ? String(args[1]) : null, { args });
  },
  info: (...args: any[]) => {
    if (__DEV__) {
      console.info('[INFO]', ...args);
    }
  },
  debug: (...args: any[]) => {
    if (__DEV__) {
      console.debug('[DEBUG]', ...args);
    }
  }
};
