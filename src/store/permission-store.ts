import { create } from 'zustand';

/**
 * usePermissionStore — Route guard store (in-memory, không persist)
 *
 * Lưu Set<screen_code> của role hiện tại để PermissionRoute
 * kiểm tra quyền truy cập trang nhanh chóng (O(1)).
 *
 * Không persist vào localStorage — sẽ bị reset khi F5,
 * Layout sẽ re-fetch và set lại.
 */
interface PermissionState {
  /** Tập hợp screen_code mà user hiện tại được phép truy cập */
  permissionCodes: Set<string>;
  isLoading: boolean;
  isInitialized: boolean;
  setPermissionStores: (codes: string[]) => void;
  setLoading: (loading: boolean) => void;
  clearPermissions: () => void;
}

export const usePermissionStore = create<PermissionState>((set) => ({
  permissionCodes: new Set<string>(),
  isLoading: false,
  isInitialized: false,

  setPermissionStores: (codes: string[]) =>
    set({ permissionCodes: new Set(codes), isInitialized: true }),

  setLoading: (isLoading: boolean) => set({ isLoading }),

  clearPermissions: () =>
    set({ permissionCodes: new Set<string>(), isInitialized: false }),
}));
