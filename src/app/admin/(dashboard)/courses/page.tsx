"use client"

import { cn } from "@/lib/utils"
import { Course, useCourseStore } from "@/store/course-store"
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Edit,
  Eye,
  GraduationCap,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2
} from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { Can } from "@/components/auth/can"
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal"
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
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePermission } from "@/hooks/use-permission"
import api from "@/lib/axios"
import { useLayoutStore } from "@/store/layout-store"
import { Subject } from "@/store/subject-store"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const targetStudentConfig: Record<string | number, { label: string, color: string }> = {
  2: { label: "Tất cả", color: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
  0: { label: "Học sinh", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  1: { label: "Nhân viên", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapBackendStatusToCommonStatus = (backendStatus: any): 'draft' | 'published' | 'archived' => {
  switch (backendStatus) {
    case 0:
    case "0":
      return "draft"
    case 1:
    case "1":
      return "archived"
    case 2:
    case "2":
      return "published"
    default:
      return "draft"
  }
}

export default function CoursesPage() {
  const router = useRouter()
  const { hasPermission, isInitialized, isLoading: isPermissionLoading } = usePermission()
  const setHeaderContent = useLayoutStore((state) => state.setHeaderContent)

  // Kiểm tra quyền truy cập trang danh sách
  React.useEffect(() => {
    if (isInitialized && !isPermissionLoading && !hasPermission("course_list")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/admin")
    }
  }, [hasPermission, isInitialized, isPermissionLoading, router])

  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<string>("all")
  const [targetStudent, setTargetStudent] = React.useState<string>("all")
  const [subject, setSubject] = React.useState<string>("all")
  const [level, setLevel] = React.useState<string>("all")
  const [items, setItems] = React.useState<Course[]>([])

  // Pagination and Sorting State
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [sortBy, setSortBy] = React.useState("created_at")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
  const [totalItems, setTotalItems] = React.useState(0)
  const [lastPage, setLastPage] = React.useState(1)

  const [subjectsFilter, setSubjectsFilter] = React.useState<{ id: number | string, name: string }[]>([])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rawSubjects, setRawSubjects] = React.useState<any[]>([])

  const statusLabel: Record<string, string> = {
    "all": "Tất cả trạng thái",
    "0": "Bản nháp",
    "2": "Đã xuất bản",
    "1": "Lưu trữ",
  }

  const targetStudentLabel: Record<string, string> = {
    "all": "Tất cả đối tượng",
    "0": "Học sinh",
    "1": "Nhân viên",
    "2": "Cả hai",
  }

  const subjectMapper = React.useMemo(() => {
    return Object.fromEntries(
      subjectsFilter.map(item => [item.id, item.name])
    );
  }, [subjectsFilter]);

  const visibleLevels = React.useMemo(() => {
    if (subject === "all") return []
    const selectedSub = rawSubjects.find(s => String(s.id) === String(subject))
    if (!selectedSub || !Array.isArray(selectedSub.subject_levels)) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return selectedSub.subject_levels.map((l: any) => ({
      id: l.id,
      name: l.level
    }))
  }, [subject, rawSubjects])

  const levelMapper = React.useMemo(() => {
    return Object.fromEntries(
      visibleLevels.map((item: { id: number | string, name: string }) => [item.id, item.name])
    );
  }, [visibleLevels]);

  const [isLoading, setIsLoading] = React.useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [courseToDelete, setCourseToDelete] = React.useState<Course | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const { setEditingCourse } = useCourseStore()

  const fetchFilters = React.useCallback(async () => {
    try {
      const response = await api.get("/common/subjects")

      if (response.status === 200) {
        const subjectsData = response.data?.data || []
        setRawSubjects(subjectsData)
        setSubjectsFilter(subjectsData.map((s: Subject) => ({
          id: s.id,
          name: s.name
        })))
      }
    } catch (error) {
      console.error("Failed to fetch filters:", error)
    }
  }, [])

  React.useEffect(() => {
    fetchFilters()
  }, [fetchFilters])

  const fetchCourses = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      queryParams.append("page", currentPage.toString())
      queryParams.append("pagination", pageSize.toString())

      if (search) queryParams.append("name", search)
      if (status !== "all") queryParams.append("status", status)
      if (targetStudent !== "all") queryParams.append("target_student", targetStudent)
      if (subject !== "all") queryParams.append("subject", subject)
      if (level !== "all") queryParams.append("subject_level", level)

      // Map sorting to backend parameter names
      if (sortBy === "name") {
        queryParams.append("order_by_name", sortOrder)
      } else if (sortBy === "subject_name" || sortBy === "subject") {
        queryParams.append("order_by_subject", sortOrder)
      } else if (sortBy === "price") {
        queryParams.append("order_by_price", sortOrder)
      }

      const response = await api.get(`/admin/courses?${queryParams.toString()}`)
      const result = response.data
      if (response.status === 200) {
        const paginatedData = result.data
        if (paginatedData && typeof paginatedData === "object") {
          setItems(paginatedData.data || [])
          setTotalItems(paginatedData.total || 0)
          setLastPage(paginatedData.last_page || 1)
        } else {
          setItems([])
          setTotalItems(0)
          setLastPage(1)
        }
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error)
      setError("Không thể tải danh sách khóa học")
      toast.error("Không thể tải danh sách khóa học")
    } finally {
      setIsLoading(false)
    }
  }, [search, status, targetStudent, subject, level, currentPage, pageSize, sortBy, sortOrder])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses()
    }, 300)

    return () => clearTimeout(timer)
  }, [fetchCourses])

  const handleDelete = async () => {
    if (!courseToDelete) return
    setIsDeleting(true)
    try {
      const response = await api.delete(`/admin/courses/delete`, {
        params: { id: courseToDelete.id }
      })
      const result = response.data
      if (result.success) {
        toast.success(result.message || "Xóa khóa học thành công")
        // Update local state instead of re-fetching
        setItems(prev => prev.filter(item => item.id !== courseToDelete.id))
        setTotalItems(prev => Math.max(0, prev - 1))
      } else {
        toast.error(result.message || "Xóa thất bại")
      }
    } catch (error) {
      toast.error("Đã có lỗi xảy ra khi xóa khóa học")
      console.error("Delete error:", error)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setCourseToDelete(null)
    }
  }

  const resetFilters = () => {
    setSearch("")
    setStatus("all")
    setTargetStudent("all")
    setSubject("all")
    setLevel("all")
    setCurrentPage(1)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
    setCurrentPage(1)
  }

  const pageHeader = React.useMemo(() => (
    <div className="flex flex-1 items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
      <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
        Quản lý khóa học
      </h2>
      <Can permission="course_create">
        <Link href="/courses/create">
          <Button className="h-10 px-6 bg-primary hover:bg-primary/90 transition-all active:scale-95 whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" />
            <span className="text-sm font-bold">Thêm khóa học</span>
          </Button>
        </Link>
      </Can>
    </div>
  ), []);

  React.useEffect(() => {
    setHeaderContent(pageHeader)
    return () => setHeaderContent(null)
  }, [setHeaderContent, pageHeader])

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
    return sortOrder === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4 text-primary" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4 text-primary" />
    )
  }

  return (
    <div className="flex flex-col gap-6 p-1">

      {/* Filter Section */}
      <Card className="border-none shadow-sm bg-muted/30 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row flex-wrap items-center justify-end gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên khóa học..."
                className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={statusLabel[status]}
              onValueChange={(val) => {
                const key = Object.keys(statusLabel).find(k => statusLabel[k] === val);
                setStatus(key || "all");
              }}
            >
              <SelectTrigger className="bg-background border-muted-foreground/20">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Settings2 className="h-4 w-4" />
                  <SelectValue placeholder="Trạng thái" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tất cả trạng thái">Tất cả trạng thái</SelectItem>
                <SelectItem value="Bản nháp">Bản nháp</SelectItem>
                <SelectItem value="Đã xuất bản">Đã xuất bản</SelectItem>
                <SelectItem value="Lưu trữ">Lưu trữ</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={targetStudentLabel[targetStudent]}
              onValueChange={(val) => {
                const key = Object.keys(targetStudentLabel).find(k => targetStudentLabel[k] === val);
                setTargetStudent(key || "all");
              }}
            >
              <SelectTrigger className="bg-background border-muted-foreground/20">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <SelectValue placeholder="Đối tượng" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tất cả đối tượng">Tất cả đối tượng</SelectItem>
                <SelectItem value="Học sinh">Học sinh</SelectItem>
                <SelectItem value="Nhân viên">Nhân viên</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={subject == "all" ? "Tất cả môn học" : subjectMapper[subject]}
              onValueChange={(val) => {
                if (val === "Tất cả môn học") {
                  setSubject("all");
                  setLevel("all");
                } else {
                  const id = Object.keys(subjectMapper).find(key => subjectMapper[key] === val);
                  setSubject(id || "all");
                  setLevel("all");
                }
              }}
            >
              <SelectTrigger className="bg-background border-muted-foreground/20">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <SelectValue placeholder="Môn học" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tất cả môn học">Tất cả môn học</SelectItem>
                {subjectsFilter.map((s) => (
                  <SelectItem key={String(s.id)} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              disabled={subject === "all"}
              value={level == "all" ? "Tất cả trình độ" : levelMapper[level]}
              onValueChange={(val) => {
                if (val === "Tất cả trình độ") {
                  setLevel("all");
                } else {
                  const id = Object.keys(levelMapper).find(key => levelMapper[key] === val);
                  setLevel(id || "all");
                }
              }}
            >
              <SelectTrigger className="bg-background border-muted-foreground/20 disabled:opacity-50 transition-opacity">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Layers className="h-4 w-4" />
                  <SelectValue placeholder={subject === "all" ? "Chọn môn học trước" : "Trình độ"} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tất cả trình độ">Tất cả trình độ</SelectItem>
                {visibleLevels.map((l: { id: number | string, name: string }) => (
                  <SelectItem key={String(l.id)} value={l.name}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1"></div>
            <Button
              variant="outline"
              className="w-full md:w-fit bg-background hover:bg-muted transition-colors border-dashed"
              onClick={resetFilters}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <div className="rounded-xl border bg-background shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead
                  className="font-semibold py-4 cursor-pointer hover:bg-muted/50 transition-colors text-center"
                  onClick={() => handleSort("id")}
                >
                  <div className="flex items-center justify-center">
                    ID
                    <SortIcon field="id" />
                  </div>
                </TableHead>
                <TableHead
                  className="font-semibold py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Tên khóa học
                    <SortIcon field="name" />
                  </div>
                </TableHead>
                <TableHead
                  className="font-semibold py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("subject_name")}
                >
                  <div className="flex items-center">
                    Môn học
                    <SortIcon field="subject_name" />
                  </div>
                </TableHead>
                <TableHead
                  className="font-semibold py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("subject_level")}
                >
                  <div className="flex items-center">
                    Trình độ
                    <SortIcon field="subject_level" />
                  </div>
                </TableHead>
                <TableHead
                  className="font-semibold py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("target_student")}
                >
                  <div className="flex items-center">
                    Đối tượng
                    <SortIcon field="target_student" />
                  </div>
                </TableHead>
                <TableHead
                  className="font-semibold py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Trạng thái
                    <SortIcon field="status" />
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold py-4">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={cn(isLoading && items.length > 0 && "opacity-50 transition-opacity duration-300")}>
              {isLoading && items.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-center">
                      <Skeleton className="h-4 w-12 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-md" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-8 w-32 mx-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 text-destructive">
                      <RefreshCw className="h-12 w-12 opacity-50" />
                      <p className="font-medium">{error}</p>
                      <Button variant="outline" size="sm" onClick={fetchCourses}>Thử lại</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <BookOpen className="h-12 w-12 opacity-20" />
                      <div className="space-y-1">
                        <p className="text-lg font-medium">Không tìm thấy khóa học nào</p>
                        <p className="text-sm">Hãy thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc của bạn.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/40 transition-colors">
                    <TableCell className="py-4 text-center">
                      <span className="text-sm font-mono text-muted-foreground">{item.id}</span>
                    </TableCell>
                    <TableCell className="font-medium text-foreground/90 py-4 max-w-[300px]">
                      <span className="truncate font-semibold">{item.name}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm">{item.subject_name || "N/A"}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm">{item.subject_level || "N/A"}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        variant="outline"
                        className={`shadow-none font-medium ${
                          item.target_student === 0 ? targetStudentConfig[0].color :
                          item.target_student === 1 ? targetStudentConfig[1].color :
                          targetStudentConfig[2].color
                        }`}
                      >
                        {
                          item.target_student === 0 ? targetStudentConfig[0].label :
                          item.target_student === 1 ? targetStudentConfig[1].label :
                          targetStudentConfig[2].label
                        }
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <StatusBadge status={mapBackendStatusToCommonStatus(item.status)} className="shadow-none rounded-md" />
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="flex justify-center gap-1">
                        <Can permission="course_detail">
                          <Link href={`/courses/${item.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </Can>
                        <Can permission="course_edit">
                          <Link
                            href={`/courses/${item.id}/edit`}
                            onClick={() => setEditingCourse(item)}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-amber-600 transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </Can>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                            title="Xóa"
                            onClick={() => {
                              setCourseToDelete(item)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmDeleteModal
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Xác nhận xóa khóa học"
        itemName={courseToDelete?.name}
      />

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 gap-4 text-sm text-muted-foreground border-t bg-muted/10">
        <div className="flex items-center gap-4">
          <p>
            Hiển thị <strong>{items.length}</strong> / <strong>{totalItems}</strong> khóa học
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
    </div>
  )
}
