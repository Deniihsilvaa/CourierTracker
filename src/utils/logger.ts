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
  },
  error: (...args: any[]) => {
    // In production, this could be sent to Sentry or another error reporting service
    if (__DEV__) {
      console.error('[ERROR]', ...args);
    } else {
      // Production error logging (e.g., Sentry.captureException(args[0]))
    }
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
