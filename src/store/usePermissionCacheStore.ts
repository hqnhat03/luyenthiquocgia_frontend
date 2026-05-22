import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

export interface CachedScreen {
  id: number;
  name: string;
  code: string;
}

export interface CachedRole {
  id: number;
  name: string;
}

export interface CachedPermissionItem {
  role_id: number;
  role_name: string;
  screen_id: number;
  screen_name: string;
  screen_code: string;
}

interface PermissionCacheState {
  screens: CachedScreen[];
  roles: CachedRole[];
  permissions: CachedPermissionItem[];
  lastFetched: number | null;

  setCache: (data: {
    screens: CachedScreen[];
    roles: CachedRole[];
    permissions: CachedPermissionItem[];
  }) => void;

  isValid: () => boolean;
  clearCache: () => void;
}

export const usePermissionCacheStore = create<PermissionCacheState>()(
  persist(
    (set, get) => ({
      screens: [],
      roles: [],
      permissions: [],
      lastFetched: null,

      setCache: ({ screens, roles, permissions }) =>
        set({ screens, roles, permissions, lastFetched: Date.now() }),

      isValid: () => {
        const { lastFetched } = get();
        if (!lastFetched) return false;
        return Date.now() - lastFetched < CACHE_DURATION;
      },

      clearCache: () =>
        set({ screens: [], roles: [], permissions: [], lastFetched: null }),
    }),
    {
      name: 'permission-data-cache',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
