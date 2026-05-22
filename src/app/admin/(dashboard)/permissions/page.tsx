'use client';

import { PermissionRoute } from '@/components/auth/PermissionRoute';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { useLayoutStore } from "@/store/layout-store";
import { usePermissionCacheStore } from '@/store/usePermissionCacheStore';
import { usePermissionStore } from '@/store/permission-store';
import {
  AlertCircle,
  Book,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Lock,
  Newspaper,
  RefreshCw,
  Save,
  School,
  Search,
  Settings2,
  ShieldAlert,
  TrendingUp,
  Users
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';


interface PermissionItem {
  role_id: number;
  role_name: string;
  screen_id: number;
  screen_name: string;
  screen_code: string;
  created_at: string;
  updated_at: string;
}

interface Screen {
  id: number;
  name: string;
  code: string;
}

interface RoleItem {
  id: number;
  name: string;
}

interface PermissionData {
  roles: RoleItem[];
  screens: Screen[];
}

const GROUP_CONFIG: Record<string, { label: string; icon: React.ComponentType }> = {
  'A_00': { label: 'Xác thực & Hệ thống', icon: Lock },
  'A_01': { label: 'Bảng điều khiển', icon: LayoutDashboard },
  'A_02': { label: 'Quản lý người dùng', icon: Users },
  'A_03': { label: 'Khóa học', icon: BookOpen },
  'A_04': { label: 'Lớp học', icon: School },
  'A_05': { label: 'Bài giảng', icon: Book },
  'A_06': { label: 'Môn học', icon: Layers },
  'A_07': { label: 'Trình độ', icon: TrendingUp },
  'A_08': { label: 'Tin tức', icon: Newspaper },
  'A_09': { label: 'Đăng ký khóa học', icon: GraduationCap },
  'A_10': { label: 'Câu hỏi & Chatbot', icon: Settings2 },
  'other': { label: 'Khác', icon: Settings2 }
};

/**
 * Các screen_code đặc biệt — checkbox bị disabled, không thể bỏ quyền
 */
const specialScreenCodes = ["A_02_00", "A_02_01", "A_02_02", "A_02_03"];

/**
 * Các screen_code bị ẩn khỏi bảng phân quyền
 */
const hiddenScreenCodes = ["A_00_02", "A_00_01", "A_00_00"];

function PermissionsPageContent() {
  const setHeaderContent = useLayoutStore((state) => state.setHeaderContent)

  const cacheStore = usePermissionCacheStore()
  const permissionStore = usePermissionStore()

  const [data, setData] = useState<PermissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<number | null>(null);

  // Local state for modified permissions
  const [rolePermissions, setRolePermissions] = useState<Record<number, number[]>>({});
  const [initialRolePermissions, setInitialRolePermissions] = useState<Record<number, number[]>>({});

  /**
   * Build permissionsMap từ danh sách permission items
   * Roles và Screens lấy từ API riêng, không derive từ permissions
   */
  const buildPermissionsMap = (
    items: Omit<PermissionItem, 'created_at' | 'updated_at'>[]
  ): Record<number, number[]> => {
    const map: Record<number, number[]> = {};
    items.forEach(item => {
      // Ép kiểu về number đề phòng API trả về string
      const roleId = Number(item.role_id);
      const screenId = Number(item.screen_id);
      if (!map[roleId]) map[roleId] = [];
      if (!map[roleId].includes(screenId)) {
        map[roleId].push(screenId);
      }
    });
    return map;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Gọi song song 3 API để lấy đầy đủ dữ liệu
      // /admin/roles và /admin/screens trả về toàn bộ danh sách,
      // không phụ thuộc vào việc role đó đã có quyền hay chưa
      const [rolesRes, screensRes, permsRes] = await Promise.all([
        api.get('/admin/roles'),
        api.get('/admin/screens', { params: { page: 1, per_page: 500 } }),
        api.get('/admin/permissions', { params: { page: 1, per_page: 500 } }),
      ]);

      // /admin/roles → { status, data: [{ id, name }, ...] }
      // Ép kiểu id về number đề phòng API trả về string
      const roles: RoleItem[] = (rolesRes.data?.data || []).map((r: RoleItem) => ({
        ...r,
        id: Number(r.id),
      }));
      // /admin/screens → { status, data: { items: [...], total, ... } }
      const rawScreens: Screen[] = screensRes.data?.data?.items || screensRes.data?.data || [];
      const allScreens: Screen[] = rawScreens.map((s: Screen) => ({
        ...s,
        id: Number(s.id),
      }));
      const items: PermissionItem[] = permsRes.data?.data?.items || [];

      const screens = allScreens.filter(s => !hiddenScreenCodes.includes(s.code));
      const permissionsMap = buildPermissionsMap(items);

      // Lưu cache
      cacheStore.setCache({ screens, roles, permissions: items });

      setData({ roles, screens });
      setRolePermissions(permissionsMap);
      setInitialRolePermissions(permissionsMap);

      if (roles.length > 0 && !selectedRole) {
        setSelectedRole(Number(roles[0].id));
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Không thể tải danh sách quyền');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    // Xóa cache lần này để đảm bảo dữ liệu mới nhất với đầy đủ roles/screens
    // Cache cũ có thể được build từ /admin/permissions (thiếu roles chưa có quyền)
    cacheStore.clearCache();
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const pageHeader = React.useMemo(() => (
    <div className="flex flex-1 items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
      <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
        Phân quyền hệ thống
      </h2>
      <Button
        variant="outline"
        className="h-10 px-6 bg-background hover:bg-muted transition-all active:scale-95 whitespace-nowrap shadow-sm border-dashed"
        onClick={() => fetchData()}
        disabled={loading}
      >
        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
        <span className="text-sm font-bold">Làm mới</span>
      </Button>
    </div>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [loading]);

  React.useEffect(() => {
    setHeaderContent(pageHeader)
    return () => setHeaderContent(null)
  }, [setHeaderContent, pageHeader])

  const handleTogglePermission = (roleId: number, screenId: number, screenCode: string) => {
    const role = data?.roles.find(r => r.id === roleId);

    // Super Admin không thể chỉnh sửa
    if (role?.name === 'super_admin' || role?.name === 'Super Admin') {
      toast.error('Không thể chỉnh sửa quyền của Super Admin');
      return;
    }

    // Các màn hình đặc biệt không thể bỏ quyền
    if (specialScreenCodes.includes(screenCode)) {
      toast.error('Không thể thay đổi quyền của màn hình này');
      return;
    }

    setRolePermissions(prev => {
      const current = prev[roleId] || [];
      if (current.includes(screenId)) {
        return { ...prev, [roleId]: current.filter(id => id !== screenId) };
      } else {
        return { ...prev, [roleId]: [...current, screenId] };
      }
    });
  };

  const handleSave = async (roleId: number) => {
    setSaving(roleId);
    try {
      const current = rolePermissions[roleId] || [];
      const original = initialRolePermissions[roleId] || [];

      const added = current.filter(id => !original.includes(id));
      const removed = original.filter(id => !current.includes(id));

      const permissionsPayload = [
        ...added.map(screen_id => ({ has_access: true, role_id: roleId, screen_id })),
        ...removed.map(screen_id => ({ has_access: false, role_id: roleId, screen_id }))
      ];

      if (permissionsPayload.length === 0) {
        toast.info('Không có thay đổi nào để lưu');
        setSaving(null);
        return;
      }

      const response = await api.put('/admin/permissions/update', {
        permissions: permissionsPayload
      });

      if (response.data?.status === 'success' || response.data?.success) {
        toast.success(response.data?.message || `Cập nhật quyền thành công`);
        setInitialRolePermissions(prev => ({ ...prev, [roleId]: [...current] }));

        // Cập nhật lại usePermissionStore sau khi save
        // (Nếu role đang chỉnh là role của user hiện tại)
        cacheStore.clearCache();
      } else {
        toast.error(response.data?.message || 'Lỗi khi cập nhật quyền');
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Lỗi khi cập nhật quyền');
    } finally {
      setSaving(null);
    }
  };

  const isRoleDirty = (roleId: number) => {
    if (!data) return false;
    const current = rolePermissions[roleId] || [];
    const original = initialRolePermissions[roleId] || [];

    if (current.length !== original.length) return true;
    return !current.every(p => original.includes(p));
  };

  const isSuperAdminRole = (roleId: number | null) => {
    if (!roleId) return false;
    const role = data?.roles.find(r => r.id === roleId);
    return role?.name === 'super_admin' || role?.name === 'Super Admin';
  };

  // Grouping logic
  const groupedPermissions = useMemo(() => {
    if (!data) return [];

    const groups: Record<string, Screen[]> = {};

    data.screens.forEach(screen => {
      const prefix = screen.code.split('_').slice(0, 2).join('_');
      const groupKey = GROUP_CONFIG[prefix] ? prefix : 'other';

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(screen);
    });

    return Object.entries(groups)
      .map(([key, screens]) => ({
        key,
        config: GROUP_CONFIG[key] || GROUP_CONFIG['other'],
        permissions: screens.sort((a, b) => a.code.localeCompare(b.code))
      }))
      .filter(group =>
        group.config.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.permissions.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [data, searchQuery]);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {/* Sidebar Roles */}
        <div className="md:col-span-1 space-y-4">
          <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl overflow-hidden ring-1 ring-slate-200/50 dark:ring-slate-800/50">
            <CardHeader className="pb-3 pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Vai trò
                </CardTitle>
                <ShieldAlert className="w-4 h-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <div className="flex flex-col gap-1">
                {data?.roles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(Number(role.id))}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-300 group",
                      selectedRole === role.id
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        selectedRole === role.id ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"
                      )}>
                        {(role.name === 'super_admin' || role.name === 'Super Admin') ? <Lock className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      </div>
                      <span className="font-medium text-sm capitalize">
                        {role.name.replace('_', ' ')}
                      </span>
                    </div>
                    {isRoleDirty(role.id) && (
                      <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Permissions Content */}
        <div className="md:col-span-3 lg:col-span-4 space-y-6">
          <Card className="border-none shadow-2xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl rounded-3xl overflow-hidden ring-1 ring-slate-200/50 dark:ring-slate-800/20">
            <CardHeader className="pb-0 pt-8 px-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">
                      {data?.roles.find(r => r.id === selectedRole)?.name?.replace('_', ' ')}
                    </h2>
                    {isSuperAdminRole(selectedRole) && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        ReadOnly
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Tùy chỉnh chi tiết quyền hạn cho vai trò này.
                  </CardDescription>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Tìm kiếm quyền..."
                      className="pl-10 rounded-xl bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  {selectedRole && isRoleDirty(selectedRole) && (
                    <Button
                      onClick={() => handleSave(selectedRole)}
                      disabled={saving === selectedRole}
                      className="rounded-xl shadow-lg shadow-primary/25 px-6 animate-in zoom-in duration-300"
                    >
                      {saving === selectedRole ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Lưu thay đổi
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-8 flex items-center gap-4 text-sm font-medium text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>{isSuperAdminRole(selectedRole) ? (data?.screens.length || 0) : (rolePermissions[selectedRole || 0]?.length || 0)} quyền đã cấp</span>
                </div>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                  <span>{data?.screens.length || 0} quyền tổng cộng</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                      <TableHead className="w-[300px] pl-8 py-4 font-semibold text-slate-600 dark:text-slate-300">Nhóm chức năng</TableHead>
                      <TableHead className="py-4 font-semibold text-slate-600 dark:text-slate-300">Quyền hạn chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedPermissions.map((group) => (
                      <TableRow key={group.key} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 border-slate-100 dark:border-slate-800 transition-colors">
                        <TableCell className="pl-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">{group.config.label}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-500 font-mono mt-0.5">{group.key}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="pr-8 ">
                          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 py-2 pr-4">
                            {group.permissions.map(screen => {
                              const isChecked = isSuperAdminRole(selectedRole)
                                ? true  // Super Admin luôn có tất cả quyền
                                // Dùng loose == để tránh lỗi string vs number từ API
                                // eslint-disable-next-line eqeqeq
                                : (rolePermissions[selectedRole || 0]?.some(id => id == Number(screen.id)) ?? false);
                              const isReadOnly = isSuperAdminRole(selectedRole) || specialScreenCodes.includes(screen.code);

                              return (
                                <label
                                  key={screen.id}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer group",
                                    isChecked
                                      ? "bg-primary/5 border-primary/20 ring-1 ring-primary/5 shadow-sm"
                                      : "bg-transparent border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-none",
                                    isReadOnly && "cursor-not-allowed opacity-80"
                                  )}
                                >
                                  <Checkbox
                                    id={`screen-${screen.id}`}
                                    checked={isChecked}
                                    onCheckedChange={() => handleTogglePermission(selectedRole || 0, screen.id, screen.code)}
                                    disabled={isReadOnly}
                                    className={cn(
                                      "rounded-md w-5 h-5 transition-all",
                                      isChecked ? "bg-primary border-primary" : "border-slate-300 dark:border-slate-600"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className={cn(
                                      "text-sm font-medium transition-colors",
                                      isChecked ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900"
                                    )}>
                                      {screen.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono hidden lg:block uppercase tracking-tight">
                                      {screen.code}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {groupedPermissions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <Search className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Không tìm thấy quyền phù hợp</p>
                            <p className="text-sm">Vui lòng kiểm tra lại từ khóa tìm kiếm</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 flex gap-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full h-fit mt-0.5">
               <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300">Lưu ý về bảo mật</h4>
              <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                Các thay đổi về quyền hạn sẽ có hiệu lực ngay lập tức đối với người dùng đang đăng nhập.
                Hãy cẩn thận khi điều chỉnh các quyền quan trọng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Trang phân quyền màn hình
 * Yêu cầu screen_code: A_02_40
 */
export default function PermissionsPage() {
  return (
    <PermissionRoute requiredCode="A_02_40">
      <PermissionsPageContent />
    </PermissionRoute>
  );
}
