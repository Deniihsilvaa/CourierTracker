import { AuthState, Profile } from "@/src/types/auth";
import * as Linking from "expo-linking";
import { create } from "zustand";
import { getAuthToken } from "../../services/api";
import { authService } from "../../services/auth.service";
import { localDatabase } from "../../services/localDatabase";
import { initDb } from "../../services/sqlite";
import { setLogUserIdProvider } from "../../services/logSystem";
import { logger } from "../../utils/logger";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true, // Começa carregando para o checkSession
  error: null,

  setUser: (user) => set({ user }),

  signUp: async (
    email: string,
    password: string,
    name: string,
    vehicle_type: string,
    city: string,
  ) => {
    try {
      set({ isLoading: true, error: null });
      await initDb(false);

      const response = await authService.signUp(
        email,
        password,
        name,
        vehicle_type,
        city,
      );

      if (response) {
        const finalProfile: Profile = {
          id: response.id,
          name: name,
          email: email,
          vehicle_type: vehicle_type,
          city: city,
        };

        await localDatabase.insert("profiles", finalProfile);

        set({ user: finalProfile, isLoading: false });
      } else {
        logger.warn("[AuthStore] No response after signUp attempt.");
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  signIn: async (email: string, password?: string) => {
    try {
      set({ isLoading: true, error: null });
      await initDb(false);

      if (!password) {
        throw new Error("Password is required");
      }

      const response = await authService.login(email, password);

      if (response && typeof response !== 'boolean') {
        const finalProfile: Profile = {
          id: response.id,
          name: response.user_metadata?.name ?? response.name ?? null,
          email: response.email ?? email,
          vehicle_type: response.user_metadata?.vehicle_type ?? null,
          city: response.user_metadata?.city ?? null,
        };

        // Usa update para caso ele já exista no banco local
        await localDatabase.insert("profiles", finalProfile).catch(() => {
          localDatabase.update("profiles", finalProfile.id, {
            name: finalProfile.name,
            email: finalProfile.email,
            city: finalProfile.city,
            vehicle_type: finalProfile.vehicle_type,
          });
        });

        set({ user: finalProfile, isLoading: false });
      } else {
        console.log("[AuthStore] No profile after signIn attempt.");
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  signInWithGoogle: async (idToken?: string) => {
    try {
      set({ isLoading: true, error: null });
      await initDb(false);
      
      if (!idToken) {
        throw new Error("ID Token is required for Google login");
      }

      const user = await authService.googleLogin(idToken);
      
      if (user) {
        const finalProfile: Profile = {
          id: user.id,
          name: user.user_metadata?.name ?? user.name ?? null,
          email: user.email ?? null,
          vehicle_type: user.user_metadata?.vehicle_type ?? null,
          city: user.user_metadata?.city ?? null,
        };

        await localDatabase.insert("profiles", finalProfile).catch(() => {
          localDatabase.update("profiles", finalProfile.id, {
            name: finalProfile.name,
            email: finalProfile.email,
            city: finalProfile.city,
            vehicle_type: finalProfile.vehicle_type,
          });
        });

        set({ user: finalProfile });
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      await authService.resetPassword(email);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      await authService.logout();
      set({ user: null });
      
      // Wipe the whole offline database on sign out to prevent data leaks between sessions/users
      await initDb(true);
      logger.info("[AuthStore] Database wiped successfully after sign out.");
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  checkSession: async () => {
    try {
      set({ isLoading: true, error: null });
      await initDb(false);

      const token = await getAuthToken();
      if (!token) {
        logger.info("[AuthStore] checkSession: No session found.");
        set({ user: null, isLoading: false });
        return;
      }

      const profile = await authService.me();

      if (profile) {
        const finalProfile: Profile = {
          id: profile.id,
          name: profile.name ?? null,
          email: profile.email ?? null,
          vehicle_type: profile.vehicle_type ?? null,
          city: profile.city ?? null,
        };

        try {
          await localDatabase.insert("profiles", finalProfile);
        } catch {
          await localDatabase.update("profiles", finalProfile.id, {
            name: finalProfile.name,
            email: finalProfile.email,
            city: finalProfile.city,
            vehicle_type: finalProfile.vehicle_type,
          });
        }

        set({ user: finalProfile });
      } else {
        logger.warn("[AuthStore] checkSession: Profile missing from server.");
        // Try getting from local database before kicking user out
        const profiles = await localDatabase.list<Profile>("profiles");
        if (profiles.length > 0) {
          logger.info("[AuthStore] checkSession: Using local profile as fallback.");
          set({ user: profiles[0] });
        } else {
          set({ user: null });
        }
      }
    } catch (error: any) {
      logger.error("Session check error:", error.message);
      // Only remove the user if we specifically get an unauthenticated error (like 401)
      // Otherwise keep local session on network errors to prevent logging out when offline
      if (error?.response?.status === 401 || error?.status === 401) {
        set({ error: "Sessão expirada", user: null });
        await authService.logout();
        await initDb(true); // Wipe the offline DB to prevent data leaks!
        logger.info("[AuthStore] Database wiped after 401 session expiry.");
      } else {
        logger.info("[AuthStore] checkSession: offline/network error, keeping local user if exists.");
        const profiles = await localDatabase.list<Profile>("profiles");
        if (profiles.length > 0) {
          set({ user: profiles[0] });
        } else {
          set({ error: error.message, user: null });
        }
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));

/**
 * Configure the log system to get the user ID from the store.
 * This breaks the require cycle between store -> logger -> logSystem -> store.
 */
setLogUserIdProvider(() => useAuthStore.getState().user?.id ?? null);
