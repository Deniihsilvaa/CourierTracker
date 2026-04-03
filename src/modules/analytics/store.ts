import { fetchFinancialAnalytics } from "@/src/services/analytics.service";
import { AnalyticsState } from "@/src/types/stores";
import { logger } from "@/src/utils/logger";
import { create } from "zustand";

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  financials: null,
  isLoading: false,
  error: null,

  setFinancials: (data) => set({ financials: data }),
  setIsLoading: (v) => set({ isLoading: v }),
  setError: (v) => set({ error: v }),

  fetchFinancialSummary: async (groupBy = "day") => {
    set({ isLoading: true, error: null });
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];
    try {
      const data = await fetchFinancialAnalytics(groupBy, startDate, endDate);
      if (data && data.length > 0) {
        set({ financials: data[0], isLoading: false });
      } else {
        set({ financials: null, isLoading: false });
      }
    } catch (error: any) {
      logger.error("[Analytics Store] Error fetching summary:", error);
      set({ error: error.message, isLoading: false });
    }
  },
}));
