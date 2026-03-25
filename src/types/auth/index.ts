export interface Profile {
  id: string;
  name: string | null;
  email: string | null; // Vem do auth.users, não da tabela profiles
  vehicle_type: string | null;
  city: string | null;
}

export interface AuthState {
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
export type LoginReturn = {
  user: {
    email: string;
    name: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: string;
  };
};
