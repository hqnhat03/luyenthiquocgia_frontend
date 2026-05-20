import { create } from 'zustand';

export interface ScreenPermission {
  screen_code: string;
  screen_name: string;
  can_view: number;
  can_add: number;
  can_edit: number;
  can_delete: number;
}

interface PermissionState {
  permissions: ScreenPermission[];
  permissionMap: Map<string, ScreenPermission>;
  isLoading: boolean;
  isInitialized: boolean;
  setPermissions: (permissions: ScreenPermission[]) => void;
  setLoading: (loading: boolean) => void;
  clearPermissions: () => void;
}

export const usePermissionStore = create<PermissionState>((set) => ({
  permissions: [],
  permissionMap: new Map(),
  isLoading: false,
  isInitialized: false,
  setPermissions: (permissions) => {
    const map = new Map<string, ScreenPermission>();
    permissions.forEach((p) => {
      map.set(p.screen_code, p);
    });
    set({ permissions, permissionMap: map, isInitialized: true });
  },
  setLoading: (isLoading) => set({ isLoading }),
  clearPermissions: () => set({ permissions: [], permissionMap: new Map() }),
}));
