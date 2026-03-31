import { AnalyticsState } from "@/src/types/stores";
import { fetchFinancialAnalytics } from "@/src/services/analytics.service";
import { logger } from "@/src/utils/logger";
import { create } from "zustand";

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  financials: null,
  isLoading: false,
  error: null,

  setFinancials: (data) => set({ financials: data }),
  setIsLoading: (v) => set({ isLoading: v }),
  setError: (v) => set({ error: v }),

  fetchFinancialSummary: async (groupBy = "month") => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchFinancialAnalytics(groupBy);
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
