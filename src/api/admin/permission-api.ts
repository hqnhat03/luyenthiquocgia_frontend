import api from "@/lib/axios";

export interface RawPermissionItem {
  role_id: number;
  role_name: string;
  screen_id: number;
  screen_name: string;
  screen_code: string;
  created_at: string;
  updated_at: string;
}

export interface RawPermissionResponse {
  items: RawPermissionItem[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export const PermissionApi = {
  /**
   * Lấy toàn bộ permission table (dùng cho Layout và trang quản lý phân quyền)
   */
  getPermissions: async (params?: { page?: number; per_page?: number }) => {
    const response = await api.get("/admin/permissions", {
      params: { page: params?.page ?? 1, per_page: params?.per_page ?? 500 },
    });
    return response.data as {
      success: boolean;
      data: RawPermissionResponse;
    };
  },

  /**
   * Cập nhật quyền cho một role
   */
  updatePermissions: async (
    permissions: Array<{ role_id: number; screen_id: number; has_access: boolean }>
  ) => {
    const response = await api.put("/admin/permissions/update", { permissions });
    return response.data;
  },
};
