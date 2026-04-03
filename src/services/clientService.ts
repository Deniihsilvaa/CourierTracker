import { v4 as uuidv4 } from 'uuid';
import { localDatabase } from './localDatabase';
import { geocodingService } from './geocodingService';
import { Client } from '../types/route.types';
import { logger } from '../utils/logger';

export const clientService = {
  async createClient(data: { name: string; address: string; phone?: string }): Promise<Client> {
    logger.info(`[ClientService] Creating new client: ${data.name}`);
    let lat: number | null = null;
    let lng: number | null = null;
    
    // 1. Call geocodeAddress()
    const geo = await geocodingService.geocodeAddress(data.address);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
    }

    const now = new Date().toISOString().split('.')[0] + 'Z';
    const newClient: Client = {
      id: uuidv4(),
      name: data.name,
      address: data.address,
      phone: data.phone || null,
      latitude: lat,
      longitude: lng,
      created_at: now,
      synced: false
    };

    // 3. Save the client in SQLite
    await localDatabase.insert('clients', { ...newClient, synced: 0 });
    return newClient;
  },

  async getClients(): Promise<Client[]> {
    const clients = await localDatabase.list<any>('clients');
    return clients.map(c => ({
      ...c,
      synced: Boolean(c.synced)
    }));
  },

  async findClientById(id: string): Promise<Client | null> {
    const client = await localDatabase.find<any>('clients', 'WHERE id = ?', [id]);
    if (client) {
      return {
        ...client,
        synced: Boolean(client.synced)
      };
    }
    return null;
  }
};
