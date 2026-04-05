import { clientApi, ClientPaginationMeta, ClientPayload } from "@/src/modules/clients/api/clientApi";
import { localDatabase } from "@/src/services/localDatabase";
import { getDb } from "@/src/services/sqlite";
import { Client } from "@/src/types/route.types";
import { logger } from "@/src/utils/logger";
import { v4 as uuidv4 } from "uuid";

export interface ClientListOptions {
  page?: number;
  limit?: number;
  q?: string;
  updated_after?: string;
}

export interface ClientListResult {
  clients: Client[];
  meta: ClientPaginationMeta;
  source: "local" | "remote";
}

const DEFAULT_LIMIT = 20;

const normalizeString = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeNumber = (value?: number | null) => {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const mapClient = (row: any): Client => ({
  id: row.id,
  name: row.name,
  address: row.address,
  phone: row.phone ?? null,
  latitude: row.latitude ?? null,
  longitude: row.longitude ?? null,
  client_type: row.client_type ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at ?? undefined,
  deleted_at: row.deleted_at ?? null,
  synced: Boolean(row.synced),
});

const buildLocalMeta = (page: number, limit: number, total: number): ClientPaginationMeta => {
  const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

const buildSearchClause = (query?: string) => {
  const q = query?.trim().toLowerCase();

  if (!q) {
    return {
      clause: "WHERE deleted_at IS NULL",
      params: [] as string[],
    };
  }

  const like = `%${q}%`;

  return {
    clause: `
      WHERE deleted_at IS NULL
        AND (
          LOWER(name) LIKE ?
          OR LOWER(address) LIKE ?
          OR LOWER(COALESCE(phone, '')) LIKE ?
        )
    `,
    params: [like, like, like],
  };
};

const upsertClientRow = async (client: Client, synced: number) => {
  const db = getDb();

  await db.runAsync(
    `
      INSERT INTO clients (
        id,
        name,
        address,
        phone,
        latitude,
        longitude,
        client_type,
        created_at,
        updated_at,
        deleted_at,
        synced
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        address = excluded.address,
        phone = excluded.phone,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        client_type = excluded.client_type,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at,
        synced = excluded.synced
    `,
    [
      client.id,
      client.name,
      client.address,
      client.phone ?? null,
      client.latitude ?? null,
      client.longitude ?? null,
      client.client_type ?? null,
      client.created_at ?? new Date().toISOString(),
      client.updated_at ?? null,
      client.deleted_at ?? null,
      synced,
    ]
  );
};

const fetchClientsLocalPage = async ({
  page = 1,
  limit = DEFAULT_LIMIT,
  q,
}: ClientListOptions): Promise<ClientListResult> => {
  const db = getDb();
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const offset = (safePage - 1) * safeLimit;
  const search = buildSearchClause(q);

  const rows = await db.getAllAsync<any>(
    `
      SELECT *
      FROM clients
      ${search.clause}
      ORDER BY COALESCE(updated_at, created_at) DESC, name ASC
      LIMIT ? OFFSET ?
    `,
    [...search.params, safeLimit, offset]
  );

  const totalRow = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) as total FROM clients ${search.clause}`,
    search.params
  );

  const total = Number(totalRow?.total ?? 0);

  return {
    clients: rows.map(mapClient),
    meta: buildLocalMeta(safePage, safeLimit, total),
    source: "local",
  };
};

const getClientLocalById = async (id: string) => {
  const db = getDb();
  const row = await db.getFirstAsync<any>(
    "SELECT * FROM clients WHERE id = ? AND deleted_at IS NULL LIMIT 1",
    [id]
  );

  return row ? mapClient(row) : null;
};

const finalizeRemoteDeleteLocal = async (id: string) => {
  const db = getDb();
  await db.runAsync(
    "UPDATE clients SET deleted_at = ?, updated_at = ?, synced = 1 WHERE id = ?",
    [new Date().toISOString(), new Date().toISOString(), id]
  );
};

export const clientService = {
  async saveClientLocal(payload: ClientPayload & { id?: string; created_at?: string; updated_at?: string; synced?: number }) {
    const now = new Date().toISOString();
    const client: Client = {
      id: payload.id ?? uuidv4(),
      name: payload.name.trim(),
      address: payload.address.trim(),
      phone: normalizeString(payload.phone),
      latitude: normalizeNumber(payload.latitude),
      longitude: normalizeNumber(payload.longitude),
      client_type: payload.client_type ?? null,
      created_at: payload.created_at ?? now,
      updated_at: payload.updated_at,
      deleted_at: null,
      synced: (payload.synced ?? 0) === 1,
    };

    await localDatabase.insert("clients", {
      ...client,
      phone: client.phone,
      latitude: client.latitude,
      longitude: client.longitude,
      client_type: client.client_type,
      synced: client.synced ? 1 : 0,
    });

    return client;
  },

  async getClientsLocal(options: ClientListOptions = {}) {
    return fetchClientsLocalPage(options);
  },

  async getClientLocalById(id: string) {
    return getClientLocalById(id);
  },

  async updateClientLocal(id: string, updates: Partial<ClientPayload>) {
    await localDatabase.update("clients", id, {
      ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
      ...(updates.address !== undefined ? { address: updates.address.trim() } : {}),
      ...(updates.phone !== undefined ? { phone: normalizeString(updates.phone) } : {}),
      ...(updates.latitude !== undefined ? { latitude: normalizeNumber(updates.latitude) } : {}),
      ...(updates.longitude !== undefined ? { longitude: normalizeNumber(updates.longitude) } : {}),
      ...(updates.client_type !== undefined ? { client_type: updates.client_type ?? null } : {}),
    });

    return getClientLocalById(id);
  },

  async deleteClientLocal(id: string) {
    await localDatabase.delete("clients", id);
  },

  async hydrateClientsFromApi(options: ClientListOptions = {}) {
    const response = await clientApi.list(options);

    for (const client of response.data) {
      await upsertClientRow({ ...client, deleted_at: null, synced: true }, 1);
    }

    return response.meta;
  },

  async fetchClients(options: ClientListOptions = {}) {
    const safeOptions = {
      page: options.page ?? 1,
      limit: options.limit ?? DEFAULT_LIMIT,
      q: options.q?.trim() || undefined,
      updated_after: options.updated_after,
    };

    try {
      const remoteMeta = await this.hydrateClientsFromApi(safeOptions);
      const localResult = await fetchClientsLocalPage(safeOptions);

      return {
        ...localResult,
        meta: remoteMeta,
        source: "remote" as const,
      };
    } catch (error) {
      logger.warn("[ClientService] Falling back to local clients list", { error });
      return fetchClientsLocalPage(safeOptions);
    }
  },

  async getClientById(id: string) {
    const localClient = await getClientLocalById(id);

    if (!localClient) {
      try {
        const remoteClient = await clientApi.getById(id);
        await upsertClientRow({ ...remoteClient, deleted_at: null, synced: true }, 1);
        return remoteClient;
      } catch (error) {
        logger.warn("[ClientService] Failed to fetch client by id from API", { id, error });
        return null;
      }
    }

    if (!localClient.synced) {
      return localClient;
    }

    try {
      const remoteClient = await clientApi.getById(id);
      await upsertClientRow({ ...remoteClient, deleted_at: null, synced: true }, 1);
      return remoteClient;
    } catch (error) {
      logger.warn("[ClientService] Using local client details fallback", { id, error });
      return localClient;
    }
  },

  async createClient(payload: ClientPayload) {
    return this.saveClientLocal({
      ...payload,
      synced: 0,
    });
  },

  async updateClient(id: string, updates: Partial<ClientPayload>) {
    const localClient = await getClientLocalById(id);

    if (!localClient) {
      throw new Error("Cliente não encontrado localmente.");
    }

    const updatedLocal = await this.updateClientLocal(id, updates);

    if (!localClient.synced) {
      return updatedLocal;
    }

    try {
      const remoteClient = await clientApi.update(id, updates);
      await upsertClientRow({ ...remoteClient, deleted_at: null, synced: true }, 1);
      return remoteClient;
    } catch (error) {
      logger.warn("[ClientService] Local update saved and remote update deferred", { id, error });
      return updatedLocal;
    }
  },

  async deleteClient(id: string) {
    const localClient = await getClientLocalById(id);

    if (!localClient) {
      return;
    }

    await this.deleteClientLocal(id);

    if (!localClient.synced) {
      return;
    }

    try {
      await clientApi.delete(id);
      await finalizeRemoteDeleteLocal(id);
    } catch (error) {
      logger.warn("[ClientService] Local delete saved and remote delete deferred", { id, error });
    }
  },
};
