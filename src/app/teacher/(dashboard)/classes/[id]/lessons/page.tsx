"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit,
  Eye,
  FileText,
  FileUp,
  Loader2,
  PlayCircle,
  Plus,
  Trash2,
  XCircle
} from "lucide-react"
import { useParams } from "next/navigation"
import * as React from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/axios"
import { Lesson, useLessonStore } from "@/store/lesson-store"
import { AxiosError } from "axios"
import { toast } from "sonner"

// Zod Schema for Lesson
const lessonSchema = z.object({
  lesson_name: z.string().min(1, "Vui lòng nhập tên bài học").max(255, "Tên bài học không được vượt quá 255 ký tự"),
  duration_value: z.coerce.number().min(1, "Thời lượng phải lớn hơn 0"),
  duration_unit: z.enum(["minute", "hour"]),
  sort: z.coerce.number().int("Số thứ tự phải là số nguyên").min(1, "Số thứ tự phải lớn hơn 0"),
  document_url: z.string().max(255, "Đường dẫn tài liệu không được vượt quá 255 ký tự").optional().or(z.literal("")),
  video_url: z.string().max(255, "Đường dẫn video không được vượt quá 255 ký tự").optional().or(z.literal("")),
  description: z.string().min(1, "Vui lòng nhập mô tả"),
})

type LessonFormValues = z.infer<typeof lessonSchema>

export default function ClassLessonsPage() {
  const params = useParams()
  const [lessons, setLessons] = React.useState<Lesson[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const { editingLesson, setEditingLesson } = useLessonStore()
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false)
  const [selectedLesson, setSelectedLesson] = React.useState<Lesson | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [lessonToDelete, setLessonToDelete] = React.useState<Lesson | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [loadingDetail, setLoadingDetail] = React.useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(5)
  const [totalItems, setTotalItems] = React.useState(0)

  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema as any),
    defaultValues: {
      lesson_name: "",
      duration_value: 1,
      duration_unit: "minute",
      sort: 1,
      document_url: "",
      video_url: "",
      description: "",
    },
  })

  const fetchLessons = React.useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const response = await api.get(`/teacher/lessons`, {
        params: {
          class_id: params.id,
          page: page,
          pagination: pageSize,
        }
      })
      if (response.data?.status === 'success' || response.data?.success) {
        const paginatedData = response.data.data;
        if (paginatedData) {
          const normalizedData = (paginatedData.data || []).map((lesson: any) => ({
            ...lesson,
            status: lesson.status !== undefined && lesson.status !== null ? Number(lesson.status) : 0
          }))
          setLessons(normalizedData)
          setCurrentPage(paginatedData.current_page || page)
          setTotalPages(paginatedData.last_page || 1)
          setTotalItems(paginatedData.total || 0)
        } else {
          setLessons([])
        }
      } else {
        setLessons([])
      }
    } catch (error) {
      console.error("Failed to fetch lessons:", error)
      setLessons([])
    } finally {
      setLoading(false)
    }
  }, [params.id, pageSize])

  React.useEffect(() => {
    if (params.id) {
      fetchLessons(1)
    }
  }, [fetchLessons, params.id])

  React.useEffect(() => {
    if (editingLesson && isEditModalOpen) {
      form.reset({
        lesson_name: editingLesson.lesson_name,
        duration_value: editingLesson.duration_value,
        duration_unit: editingLesson.duration_unit,
        sort: editingLesson.sort,
        document_url: editingLesson.document_url || "",
        video_url: editingLesson.video_url || "",
        description: editingLesson.description || "",
      })
    }
  }, [editingLesson, isEditModalOpen, form])

  const onSubmit = async (data: LessonFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await api.post(`/teacher/lessons/create`, {
        class_id: Number(params.id),
        ...data,
      })

      if (response.data?.status === 'success' || response.data?.success) {
        toast.success("Tạo bài học thành công")
        setIsCreateModalOpen(false)
        form.reset()
        fetchLessons(1)
      } else {
        toast.error(response.data?.message || "Không thể tạo bài học")
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || "Đã có lỗi xảy ra khi tạo bài học")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const onUpdate = async (data: LessonFormValues) => {
    if (!editingLesson) return
    setIsSubmitting(true)
    try {
      const response = await api.put(`/teacher/lessons/update`, {
        id: editingLesson.id,
        class_id: Number(params.id),
        ...data,
      })

      if (response.data?.status === 'success' || response.data?.success) {
        toast.success("Cập nhật bài học thành công")
        setIsEditModalOpen(false)
        setEditingLesson(null)
        form.reset()
        fetchLessons(currentPage)
      } else {
        toast.error(response.data?.message || "Không thể cập nhật bài học")
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || "Đã có lỗi xảy ra khi cập nhật bài học")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!lessonToDelete) return
    setIsDeleting(true)
    try {
      const response = await api.delete(`/teacher/lessons/delete`, {
        data: { id: lessonToDelete.id }
      })

      if (response.data?.status === 'success' || response.data?.success) {
        toast.success("Xóa bài học thành công")
        setIsDeleteModalOpen(false)
        setLessonToDelete(null)
        const isLastItem = lessons.length === 1
        const nextPage = isLastItem && currentPage > 1 ? currentPage - 1 : currentPage
        fetchLessons(nextPage)
      } else {
        toast.error(response.data?.message || "Không thể xóa bài học")
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || "Đã có lỗi xảy ra khi xóa bài học")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleViewDetail = async (lesson: Lesson) => {
    setSelectedLesson(null)
    setIsViewModalOpen(true)
    setLoadingDetail(true)
    try {
      const response = await api.get(`/teacher/lessons/detail`, {
        params: { id: lesson.id }
      })
      if (response.data?.status === 'success' || response.data?.success) {
        const detailData = response.data.data;
        if (detailData) {
          setSelectedLesson({
            ...detailData,
            status: detailData.status !== undefined && detailData.status !== null ? Number(detailData.status) : 0
          })
        } else {
          toast.error("Không thể lấy chi tiết bài học")
          setIsViewModalOpen(false)
        }
      } else {
        toast.error("Không thể lấy chi tiết bài học")
        setIsViewModalOpen(false)
      }
    } catch (error) {
      console.error("Failed to fetch lesson detail:", error)
      toast.error("Đã xảy ra lỗi khi tải chi tiết bài học")
      setIsViewModalOpen(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Strip HTML tags for clean description preview in list
  const stripHtml = (html?: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "");
  }

  // Render status badge based on 0 (Chưa duyệt), 1 (Đã duyệt), 2 (Từ chối)
  const renderStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return (
          <Badge variant="outline" className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider shadow-sm bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
            <CheckCircle2 className="size-3 mr-1.5" />
            <span>Đã duyệt</span>
          </Badge>
        )
      case 2:
        return (
          <Badge variant="outline" className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider shadow-sm bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20 transition-colors">
            <XCircle className="size-3 mr-1.5" />
            <span>Từ chối</span>
          </Badge>
        )
      case 0:
      default:
        return (
          <Badge variant="outline" className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider shadow-sm bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20 transition-colors">
            <Edit className="size-3 mr-1.5" />
            <span>Chưa duyệt</span>
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <span>Quản lý lớp học</span>
          <ChevronRight className="size-4 opacity-50" />
          <span className="text-primary font-semibold">{params.id}</span>
          <ChevronRight className="size-4 opacity-50" />
          <span>Bài học</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-4">
              Quản lý bài học
              {!loading && (
                <Badge variant="secondary" className="font-bold rounded-lg text-sm bg-primary/10 text-primary border-none self-center">
                  {totalItems} bài
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground font-medium">
              Tạo và quản lý tài liệu, bài giảng cho lớp học này.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                form.reset({
                  lesson_name: "",
                  duration_value: 1,
                  duration_unit: "minute",
                  sort: 1,
                  document_url: "",
                  video_url: "",
                  description: "",
                })
                setIsCreateModalOpen(true)
              }}
              className="rounded-lg h-12 px-6 gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 font-bold"
            >
              <Plus className="size-5" />
              <span>Thêm bài học mới</span>
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <div className="bg-background/60 backdrop-blur-xl border border-border/40 rounded-xl p-16 flex flex-col items-center justify-center min-h-[500px] text-center space-y-6 shadow-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
            <div className="relative p-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/10 shadow-inner">
              <BookOpen className="size-16" />
            </div>
          </div>
          <div className="space-y-2 max-w-sm">
            <h3 className="text-2xl font-black tracking-tight">Chưa có bài học nào</h3>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Lớp học của bạn hiện tại chưa có tài liệu hay bài học nào. Hãy bắt đầu bằng cách thêm bài học đầu tiên!
            </p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="outline"
            className="rounded-lg h-12 px-8 font-bold border-2 hover:bg-primary/5 transition-all"
          >
            Thêm bài học đầu tiên
          </Button>
        </div>
      ) : (
        <div className="bg-background/60 backdrop-blur-xl border border-border/40 rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-border/40 h-14">
                <TableHead className="w-[80px] text-center font-bold text-primary pl-6">STT</TableHead>
                <TableHead className="font-bold text-primary">Tên bài học</TableHead>
                <TableHead className="font-bold text-primary">Thời lượng</TableHead>
                <TableHead className="font-bold text-primary">Trạng thái</TableHead>
                <TableHead className="w-[140px] text-right font-bold text-primary pr-6">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons.map((lesson) => (
                <TableRow key={lesson.id} className="hover:bg-muted/30 border-b-border/40 transition-colors h-16">
                  <TableCell className="text-center pl-6">
                    <span className="inline-flex items-center justify-center size-8 rounded-lg bg-muted font-black text-[10px] text-muted-foreground uppercase tracking-widest">
                      {lesson.sort}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-base line-clamp-1">{lesson.lesson_name}</span>
                      <span className="text-xs text-muted-foreground font-medium line-clamp-1">
                        {stripHtml(lesson.description) || "Không có mô tả cho bài học này."}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 w-fit border border-transparent group-hover:bg-white/50 group-hover:border-border/40 transition-all">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span className="text-xs font-bold">
                        {lesson.duration_value} {lesson.duration_unit === "hour" ? "giờ" : "phút"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {renderStatusBadge(lesson.status)}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-lg hover:bg-blue-500/10 hover:text-blue-600 transition-colors"
                        title="Xem chi tiết"
                        onClick={() => handleViewDetail(lesson)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      {lesson.status !== 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-lg hover:bg-amber-500/10 hover:text-amber-600 transition-colors"
                          title="Chỉnh sửa"
                          onClick={() => {
                            setEditingLesson(lesson)
                            setIsEditModalOpen(true)
                          }}
                        >
                          <Edit className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Xóa bài học"
                        onClick={() => {
                          setLessonToDelete(lesson)
                          setIsDeleteModalOpen(true)
                        }}
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border/40">
              <div className="flex items-center gap-6">
                <p className="text-sm font-medium text-muted-foreground">
                  Hiển thị <span className="font-bold text-foreground">{lessons.length}</span> trên tổng số{" "}
                  <span className="font-bold text-foreground">{totalItems}</span> bài học
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">Số lượng hiển thị:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                    }}
                    className="flex h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 text-xs font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchLessons(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="rounded-lg h-9 font-bold px-3"
                  >
                    Trước
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => fetchLessons(page)}
                      disabled={loading}
                      className={`rounded-lg size-9 font-bold ${page === currentPage ? "shadow-md shadow-primary/20" : ""}`}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchLessons(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="rounded-lg h-9 font-bold px-3"
                  >
                    Sau
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg p-0 border-none shadow-2xl">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-black tracking-tight">Thêm bài học mới</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Nhập thông tin chi tiết để tạo bài học mới cho lớp học này.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 pt-6 space-y-6">
            <FieldGroup>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field>
                  <FieldLabel>Tên bài học</FieldLabel>
                  <FieldContent>
                    <Input
                      placeholder="VD: 7 hằng đẳng thức đáng nhớ"
                      className="rounded-lg h-11"
                      {...form.register("lesson_name")}
                    />
                    <FieldError errors={[form.formState.errors.lesson_name]} />
                  </FieldContent>
                </Field>

                <div className="grid grid-cols-3 gap-4">
                  <Field className="col-span-1">
                    <FieldLabel>Số thứ tự</FieldLabel>
                    <FieldContent>
                      <Input
                        type="number"
                        min="1"
                        className="rounded-lg h-11"
                        {...form.register("sort")}
                      />
                      <FieldError errors={[form.formState.errors.sort]} />
                    </FieldContent>
                  </Field>

                  <Field className="col-span-1">
                    <FieldLabel>Thời lượng</FieldLabel>
                    <FieldContent>
                      <Input
                        type="number"
                        min="1"
                        className="rounded-lg h-11"
                        {...form.register("duration_value")}
                      />
                      <FieldError errors={[form.formState.errors.duration_value]} />
                    </FieldContent>
                  </Field>

                  <Field className="col-span-1">
                    <FieldLabel>Đơn vị</FieldLabel>
                    <FieldContent>
                      <select
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...form.register("duration_unit")}
                      >
                        <option value="minute">Phút</option>
                        <option value="hour">Giờ</option>
                      </select>
                      <FieldError errors={[form.formState.errors.duration_unit]} />
                    </FieldContent>
                  </Field>
                </div>
              </div>

              <Field>
                <FieldLabel>Link Video (Tùy chọn)</FieldLabel>
                <FieldContent>
                  <div className="relative">
                    <PlayCircle className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="https://youtube.com/..."
                      className="pl-9 rounded-lg h-11"
                      {...form.register("video_url")}
                    />
                  </div>
                  <FieldError errors={[form.formState.errors.video_url]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Link tài liệu (Tùy chọn)</FieldLabel>
                <FieldContent>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="https://drive.google.com/..."
                      className="pl-9 rounded-lg h-11"
                      {...form.register("document_url")}
                    />
                  </div>
                  <FieldError errors={[form.formState.errors.document_url]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Mô tả bài học</FieldLabel>
                <FieldContent>
                  <Textarea
                    placeholder="Tóm tắt nội dung bài học..."
                    className="rounded-lg min-h-[120px] resize-none"
                    {...form.register("description")}
                  />
                  <FieldError errors={[form.formState.errors.description]} />
                </FieldContent>
              </Field>
            </FieldGroup>

            <DialogFooter className="pt-4 flex items-center justify-end gap-3 bg-transparent border-none p-0 -mx-0">
              <Button
                type="button"
                variant="ghost"
                className="rounded-lg h-11 px-6 font-bold"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                className="rounded-lg h-11 px-8 font-bold gap-2 shadow-lg shadow-primary/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Lưu bài học"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Detail Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg p-0 border-none shadow-2xl">
          {loadingDetail ? (
            <div className="p-16 flex flex-col items-center justify-center min-h-[350px] space-y-4">
              <Loader2 className="size-12 animate-spin text-primary" />
              <div className="space-y-1 text-center">
                <p className="font-bold text-lg">Đang tải thông tin chi tiết</p>
                <p className="text-xs text-muted-foreground font-medium">Vui lòng chờ trong giây lát...</p>
              </div>
            </div>
          ) : selectedLesson ? (
            <>
              <DialogHeader className="p-8 pb-0">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-primary/10 text-primary border-none hover:bg-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                    Bài học {selectedLesson.sort}
                  </Badge>
                  {renderStatusBadge(selectedLesson.status)}
                </div>
                <DialogTitle className="text-3xl font-black tracking-tight">{selectedLesson.lesson_name}</DialogTitle>
                <div className="flex items-center gap-4 mt-2 text-muted-foreground font-medium text-sm">
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    <span>{selectedLesson.duration_value} {selectedLesson.duration_unit === "hour" ? "giờ" : "phút"}</span>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-8 space-y-8">
                {/* Video Player Section */}
                {selectedLesson.video_url && (selectedLesson.video_url.includes('youtube.com') || selectedLesson.video_url.includes('youtu.be') || selectedLesson.video_url.startsWith('http')) ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black shadow-2xl group border-4 border-muted/50">
                    {selectedLesson.video_url.includes('youtube.com') || selectedLesson.video_url.includes('youtu.be') ? (() => {
                      const getYoutubeId = (url: string) => {
                        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                        const match = url.match(regExp);
                        return match && match[2].length === 11 ? match[2] : null;
                      };
                      const videoId = getYoutubeId(selectedLesson.video_url);
                      const embedUrl = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : selectedLesson.video_url;
                      
                      return (
                        <iframe
                          src={embedUrl}
                          className="absolute inset-0 w-full h-full"
                          allowFullScreen
                          title={selectedLesson.lesson_name}
                        />
                      );
                    })() : (
                      <video
                        src={selectedLesson.video_url}
                        className="absolute inset-0 w-full h-full"
                        controls
                      />
                    )}
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-lg bg-muted/40 border-2 border-dashed border-muted flex flex-col items-center justify-center text-muted-foreground p-6 gap-3">
                    <PlayCircle className="size-12 opacity-40" />
                    <p className="font-bold text-sm">Không có video bài học</p>
                  </div>
                )}

                {/* Description & Details */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-lg font-black flex items-center gap-2">
                      <FileText className="size-5 text-primary" />
                      Mô tả bài học
                    </h4>
                    <div className="bg-muted/30 rounded-lg p-6 border border-border/40">
                      <div 
                        className="text-muted-foreground font-medium leading-relaxed whitespace-pre-wrap lessons-description-html"
                        dangerouslySetInnerHTML={{ __html: selectedLesson.description || "Không có mô tả cho bài học này." }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLesson.document_url && (
                      <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between group/doc hover:bg-emerald-500/10 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                            <FileUp className="size-4" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">Tài liệu đính kèm</p>
                            <p className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-widest">Sẵn sàng tải xuống</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-lg font-bold bg-white/50 hover:bg-white"
                          onClick={() => selectedLesson.document_url && window.open(selectedLesson.document_url, '_blank')}
                        >
                          Mở tài liệu
                        </Button>
                      </div>
                    )}

                    {selectedLesson.video_url && (
                      <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                            <PlayCircle className="size-4" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">Nguồn Video</p>
                            <p className="text-[10px] text-blue-600/70 font-bold uppercase tracking-widest">
                              {selectedLesson.video_url.includes('youtube') ? 'Youtube Player' : 'Đường dẫn trực tiếp'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-lg font-bold bg-white/50 hover:bg-white"
                          onClick={() => selectedLesson.video_url && window.open(selectedLesson.video_url, '_blank')}
                        >
                          Xem gốc
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="p-8 pt-0 bg-transparent border-none">
                <Button
                  onClick={() => setIsViewModalOpen(false)}
                  className="w-full rounded-lg h-12 font-black text-base shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Đóng cửa sổ
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open)
        if (!open) setEditingLesson(null)
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg p-0 border-none shadow-2xl">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-black tracking-tight">Chỉnh sửa bài học</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Cập nhật thông tin cho bài học &quot;{editingLesson?.lesson_name}&quot;.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onUpdate)} className="p-8 pt-6 space-y-6">
            <FieldGroup>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field>
                  <FieldLabel>Tên bài học</FieldLabel>
                  <FieldContent>
                    <Input
                      placeholder="VD: 7 hằng đẳng thức đáng nhớ"
                      className="rounded-lg h-11"
                      {...form.register("lesson_name")}
                    />
                    <FieldError errors={[form.formState.errors.lesson_name]} />
                  </FieldContent>
                </Field>

                <div className="grid grid-cols-3 gap-4">
                  <Field className="col-span-1">
                    <FieldLabel>Số thứ tự</FieldLabel>
                    <FieldContent>
                      <Input
                        type="number"
                        min="1"
                        className="rounded-lg h-11"
                        {...form.register("sort")}
                      />
                      <FieldError errors={[form.formState.errors.sort]} />
                    </FieldContent>
                  </Field>

                  <Field className="col-span-1">
                    <FieldLabel>Thời lượng</FieldLabel>
                    <FieldContent>
                      <Input
                        type="number"
                        min="1"
                        className="rounded-lg h-11"
                        {...form.register("duration_value")}
                      />
                      <FieldError errors={[form.formState.errors.duration_value]} />
                    </FieldContent>
                  </Field>

                  <Field className="col-span-1">
                    <FieldLabel>Đơn vị</FieldLabel>
                    <FieldContent>
                      <select
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...form.register("duration_unit")}
                      >
                        <option value="minute">Phút</option>
                        <option value="hour">Giờ</option>
                      </select>
                      <FieldError errors={[form.formState.errors.duration_unit]} />
                    </FieldContent>
                  </Field>
                </div>
              </div>

              <Field>
                <FieldLabel>Link Video (Tùy chọn)</FieldLabel>
                <FieldContent>
                  <div className="relative">
                    <PlayCircle className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="https://youtube.com/..."
                      className="pl-9 rounded-lg h-11"
                      {...form.register("video_url")}
                    />
                  </div>
                  <FieldError errors={[form.formState.errors.video_url]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Link tài liệu (Tùy chọn)</FieldLabel>
                <FieldContent>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="https://drive.google.com/..."
                      className="pl-9 rounded-lg h-11"
                      {...form.register("document_url")}
                    />
                  </div>
                  <FieldError errors={[form.formState.errors.document_url]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Mô tả bài học</FieldLabel>
                <FieldContent>
                  <Textarea
                    placeholder="Tóm tắt nội dung bài học..."
                    className="rounded-lg min-h-[120px] resize-none"
                    {...form.register("description")}
                  />
                  <FieldError errors={[form.formState.errors.description]} />
                </FieldContent>
              </Field>
            </FieldGroup>

            <DialogFooter className="pt-4 flex items-center justify-end gap-3 bg-transparent border-none p-0 -mx-0">
              <Button
                type="button"
                variant="ghost"
                className="rounded-lg h-11 px-6 font-bold"
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditingLesson(null)
                }}
                disabled={isSubmitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                className="rounded-lg h-11 px-8 font-bold gap-2 shadow-lg shadow-primary/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  "Cập nhật bài học"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent className="rounded-lg border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black tracking-tight">Xác nhận xóa bài học</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium pt-2">
              Bạn có chắc chắn muốn xóa bài học <span className="font-bold text-foreground">&quot;{lessonToDelete?.lesson_name}&quot;</span>?
              Hành động này không thể hoàn tác và tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel disabled={isDeleting} className="rounded-lg font-bold">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
              className="bg-destructive text-white hover:bg-destructive/90 rounded-lg font-bold transition-all shadow-lg shadow-destructive/20"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Đang xóa...
                </>
              ) : (
                "Xác nhận xóa"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
