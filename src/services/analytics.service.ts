import { api } from "./api";
import { logger } from "../utils/logger";

export interface FinancialAnalytics {
  day_date: string;
  total_income: number;
  total_expenses: number;
  total_fuel: number;
  total_costs: number;
  net_profit: number;
  profit_margin: number;
}

export interface AnalyticsResponse {
  success: boolean;
  data: FinancialAnalytics[];
}

export const fetchFinancialAnalytics = async (
  groupBy: "day" | "week" | "month" = "month",
  startDate?: string,
  endDate?: string
): Promise<FinancialAnalytics[]> => {
  try {
    const params: any = { groupBy };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await api.get<AnalyticsResponse>("/analytics/v1/financial", { params });
    
    if (response.data.success) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    logger.error("[Analytics Service] Error fetching financial analytics:", error);
    throw error;
  }
};
