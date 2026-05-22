"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { usePermissionStore } from "@/store/permission-store";
import { useAuthStore } from "@/store/auth-store";

interface PermissionRouteProps {
  /** screen_code bắt buộc phải có, ví dụ: "A_02_00" */
  requiredCode: string;
  children: React.ReactNode;
}

/**
 * PermissionRoute — Route guard bảo vệ từng trang
 *
 * Wrap từng trang với component này để kiểm tra quyền:
 *
 * ```tsx
 * <PermissionRoute requiredCode="A_02_00">
 *   <AdminsPage />
 * </PermissionRoute>
 * ```
 *
 * Nếu không có quyền → toast.error + navigate(-1)
 * Super Admin (role_id = 1) luôn được phép
 */
export function PermissionRoute({ requiredCode, children }: PermissionRouteProps) {
  const router = useRouter();
  const { permissionCodes, isInitialized, isLoading } = usePermissionStore();
  const { user } = useAuthStore();

  const isSuperAdmin = user?.role_id === 1;
  const isStillLoading = !isInitialized || isLoading;
  const canAccess = isSuperAdmin || isStillLoading || permissionCodes.has(requiredCode);

  React.useEffect(() => {
    if (isInitialized && !isLoading && !isSuperAdmin && !permissionCodes.has(requiredCode)) {
      toast.error("Bạn không có quyền truy cập trang này");
      router.back();
    }
  }, [isInitialized, isLoading, isSuperAdmin, permissionCodes, requiredCode, router]);

  if (!canAccess) return null;

  return <>{children}</>;
}
