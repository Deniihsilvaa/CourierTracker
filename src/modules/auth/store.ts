import { AuthState, Profile } from "@/src/types/auth";
import * as Linking from "expo-linking";
import { create } from "zustand";
import { getAuthToken } from "../../services/api";
import { authService } from "../../services/auth.service";
import { localDatabase } from "../../services/localDatabase";
import { supabase } from "../../services/supabase";
import { setLogUserIdProvider } from "../../services/logSystem";
import { logger } from "../../utils/logger";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true, // Começa carregando para o checkSession
  error: null,

  setUser: (user) => set({ user }),

  signUp: async (email: string, password: string, name: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authService.signUp(email, password, name);
      // Carregar perfil completo do backend
      const profile = await authService.me();

      if (profile && response) {
        const finalProfile: Profile = {
          id: profile.id,
          name: profile.name ?? name,
          email: email,
          vehicle_type: profile.vehicle_type ?? null,
          city: profile.city ?? null,
        };

        await localDatabase.update("profiles", finalProfile.id, {
          name: finalProfile.name,
          email: finalProfile.email,
          city: finalProfile.city,
          vehicle_type: finalProfile.vehicle_type,
        });

        set({ user: finalProfile, isLoading: false });
      } else {
        logger.warn(
          "[AuthStore] No profile after signUp attempt.",
        );
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

      if (!password) {
        throw new Error("Password is required");
      }

      const response = await authService.login(email, password);
      // carregar perfil
      const profile = await authService.me();

      if (profile && response) {
        const finalProfile: Profile = {
          id: profile.id,
          name: profile.name ?? null,
          email: profile.email ?? null,
          vehicle_type: profile.vehicle_type ?? null,
          city: profile.city ?? null,
        };

        await localDatabase.update("profiles", finalProfile.id, {
          name: finalProfile.name,
          email: finalProfile.email,
          city: finalProfile.city,
          vehicle_type: finalProfile.vehicle_type,
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

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      const redirectTo = Linking.createURL("/(tabs)");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    } finally {
      // Don't set isLoading to false here, as we are redirecting away from app
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      const redirectTo = Linking.createURL("/login");

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;
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

        await localDatabase.update("profiles", finalProfile.id, {
          name: finalProfile.name,
          email: finalProfile.email,
          city: finalProfile.city,
          vehicle_type: finalProfile.vehicle_type,
        });

        set({ user: finalProfile });
      } else {
        logger.warn("[AuthStore] checkSession: Profile missing.");
        set({ user: null });
      }
    } catch (error: any) {
      logger.error("Session check error:", error.message);
      // Se houver erro na sessão (ex: token expirado), remove o usuário
      set({ error: error.message, user: null });
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
