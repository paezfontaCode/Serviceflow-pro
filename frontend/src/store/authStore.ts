import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'vendedor' | 'tecnico';
  roles?: { id: number; name: string }[];
}

interface AuthState {
  token: string | null;
  refresh_token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, refresh_token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refresh_token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, refresh_token, user) =>
        set({ token, refresh_token, user, isAuthenticated: true }),
      logout: () =>
        set({ token: null, refresh_token: null, user: null, isAuthenticated: false }),
      updateUser: (user) => set({ user }),
    }),
    {
      name: 'serviceflow-auth', // unique name for storage
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
