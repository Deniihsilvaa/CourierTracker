import { LoginReturn, Profile } from "@/src/types/auth";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import "react-native-url-polyfill/auto";
import { logger } from "../utils/logger";
import { api, API_ROUTES, setAuthToken } from "./api";

WebBrowser.maybeCompleteAuthSession();

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

  async googleLogin(): Promise<Profile> {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        path: "auth/callback"
      });

      // Fetch the authorization URL from our backend
      const response = await api.get(API_ROUTES.AUTH.GOOGLE, {
        params: { redirectTo: redirectUri }
      });
      
      const authUrl = response.data?.url || response.data?.data?.url;

      if (!authUrl) {
        throw new Error("Não foi possível obter a URL de autenticação.");
      }

      // Open the browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type !== 'success' || !result.url) {
        throw new Error("Autenticação cancelada ou mal sucedida.");
      }

      // Parse the token from the redirect URL hash or search params
      const urlHash = result.url.split('#')[1];
      const urlQuery = result.url.split('?')[1];
      const params = new URLSearchParams(urlHash || urlQuery || '');

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken) {
        throw new Error("Tokens de autenticação não encontrados na resposta.");
      }

      // Store tokens securely
      await setAuthToken(accessToken, refreshToken || undefined);

      // Fetch the user data with the fresh tokens
      return await this.me();

    } catch (e: any) {
      logger.error("[AuthService] Google OAuth Error:", e);
      throw e;
    }
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
