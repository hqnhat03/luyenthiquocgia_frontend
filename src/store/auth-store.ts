import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  role_id?: number;
  avatar?: string;
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        set({ user, token });
        // Vẫn lưu token vào cookie để middleware hoặc SSR có thể đọc nếu cần
        if (typeof window !== 'undefined') {
          document.cookie = `access_token=${token}; path=/; max-age=604800; SameSite=Lax`;
        }
      },
      setUser: (user) => {
        set({ user });
      },
      setToken: (token) => {
        set({ token });
        if (typeof window !== 'undefined') {
          document.cookie = `access_token=${token}; path=/; max-age=604800; SameSite=Lax`;
        }
      },
      logout: () => {
        set({ user: null, token: null });
        if (typeof window !== 'undefined') {
          document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          localStorage.removeItem('auth-storage'); // Xóa sạch local storage khi logout
        }
      },
    }),
    {
      name: 'auth-storage', // Tên key trong local storage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
