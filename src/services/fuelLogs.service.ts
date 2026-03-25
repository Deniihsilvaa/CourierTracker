import { api } from './api';

export type FuelType = 'gasoline' | 'Ethanol';

export interface FuelLog {
  id: string;
  user_id: string;
  session_id: string;
  amount: number;
  liters: string;
  price_per_liter: number;
  odometer: string;
  description: string;
  gas_station: string;
  date_competition: string;
  type: FuelType;
  created_at: string;
}

export interface CreateFuelLogPayload {
  amount: number;
  liters: string;
  pricePerLiter: number;
  odometer: string;
  description: string;
  gasStation: string;
  dateCompetition: string;
  type: FuelType;
  sessionId: string;
}

export const fuelLogsService = {
  list: async (params?: { date?: string; type?: FuelType }): Promise<FuelLog[]> => {
    const response = await api.get('/fuel-logs/v1/', { params });
    if (response.data?.success) {
      return (response.data.data as FuelLog[]) || [];
    }
    return [];
  },

  create: async (payload: CreateFuelLogPayload): Promise<FuelLog> => {
    const response = await api.post('/fuel-logs/v1/', payload);
    if (response.data?.success) {
      return response.data.data as FuelLog;
    }
    throw new Error('Failed to create fuel log');
  },

  update: async (id: string, payload: CreateFuelLogPayload): Promise<FuelLog> => {
    const response = await api.put(`/fuel-logs/v1/${id}`, payload);
    if (response.data?.success) {
      return response.data.data as FuelLog;
    }
    throw new Error('Failed to update fuel log');
  },
};
