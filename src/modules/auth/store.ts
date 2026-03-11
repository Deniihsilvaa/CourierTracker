import * as Linking from 'expo-linking';
import { create } from 'zustand';
import { getDb } from '../../services/sqlite';
import { supabase } from '../../services/supabase';

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
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
        options: {
          data: {
            name: name,
          }
        }
      });

      if (error) throw error;

      if (session?.user) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: session.user.id,
            name: name,
            email: email
          }])
          .select();

        if (profileError) {
          console.error('[AuthStore] Error creating profile during signUp:', profileError);
          throw profileError;
        }

        const profile = profiles?.[0] || null;

        if (profile) {
          console.log('[AuthStore] Profile created and ready after signUp.');

          const finalProfile = {
            ...profile,
            email: profile.email || email
          };

          const db = getDb();
          await db.runAsync(
            'INSERT INTO profiles (id, name, full_name, email, city, vehicle_type) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, full_name=excluded.full_name, email=excluded.email, city=excluded.city, vehicle_type=excluded.vehicle_type',
            [
              finalProfile.id,
              finalProfile.name || null,
              finalProfile.full_name || finalProfile.name || null,
              finalProfile.email || null,
              finalProfile.city || null,
              finalProfile.vehicle_type || null
            ]
          ).catch(e => console.error('SQLite Sync Error:', e));

          set({ user: finalProfile, isLoading: false });
        } else {
          console.warn('[AuthStore] Profile still missing after signUp.');
          set({ isLoading: false });
        }
      } else {
        console.log('[AuthStore] No session user after signUp. Email confirmation might be required.');
        set({ error: 'Please check your email for confirmation link.', isLoading: false });
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
        console.log('[AuthStore] Session user found:', session.user.id);
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('[AuthStore] Error fetching profile:', profileError);
          throw profileError;
        }

        if (!profile) {
          console.log('[AuthStore] Profile not found, creating one...');
          const { data: newProfiles, error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || null,
              email: session.user.email || null
            }])
            .select();

          if (createError) {
            console.error('[AuthStore] Error creating profile:', createError);
            throw createError;
          }
          profile = newProfiles?.[0] || null;
          console.log('[AuthStore] New profile created:', profile?.id);
        }

        if (profile) {
          console.log('[AuthStore] Profile ready, setting user.');
          const finalProfile = {
            ...profile,
            email: profile.email || session.user.email || null
          };

          const db = getDb();
          await db.runAsync(
            'INSERT INTO profiles (id, name, full_name, email, city, vehicle_type) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, full_name=excluded.full_name, email=excluded.email, city=excluded.city, vehicle_type=excluded.vehicle_type',
            [
              finalProfile.id,
              finalProfile.name || null,
              finalProfile.full_name || finalProfile.name || null,
              finalProfile.email || null,
              finalProfile.city || null,
              finalProfile.vehicle_type || null
            ]
          ).catch(e => console.error('SQLite Sync Error:', e));

          set({ user: finalProfile, isLoading: false });
        } else {
          console.warn('[AuthStore] Profile still missing after creation attempt.');
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
          console.error('[AuthStore] checkSession: Profile fetch error:', profileError);
          throw profileError;
        }

        if (!profile) {
          console.log('[AuthStore] checkSession: Profile not found, creating...');
          const { data: newProfiles, error: createError } = await supabase
            .from('profiles')
            .insert([{ id: session.user.id, name: session.user.user_metadata?.name || null, email: session.user.email || null }])
            .select();

          if (createError) {
            console.error('[AuthStore] checkSession: Profile create error:', createError);
            throw createError;
          }
          profile = newProfiles?.[0] || null;
        }

        if (profile) {
          console.log('[AuthStore] checkSession: Profile ready, setting user.');
          const finalProfile = {
            ...profile,
            email: profile.email || session.user.email || null
          };
          const db = getDb();
          try {
            await db.runAsync(
              'INSERT INTO profiles (id, name, full_name, email, city, vehicle_type) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, full_name=excluded.full_name, email=excluded.email, city=excluded.city, vehicle_type=excluded.vehicle_type',
              [
                finalProfile.id,
                finalProfile.name || null,
                finalProfile.full_name || finalProfile.name || null,
                finalProfile.email || null,
                finalProfile.city || null,
                finalProfile.vehicle_type || null
              ]
            );
          } catch (sqlError) {
            console.error('SQLite profile sync error:', sqlError);
          }
          set({ user: finalProfile });
        } else {
          console.warn('[AuthStore] checkSession: Profile still missing after creation.');
        }
      } else {
        console.log('[AuthStore] checkSession: No session found.');
        set({ user: null });
      }
    } catch (error: any) {
      console.error('Session check error:', error);
      set({ error: error.message, user: null });
    } finally {
      set({ isLoading: false });
    }
  }
}));