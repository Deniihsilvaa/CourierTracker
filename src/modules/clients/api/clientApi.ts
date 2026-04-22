import { api, API_ROUTES } from "@/src/services/api";
import { Client } from "@/src/types/route.types";
import { AxiosError } from "axios";

export type ClientType = "store" | "restaurant" | "customer" | "warehouse";

export interface ClientPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ListClientsParams {
  page?: number;
  limit?: number;
  q?: string;
  updated_after?: string;
}

export interface ClientPayload {
  name: string;
  address: string;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  client_type?: ClientType | null;
}

export interface ClientListResponse {
  success: boolean;
  data: Client[];
  meta: ClientPaginationMeta;
}

interface ClientEnvelope {
  success: boolean;
  data: Client;
}

interface ClientDeleteEnvelope {
  success: boolean;
  data: { id: string };
}

const normalizeClient = (client: Client): Client => ({
  ...client,
  phone: client.phone ?? null,
  latitude: client.latitude ?? null,
  longitude: client.longitude ?? null,
  client_type: client.client_type ?? null,
  updated_at: client.updated_at ?? undefined,
});

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    const apiMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail;

    if (typeof apiMessage === "string" && apiMessage.trim()) {
      return apiMessage;
    }

    if (error.response?.status === 422) {
      return "Revise os dados do cliente e tente novamente.";
    }

    if (error.response?.status === 401) {
      return "Sua sessão expirou. Entre novamente.";
    }

    if (error.response?.status === 404) {
      return "Cliente não encontrado.";
    }

    if (error.message === "Network Error") {
      return "Sem conexão com a internet.";
    }
  }

  return "Não foi possível concluir a operação com clientes.";
};

const handleEnvelope = <T extends { success: boolean; data: unknown }>(
  payload: T,
) => {
  if (!payload?.success) {
    throw new Error("A API respondeu sem sucesso para a operação de clientes.");
  }

  return payload;
};

export const clientApi = {
  async list(params: ListClientsParams = {}): Promise<ClientListResponse> {
    try {
      const response = await api.get<ClientListResponse>(
        API_ROUTES.CLIENTS.list,
        { params },
      );
      const payload = response.data;

      if (!payload?.success) {
        throw new Error("Falha ao listar clientes.");
      }

      return {
        ...payload,
        data: payload.data.map(normalizeClient),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getById(id: string): Promise<Client> {
    try {
      const response = await api.get<ClientEnvelope>(`/clients/v1/${id}`);
      return normalizeClient(handleEnvelope(response.data).data as Client);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async create(payload: ClientPayload): Promise<Client> {
    try {
      const response = await api.post<ClientEnvelope>("/clients/v1/", payload);
      return normalizeClient(handleEnvelope(response.data).data as Client);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async update(id: string, payload: Partial<ClientPayload>): Promise<Client> {
    try {
      const response = await api.patch<ClientEnvelope>(
        `/clients/v1/${id}`,
        payload,
      );
      return normalizeClient(handleEnvelope(response.data).data as Client);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async delete(id: string): Promise<{ id: string }> {
    try {
      const response = await api.delete<ClientDeleteEnvelope>(
        `/clients/v1/${id}`,
      );
      return handleEnvelope(response.data).data as { id: string };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
