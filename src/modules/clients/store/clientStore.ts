import { ClientPayload } from "@/src/modules/clients/api/clientApi";
import { clientService } from "@/src/modules/clients/services/clientService";
import { Client } from "@/src/types/route.types";
import { create } from "zustand";

interface ClientPaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface FetchClientOptions {
  page?: number;
  limit?: number;
  refresh?: boolean;
  append?: boolean;
  q?: string;
}

interface ClientStoreState {
  clients: Client[];
  currentClient: Client | null;
  searchQuery: string;
  pagination: ClientPaginationState;
  isLoading: boolean;
  isRefreshing: boolean;
  isSaving: boolean;
  error: string | null;
  fetchClients: (options?: FetchClientOptions) => Promise<void>;
  fetchClientById: (id: string) => Promise<Client | null>;
  createClient: (payload: ClientPayload) => Promise<Client>;
  updateClient: (id: string, payload: Partial<ClientPayload>) => Promise<Client | null>;
  deleteClient: (id: string) => Promise<void>;
  searchClients: (query: string) => Promise<void>;
  resetError: () => void;
}

const initialPagination: ClientPaginationState = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

export const useClientStore = create<ClientStoreState>((set, get) => ({
  clients: [],
  currentClient: null,
  searchQuery: "",
  pagination: initialPagination,
  isLoading: false,
  isRefreshing: false,
  isSaving: false,
  error: null,

  fetchClients: async (options = {}) => {
    const current = get();
    const page = options.page ?? current.pagination.page;
    const limit = options.limit ?? current.pagination.limit;
    const q = options.q ?? current.searchQuery;
    const append = Boolean(options.append && page > 1);
    const loadingKey = options.refresh ? "isRefreshing" : "isLoading";

    set({ [loadingKey]: true, error: null } as Partial<ClientStoreState>);

    try {
      const result = await clientService.fetchClients({ page, limit, q });

      set((state) => ({
        clients: append ? [...state.clients, ...result.clients] : result.clients,
        pagination: result.meta,
        searchQuery: q,
        [loadingKey]: false,
      } as Partial<ClientStoreState>));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Não foi possível carregar os clientes.",
        [loadingKey]: false,
      } as Partial<ClientStoreState>);
    }
  },

  fetchClientById: async (id: string) => {
    set({ isLoading: true, error: null, currentClient: null });

    try {
      const client = await clientService.getClientById(id);
      set({ currentClient: client, isLoading: false });
      return client;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível carregar o cliente.";
      set({ error: message, isLoading: false });
      return null;
    }
  },

  createClient: async (payload) => {
    set({ isSaving: true, error: null });

    try {
      const client = await clientService.createClient(payload);

      set((state) => {
        const matchesSearch =
          !state.searchQuery ||
          `${client.name} ${client.address} ${client.phone ?? ""}`
            .toLowerCase()
            .includes(state.searchQuery.toLowerCase());

        const total = state.pagination.total + 1;
        const totalPages = Math.max(1, Math.ceil(total / state.pagination.limit));

        return {
          clients:
            state.pagination.page === 1 && matchesSearch
              ? [client, ...state.clients].slice(0, state.pagination.limit)
              : state.clients,
          currentClient: client,
          isSaving: false,
          pagination: {
            ...state.pagination,
            total,
            totalPages,
            hasNextPage: state.pagination.page < totalPages,
            hasPreviousPage: state.pagination.page > 1,
          },
        };
      });

      return client;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível criar o cliente.";
      set({ error: message, isSaving: false });
      throw error;
    }
  },

  updateClient: async (id, payload) => {
    set({ isSaving: true, error: null });

    try {
      const client = await clientService.updateClient(id, payload);

      set((state) => ({
        clients: state.clients.map((item) => (item.id === id && client ? client : item)),
        currentClient: state.currentClient?.id === id ? client ?? state.currentClient : state.currentClient,
        isSaving: false,
      }));

      return client;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível atualizar o cliente.";
      set({ error: message, isSaving: false });
      throw error;
    }
  },

  deleteClient: async (id) => {
    set({ isSaving: true, error: null });

    try {
      await clientService.deleteClient(id);
      set((state) => ({
        clients: state.clients.filter((client) => client.id !== id),
        currentClient: state.currentClient?.id === id ? null : state.currentClient,
        isSaving: false,
        pagination: (() => {
          const total = Math.max(0, state.pagination.total - 1);
          const totalPages = Math.max(1, Math.ceil(total / state.pagination.limit));

          return {
            ...state.pagination,
            total,
            totalPages,
            hasNextPage: state.pagination.page < totalPages,
            hasPreviousPage: state.pagination.page > 1,
          };
        })(),
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível excluir o cliente.";
      set({ error: message, isSaving: false });
      throw error;
    }
  },

  searchClients: async (query) => {
    set({ searchQuery: query });
    await get().fetchClients({ page: 1, q: query });
  },

  resetError: () => set({ error: null }),
}));
