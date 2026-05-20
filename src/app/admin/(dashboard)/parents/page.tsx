"use client"

import { Can } from "@/components/auth/can"
import { usePermission } from "@/hooks/use-permission"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"
import { useLayoutStore } from "@/store/layout-store"
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
} from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

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
import { type Parent, mapBackendParentToFrontend } from "@/types/ParentType"
import { ParentDrawer } from "./_components/ParentDrawer"

export default function ParentsPage() {
  const router = useRouter()
  const { hasPermission } = usePermission()
  const setHeaderContent = useLayoutStore((state) => state.setHeaderContent)

  // Kiểm tra quyền truy cập trang danh sách
  React.useEffect(() => {
    if (!hasPermission("guardian_list")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/admin")
    }
  }, [hasPermission, router])

  // State for filtering
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<string>("all")

  // Pagination and Sorting State
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [sortBy, setSortBy] = React.useState("created_at")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
  const [totalItems, setTotalItems] = React.useState(0)
  const [lastPage, setLastPage] = React.useState(1)

  // State for data
  const [parents, setParents] = React.useState<Parent[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Drawer state
  const [drawerMode, setDrawerMode] = React.useState<"create" | "edit" | "view" | undefined>(undefined)
  const [selectedParent, setSelectedParent] = React.useState<Parent | null>(null)

  // Debounced search term
  const debouncedSearch = useDebounce(search, 300)

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [parentToDelete, setParentToDelete] = React.useState<Parent | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const statusLabels: Record<string, string> = {
    "all": "Tất cả trạng thái",
    "active": "Đang hoạt động",
    "inactive": "Bị khóa",
  }

  const fetchParents = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append("name", debouncedSearch)
      if (status !== "all") {
        params.append("status", status === "active" ? "1" : "0")
      }

      params.append("page", currentPage.toString())
      params.append("pagination", pageSize.toString())
      params.append("order_by", sortBy)
      params.append("direction", sortOrder)

      const response = await api.get(`/admin/parents?${params.toString()}`)
      const result = response.data

      if ((result.success || result.status === "success") && result.data) {
        const paginator = result.data
        const rawParents = Array.isArray(paginator.data) ? paginator.data : []
        setParents(rawParents.map(mapBackendParentToFrontend))
        setTotalItems(paginator.total || 0)
        setLastPage(paginator.last_page || 1)
      } else {
        throw new Error(result.message || "Lỗi khi lấy dữ liệu")
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra")
      toast.error(err instanceof Error ? err.message : "Đã có lỗi khi tải dữ liệu")
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, status, currentPage, pageSize, sortBy, sortOrder])

  React.useEffect(() => {
    fetchParents()
  }, [fetchParents])

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

  const handleDeleteClick = (parent: Parent) => {
    setParentToDelete(parent)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!parentToDelete) return

    setIsDeleting(true)
    try {
      const response = await api.delete(`/admin/parents/delete`, {
        params: { id: parentToDelete.id }
      })
      const result = response.data

      if (result.success || result.status === "success") {
        toast.success(result.message || "Xóa phụ huynh thành công")
        // Xóa khỏi danh sách local
        setParents(prev => prev.filter(g => g.id !== parentToDelete.id))
        setTotalItems(prev => Math.max(0, prev - 1))
      } else {
        throw new Error(result.message || "Không thể xóa phụ huynh")
      }
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi xóa")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setParentToDelete(null)
    }
  }

  const resetFilters = () => {
    setSearch("")
    setStatus("all")
    setCurrentPage(1)
  }

  const openDrawer = (mode: "create" | "edit" | "view", parent: Parent | null = null) => {
    setSelectedParent(parent)
    setDrawerMode(mode)
  }

  const pageHeader = React.useMemo(() => (
    <div className="flex flex-1 items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
      <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
        Quản lý phụ huynh
      </h2>
      <Can permission="guardian_create">
        <Button
          className="h-10 px-6 bg-primary hover:bg-primary/90 transition-all active:scale-95 whitespace-nowrap shadow-md shadow-primary/20"
          onClick={() => openDrawer("create")}
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="text-sm font-bold">Thêm phụ huynh</span>
        </Button>
      </Can>
    </div>
  ), []);

  React.useEffect(() => {
    setHeaderContent(pageHeader)
    return () => setHeaderContent(null)
  }, [setHeaderContent, pageHeader])

  return (
    <div className="flex flex-col gap-6 p-1">

      {/* Filter Section */}
      <Card className="border-none shadow-sm bg-muted/40 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row flex-wrap items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên phụ huynh"
                className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={statusLabels[status]}
              onValueChange={(val) => {
                const key = Object.keys(statusLabels).find(k => statusLabels[k] === val);
                setStatus(key || "all");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="bg-background border-muted-foreground/20">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Trạng thái" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tất cả trạng thái">Tất cả trạng thái</SelectItem>
                <SelectItem value="Đang hoạt động">Đang hoạt động</SelectItem>
                <SelectItem value="Bị khóa">Bị khóa</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1"></div>
            <Button
              variant="outline"
              className="w-full md:w-fit bg-background hover:bg-muted transition-colors"
              onClick={resetFilters}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <div className="rounded-xl border bg-background shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead
                className="w-[80px] font-semibold cursor-pointer hover:bg-muted/80 transition-colors text-center"
                onClick={() => handleSort("id")}
              >
                <div className="flex items-center justify-center">
                  ID
                  <SortIcon field="id" />
                </div>
              </TableHead>
              <TableHead className="w-[120px] font-semibold">Ảnh đại diện</TableHead>
              <TableHead
                className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Họ và tên
                  <SortIcon field="name" />
                </div>
              </TableHead>
              <TableHead
                className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("email")}
              >
                <div className="flex items-center">
                  Email
                  <SortIcon field="email" />
                </div>
              </TableHead>
              <TableHead
                className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("phone")}
              >
                <div className="flex items-center">
                  Số điện thoại
                  <SortIcon field="phone" />
                </div>
              </TableHead>
              <TableHead className="font-semibold">Học sinh</TableHead>
              <TableHead
                className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Trạng thái
                  <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead className="text-center font-semibold">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={cn(isLoading && parents.length > 0 && "opacity-50 transition-opacity duration-300")}>
            {isLoading && parents.length === 0 ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-8 w-32 mx-auto rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-destructive">
                    <ShieldAlert className="h-8 w-8" />
                    <p className="font-semibold">{error}</p>
                    <Button variant="outline" size="sm" onClick={fetchParents}>Thử lại</Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : parents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UserCheck className="h-8 w-8 opacity-20" />
                    <p>Không tìm thấy phụ huynh nào phù hợp.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}

            {!hasPermission("guardian_list") ? null : (
              parents.map((parent) => (

                <TableRow key={parent.id} className="group hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium text-muted-foreground text-center">
                    #{parent.id}
                  </TableCell>
                  <TableCell>
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm ring-1 ring-muted group-hover:ring-primary/30 transition-all">
                      <AvatarImage src={parent.avatar ? (parent.avatar.startsWith('http') ? parent.avatar : `${process.env.NEXT_PUBLIC_API_IMAGE_URL}${parent.avatar}`) : ""} alt={parent.name} />
                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                        {parent.name?.split(" ").pop()?.substring(0, 2).toUpperCase() || "PH"}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground/90">{parent.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{parent.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{parent.phone}</TableCell>
                  <TableCell>
                    {parent.students && parent.students.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {parent.students.map((student) => (
                          <Badge key={student.id} variant="secondary" className="text-xs font-medium bg-muted whitespace-nowrap">
                            {student.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Chưa có</span>
                    )}
                  </TableCell>
                  <TableCell >
                    {parent.status === "active" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200/50 shadow-none">
                        Đang hoạt động
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-200/50 shadow-none">
                        Bị khóa
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      <Can permission="guardian_detail">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                          title="Chi tiết"
                          onClick={() => openDrawer("view", parent)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Can>
                      <Can permission="guardian_edit">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-amber-600 transition-colors"
                          title="Chỉnh sửa"
                          onClick={() => openDrawer("edit", parent)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Can>
                      <Can permission="guardian_delete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                          title="Xóa"
                          onClick={() => handleDeleteClick(parent)}
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

      {/* Pagination Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 gap-4 text-sm text-muted-foreground border-t bg-muted/5 rounded-b-xl">
        <div className="flex items-center gap-4">
          <p>
            Hiển thị <strong>{parents.length}</strong> / <strong>{totalItems}</strong> phụ huynh
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
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isLoading}
            className="bg-background h-8"
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
                    "h-8 w-8 text-xs font-medium",
                    currentPage === pageNum && "shadow-md shadow-primary/20"
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
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(lastPage, prev + 1))}
            disabled={currentPage === lastPage || isLoading}
            className="bg-background h-8"
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
        title="Xác nhận xóa phụ huynh"
        itemName={parentToDelete?.name}
      />

      {/* Parent Drawer */}
      <ParentDrawer
        mode={drawerMode}
        parent={selectedParent}
        onSuccess={(data?: Parent) => {
          if (data) {
            setParents(prev => prev.map(g => g.id == data.id ? { ...g, ...data } : g))
            setSelectedParent(prev => prev && prev.id == data.id ? { ...prev, ...data } : prev)
            setDrawerMode("view")
          } else {
            fetchParents()
          }
        }}
        onClose={() => {
          setDrawerMode(undefined)
          setSelectedParent(null)
        }}
      />
    </div>
  )
}
