"use client"

import { cn } from "@/lib/utils"
import {
  Activity,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Edit,
  Eye,
  Plus,
  RefreshCcw,
  Search,
  SearchX,
  Trash2,
} from "lucide-react"
import * as React from "react"

import { Can } from "@/components/auth/can"
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDebounce } from "@/hooks/use-debounce"
import { usePermission } from "@/hooks/use-permission"
import api from "@/lib/axios"
import { useLayoutStore } from "@/store/layout-store"
import { type Admin } from "@/types/AdminType"
import { type Role } from "@/types/RoleType"
import { AxiosError } from "axios"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AdminDrawer } from "./_components/AdminDrawer"

export default function AdminsPage() {
  const router = useRouter()
  const { hasPermission } = usePermission()
  const setHeaderContent = useLayoutStore((state) => state.setHeaderContent)

  const statusLabel: Record<string, string> = {
    "all": "Tất cả trạng thái",
    "active": "Đang hoạt động",
    "inactive": "Bị khóa",
  }

  // Kiểm tra quyền truy cập trang danh sách
  React.useEffect(() => {
    if (!hasPermission("admin_list")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/admin")
    }
  }, [hasPermission, router])

  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState("all")

  // Pagination and Sorting State
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [sortBy, setSortBy] = React.useState("created_at")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
  const [totalItems, setTotalItems] = React.useState(0)
  const [lastPage, setLastPage] = React.useState(1)

  const [admins, setAdmins] = React.useState<Admin[]>([])
  const [roles, setRoles] = React.useState<Role[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingRoles, setIsLoadingRoles] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)


  const debouncedSearch = useDebounce(search, 400)

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [adminToDelete, setAdminToDelete] = React.useState<Admin | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Drawer state
  const [drawerMode, setDrawerMode] = React.useState<"create" | "edit" | "view" | undefined>(undefined)
  const [selectedAdmin, setSelectedAdmin] = React.useState<Admin | null>(null)

  const pageHeader = React.useMemo(() => (
    <div className="flex flex-1 items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
      <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
        Quản lý quản trị viên
      </h2>
      <Can permission="admin_create">
        <Button
          className="h-10 px-6 bg-primary hover:bg-primary/90 transition-all active:scale-95 whitespace-nowrap shadow-md shadow-primary/20"
          onClick={() => {
            setSelectedAdmin(null)
            setDrawerMode("create")
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="text-sm font-bold">Thêm mới</span>
        </Button>
      </Can>
    </div>
  ), []);

  React.useEffect(() => {
    setHeaderContent(pageHeader)
    return () => setHeaderContent(null)
  }, [setHeaderContent, pageHeader])
  const fetchAdmins = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get("/admin/admins", {
        params: {
          name: debouncedSearch || undefined,
          status: status !== "all" ? (status === "active" ? 1 : 0) : undefined,
          page: currentPage,
          pagination: pageSize,
          order_by_name: sortBy === "name" ? sortOrder : undefined,
        },
      })

      const result = response.data
      if (result.status === "success") {
        setAdmins(result.data?.data || [])
        setTotalItems(result.data?.total || 0)
        setLastPage(result.data?.last_page || 1)
      } else {
        throw new Error(result.message || "Không thể tải danh sách quản trị viên")
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        console.error(err)
        setError(err.response?.data?.message || "Không thể tải danh sách quản trị viên")
        toast.error("Lỗi: " + (err.response?.data?.message || "Đã có lỗi xảy ra"))
      } else if (err instanceof Error) {
        setError(err.message)
        toast.error(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, status, currentPage, pageSize, sortBy, sortOrder])

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
    setCurrentPage(1)
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
    return sortOrder === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4 text-primary" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4 text-primary" />
    )
  }

  const fetchRoles = React.useCallback(async () => {
    if (roles.length > 0) return
    setIsLoadingRoles(true)
    try {
      const response = await api.get("/admin/roles")
      const result = response.data
      if (result.status === "success") {
        setRoles(result.data || [])
      }
    } catch (err) {
      console.error("Failed to fetch roles:", err)
    } finally {
      setIsLoadingRoles(false)
    }
  }, [roles.length])

  React.useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  React.useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const handleDeleteClick = (admin: Admin) => {
    setAdminToDelete(admin)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!adminToDelete) return

    setIsDeleting(true)
    try {
      const response = await api.delete("/admin/admins/delete", {
        params: { id: adminToDelete.id }
      })

      if (response.status === 200 || response.data?.status === "success") {
        toast.success(response.data?.message || "Xóa quản trị viên thành công")
        const deletedId = response.data?.data || adminToDelete.id
        setAdmins(prev => prev.filter(a => a.id !== deletedId))
        setTotalItems(prev => Math.max(0, prev - 1))
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        console.error(err)
        toast.error(err.response?.data?.message || "Lỗi khi xóa quản trị viên")
      }
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setAdminToDelete(null)
    }
  }

  if (!hasPermission("admin_list")) return null

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      {/* Filter Section */}
      <Card className="border-none shadow-sm bg-muted/30 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên, email hoặc SĐT..."
                className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="w-full md:w-48">
              <Select
                value={statusLabel[status]}
                onValueChange={(val) => {
                  const key = Object.keys(statusLabel).find(k => statusLabel[k] === val);
                  setStatus(key || "all");
                }}
              >
                <SelectTrigger className="bg-background border-muted-foreground/20">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    <SelectValue placeholder="Trạng thái" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tất cả trạng thái">Tất cả trạng thái</SelectItem>
                  <SelectItem value="Đang hoạt động">Đang hoạt động</SelectItem>
                  <SelectItem value="Bị khóa">Bị khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1"></div>
            <Button
              variant="outline"
              className="w-full md:w-fit bg-background hover:bg-muted transition-colors border-dashed"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setCurrentPage(1);
                setSortBy("created_at");
                setSortOrder("desc");
              }}
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content: Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
          <p>
            Hiển thị <strong>{admins.length}</strong> / <strong>{totalItems}</strong> quản trị viên
          </p>
        </div>

        <div className="rounded-xl border bg-background shadow-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[80px] text-center">ID</TableHead>
                <TableHead className="w-[100px]">Ảnh đại diện</TableHead>
                <TableHead
                  className="cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Họ tên
                    <SortIcon field="name" />
                  </div>
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[150px]">Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={cn(isLoading && admins.length > 0 && "opacity-50 transition-opacity duration-300")}>
              {isLoading && admins.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-center"><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-8 w-32 mx-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 text-destructive">
                      <SearchX className="h-12 w-12 opacity-50" />
                      <p className="font-medium">{error}</p>
                      <Button variant="outline" size="sm" onClick={fetchAdmins}>Thử lại</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                      <SearchX className="h-12 w-12 opacity-30" />
                      <div className="space-y-1">
                        <p className="text-lg font-medium">Không tìm thấy kết quả nào</p>
                        <p className="text-sm">Hãy thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc của bạn.</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setSearch(""); setStatus("all"); }}
                        className="mt-2"
                      >
                        Xóa bộ lọc
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow key={admin.id} className="hover:bg-muted/20 transition-colors group">
                    <TableCell className="text-center">
                      <div className="text-sm font-medium text-muted-foreground">#{admin.id}</div>
                    </TableCell>
                    <TableCell>
                      <Avatar className="h-10 w-10 border-2 border-background shadow-sm ring-1 ring-muted/50 group-hover:ring-primary/30 transition-all">
                        <AvatarImage 
                          src={admin.avatar_url ? (admin.avatar_url.startsWith('http') ? admin.avatar_url : `${process.env.NEXT_PUBLIC_API_IMAGE_URL}${admin.avatar_url}`) : ""} 
                          alt={`${admin.first_name} ${admin.last_name}`} 
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {admin.first_name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {admin.first_name} {admin.last_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" title="Sao chép email">
                        {admin.email}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {admin.role ? (
                          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-normal text-[10px] flex items-center gap-1">
                            {admin.role.name}
                          </Badge>
                        ) : admin.roles && admin.roles.length > 0 ? (
                          admin.roles.map((role, idx) => {
                            const roleName = typeof role === "string" ? role : role.name;
                            const roleKey = typeof role === "string" ? role : role.id?.toString() || String(idx);
                            return (
                              <Badge key={roleKey} variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-normal text-[10px] flex items-center gap-1">
                                {roleName}
                              </Badge>
                            );
                          })
                        ) : admin.role_id ? (
                          (() => {
                            const role = roles.find(r => r.id === admin.role_id);
                            return role ? (
                              <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-normal text-[10px] flex items-center gap-1">
                                {role.name}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">ID: {admin.role_id}</span>
                            );
                          })()
                        ) : (
                          <span className="text-xs text-muted-foreground">Chưa phân vai trò</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(admin.status === "active" || admin.status === 1) ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200/50 transition-colors cursor-default">
                          Đang hoạt động
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-200/50 transition-colors cursor-default">
                          Bị khóa
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Can permission="admin_detail">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                            title="Chi tiết"
                            onClick={() => {
                              setSelectedAdmin(admin)
                              setDrawerMode("view")
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Can>
                        <Can permission="admin_edit">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-amber-600 transition-colors"
                            title="Chỉnh sửa"
                            onClick={() => {
                              setSelectedAdmin(admin)
                              setDrawerMode("edit")
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Can>
                        <Can permission="admin_delete">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                            title="Xóa"
                            onClick={() => handleDeleteClick(admin)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Can>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between px-2 mt-6 gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <p>
            Hiển thị <strong>{admins.length}</strong> / <strong>{totalItems}</strong> quản trị viên
          </p>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap">Số hàng:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => {
                setPageSize(parseInt(val || "10"))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[70px] bg-background">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isLoading}
          >
            Trước
          </Button>
          <div className="flex items-center gap-1">
            {(() => {
              const maxVisible = 5;
              let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
              const end = Math.min(lastPage, start + maxVisible - 1);

              if (end - start + 1 < maxVisible) {
                start = Math.max(1, end - maxVisible + 1);
              }

              const pages: number[] = [];
              for (let i = start; i <= end; i++) {
                pages.push(i);
              }

              return pages.map((pageNum) => (
                <Button
                  key={`page-${pageNum}`}
                  variant={currentPage === pageNum ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-8 w-8 text-xs font-bold",
                    currentPage === pageNum && "bg-primary/10 text-primary hover:bg-primary/20 shadow-sm"
                  )}
                  onClick={() => setCurrentPage(pageNum)}
                  disabled={isLoading}
                >
                  {pageNum}
                </Button>
              ));
            })()}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(lastPage, prev + 1))}
            disabled={currentPage === lastPage || isLoading}
          >
            Sau
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteModal
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Xác nhận xóa quản trị viên"
        itemName={adminToDelete ? `${adminToDelete.first_name} ${adminToDelete.last_name}` : ""}
      />

      {/* Admin Drawer */}
      <AdminDrawer
        mode={drawerMode}
        admin={selectedAdmin}
        roles={roles}
        isLoadingRoles={isLoadingRoles}
        onClose={() => {
          setDrawerMode(undefined)
          setSelectedAdmin(null)
        }}
        onSuccess={(data?: Admin) => {
          if (data) {
            setAdmins(prev => prev.map(a => a.id == data.id ? { ...a, ...data } : a))
            setSelectedAdmin(prev => prev && prev.id == data.id ? { ...prev, ...data } : prev)
            setDrawerMode("view")
          } else {
            fetchAdmins()
          }
        }}
      />
    </div>
  )
}
