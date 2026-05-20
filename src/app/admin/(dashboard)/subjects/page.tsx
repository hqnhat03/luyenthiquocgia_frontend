"use client"

import { Can } from "@/components/auth/can"
import { usePermission } from "@/hooks/use-permission"
import {
  BookOpen,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  Users
} from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { SubjectFormDrawer } from "./_components/SubjectFormDrawer"


import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import api from "@/lib/axios"
import { useLayoutStore } from "@/store/layout-store"
import { toast } from "sonner"

import { type Subject } from "@/store/subject-store"



const statusConfig = {
  draft: { label: "Bản nháp", color: "bg-slate-500/10 text-slate-600 border-slate-200" },
  published: { label: "Đã xuất bản", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  archived: { label: "Lưu trữ", color: "bg-rose-500/10 text-rose-600 border-rose-200" },
}

const targetStudentLabels: Record<number, string> = {
  0: "Học sinh",
  1: "Nhân viên",
  2: "Cả hai",
}

const statusLabels: Record<string, string> = {
  all: "Tất cả trạng thái",
  draft: "Bản nháp",
  published: "Đã xuất bản",
  archived: "Lưu trữ",
}

const statusMap: Record<string, number> = {
  draft: 0,
  archived: 1,
  published: 2,
}

const statusReverseMap: Record<number, "draft" | "published" | "archived"> = {
  0: "draft",
  1: "archived",
  2: "published",
}

const targetStudentFilterLabels: Record<string, string> = {
  all: "Tất cả đối tượng",
  0: "Học sinh",
  1: "Nhân viên",
  2: "Cả hai",
}

export default function SubjectsPage() {
  const router = useRouter()
  const { hasPermission } = usePermission()
  const setHeaderContent = useLayoutStore((state) => state.setHeaderContent)

  // Kiểm tra quyền truy cập trang danh sách
  React.useEffect(() => {
    if (!hasPermission("subject_list")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/admin")
    }
  }, [hasPermission, router])

  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<string>("all")
  const [targetStudentFilter, setTargetStudentFilter] = React.useState<string>("all")
  const [items, setItems] = React.useState<Subject[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [paginationInfo, setPaginationInfo] = React.useState<{ total: number; last_page: number } | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [subjectToDelete, setSubjectToDelete] = React.useState<Subject | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [drawerMode, setDrawerMode] = React.useState<"create" | "edit" | undefined>(undefined)
  const [selectedSubject, setSelectedSubject] = React.useState<Subject | null>(null)

  const fetchSubjects = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params: any = {}
      if (status !== "all") {
        params.status = statusMap[status]
      }

      const response = await api.get(`/admin/subjects`, { params })
      const result = response.data
      if (response.status === 200) {
        const rawData = result.data || []
        const subjectsArray = Array.isArray(rawData) ? rawData : (rawData.data || [])
        
        const mappedItems = subjectsArray.map((item: any) => ({
          ...item,
          status: statusReverseMap[item.status as number] || "draft"
        }))
        setItems(mappedItems)
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error)
    } finally {
      setIsLoading(false)
    }
  }, [status])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [search, status])

  const filteredItems = React.useMemo(() => {
    return items.filter(item => {
      const matchName = item.name.toLowerCase().includes(search.toLowerCase())
      const matchTargetStudent = targetStudentFilter === "all" || item.target_student.toString() === targetStudentFilter
      return matchName && matchTargetStudent
    })
  }, [items, search, targetStudentFilter])

  const paginatedItems = React.useMemo(() => {
    const start = (currentPage - 1) * 10
    return filteredItems.slice(start, start + 10)
  }, [filteredItems, currentPage])

  React.useEffect(() => {
    setPaginationInfo({
      total: filteredItems.length,
      last_page: Math.ceil(filteredItems.length / 10) || 1
    })
  }, [filteredItems])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubjects()
    }, 300)

    return () => clearTimeout(timer)
  }, [fetchSubjects])

  const pageHeader = React.useMemo(() => (
    <div className="flex flex-1 items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
      <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
        Quản lý môn học
      </h2>
      <Can permission="subject_create">
        <Button
          className="h-10 px-6 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all active:scale-95 whitespace-nowrap"
          onClick={() => {
            setSelectedSubject(null)
            setDrawerMode("create")
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="text-sm font-bold">Thêm môn học</span>
        </Button>
      </Can>
    </div>
  ), []);

  React.useEffect(() => {
    setHeaderContent(pageHeader)
    return () => setHeaderContent(null)
  }, [setHeaderContent, pageHeader])

  const handleDelete = async () => {
    if (!subjectToDelete) return
    setIsDeleting(true)
    try {
      const response = await api.delete(`/admin/subjects/delete?id=${subjectToDelete.id}`)
      const result = response.data
      if (result.success) {
        toast.success(result.message || "Xóa môn học thành công")
        fetchSubjects()
      } else {
        toast.error(result.message || "Xóa thất bại")
      }
    } catch (error) {
      toast.error("Đã có lỗi xảy ra khi xóa môn học")
      console.error("Delete error:", error)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setSubjectToDelete(null)
    }
  }

  const resetFilters = () => {
    setSearch("")
    setStatus("all")
    setTargetStudentFilter("all")
  }

  if (!hasPermission("subject_list")) return null

  return (
    <div className="flex flex-col gap-6 p-1 animate-in fade-in duration-500">
      {/* Filter Section */}
      <Card className="border-none shadow-sm bg-muted/30 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row flex-wrap items-center justify-start gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên môn học..."
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
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
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
              value={targetStudentFilterLabels[targetStudentFilter]}
              onValueChange={(val) => {
                const key = Object.keys(targetStudentFilterLabels).find(k => targetStudentFilterLabels[k] === val);
                setTargetStudentFilter(key || "all");
              }}
            >
              <SelectTrigger className="bg-background border-muted-foreground/20 w-[180px]">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Đối tượng" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {Object.values(targetStudentFilterLabels).map((label) => (
                  <SelectItem key={label} value={label}>
                    {label}
                  </SelectItem>
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
      <div className="rounded-xl border bg-background/50 backdrop-blur-sm shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold py-4 pl-8">Tên môn học</TableHead>
                <TableHead className="font-semibold py-4">Danh mục</TableHead>
                <TableHead className="font-semibold py-4">Đối tượng học sinh</TableHead>
                <TableHead className="font-semibold py-4">Cấp độ học vấn</TableHead>
                <TableHead className="font-semibold py-4">Trạng thái</TableHead>
                <TableHead className="text-center font-semibold py-4">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-8 py-4">
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-md" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-8 w-24 mx-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <BookOpen className="h-8 w-8 opacity-20" />
                      <p>Không tìm thấy môn học nào phù hợp.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item: Subject) => (
                  <TableRow key={item.id} className="group hover:bg-primary/[0.02] transition-colors">
                    <TableCell className="font-medium text-foreground/90 py-4 pl-8">
                      {item.name}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="font-normal bg-muted/50 rounded-full">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm text-muted-foreground">
                        {targetStudentLabels[item.target_student] || "---"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm text-muted-foreground">
                        {item.education_level || "---"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        variant="outline"
                        className={`shadow-none font-medium px-3 py-1 rounded-full ${statusConfig[item.status].color}`}
                      >
                        {statusConfig[item.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Can permission="subject_edit">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors rounded-xl"
                            title="Chỉnh sửa"
                            onClick={() => {
                              setSelectedSubject(item)
                              setDrawerMode("edit")
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </Button>
                        </Can>
                        <Can permission="subject_delete">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors rounded-xl"
                            title="Xóa"
                            onClick={() => {
                              setSubjectToDelete(item)
                              setIsDeleteDialogOpen(true)
                            }}
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa môn học</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa môn học <strong>{subjectToDelete?.name}</strong>?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className="bg-destructive text-white hover:bg-destructive/90 rounded-xl"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xác nhận xóa"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-2 text-sm text-muted-foreground mt-4">
        <p>
          Hiển thị <strong>{items.length}</strong> / <strong>{paginationInfo?.total || 0}</strong> môn học
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="h-8"
          >
            Trước
          </Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold shadow-sm">
            {currentPage}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(paginationInfo?.last_page || 1, prev + 1))}
            disabled={!paginationInfo || currentPage === paginationInfo.last_page}
            className="h-8"
          >
            Sau
          </Button>
        </div>
      </div>

      <SubjectFormDrawer
        mode={drawerMode}
        subject={selectedSubject}
        onSuccess={fetchSubjects}
        onClose={() => {
          setDrawerMode(undefined)
          setSelectedSubject(null)
        }}
        trigger={null}
      />
    </div>
  )
}
