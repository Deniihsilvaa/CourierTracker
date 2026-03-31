import { LoginReturn, Profile } from "@/src/types/auth";
import { logger } from "../utils/logger";
import { api, setAuthToken } from "./api";

export const authService = {
  async login(
    email: string,
    password?: string,
  ): Promise<LoginReturn["user"] | boolean> {
    const { data } = await api.post("/auth/v1/login", {
      email,
      password,
    });
    const returnApi: LoginReturn = data.data;

    await setAuthToken(returnApi.session.access_token);
    return returnApi.user;
  },

  async signUp(
    email: string,
    password: string,
    name: string,
  ): Promise<LoginReturn["user"]> {
    const { data } = await api.post("/auth/v1/register", {
      email,
      password,
      name,
    });
    const returnApi: LoginReturn = data.data;

    logger.debug("[AuthService] signUp response:", returnApi.user);
    await setAuthToken(returnApi.session.access_token);
    return returnApi.user;
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/v1/logout");
    } finally {
      await setAuthToken(null);
    }
  },

  async me(): Promise<Profile> {
    const response = await api.get("/auth/v1/profile");
    if (response.data?.success) {
      return response.data.data;
    }
    return response.data;
  },
};
