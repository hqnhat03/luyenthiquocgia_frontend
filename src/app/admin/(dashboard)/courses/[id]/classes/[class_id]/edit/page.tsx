"use client"

import api from "@/lib/axios"
import { useLayoutStore } from "@/store/layout-store"
import { useParams, useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { usePermission } from "@/hooks/use-permission"
import { AxiosError } from "axios"
import { ClassForm } from "./_components/class-form"

/**
 * EditClassPage
 * 
 * This page allows administrators to edit an existing class.
 * It fetches the class details from the API and passes them to the ClassForm.
 */
export default function EditClassPage() {
  const params = useParams()
  const router = useRouter()
  const classId = params.class_id as string
  const { hasPermission } = usePermission()

  // Kiểm tra quyền
  React.useEffect(() => {
    if (!hasPermission("class_edit")) {
      toast.error("Bạn không có quyền thực hiện chức năng này")
      router.back()
    }
  }, [hasPermission, router])


  const [classData, setClassData] = React.useState<React.ComponentProps<typeof ClassForm>["initialData"] | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchClassDetails = async () => {
      setIsLoading(true)
      try {
        const response = await api.get(`/admin/classes/detail`, {
          params: { id: classId }
        })
        const result = response.data
        if (result.status === "success" || result.success) {
          const rawData = result.data

          const mappedData = {
            class_code: rawData.class_code,
            start_day: rawData.start_date,
            end_day: rawData.end_date,
            max_students: rawData.max_students,
            meeting_url: rawData.meeting_url || "",
            status: rawData.status !== undefined ? rawData.status : 2,
            course_id: rawData.course_id,
            course_name: rawData.course?.name || "",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            class_teachers: (rawData.teachers_basic_info || []).map((t: any) => ({
              id: String(t.id),
              teacher_id: t.id
            })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            class_schedules: (rawData.class_schedules || []).map((s: any) => ({
              id: String(s.id),
              day_of_week: String(s.day_of_week),
              start_time: s.start_time,
              end_time: s.end_time
            }))
          }
          setClassData(mappedData)
        } else {
          toast.error(result.message || "Không thể tải thông tin lớp học")
        }
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tải thông tin lớp học")
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (classId) {
      fetchClassDetails()
    }
  }, [classId])

  const { setHeaderContent } = useLayoutStore()

  React.useEffect(() => {
    if (classData) {
      setHeaderContent(
        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Chỉnh sửa lớp học
            </h2>
            <p className="text-muted-foreground mt-0.5 text-xs flex items-center gap-2">
              <span className="inline-block px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono font-bold uppercase tracking-tight">
                {classData.class_code}
              </span>
              <span>Cập nhật thông tin chi tiết và giáo viên phụ trách</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              type="button"
              className="h-10 px-6 bg-background hover:bg-muted transition-colors border"
              onClick={() => router.back()}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              form="edit-class-form"
              className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 transition-all active:scale-95 text-sm font-bold"
            >
              Lưu
            </Button>
          </div>
        </div>
      )
    }
    return () => {
      setHeaderContent(null)
    }
  }, [setHeaderContent, classData, router])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-[400px] bg-muted/40 animate-pulse rounded-xl" />
          <div className="h-[300px] bg-muted/40 animate-pulse rounded-xl" />
        </div>
      </div>
    )
  }

  if (!classData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">Không tìm thấy thông tin</h3>
          <p className="text-muted-foreground">Lớp học bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        </div>
        <Button onClick={() => router.back()}>Quay lại</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10 
      animate-in fade-in duration-500 slide-in-from-bottom-4">
      {/* Form Content */}
      <ClassForm initialData={classData} />
    </div>
  )
}
