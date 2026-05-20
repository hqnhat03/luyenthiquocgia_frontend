import { usePermissionStore } from "@/store/permission-store";
import { useAuthStore } from "@/store/auth-store";
import { getScreenCode } from "@/lib/permission-helper";

export const usePermission = () => {
  const { permissionMap, isLoading, isInitialized } = usePermissionStore();
  const { user } = useAuthStore();

  const hasPermission = (key: string | string[], action: 'view' | 'add' | 'edit' | 'delete' = 'view'): boolean => {
    // Super admin (role_id = 1) luôn có quyền
    if (user?.role_id === 1) return true;

    // Nếu chưa khởi tạo hoặc đang load, tạm thời trả về true để tránh redirect sai
    if (!isInitialized || isLoading) return true;

    if (Array.isArray(key)) {
      return key.some(k => hasPermission(k, action));
    }

    // Try to get screen code from mapping or use key directly if it looks like a screen code
    const screenCode = getScreenCode(key) || key;
    const permission = permissionMap.get(screenCode);

    if (!permission) return false;

    switch (action) {
      case 'view': return permission.can_view === 1;
      case 'add': return permission.can_add === 1;
      case 'edit': return permission.can_edit === 1;
      case 'delete': return permission.can_delete === 1;
      default: return false;
    }
  };

  return {
    hasPermission,
    isLoading,
    isInitialized,
    canView: (key: string) => hasPermission(key, 'view'),
    canAdd: (key: string) => hasPermission(key, 'add'),
    canEdit: (key: string) => hasPermission(key, 'edit'),
    canDelete: (key: string) => hasPermission(key, 'delete'),
  };
};
