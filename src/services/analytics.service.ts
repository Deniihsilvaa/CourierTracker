import { api } from "./api";

function unwrapResponseData<T>(payload: unknown, fallback: T): T {
  if (payload == null) {
    return fallback;
  }

  if (typeof payload === "object" && payload !== null && "data" in payload) {
    const inner = (payload as { data?: unknown }).data;
    return (inner ?? fallback) as T;
  }

  return payload as T;
}

function ensureArray<T>(payload: unknown): T[] {
  const data = unwrapResponseData<unknown>(payload, []);
  return Array.isArray(data) ? (data as T[]) : [];
}

function ensureObject<T extends object>(payload: unknown): T | null {
  const data = unwrapResponseData<unknown>(payload, null);
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as T;
  }
  return null;
}

export const analyticsService = {
  async getSummary<T extends object = Record<string, unknown>>() {
    const { data } = await api.get("/analytics/v1/summary");
    return ensureObject<T>(data);
  },

  async getTrips<T = unknown>() {
    const { data } = await api.get("/analytics/v1/trips");
    return ensureArray<T>(data);
  },

  async getDailyStats<T = unknown>() {
    const { data } = await api.get("/analytics/v1/daily-stats");
    return ensureArray<T>(data);
  },

  async fetchFinancialAnalytics<T = unknown>(groupBy: string, startDate: string, endDate: string) {
    const { data } = await api.get("/analytics/v1/financial", {
      params: { groupBy, startDate, endDate },
    });
    return ensureArray<T>(data);
  },
};
