import { localDatabase } from './localDatabase';

export type LogSystemLevel = 'debug' | 'info' | 'warn' | 'error';

type LogSystemMeta = Record<string, any>;

let getUserId: () => string | null = () => null;

/**
 * Configure how the log system retrieves the current user ID.
 * This breaks the circular dependency with the AuthStore.
 */
export const setLogUserIdProvider = (provider: () => string | null) => {
  getUserId = provider;
};

const sanitize = (value: any) => {
  try {
    if (value == null) return null;
    if (typeof value === 'string') return value.slice(0, 5000);
    return JSON.parse(JSON.stringify(value));
  } catch {
    try {
      return String(value).slice(0, 5000);
    } catch {
      return '[unserializable]';
    }
  }
};

export const logSystem = {
  enqueue: async (level: LogSystemLevel, message: string, data?: string | null, metaDados?: LogSystemMeta) => {
    const userId = getUserId();
    const meta: LogSystemMeta = {
      ...(metaDados ?? {}),
      user_id: userId,
    };

    // fire-and-forget callers should never crash due to logging
    try {
      await localDatabase.insertLogSystem(level, message, data ?? null, sanitize(meta));
    } catch {
      // ignore
    }
  },
};

