"use client"

import api from "@/lib/axios"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, isBefore, startOfDay } from "date-fns"
import {
  BookOpen,
  Clock,
  Loader2
} from "lucide-react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"
import * as z from "zod"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { TeacherSelect } from "@/app/admin/(dashboard)/courses/[id]/classes/_components/teacher-select"
import { AxiosError } from "axios"

const baseClassSchema = z.object({
  class_code: z.string().min(1, "Vui lòng nhập mã lớp"),
  start_day: z.date({
    error: "Vui lòng chọn ngày bắt đầu",
  }),
  end_day: z.date({
    error: "Vui lòng chọn ngày kết thúc",
  }),
  max_students: z.number().min(1, "Sĩ số phải lớn hơn 0"),
  status: z.union([z.string(), z.number()]),
  course_id: z.number({
    error: "Vui lòng chọn khóa học",
  }).min(1, "Vui lòng chọn khóa học"),
  class_teachers: z.array(z.object({
    id: z.string(),
    teacher_id: z.number()
  })).min(1, "Cần ít nhất 1 giáo viên phụ trách"),
  class_schedules: z.array(z.object({
    id: z.string(),
    day_of_week: z.number(),
    start_time: z.string(),
    end_time: z.string(),
  })).optional()
})

type FormValues = z.infer<typeof baseClassSchema>

const classSchema = baseClassSchema.superRefine((data, ctx) => {
  if (data.start_day && data.end_day && !isBefore(startOfDay(data.start_day), startOfDay(data.end_day)) && !isBefore(data.start_day, data.end_day)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Ngày kết thúc phải sau ngày bắt đầu",
      path: ["end_day"],
    })
  }
})

const statusOptions = [
  {
    value: 0,
    label: "Bản nháp",
    activeClass: "bg-slate-50 border-slate-500 text-slate-700 dark:bg-slate-950 dark:border-slate-500 dark:text-slate-300"
  },
  {
    value: 2,
    label: "Xuất bản",
    activeClass: "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-500 dark:text-emerald-300"
  },
  {
    value: 1,
    label: "Lưu trữ",
    activeClass: "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950 dark:border-blue-500 dark:text-blue-300"
  },
]

export interface CourseScheduleItem {
  id: number
  course_id: number
  schedule_no: number
  schedule_name: string
  day_of_week: number
  start_time: string
  end_time: string
}

export interface GroupedCourseSchedule {
  schedule_no: number
  schedule_name: string
  details: {
    day_of_week: number
    start_time: string
    end_time: string
  }[]
}

export function ClassForm() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialCourseId = params?.id as string
  const [courseName, setCourseName] = React.useState<string>(searchParams.get("course_name") || "")

  const [courseSchedules, setCourseSchedules] = React.useState<CourseScheduleItem[]>([])
  const [isLoadingSchedules, setIsLoadingSchedules] = React.useState(false)

  // Fetch course details & schedules
  React.useEffect(() => {
    if (initialCourseId) {
      const fetchCourseData = async () => {
        setIsLoadingSchedules(true)
        try {
          // Fetch course name/details
          const detailRes = await api.get(`/admin/courses/detail`, {
            params: { id: initialCourseId }
          })
          const detailData = detailRes.data?.data || detailRes.data
          if (detailData?.name) {
            setCourseName(detailData.name)
          }

          // Fetch schedules
          const res = await api.get(`/admin/courses/schedule-course`, {
            params: { course_id: initialCourseId }
          })
          const data = res.data?.data || res.data
          if (Array.isArray(data)) {
            setCourseSchedules(data)
          }
        } catch (error) {
          console.error("Failed to fetch course data:", error)
        } finally {
          setIsLoadingSchedules(false)
        }
      }
      fetchCourseData()
    }
  }, [initialCourseId])

  const groupedSchedules = React.useMemo((): GroupedCourseSchedule[] => {
    const groups: Record<number, GroupedCourseSchedule> = {}
    courseSchedules.forEach((item) => {
      if (!groups[item.schedule_no]) {
        groups[item.schedule_no] = {
          schedule_no: item.schedule_no,
          schedule_name: item.schedule_name,
          details: [],
        }
      }
      groups[item.schedule_no].details.push({
        day_of_week: item.day_of_week,
        start_time: item.start_time,
        end_time: item.end_time,
      })
    })
    return Object.values(groups)
  }, [courseSchedules])

  const courseDayToCreateFormDay = (day: number): number => {
    if (day === 1) return 0 // Sunday
    return day - 1 // 2-7 -> 1-6
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isScheduleSelected = (grouped: GroupedCourseSchedule, formSchedules: any[]) => {
    if (!formSchedules || formSchedules.length !== grouped.details.length) return false

    return grouped.details.every(detail => {
      const expectedDay = courseDayToCreateFormDay(detail.day_of_week)
      return formSchedules.some(fs => 
        Number(fs.day_of_week) === expectedDay && 
        fs.start_time.substring(0, 5) === detail.start_time.substring(0, 5) && 
        fs.end_time.substring(0, 5) === detail.end_time.substring(0, 5)
      )
    })
  }

  const handleScheduleSelect = (
    grouped: GroupedCourseSchedule,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentValue: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (value: any[]) => void
  ) => {
    const isSelected = isScheduleSelected(grouped, currentValue)
    if (isSelected) {
      onChange([])
    } else {
      const formSchedules = grouped.details.map((detail) => ({
        id: uuidv4(),
        day_of_week: courseDayToCreateFormDay(detail.day_of_week),
        start_time: detail.start_time.substring(0, 5),
        end_time: detail.end_time.substring(0, 5),
      }))
      onChange(formSchedules)
    }
  }

  const getDayLabel = (day: number) => {
    const d = Number(day)
    switch (d) {
      case 1:
      case 8:
        return "Chủ nhật"
      case 2:
        return "Thứ 2"
      case 3:
        return "Thứ 3"
      case 4:
        return "Thứ 4"
      case 5:
        return "Thứ 5"
      case 6:
        return "Thứ 6"
      case 7:
        return "Thứ 7"
      default:
        return `Thứ ${d}`
    }
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      class_code: "",
      max_students: 25,
      status: 2,
      course_id: initialCourseId ? Number(initialCourseId) : undefined,
      class_teachers: [],
      class_schedules: [],
    },
  })

  async function onSubmit(data: FormValues) {
    try {
      const payload = {
        course_id: data.course_id,
        class_code: data.class_code,
        start_date: format(data.start_day, "yyyy-MM-dd"),
        end_date: format(data.end_day, "yyyy-MM-dd"),
        max_students: Number(data.max_students),
        status: Number(data.status),
        teacher_of_class: data.class_teachers.map((t) => ({
          id: t.teacher_id,
          role: "1",
          is_primary_instructor: 1,
          teaching_hours: 0,
          status: 1
        })),
        class_schedules: (data.class_schedules || []).map((slot) => {
          let backendDay = 2
          if (slot.day_of_week === 0) {
            backendDay = 8 // Chủ nhật -> 8
          } else if (slot.day_of_week >= 1 && slot.day_of_week <= 6) {
            backendDay = slot.day_of_week + 1 // Thứ 2-7 -> 2-7
          }
          return {
            day_of_week: backendDay,
            start_time: slot.start_time,
            end_time: slot.end_time,
          }
        })
      }

      await api.post("/admin/classes/create", payload)

      toast.success("Tạo lớp học thành công!")

      // Chuyển hướng ngay lập tức để cải thiện tốc độ phản hồi UI
      const targetUrl = initialCourseId
        ? `/admin/courses/${initialCourseId}/classes`
        : "/admin/classes"

      router.push(targetUrl)
      router.refresh()
    } catch (err: unknown) {
      console.error(err)
      if (err instanceof AxiosError) {
        const responseData = err.response?.data
        if (responseData?.message && typeof responseData.message === "object") {
          Object.keys(responseData.message).forEach((field) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            form.setError(field as any, {
              type: "server",
              message: responseData.message[field][0],
            })
          })
          toast.error("Vui lòng kiểm tra lại thông tin trong form")
        } else {
          toast.error(responseData?.message || err.message || "Có lỗi xảy ra khi tạo lớp học")
        }
      } else {
        toast.error("Có lỗi xảy ra khi tạo lớp học")
      }
    }
  }

  const { formState: { errors } } = form

  return (
    <form id="create-class-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Card: Thông tin lớp học */}
        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Thông tin lớp học
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field data-invalid={!!errors.class_code}>
                <FieldLabel>Mã lớp <span className="text-destructive">*</span></FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="VD: CLS001"
                    className="bg-background/50 focus-visible:ring-primary/20"
                    {...form.register("class_code")}
                  />
                </FieldContent>
                <FieldError errors={[{ message: errors.class_code?.message }]} />
              </Field>

              <Field>
                <FieldLabel>Khóa học</FieldLabel>
                <FieldContent>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-primary font-medium">
                    <BookOpen className="h-4 w-4" />
                    {isLoadingSchedules ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-sm opacity-70">Đang tải thông tin khóa học...</span>
                      </div>
                    ) : (
                      <span className="text-sm">{courseName || `ID: ${initialCourseId}`}</span>
                    )}
                  </div>
                  {/* Hidden input to keep form value if needed, though course_id is already in defaultValues */}
                  <input type="hidden" {...form.register("course_id", { valueAsNumber: true })} />
                </FieldContent>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field data-invalid={!!errors.start_day}>
                <FieldLabel>Ngày bắt đầu <span className="text-destructive">*</span></FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="start_day"
                    render={({ field }) => (
                      <Input
                        type="date"
                        className="bg-background/50 focus-visible:ring-primary/20"
                        value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    )}
                  />
                </FieldContent>
                <FieldError errors={[{ message: errors.start_day?.message }]} />
              </Field>

              <Field data-invalid={!!errors.end_day}>
                <FieldLabel>Ngày kết thúc <span className="text-destructive">*</span></FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="end_day"
                    render={({ field }) => (
                      <Input
                        type="date"
                        className="bg-background/50 focus-visible:ring-primary/20"
                        value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    )}
                  />
                </FieldContent>
                <FieldError errors={[{ message: errors.end_day?.message }]} />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field data-invalid={!!errors.max_students}>
                <FieldLabel>Sĩ số tối đa <span className="text-destructive">*</span></FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    placeholder="VD: 25"
                    className="bg-background/50 focus-visible:ring-primary/20"
                    {...form.register("max_students", { valueAsNumber: true })}
                  />
                </FieldContent>
                <FieldError errors={[{ message: errors.max_students?.message }]} />
              </Field>

              <Field data-invalid={!!errors.status}>
                <FieldLabel>Trạng thái <span className="text-destructive">*</span></FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <div className="flex gap-2 w-full">
                        {statusOptions.map((opt) => {
                          const isSelected = Number(field.value) === opt.value
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => field.onChange(opt.value)}
                              className={cn(
                                "flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                                isSelected
                                  ? opt.activeClass
                                  : "border-input bg-background/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  />
                </FieldContent>
                <FieldError errors={[{ message: errors.status?.message }]} />
              </Field>
            </div>

            <Field data-invalid={!!errors.class_teachers}>
              <FieldLabel>Giáo viên phụ trách <span className="text-destructive">*</span></FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="class_teachers"
                  render={({ field }) => (
                    <TeacherSelect
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </FieldContent>
              <FieldError errors={[{ message: errors.class_teachers?.message }]} />
            </Field>
          </CardContent>
        </Card>

        {/* Card: Lịch học */}
        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Lịch học
            </CardTitle>
            <CardDescription>
              Chọn một trong các lịch học mẫu của khóa học để áp dụng cho lớp học này.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSchedules ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground font-medium">Đang tải lịch học mẫu...</span>
              </div>
            ) : groupedSchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-dashed rounded-xl p-8 text-center bg-muted/20">
                <Clock className="h-10 w-10 text-muted-foreground/60 mb-2 animate-pulse" />
                <p className="text-sm font-semibold text-foreground">Khóa học chưa cấu hình lịch học mẫu</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Lớp học sẽ không có giờ học cố định. Bạn hãy cập nhật lịch học của khóa học này trước.
                </p>
              </div>
            ) : (
              <Controller
                control={form.control}
                name="class_schedules"
                render={({ field }) => (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedSchedules.map((group) => {
                      const isSelected = isScheduleSelected(group, field.value || [])
                      return (
                        <div
                          key={group.schedule_no}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleScheduleSelect(group, field.value || [], field.onChange)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              handleScheduleSelect(group, field.value || [], field.onChange)
                            }
                          }}
                          className={cn(
                            "group relative flex flex-col justify-between p-5 rounded-xl border-2 bg-background/40 cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20",
                            isSelected
                              ? "border-primary bg-primary/[0.03] shadow-lg shadow-primary/5"
                              : "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          {/* Checkmark icon on select */}
                          {isSelected && (
                            <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-md animate-in zoom-in duration-300">
                              <svg
                                className="h-3 w-3 text-primary-foreground stroke-[3]"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}

                          <div className="space-y-3">
                            {/* Option Header */}
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "p-2 rounded-lg transition-colors",
                                isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/10 group-hover:text-foreground"
                              )}>
                                <Clock className="h-4 w-4" />
                              </div>
                              <span className="font-bold text-sm tracking-tight text-foreground">
                                {group.schedule_name}
                              </span>
                            </div>

                            {/* Details List */}
                            <div className="space-y-1.5 pl-0.5">
                              {group.details.map((detail, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                  <span className="inline-block min-w-[70px] font-bold text-muted-foreground">
                                    {getDayLabel(detail.day_of_week)}:
                                  </span>
                                  <span className="font-semibold text-foreground px-2 py-0.5 rounded-md bg-muted/60 border border-border/50">
                                    {detail.start_time.substring(0, 5)} - {detail.end_time.substring(0, 5)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              />
            )}
          </CardContent>
        </Card>

      </div>
    </form>
  )
}
