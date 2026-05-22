"use client"


import { usePermission } from "@/hooks/use-permission"
import { Level } from "@/store/level-store"
import { Layers, Library, Plus, RefreshCw, Search, Settings2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { LevelFormDrawer } from "./_components/LevelFormDrawer"

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

const statusConfig: Record<number | string, { label: string, color: string }> = {
  0: { label: "Bản nháp", color: "bg-slate-500/10 text-slate-600 border-slate-200" },
  2: { label: "Đã xuất bản", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  1: { label: "Lưu trữ", color: "bg-rose-500/10 text-rose-600 border-rose-200" },
}

const statusLabels: Record<string, string> = {
  all: "Tất cả trạng thái",
  "0": "Bản nháp",
  "2": "Đã xuất bản",
  "1": "Lưu trữ",
}

export default function LevelsPage() {
  const router = useRouter()
  const { hasPermission } = usePermission()
  const setHeaderContent = useLayoutStore((state) => state.setHeaderContent)

  // Kiểm tra quyền truy cập trang danh sách
  React.useEffect(() => {
    if (!hasPermission("level_list")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/admin")
    }
  }, [hasPermission, router])

  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<string>("all")
  const [items, setItems] = React.useState<Level[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [paginationInfo, setPaginationInfo] = React.useState<{ total: number; last_page: number } | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [levelToDelete, setLevelToDelete] = React.useState<Level | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [drawerMode, setDrawerMode] = React.useState<"create" | "edit" | undefined>(undefined)
  const [selectedLevel, setSelectedLevel] = React.useState<Level | null>(null)
  const [subjects, setSubjects] = React.useState<{ id: number; name: string }[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string>("all")


  const fetchSubjects = React.useCallback(async () => {
    try {
      const response = await api.get("/admin/subjects")
      if (response.status === 200) {
        setSubjects(response.data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error)
    }
  }, [])

  React.useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  const fetchLevels = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params: Record<string, string> = {}
      if (status !== "all") params.status = status
      if (selectedSubjectId !== "all") params.subject_id = selectedSubjectId

      const response = await api.get("/admin/subject-levels", { params })
      const result = response.data
      if (response.status === 200) {
        setItems(result.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch levels:", error)
      toast.error("Không thể tải danh sách trình độ")
    } finally {
      setIsLoading(false)
    }
  }, [status, selectedSubjectId])

  React.useEffect(() => {
    fetchLevels()
  }, [fetchLevels])

  const filteredItems = React.useMemo(() => {
    if (!search) return items
    const s = search.toLowerCase()
    return items.filter(item => 
      item.level.toLowerCase().includes(s) || 
      item.subject_name?.toLowerCase().includes(s)
    )
  }, [items, search])

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
    setCurrentPage(1)
  }, [search, status, selectedSubjectId])

  const pageHeader = React.useMemo(() => (
    <div className="flex flex-1 items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
      <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
        Quản lý trình độ
      </h2>
      <Button
        className="h-10 px-6 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all active:scale-95 whitespace-nowrap"
        onClick={() => {
          setSelectedLevel(null)
          setDrawerMode("create")
        }}
      >
        <Plus className="mr-2 h-4 w-4" />
        <span className="text-sm font-bold">Thêm trình độ</span>
      </Button>
    </div>
  ), []);

  React.useEffect(() => {
    setHeaderContent(pageHeader)
    return () => setHeaderContent(null)
  }, [setHeaderContent, pageHeader])

  const handleDelete = async () => {
    if (!levelToDelete) return
    setIsDeleting(true)
    try {
      const response = await api.delete(`/admin/subject-levels/delete`, {
        data: { id: levelToDelete.id }
      })
      const result = response.data
      if (response.status === 200) {
        toast.success(result.message || "Xóa trình độ thành công")
        fetchLevels()
      } else {
        toast.error(result.message || "Xóa thất bại")
      }
    } catch (error) {
      toast.error("Đã có lỗi xảy ra khi xóa trình độ")
      console.error("Delete error:", error)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setLevelToDelete(null)
    }
  }

  const resetFilters = () => {
    setSearch("")
    setStatus("all")
    setSelectedSubjectId("all")
  }

  if (!hasPermission("level_list")) return null

  return (
    <div className="flex flex-col gap-6 p-1 animate-in fade-in duration-500">
      {/* Filter Section */}
      <Card className="border-none shadow-sm bg-muted/30 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row flex-wrap items-center justify-start gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên trình độ..."
                className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="w-full md:w-48">
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
            </div>
            <div className="w-full md:w-56">
              <Select
                value={selectedSubjectId === "all" ? "Tất cả môn học" : subjects.find(s => s.id.toString() === selectedSubjectId)?.name || "Tất cả môn học"}
                onValueChange={(val) => {
                  if (val === "Tất cả môn học") {
                    setSelectedSubjectId("all")
                  } else {
                    const subject = subjects.find(s => s.name === val)
                    if (subject) setSelectedSubjectId(subject.id.toString())
                  }
                }}
              >
                <SelectTrigger className="bg-background border-muted-foreground/20 text-foreground">
                  <div className="flex items-center gap-2">
                    <Library className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Môn học" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tất cả môn học">Tất cả môn học</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.name}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


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
                <TableHead className="font-semibold py-4 pl-6">Trình độ</TableHead>
                <TableHead className="font-semibold py-4">Môn học</TableHead>
                <TableHead className="font-semibold py-4">Trạng thái</TableHead>
                <TableHead className="text-center font-semibold py-4">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="py-4 pl-6">
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex justify-center">
                        <Skeleton className="h-8 w-20 rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Layers className="h-8 w-8 opacity-20" />
                      <p>Không tìm thấy trình độ nào phù hợp.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item: Level) => (
                  <TableRow key={item.id} className="group hover:bg-primary/[0.02] transition-colors">
                    <TableCell className="font-medium text-foreground/90 py-4 pl-6">
                      {item.level}
                    </TableCell>
                    <TableCell className="py-4 text-muted-foreground">
                      {item.subject_name}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        variant="outline"
                        className={`shadow-none font-medium px-3 py-1 rounded-full ${statusConfig[item.status]?.color || ""}`}
                      >
                        {statusConfig[item.status]?.label || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-amber-600 transition-colors rounded-xl"
                          title="Chỉnh sửa"
                          onClick={() => {
                            setSelectedLevel(item)
                            setDrawerMode("edit")
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors rounded-xl"
                          title="Xóa"
                          onClick={() => {
                            setLevelToDelete(item)
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa trình độ</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa trình độ <strong>{levelToDelete?.level}</strong>?
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
          Hiển thị <strong>{items.length}</strong> / <strong>{paginationInfo?.total || 0}</strong> trình độ
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

      <LevelFormDrawer
        mode={drawerMode}
        level={selectedLevel}
        onSuccess={fetchLevels}
        onClose={() => {
          setDrawerMode(undefined)
          setSelectedLevel(null)
        }}
        trigger={null}
      />
    </div>
  )
}
