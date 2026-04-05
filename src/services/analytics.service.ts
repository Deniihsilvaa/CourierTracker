import { api } from "./api";

export const analyticsService = {
  /**
   * Fetches the summary of driver metrics.
   */
  async getSummary() {
    const { data } = await api.get("/analytics/v1/summary");
    return data;
  },

  /**
   * Fetches the trip history with performance metrics.
   */
  async getTrips() {
    const { data } = await api.get("/analytics/v1/trips");
    return data;
  },

  /**
   * Fetches the daily breakdown of the last 10 days of activity.
   */
  async getDailyStats() {
    const { data } = await api.get("/analytics/v1/daily-stats");
    return data;
  },
};
