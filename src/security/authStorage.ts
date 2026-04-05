import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export const authStorage = {
    async getToken(): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        } catch (error) {
            console.warn("[AuthStorage] Failed to read token, clearing", error);
            await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
            return null;
        }
    },
    async getRefreshToken() {
        try {

            return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        } catch (error) {
            console.warn("[AuthStorage] Failed to read refresh token, clearing", error);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
            return null;
        }
    },
    async setToken(token: string, refreshToken?: string) {
        try {
            if (!token) {
                throw new Error("Token is required");
            }
            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
            if (refreshToken) {
                await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
            }
        } catch (error) {
            console.warn("[AuthStorage] Failed to write token, clearing", error);
            await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        }
    },

    async clearToken() {
        await Promise.all([
            SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
            SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
        ]);
    }
};