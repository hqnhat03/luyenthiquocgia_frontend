"use client"

import { Can } from "@/components/auth/can"
import { usePermission } from "@/hooks/use-permission"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"
import { useLayoutStore } from "@/store/layout-store"
import { Student, mapBackendStudentToFrontend } from "@/types/StudentType"
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
  Users
} from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"
import { StudentDrawer } from "./_components/StudentDrawer"

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


export default function StudentsPage() {
  const router = useRouter()
  const { hasPermission, isInitialized, isLoading: isPermissionLoading } = usePermission()
  const setHeaderContent = useLayoutStore((state) => state.setHeaderContent)

  React.useEffect(() => {
    if (isInitialized && !isPermissionLoading && !hasPermission("student_list")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/admin")
    }
  }, [hasPermission, isInitialized, isPermissionLoading, router])


  // State for filtering
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<string>("all")
  const [studentType, setStudentType] = React.useState<string>("all")
  const [sortBy, setSortBy] = React.useState<string>("created_at")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")

  // State for data
  const [students, setStudents] = React.useState<Student[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [totalItems, setTotalItems] = React.useState(0)
  const [lastPage, setLastPage] = React.useState(1)

  // Debounced search term
  const debouncedSearch = useDebounce(search, 300)

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [studentToDelete, setStudentToDelete] = React.useState<Student | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Drawer state
  const [drawerMode, setDrawerMode] = React.useState<"create" | "edit" | "view" | undefined>(undefined)
  const [selectedStudentId, setSelectedStudentId] = React.useState<string | number | null>(null)

  const studentTypeLabels: Record<string, string> = {
    "all": "Tất cả loại",
    "student": "Học sinh",
    "employee": "Nhân viên",
  }
  const statusLabels: Record<string, string> = {
    "all": "Tất cả trạng thái",
    "active": "Đang hoạt động",
    "inactive": "Bị khóa",
  }

  const fetchStudents = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()

      params.append("page", currentPage.toString())
      params.append("pagination", pageSize.toString())
      if (debouncedSearch) params.append("name", debouncedSearch)
      if (status !== "all") {
        params.append("status", status === "active" ? "1" : "0")
      }
      if (studentType !== "all") {
        params.append("type", studentType === "employee" ? "2" : "1")
      }
      if (sortBy === "name") {
        params.append("order_by_name", sortOrder)
      }

      const response = await api.get(`/admin/students?${params.toString()}`)
      const result = response.data

      let paginatedData: any[] = []
      let total = 0
      let lastPageVal = 1
      let parsedSuccessfully = false

      if (result && typeof result === "object") {
        const isSuccess = result.status === "success" || result.success === true;
        if (isSuccess) {
          const innerData = result.data
          if (innerData && typeof innerData === "object" && Array.isArray(innerData.data)) {
            paginatedData = innerData.data
            total = innerData.total || 0
            lastPageVal = innerData.last_page || 1
            parsedSuccessfully = true
          } else if (Array.isArray(innerData)) {
            paginatedData = innerData
            total = result.meta?.total || result.total || innerData.length || 0
            lastPageVal = result.meta?.last_page || result.last_page || 1
            parsedSuccessfully = true
          }
        } else {
          if (Array.isArray(result.data)) {
            paginatedData = result.data
            total = result.total || 0
            lastPageVal = result.last_page || 1
            parsedSuccessfully = true
          } else if (Array.isArray(result)) {
            paginatedData = result
            total = result.length
            lastPageVal = 1
            parsedSuccessfully = true
          }
        }
      }

      if (parsedSuccessfully) {
        const mappedStudents = paginatedData.map((item: any) => mapBackendStudentToFrontend(item))
        setStudents(mappedStudents)
        setTotalItems(total)
        setLastPage(lastPageVal)
      } else {
        throw new Error(result?.message || "Lỗi khi lấy dữ liệu")
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra")
      toast.error(err instanceof Error ? err.message : "Đã có lỗi khi tải dữ liệu")
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, status, studentType, currentPage, pageSize, sortBy, sortOrder])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
    setCurrentPage(1)
  }

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
    return sortOrder === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4 text-primary" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4 text-primary" />
    )
  }

  const pageHeader = React.useMemo(() => (
    <div className="flex flex-1 items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
      <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
        Quản lý học sinh
      </h2>
      <Can permission="student_create">
        <Button
          className="h-10 px-6 bg-primary hover:bg-primary/90 transition-all active:scale-95 whitespace-nowrap shadow-md shadow-primary/20"
          onClick={() => {
            setSelectedStudentId(null)
            setDrawerMode("create")
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="text-sm font-bold">Thêm học sinh</span>
        </Button>
      </Can>
    </div>
  ), []);

  React.useEffect(() => {
    setHeaderContent(pageHeader)
    return () => setHeaderContent(null)
  }, [setHeaderContent, pageHeader])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, status, studentType])

  React.useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return

    setIsDeleting(true)
    try {
      const response = await api.delete(`/admin/students/delete`, {
        params: { id: studentToDelete.id }
      })
      const result = response.data

      if (result.success) {
        toast.success(result.message || "Xóa học sinh thành công")
        // Xóa khỏi danh sách local
        setStudents(prev => prev.filter(s => s.id !== studentToDelete.id))
        setTotalItems(prev => Math.max(0, prev - 1))
      } else {
        throw new Error(result.message || "Không thể xóa học sinh")
      }
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi xóa")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setStudentToDelete(null)
    }
  }

  const resetFilters = () => {
    setSearch("")
    setStatus("all")
    setStudentType("all")
  }

  if (!hasPermission("student_list")) return null

  return (
    <div className="flex flex-col gap-6 p-1">

      {/* Filter Section */}
      <Card className="border-none shadow-sm bg-muted/40 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row flex-wrap items-center justify-end gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tên học sinh"
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
            <Select
              value={studentTypeLabels[studentType]}
              onValueChange={(val) => {
                const key = Object.keys(studentTypeLabels).find(k => studentTypeLabels[k] === val);
                setStudentType(key || "all");
              }}
            >
              <SelectTrigger className="bg-background border-muted-foreground/20">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Loại học sinh" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tất cả loại">Tất cả loại</SelectItem>
                <SelectItem value="Học sinh">Học sinh</SelectItem>
                <SelectItem value="Nhân viên">Nhân viên</SelectItem>
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
                className="w-[80px] font-semibold cursor-pointer hover:text-primary transition-colors text-center"
                onClick={() => handleSort("id")}
              >
                <div className="flex items-center justify-center">
                  ID {getSortIcon("id")}
                </div>
              </TableHead>
              <TableHead className="w-[120px] font-semibold">Ảnh đại diện</TableHead>
              <TableHead
                className="font-semibold cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Họ tên {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead
                className="font-semibold cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort("student_type")}
              >
                <div className="flex items-center">
                  Loại {getSortIcon("student_type")}
                </div>
              </TableHead>
              <TableHead
                className="font-semibold cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort("email")}
              >
                <div className="flex items-center">
                  Email {getSortIcon("email")}
                </div>
              </TableHead>
              <TableHead
                className="font-semibold cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort("phone")}
              >
                <div className="flex items-center">
                  Số điện thoại {getSortIcon("phone")}
                </div>
              </TableHead>
              <TableHead
                className="font-semibold cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Trạng thái {getSortIcon("status")}
                </div>
              </TableHead>
              <TableHead className="text-center font-semibold">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={cn(isLoading && students.length > 0 && "opacity-50 transition-opacity duration-300")}>
            {isLoading && students.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="text-center"><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
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
                    <Button variant="outline" size="sm" onClick={fetchStudents}>Thử lại</Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  Không tìm thấy học sinh nào phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id} className="group hover:bg-muted/40 transition-colors">
                  <TableCell className="text-center">
                    <div className="text-sm font-medium text-muted-foreground">#{student.id}</div>
                  </TableCell>
                  <TableCell>
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm ring-1 ring-muted">
                      <AvatarImage src={student.avatar ? (student.avatar.startsWith('http') || student.avatar.startsWith('data:') ? student.avatar : `${process.env.NEXT_PUBLIC_API_IMAGE_URL}${student.avatar}`) : undefined} alt={student.name} />
                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                        {student.name?.split(" ").pop()?.substring(0, 2).toUpperCase() || "HS"}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground/90">{student.name}</TableCell>
                  <TableCell>
                    <Badge variant={student.student_type === "employee" ? "secondary" : "outline"} className="capitalize">
                      {student.student_type === "student" ? "Học sinh" : "Nhân viên"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{student.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{student.phone}</TableCell>
                  <TableCell >
                    {student.status === "active" ? (
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
                      <Can permission="student_detail">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                          title="Chi tiết"
                          onClick={() => {
                            setSelectedStudentId(student.id)
                            setDrawerMode("view")
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Can>
                      <Can permission="student_edit">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-amber-600 transition-colors"
                          title="Chỉnh sửa"
                          onClick={() => {
                            setSelectedStudentId(student.id)
                            setDrawerMode("edit")
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Can>
                      <Can permission="student_delete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                          title="Xóa"
                          onClick={() => handleDeleteClick(student)}
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
            Hiển thị <strong>{students.length}</strong> / <strong>{totalItems}</strong> học sinh
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
        title="Xác nhận xóa học sinh"
        itemName={studentToDelete?.name}
      />

      {/* Student Drawer */}
      <StudentDrawer
        mode={drawerMode}
        studentId={selectedStudentId}
        onClose={() => {
          setDrawerMode(undefined)
          setSelectedStudentId(null)
        }}
        onSuccess={(data?: Student) => {
          if (data) {
            setStudents(prev => prev.map(s => s.id == data.id ? { ...s, ...data } : s))
            setDrawerMode("view")
          } else {
            fetchStudents()
          }
        }}
      />
    </div>
  )
}
