"use client"

import {
  BookOpen,
  Clock,
  Edit,
  FileText,
  GraduationCap,
  Layers,
  Users
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import * as React from "react"

import { Can } from "@/components/auth/can"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/ui/status-badge"
import { usePermission } from "@/hooks/use-permission"
import api from "@/lib/axios"
import { useLayoutStore } from "@/store/layout-store"
import Image from "next/image"
import { toast } from "sonner"

interface CourseDetail {
  id: number
  name: string
  slug?: string
  title?: string
  description: string
  status: number
  image_url: string
  price: string | number
  level?: string
  subject?: string
  class_rooms_count?: number
  student_count?: number
  target_student: number
  lesson_count?: number
  completion_time?: number

  // New API fields
  subject_name?: string
  subject_level?: string
  total_lessons?: number
  total_hours?: number
  total_classes?: number
  total_students?: number
  course_schedules?: CourseScheduleType[]
  course_materials: CourseMaterialType[]
}

interface CourseScheduleType {
  id: number
  course_id: number
  schedule_no: number
  schedule_name: string
  day_of_week: number
  start_time: string
  end_time: string
}

interface CourseMaterialType {
  id: number
  name?: string
  title?: string
  link_url?: string
  url?: string
  type?: string
  description?: string
  is_public?: number
}

type StatusType = "draft" | "published" | "archived"

const targetStudentConfig: Record<string | number, { label: string; color: string }> = {
  all: { label: "Tất cả", color: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
  student: { label: "Học sinh", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  employee: { label: "Nhân viên", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  2: { label: "Tất cả", color: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
  0: { label: "Học sinh", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  1: { label: "Nhân viên", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
}

const statusMap: Record<number | string, 'draft' | 'published' | 'archived'> = {
  0: "draft",
  1: "archived",
  2: "published",
  draft: "draft",
  archived: "archived",
  published: "published",
}

const getDayLabel = (dayNum: number) => {
  switch (dayNum) {
    case 1: return "Chủ nhật"
    case 2: return "Thứ 2"
    case 3: return "Thứ 3"
    case 4: return "Thứ 4"
    case 5: return "Thứ 5"
    case 6: return "Thứ 6"
    case 7: return "Thứ 7"
    default: return `Thứ ${dayNum}`
  }
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { hasPermission } = usePermission()

  // Kiểm tra quyền
  React.useEffect(() => {
    if (!hasPermission("course_detail")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/courses")
    }
  }, [hasPermission, router])

  const [course, setCourse] = React.useState<CourseDetail | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)


  const fetchCourseData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/admin/courses/detail`, {
        params: { id: params.id }
      })
      const result = response.data
      if (response.status === 200 && (result.success || result.status === "success")) {
        setCourse(result.data)
      } else {
        toast.error(result.message || "Không thể tải thông tin khóa học")
        router.push("/admin/courses")
      }
    } catch (error) {
      console.error("Failed to fetch course details:", error)
      toast.error("Có lỗi xảy ra khi tải thông tin khóa học")
    } finally {
      setIsLoading(false)
    }
  }, [params.id, router])

  React.useEffect(() => {
    if (params.id) {
      fetchCourseData()
    }
  }, [fetchCourseData, params.id])

  const { setHeaderContent } = useLayoutStore()

  React.useEffect(() => {
    if (course) {
      setHeaderContent(
        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {course.name}
          </h2>
          <div className="flex items-center gap-3">
            <Can permission="course_edit">
              <Button
                className="h-10 px-6 bg-primary hover:bg-primary/90 transition-all active:scale-95 whitespace-nowrap gap-2 shadow-md shadow-primary/20"
                onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
              >
                <Edit className="h-4 w-4" />
                <span className="text-sm font-bold">Chỉnh sửa</span>
              </Button>
            </Can>
          </div>
        </div>
      )
    }
    return () => {
      setHeaderContent(null)
    }
  }, [course, setHeaderContent, router])

  // Helper to group schedules
  const getGroupedSchedules = () => {
    if (!course?.course_schedules || course.course_schedules.length === 0) return []

    const groups: Record<string, { days: { day: number; label: string }[]; time: string }> = {}

    course.course_schedules.forEach(schedule => {
      const name = schedule.schedule_name || `Lịch ${schedule.schedule_no}`
      const start = schedule.start_time.split(":").slice(0, 2).join(":")
      const end = schedule.end_time.split(":").slice(0, 2).join(":")
      const timeStr = `${start} - ${end}`

      if (!groups[name]) {
        groups[name] = {
          days: [],
          time: timeStr
        }
      }

      groups[name].days.push({
        day: schedule.day_of_week,
        label: getDayLabel(schedule.day_of_week)
      })
    })

    return Object.entries(groups).map(([name, group]) => {
      const sortedDays = group.days.sort((a, b) => {
        const valA = a.day === 1 ? 8 : a.day
        const valB = b.day === 1 ? 8 : b.day
        return valA - valB
      })

      return {
        schedule_name: name,
        days: sortedDays.map(d => d.label),
        time: group.time
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="md:col-span-2 h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    )
  }

  if (!course) return null

  // Helpers and mappings
  const subject = course.subject_name || course.subject || "N/A"
  const level = course.subject_level || course.level || "N/A"
  const courseStatus = statusMap[course.status] || "draft"

  // Format price
  const formattedPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(course.price || 0))

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-2 flex flex-col gap-6">
          <Card className="border-none shadow-md overflow-hidden bg-gradient-to-b from-card to-muted/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Course Image - Portrait / Book ratio */}
                <div className="w-full md:w-56 shrink-0">
                  <div className="aspect-[3/4] relative rounded-xl overflow-hidden shadow-xl ring-1 ring-border bg-muted group">
                    {course.image_url ? (
                      <Image
                        src={course.image_url.startsWith('http') || course.image_url.startsWith('blob:') ? course.image_url : `${process.env.NEXT_PUBLIC_API_IMAGE_URL}${course.image_url}`}
                        alt={course.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        width={300}
                        height={400}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30 bg-primary/5 gap-2">
                        <BookOpen className="h-12 w-12" />
                        <span className="text-xs font-medium">Chưa có ảnh</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="secondary" className="px-3 py-1 text-sm bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 shadow-sm transition-all">
                        {subject}
                      </Badge>
                      <Badge variant="outline" className="px-3 py-1 text-sm shadow-sm bg-background">
                        {level}
                      </Badge>
                      <Badge variant="outline" className={`px-3 py-1 text-sm shadow-none font-medium ${targetStudentConfig[course.target_student]?.color || ""}`}>
                        <Users className="w-3.5 h-3.5 mr-1.5" />
                        {targetStudentConfig[course.target_student]?.label || course.target_student}
                      </Badge>
                      <StatusBadge status={courseStatus as StatusType} className="px-3 py-1 text-sm shadow-none font-medium rounded-md ml-auto" />
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" /> Mô tả khóa học
                      </h3>
                      <div 
                        className="text-muted-foreground leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: course.description }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
                    <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-card border shadow-sm">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Bài học</span>
                      <span className="text-lg font-bold">{course.total_lessons ?? course.lesson_count ?? 0}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-card border shadow-sm">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Thời gian</span>
                      {course.total_hours !== undefined ? (
                        <span className="text-lg font-bold">{course.total_hours} <span className="text-xs font-normal">giờ</span></span>
                      ) : (
                        <span className="text-lg font-bold">{course.completion_time || 0} <span className="text-xs font-normal">phút</span></span>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-primary/5 border border-primary/20 shadow-sm text-primary">
                      <span className="text-[10px] text-primary/70 font-bold uppercase tracking-wider">Giá bán</span>
                      <span className="text-lg font-bold">{formattedPrice}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Materials */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Tài liệu khóa học ({course.course_materials?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {course.course_materials && course.course_materials.length > 0 ? (
                <ul className="space-y-3">
                  {course.course_materials.map((material, idx) => {
                    const title = material.title || material.name || `Tài liệu ${idx + 1}`
                    const url = material.url || material.link_url
                    return (
                      <li key={idx} className="flex items-center p-3 rounded-lg border bg-muted/30 group">
                        <FileText className="h-5 w-5 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                        {url ? (
                          <Link
                            href={url}
                            target="_blank"
                            className="flex-1 font-medium hover:text-primary hover:underline transition-colors line-clamp-1 pr-2 text-sm"
                            title={title}
                          >
                            {title}
                          </Link>
                        ) : (
                          <span className="flex-1 font-medium line-clamp-1 pr-2 text-sm">{title}</span>
                        )}
                        {url && (
                          <Link href={url} target="_blank" className="shrink-0">
                            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">Xem</Button>
                          </Link>
                        )}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="text-center p-8 bg-muted/20 rounded-xl border border-dashed flex flex-col items-center justify-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Hiện chưa có tài liệu nào cho khóa học này.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary & Schedules */}
        <div className="space-y-6">
          <Card className="border-none shadow-md overflow-hidden">
            <div className="bg-primary/5 p-4 border-b">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" /> Thông tin chung
              </h3>
            </div>
            <CardContent className="p-0">
              <div className="divide-y">
                <div className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors">
                  <span className="text-sm text-muted-foreground font-medium">Trạng thái</span>
                  <StatusBadge status={courseStatus as StatusType} className="shadow-none rounded-md" />
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors">
                  <span className="text-sm text-muted-foreground font-medium">Môn học</span>
                  <span className="font-medium text-sm">{subject}</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors">
                  <span className="text-sm text-muted-foreground font-medium">Trình độ</span>
                  <span className="font-medium text-sm">{level}</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors">
                  <span className="text-sm text-muted-foreground font-medium">Đối tượng</span>
                  <span className="font-medium text-sm">{targetStudentConfig[course.target_student]?.label || course.target_student}</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors bg-primary/5">
                  <span className="text-sm font-semibold text-primary/80">Giá bán</span>
                  <span className="font-bold text-primary">{formattedPrice}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grouped Schedules */}
          {course.course_schedules && course.course_schedules.length > 0 && (
            <Card className="border-none shadow-md overflow-hidden animate-in fade-in duration-500">
              <div className="bg-primary/5 p-4 border-b">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" /> Lịch học đề xuất
                </h3>
              </div>
              <CardContent className="p-4 space-y-4">
                {getGroupedSchedules().map((grp, idx) => (
                  <div key={idx} className="p-3 rounded-xl border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{grp.schedule_name}</span>
                      <Badge variant="secondary" className="font-mono text-xs bg-primary/10 text-primary border-none">
                        {grp.time}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {grp.days.map((day, dIdx) => (
                        <Badge key={dIdx} variant="outline" className="text-xs bg-background py-0.5">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
