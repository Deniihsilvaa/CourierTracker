import { api } from "./api";
import { logger } from "../utils/logger";

export interface SyncPayload {
  profiles?: any[];
  work_sessions?: any[];
  gps_points?: any[];
  trips?: any[];
  route_events?: any[];
  category_types?: any[];
  expenses?: any[];
  incomes?: any[];
  fuel_logs?: any[];
  maintenance_logs?: any[];
  manual_routes?: any[];
  clients?: any[];
}

export const syncService = {
  /**
   * Sends a batch of data to the server for synchronization.
   * @param payload The data to be synchronized, grouped by table name.
   * @returns A promise that resolves to the server response.
   */
  async syncBatch(payload: SyncPayload) {
    try {
      logger.info("[SyncService] Sending batch sync...");
      const { data } = await api.post("/sync/v1/batch", payload);
      return data;
    } catch (error: any) {
      logger.error("[SyncService] Batch sync error:", error.response?.data || error.message);
      throw error;
    }
  },
};
