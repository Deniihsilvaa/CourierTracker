import { LoginReturn, Profile } from "@/src/types/auth";
import { logger } from "../utils/logger";
import { api, API_ROUTES, setAuthToken } from "./api";

export const authService = {
  async login(
    email: string,
    password?: string,
  ): Promise<LoginReturn["user"] | boolean> {
    const { data } = await api.post(API_ROUTES.AUTH.LOGIN, {
      email,
      password,
    });
    const returnApi: LoginReturn = data.data;

    await setAuthToken(returnApi.session.access_token, returnApi.session.refresh_token);
    return returnApi.user;
  },

  async signUp(
    email: string,
    password: string,
    name: string,
    vehicle_type: string,
    city: string
  ): Promise<LoginReturn["user"]> {
    const { data } = await api.post(API_ROUTES.AUTH.SIGNUP, {
      email,
      password,
      name,
      vehicle_type,
      city,
    });
    const returnApi: LoginReturn = data.data;

    logger.debug("[AuthService] signUp response:", returnApi.user);
    await setAuthToken(returnApi.session.access_token, returnApi.session.refresh_token);
    return returnApi.user;
  },

  async logout(): Promise<void> {
    try {
      await api.post(API_ROUTES.AUTH.LOGOUT);
    } finally {
      await setAuthToken(null);
    }
  },

  async googleLogin(idToken: string): Promise<LoginReturn["user"]> {
    const { data } = await api.post(API_ROUTES.AUTH.GOOGLE, { idToken });
    const returnApi: LoginReturn = data.data;
    await setAuthToken(returnApi.session.access_token, returnApi.session.refresh_token);
    return returnApi.user;
  },

  async resetPassword(email: string): Promise<void> {
    await api.post(API_ROUTES.AUTH.PASSWORD_RESET, { email });
  },

  async me(): Promise<Profile> {
    const response = await api.get(API_ROUTES.AUTH.PROFILE);
    if (response.data?.success) {
      return response.data.data;
    }
    return response.data;
  },
};
