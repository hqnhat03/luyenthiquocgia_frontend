"use client"

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
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import api from "@/lib/axios"
import { format } from "date-fns"
import { Calendar, ChevronLeft, ChevronRight, ClipboardList, Eye, HelpCircle, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"
import { CreateExamModal } from "./create-exam-modal"
import { ExamDetailModal } from "./exam-detail-modal"

interface Exam {
  id: number
  class_id: number
  name: string
  duration_minutes: number
  status: 'draft' | 'published' | 'archived'
  open_at: string
  close_at: string
  questions_count: number
  class?: {
    class_code: string
    course_name: string
  }
}

export default function ExamsPage() {
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedExam, setSelectedExam] = React.useState<Exam | null>(null)
  const [editingExam, setEditingExam] = React.useState<Exam | null>(null)
  const [examToDelete, setExamToDelete] = React.useState<Exam | null>(null)
  const [exams, setExams] = React.useState<Exam[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalRecords, setTotalRecords] = React.useState(0)
  const [fromRecord, setFromRecord] = React.useState(0)
  const [toRecord, setToRecord] = React.useState(0)

  const handleViewDetail = (exam: Exam) => {
    setSelectedExam(exam)
    setIsDetailOpen(true)
  }

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam)
    setIsCreateOpen(true)
  }

  const handleDeleteClick = (exam: Exam) => {
    setExamToDelete(exam)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!examToDelete) return

    setIsDeleting(true)
    try {
      await api.delete(`/teacher/class-tests/delete`, {
        params: { id: examToDelete.id }
      })
      toast.success("Xóa bài kiểm tra thành công")
      fetchExams(currentPage)
    } catch (error) {
      console.error("Failed to delete exam:", error)
      toast.error("Có lỗi xảy ra khi xóa bài kiểm tra")
    } finally {
      setIsDeleting(false)
      setIsDeleteOpen(false)
      setExamToDelete(null)
    }
  }

  const fetchExams = React.useCallback(async (page: number) => {
    setIsLoading(true)
    try {
      const response = await api.get(`/teacher/class-tests`, {
        params: {
          page: page
        }
      })
      if (response.data?.status === "success") {
        const paginatedData = response.data.data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedData = (paginatedData.data || []).map((item: any) => ({
          id: item.id,
          class_id: item.class_id || 0,
          name: item.title,
          duration_minutes: item.duration || 0,
          status: item.status === 2 ? 'published' : item.status === 1 ? 'archived' : 'draft',
          open_at: item.start_time,
          close_at: item.end_time,
          questions_count: item.total_questions || 0,
          class: {
            class_code: item.class_code,
            course_name: item.class_code,
          }
        }))
        setExams(mappedData)
        setCurrentPage(paginatedData.current_page || 1)
        setTotalPages(paginatedData.last_page || 1)
        setTotalRecords(paginatedData.total || 0)
        setFromRecord(paginatedData.from || 0)
        setToRecord(paginatedData.to || 0)
      }
    } catch (error) {
      console.error("Failed to fetch exams:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchExams(currentPage)
  }, [currentPage, fetchExams])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold uppercase tracking-wider">
            <span>Dashboard</span>
            <ChevronRight className="size-4" />
            <span className="text-primary">Quản lý bài kiểm tra</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight">Quản lý bài kiểm tra</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchExams(currentPage)} disabled={isLoading} className="rounded-lg">
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="rounded-lg shadow-lg shadow-primary/20" onClick={() => {
            setEditingExam(null)
            setIsCreateOpen(true)
          }}>
            <Plus className="size-4 mr-2" />
            Thêm bài kiểm tra
          </Button>
        </div>
      </div>

      <div className="bg-background/60 backdrop-blur-sm border border-border/40 rounded-lg overflow-hidden shadow-sm">
        {exams.length > 0 ? (
          <>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="font-bold">Lớp học</TableHead>
                <TableHead className="font-bold">Bài kiểm tra</TableHead>
                <TableHead className="font-bold">Số câu hỏi</TableHead>
                <TableHead className="font-bold">Thời gian mở/đóng</TableHead>
                <TableHead className="text-right font-bold pr-6">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id} className="group border-border/40 hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <span className="font-medium text-sm text-foreground">{exam.class?.class_code}</span>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium group-hover:text-primary transition-colors">{exam.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-muted-foreground">{exam.questions_count} câu</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3 text-primary/60" />
                        {format(new Date(exam.open_at), 'dd/MM/yyyy HH:mm')}
                      </div>
                      <div className="flex items-center gap-2 text-destructive/70">
                        <Calendar className="size-3" />
                        {format(new Date(exam.close_at), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg font-bold text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => handleViewDetail(exam)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Quản lý câu hỏi"
                        onClick={() => router.push(`/teacher/exams/${exam.id}/questions`)}
                      >
                        <HelpCircle className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        onClick={() => handleEdit(exam)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg font-bold text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteClick(exam)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 bg-muted/10">
              <p className="text-xs font-medium text-muted-foreground">
                Hiển thị từ <span className="font-bold text-foreground">{fromRecord}</span> đến{" "}
                <span className="font-bold text-foreground">{toRecord}</span> trong tổng số{" "}
                <span className="font-bold text-foreground">{totalRecords}</span> bài kiểm tra
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  disabled={currentPage === 1 || isLoading}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      className="h-8 w-8 rounded-lg text-xs font-bold"
                      disabled={isLoading}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  disabled={currentPage === totalPages || isLoading}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
          </>
        ) : isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="size-8 text-primary animate-spin" />
            <p className="text-muted-foreground animate-pulse">Đang tải danh sách bài kiểm tra...</p>
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div className="p-4 rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="size-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Chưa có bài kiểm tra nào</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Bạn chưa tạo bài kiểm tra nào. Hãy nhấn nút &quot;Thêm bài kiểm tra&quot; để bắt đầu.
              </p>
              <Button variant="outline" className="mt-4 rounded-lg font-bold" onClick={() => setIsCreateOpen(true)}>
                <Plus className="size-4 mr-2" />
                Tạo bài kiểm tra đầu tiên
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreateExamModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => fetchExams(currentPage)}
        initialData={editingExam}
      />

      <ExamDetailModal
        exam={selectedExam}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-destructive flex items-center gap-2">
              <Trash2 className="size-6" />
              Xác nhận xóa
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium">
              Bạn có chắc chắn muốn xóa bài kiểm tra <span className="font-bold text-foreground">&quot;{examToDelete?.name}&quot;</span>?
              <br />
              <span className="text-sm text-muted-foreground italic">Lưu ý: Hành động này không thể hoàn tác và tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-lg font-bold border-border/40 hover:bg-muted">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="rounded-lg font-bold bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20"
            >
              {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
