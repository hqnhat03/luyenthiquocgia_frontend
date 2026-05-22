import { usePermissionStore } from "@/store/permission-store";
import { useAuthStore } from "@/store/auth-store";
import { normalizeToPermissionKey, getScreenCodeFromKey } from "@/lib/permission-helper";

/**
 * usePermission hook
 *
 * Kiểm tra quyền truy cập dựa trên Set<screen_code> trong usePermissionStore.
 *
 * hasPermission(input) hỗ trợ 3 dạng input:
 *   1. screen_code:   "A_02_00"       → lookup trực tiếp trong Set
 *   2. permissionKey: "admin:view"    → resolve → screen_code → lookup
 *   3. legacy key:    "admin_list"    → normalize → permissionKey → screen_code → lookup
 *
 * Super Admin (role_id = 1) luôn trả về true.
 * Khi đang loading/chưa init → trả về true để tránh redirect sai.
 */
export const usePermission = () => {
  const { permissionCodes, isLoading, isInitialized } = usePermissionStore();
  const { user } = useAuthStore();

  const hasPermission = (input: string | string[]): boolean => {
    // Super Admin luôn có quyền
    if (user?.role_id === 1) return true;

    // Chưa init hoặc đang load → tạm cho phép để tránh redirect nhầm
    if (!isInitialized || isLoading) return true;

    if (Array.isArray(input)) {
      return input.some((k) => hasPermission(k));
    }

    // 1. screen_code trực tiếp (ví dụ: "A_02_00")
    if (input.startsWith("A_")) {
      return permissionCodes.has(input);
    }

    // 2. permissionKey (ví dụ: "admin:view") → tìm screen_code tương ứng
    if (input.includes(":")) {
      const screenCode = getScreenCodeFromKey(input);
      if (!screenCode) return false;
      return permissionCodes.has(screenCode);
    }

    // 3. Legacy key (ví dụ: "admin_list") → normalize → permissionKey → screen_code
    const permKey = normalizeToPermissionKey(input);
    if (!permKey) return false;
    const screenCode = getScreenCodeFromKey(permKey);
    if (!screenCode) return false;
    return permissionCodes.has(screenCode);
  };

  return {
    hasPermission,
    isLoading,
    isInitialized,
  };
};
