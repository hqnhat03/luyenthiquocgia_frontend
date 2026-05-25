"use client"

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit,
  Eye,
  Plus,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

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

interface AttendanceData {
  class_id: number
  class_session: number
  date: string
  attendance_count: string
  class_name: string
  max_student: number
}

export default function ClassAttendancePage() {
  const params = useParams()
  const classId = params.id

  const [attendances, setAttendances] = React.useState<AttendanceData[]>([])
  const [loading, setLoading] = React.useState(true)

  // Pagination states
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(5)
  const [totalItems, setTotalItems] = React.useState(0)
  
  const [className, setClassName] = React.useState<string>("")
  const [deleteId, setDeleteId] = React.useState<number | null>(null)

  const fetchAttendances = React.useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const response = await api.get(`/teacher/classes/attendance`, {
        params: {
          class_id: classId,
          page: page,
          pagination: pageSize,
        }
      })
      if (response.data?.status === 'success') {
        const paginatedData = response.data.data;
        if (paginatedData) {
          setAttendances(paginatedData.data || [])
          setCurrentPage(paginatedData.current_page || page)
          setTotalPages(paginatedData.last_page || 1)
          setTotalItems(paginatedData.total || 0)
          
          if (paginatedData.data && paginatedData.data.length > 0) {
             setClassName(paginatedData.data[0].class_name)
          }
        } else {
          setAttendances([])
        }
      } else {
        setAttendances([])
      }
    } catch (error) {
      console.error("Failed to fetch attendances:", error)
      setAttendances([])
    } finally {
      setLoading(false)
    }
  }, [classId, pageSize])

  React.useEffect(() => {
    if (classId) {
      fetchAttendances(1)
    }
  }, [fetchAttendances, classId])

  const handleDelete = async () => {
    if (deleteId === null) return

    try {
      const response = await api.delete(`/teacher/classes/attendance/${deleteId}`, {
        params: {
          class_id: classId
        }
      })
      if (response.data?.status === 'success') {
        toast.success(response.data.message || "Xóa điểm danh thành công")
        fetchAttendances(currentPage)
      } else {
        toast.error(response.data?.message || "Không thể xóa điểm danh")
      }
    } catch (error: any) {
      console.error("Delete attendance error:", error)
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi khi xóa")
    } finally {
      setDeleteId(null)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <span>Quản lý lớp học</span>
          <ChevronRight className="size-4 opacity-50" />
          <span className="text-primary font-semibold">{className || classId}</span>
          <ChevronRight className="size-4 opacity-50" />
          <span>Điểm danh</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-4">
              Lịch sử điểm danh
              {!loading && (
                <Badge variant="secondary" className="font-bold rounded-lg text-sm bg-primary/10 text-primary border-none self-center">
                  {totalItems} buổi
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground font-medium">
              Theo dõi và quản lý điểm danh các buổi học của lớp.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          <Skeleton className="h-64 rounded-lg w-full" />
        </div>
      ) : attendances.length === 0 ? (
        <div className="bg-background/60 backdrop-blur-xl border border-border/40 rounded-xl p-16 flex flex-col items-center justify-center min-h-[500px] text-center space-y-6 shadow-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
            <div className="relative p-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/10 shadow-inner">
              <Calendar className="size-16" />
            </div>
          </div>
          <div className="space-y-2 max-w-sm">
            <h3 className="text-2xl font-black tracking-tight">Chưa có dữ liệu điểm danh</h3>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Lớp học này hiện tại chưa có buổi học nào được điểm danh.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-border/40 rounded-lg p-3 flex justify-end shadow-sm">
            <Link href={`/teacher/classes/${classId}/attendance/create`}>
              <Button className="bg-[#2563eb] hover:bg-blue-700 text-white gap-2 font-medium h-10 px-5 rounded-md">
                <Plus className="size-4" />
                Thêm mới
              </Button>
            </Link>
          </div>
          <div className="bg-white border border-border/40 rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-[#f8fafc]">
              <TableRow className="hover:bg-transparent border-b-border/40 h-12">
                <TableHead className="w-[120px] text-center font-medium text-muted-foreground">
                  <div className="flex items-center justify-center gap-1">
                    Buổi
                    <ChevronUp className="size-3.5" />
                  </div>
                </TableHead>
                <TableHead className="text-center font-medium text-muted-foreground">Ngày</TableHead>
                <TableHead className="text-center font-medium text-muted-foreground">Số lượng học sinh</TableHead>
                <TableHead className="w-[100px] text-center font-medium text-muted-foreground">Tùy chỉnh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendances.map((attendance) => (
                <TableRow key={attendance.class_session} className="hover:bg-muted/30 border-b-border/40 transition-colors h-14">
                  <TableCell className="text-center font-medium">
                    {attendance.class_session}
                  </TableCell>
                  <TableCell className="text-center">
                    {attendance.date}
                  </TableCell>
                  <TableCell className="text-center">
                    {attendance.attendance_count}/{attendance.max_student}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 hover:bg-blue-500/10 hover:text-blue-600 transition-colors"
                        title="Xem chi tiết"
                      >
                        <Link href={`/teacher/classes/${classId}/attendance/${attendance.class_session}`}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 hover:bg-amber-500/10 hover:text-amber-600 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Link href={`/teacher/classes/${classId}/attendance/${attendance.class_session}/edit`}>
                          <Edit className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Xóa"
                        onClick={() => setDeleteId(attendance.class_session)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination UI */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border/40 bg-white">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fetchAttendances(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="size-8"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "ghost"}
                    size="icon"
                    onClick={() => fetchAttendances(page)}
                    disabled={loading}
                    className={`size-8 rounded ${page === currentPage ? "bg-[#2563eb] hover:bg-blue-700 text-white" : ""}`}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fetchAttendances(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="size-8"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                    }}
                    className="flex h-8 rounded border-none bg-transparent py-1 text-sm text-muted-foreground outline-none focus:ring-0 cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <p className="text-sm text-muted-foreground">
                  {totalItems} kết quả
                </p>
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa điểm danh buổi học này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
