import api from "@/lib/axios";

export const PermissionApi = {
  getPermissions: async () => {
    const response = await api.get("/admin/permissions", {
      params: { page: 1, per_page: 500 }
    });
    return response.data;
  }
};
