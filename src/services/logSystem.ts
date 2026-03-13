import { localDatabase } from './localDatabase';
import { useAuthStore } from '../modules/auth/store';

export type LogSystemLevel = 'debug' | 'info' | 'warn' | 'error';

type LogSystemMeta = Record<string, any>;

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
    const user = useAuthStore.getState().user;
    const meta: LogSystemMeta = {
      ...(metaDados ?? {}),
      user_id: user?.id ?? null,
    };

    // fire-and-forget callers should never crash due to logging
    try {
      await localDatabase.insertLogSystem(level, message, data ?? null, sanitize(meta));
    } catch {
      // ignore
    }
  },
};

