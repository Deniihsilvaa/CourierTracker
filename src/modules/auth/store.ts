import * as Linking from 'expo-linking';
import { create } from 'zustand';
import { localDatabase } from '../../services/localDatabase';
import { supabase } from '../../services/supabase';
import { logger } from '../../utils/logger';

interface Profile {
  id: string;
  name: string | null;
  email: string | null; // Vem do auth.users, não da tabela profiles
  vehicle_type: string | null;
  city: string | null;
}

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: Profile | null) => void;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true, // Começa carregando para o checkSession
  error: null,

  setUser: (user) => set({ user }),

  signUp: async (email: string, password: string, name: string) => {
    try {
      set({ isLoading: true, error: null });

      const { data: { session }, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });

      if (error) throw error;

      if (session?.user) {
        // Upsert apenas com colunas que existem na tabela: id, name
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .upsert([{ id: session.user.id, name }])
          .select();

        if (profileError) {
          logger.warn('[AuthStore] Profile upsert warning during signUp:', profileError.message);
        }

        const profile = profiles?.[0] || null;
        // Email vem do auth session, não da tabela profiles
        const finalProfile: Profile = {
          id: session.user.id,
          name: profile?.name ?? name,
          email,
          vehicle_type: profile?.vehicle_type ?? null,
          city: profile?.city ?? null,
        };

        await localDatabase.update('profiles', finalProfile.id, {
          name: finalProfile.name,
          email: finalProfile.email,
          city: null,
          vehicle_type: null,
        });

        set({ user: finalProfile, isLoading: false });
      } else {
        logger.warn('[AuthStore] No session after signUp. Email confirmation may be required.');
        set({ error: 'Verifique seu e-mail para confirmar o cadastro.', isLoading: false });
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
        throw new Error('Password is required');
      }

      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (session?.user) {
        logger.info('[AuthStore] Session user found:', session.user.id);
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          logger.error('[AuthStore] Error fetching profile:', profileError.message);
          throw profileError;
        }

        if (!profile) {
          logger.info('[AuthStore] Profile not found, creating one...');
          const { data: newProfiles, error: createError } = await supabase
            .from('profiles')
            .upsert([{
              id: session.user.id,
              name: session.user.user_metadata?.name ?? null,
            }])
            .select();

          if (createError) {
            logger.warn('[AuthStore] Profile upsert warning on signIn:', createError.message);
          }
          profile = newProfiles?.[0] || null;
        }

        if (profile) {
          const finalProfile: Profile = {
            id: profile.id,
            name: profile.name ?? null,
            email: session.user.email ?? null, // Vem do auth
            vehicle_type: profile.vehicle_type ?? null,
            city: profile.city ?? null,
          };

          await localDatabase.update('profiles', finalProfile.id, {
            name: finalProfile.name,
            email: finalProfile.email,
            city: finalProfile.city,
            vehicle_type: finalProfile.vehicle_type,
          });

          set({ user: finalProfile, isLoading: false });
        } else {
          logger.warn('[AuthStore] Profile still missing after creation attempt.');
          set({ isLoading: false });
        }
      } else {
        console.log('[AuthStore] No session user after signIn attempt.');
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
      const redirectTo = Linking.createURL('/(tabs)');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
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
      const redirectTo = Linking.createURL('/login');

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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (session?.user) {
        console.log('[AuthStore] checkSession: Session user found:', session.user.id);
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          logger.error('[AuthStore] checkSession: Profile fetch error:', profileError.message);
          throw profileError;
        }

        if (!profile) {
          logger.info('[AuthStore] checkSession: Profile not found, creating...');
          const { data: newProfiles, error: createError } = await supabase
            .from('profiles')
            .upsert([{ id: session.user.id, name: session.user.user_metadata?.name ?? null }])
            .select();

          if (createError) {
            logger.warn('[AuthStore] checkSession: Profile upsert warning:', createError.message);
          }
          profile = newProfiles?.[0] || null;
        }

        if (profile) {
          const finalProfile: Profile = {
            id: profile.id,
            name: profile.name ?? null,
            email: session.user.email ?? null, // Vem do auth
            vehicle_type: profile.vehicle_type ?? null,
            city: profile.city ?? null,
          };

          await localDatabase.update('profiles', finalProfile.id, {
            name: finalProfile.name,
            email: finalProfile.email,
            city: finalProfile.city,
            vehicle_type: finalProfile.vehicle_type,
          });

          set({ user: finalProfile });
        } else {
          logger.warn('[AuthStore] checkSession: Profile missing after creation.');
        }
      } else {
        logger.info('[AuthStore] checkSession: No session found.');
        set({ user: null });
      }
    } catch (error: any) {
      logger.error('Session check error:', error.message);
      set({ error: error.message, user: null });
    } finally {
      set({ isLoading: false });
    }
  }
}));