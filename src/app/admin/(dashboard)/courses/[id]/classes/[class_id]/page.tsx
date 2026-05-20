"use client"

import { Can } from "@/components/auth/can"
import { usePermission } from "@/hooks/use-permission"
import api from "@/lib/axios"
import { useLayoutStore } from "@/store/layout-store"
import {
  Archive,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Clock3,
  ExternalLink,
  GraduationCap,
  Mail,
  Pencil,
  UserCheck,
  Users,
  Video
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"


// Types based on API response

const dayMap: Record<number, string> = {
  2: "Thứ 2",
  3: "Thứ 3",
  4: "Thứ 4",
  5: "Thứ 5",
  6: "Thứ 6",
  7: "Thứ 7",
  8: "Chủ nhật",
  1: "Chủ nhật"
}

const getStatusConfig = (status: string | number) => {
  const s = String(status)?.toLowerCase() || ""
  
  if (s === "2" || s === "published") {
    return {
      label: "Đã xuất bản",
      color: "bg-emerald-500/15 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400",
      icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />,
      tooltip: "Lớp học đã được công khai và có thể bắt đầu",
    }
  }
  if (s === "0" || s === "draft") {
    return {
      label: "Bản nháp",
      color: "bg-amber-500/15 text-amber-700 border-amber-200/50 dark:bg-amber-500/20 dark:text-amber-400",
      icon: <Clock3 className="w-3.5 h-3.5 mr-1.5" />,
      tooltip: "Lớp học đang trong quá trình chuẩn bị",
    }
  }
  if (s === "1" || s === "archived") {
    return {
      label: "Lưu trữ",
      color: "bg-slate-500/15 text-slate-700 border-slate-200/50 dark:bg-slate-500/20 dark:text-slate-400",
      icon: <Archive className="w-3.5 h-3.5 mr-1.5" />,
      tooltip: "Lớp học đã kết thúc hoặc bị tạm dừng",
    }
  }
  
  return {
    label: s || "N/A",
    color: "bg-primary/15 text-primary border-primary/20",
    icon: null,
    tooltip: "Trạng thái không xác định",
  }
}

const getDayConfig = (day: number | string) => {
  const dayNum = Number(day);
  const configs: Record<number, { color: string, bg: string }> = {
    2: { color: "text-blue-600", bg: "bg-blue-500/10" },
    3: { color: "text-purple-600", bg: "bg-purple-500/10" },
    4: { color: "text-amber-600", bg: "bg-amber-500/10" },
    5: { color: "text-rose-600", bg: "bg-rose-500/10" },
    6: { color: "text-emerald-600", bg: "bg-emerald-500/10" },
    7: { color: "text-indigo-600", bg: "bg-indigo-500/10" },
    8: { color: "text-red-600", bg: "bg-red-500/10" },
    1: { color: "text-red-600", bg: "bg-red-500/10" },
  };
  return configs[dayNum] || { color: "text-slate-600", bg: "bg-slate-500/10" };
}

interface ScheduleItem {
  id?: string | number;
  day_of_week: number | string;
  start_time?: string;
  end_time?: string;
}

interface StudentItem {
  id: string | number;
  name: string;
  avatar?: string;
}

interface TeacherItem {
  id: string | number;
  name: string;
  avatar?: string;
  email?: string;
}

export default function ClassDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { hasPermission } = usePermission()

  // Kiểm tra quyền
  React.useEffect(() => {
    if (!hasPermission("class_detail")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.back()
    }
  }, [hasPermission, router])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)


  const fetchClassDetail = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get(`/admin/classes/detail`, {
        params: { id: params.class_id }
      })
      const result = response.data
      if (response.status === 200 && (result.status === "success" || result.success)) {
        setData(result.data)
      } else {
        const errMsg = result.message || "Không thể tải thông tin lớp học"
        setError(errMsg)
        toast.error(errMsg)
      }
    } catch (err) {
      console.error("Fetch error:", err)
      setError("Có lỗi kết nối đến máy chủ. Vui lòng thử lại sau.")
      toast.error("Lỗi kết nối API")
    } finally {
      setIsLoading(false)
    }
  }, [params.class_id])

  React.useEffect(() => {
    if (params.class_id) {
      fetchClassDetail()
    }
  }, [fetchClassDetail, params.class_id])

  const { setHeaderContent } = useLayoutStore()

  React.useEffect(() => {
    if (data) {
      setHeaderContent(
        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {data.class_code}
          </h2>
          <div className="flex items-center gap-3">
            <Can permission="class_edit">
              <Link href={`/courses/${params.id}/classes/${params.class_id}/edit`}>
                <Button className="h-10 px-6 bg-primary hover:bg-primary/90 transition-all active:scale-95 whitespace-nowrap gap-2 shadow-md shadow-primary/20">
                  <Pencil className="h-4 w-4" />
                  <span className="text-sm font-bold">Chỉnh sửa</span>
                </Button>
              </Link>
            </Can>
          </div>
        </div>
      )
    }
    return () => {
      setHeaderContent(null)
    }
  }, [setHeaderContent, data, params.id, params.class_id])

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return "N/A"
    // Handle HH:mm:ss format
    return timeString.split(":").slice(0, 2).join(":")
  }


  const handleBack = () => {
    if (data?.course_id) {
      router.push(`/admin/courses/${data.course_id}/classes`)
    } else {
      router.back()
    }
  }

  if (isLoading) {
    return <ClassDetailSkeleton />
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <div className="size-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
          <Archive className="size-8" />
        </div>
        <h2 className="text-xl font-semibold">{error || "Không tìm thấy dữ liệu"}</h2>
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
      </div>
    )
  }

  const getAvatarUrl = (url?: string) => {
    if (!url) return ""
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url
    }
    return `${process.env.NEXT_PUBLIC_API_IMAGE_URL || ""}${url}`
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teachers = (data?.teachers_basic_info || []).map((teacher: any) => ({
    id: teacher.id,
    name: `${teacher.last_name || ""} ${teacher.first_name || ""}`.trim(),
    avatar: getAvatarUrl(teacher.avatar_url),
    email: teacher.email
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const students = (data?.student_basic_info || []).map((student: any) => ({
    id: student.id,
    name: `${student.last_name || ""} ${student.first_name || ""}`.trim(),
    avatar: getAvatarUrl(student.avatar_url)
  }))

  const statusConfig = getStatusConfig(data.status)

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Information Card */}
          <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary transition-all group-hover:w-2" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Thông tin chung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="size-4 text-primary/70" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Ngày bắt đầu</span>
                  </div>
                  <p className="text-sm font-semibold">{formatDate(data.start_date)}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="size-4 text-primary/70" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Ngày kết thúc</span>
                  </div>
                  <p className="text-sm font-semibold">{formatDate(data.end_date)}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="size-4 text-primary/70" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Số lượng tối đa</span>
                  </div>
                  <p className="text-sm font-semibold">{data.max_students} học viên</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <Video className="size-4 text-primary/70" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Link học tập</span>
                  </div>
                  {data.meeting_url ? (
                    <a
                      href={data.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 group/link truncate"
                    >
                      Mở link
                      <ExternalLink className="size-3 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Chưa có</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Card */}
          <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 transition-all group-hover:w-2" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Lịch học
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.class_schedules?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.class_schedules
                    .slice()
                    .sort((a: ScheduleItem, b: ScheduleItem) => {
                      const dayA = (Number(a.day_of_week) === 1 || Number(a.day_of_week) === 8) ? 8 : Number(a.day_of_week);
                      const dayB = (Number(b.day_of_week) === 1 || Number(b.day_of_week) === 8) ? 8 : Number(b.day_of_week);
                      return dayA - dayB;
                    })
                    .map((schedule: ScheduleItem, idx: number) => {
                      const dayLabel = dayMap[schedule.day_of_week as number] || String(schedule.day_of_week)
                      const dayConfig = getDayConfig(schedule.day_of_week)
                      return (
                        <div
                          key={schedule.id || idx}
                          className="flex flex-col gap-3 p-4 rounded-xl border bg-background/40 hover:bg-background hover:shadow-md transition-all group/item"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`size-12 rounded-2xl ${dayConfig.bg} ${dayConfig.color} flex items-center justify-center font-black text-lg shadow-sm border border-current/10`}>
                              {dayLabel.replace("Thứ ", "T").replace("Chủ nhật", "CN")}
                            </div>
                            <div>
                              <p className="font-bold text-base leading-tight">{dayLabel}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Hàng tuần</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="w-full justify-center py-1.5 font-mono text-sm bg-muted/50 text-foreground/80 border-none">
                            <Clock3 className="size-3.5 mr-2 opacity-60" />
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                          </Badge>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground italic border-2 border-dashed rounded-xl flex flex-col items-center gap-2">
                  <Clock3 className="size-10 opacity-20" />
                  <p>Chưa thiết lập lịch học cho lớp này</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Students Card */}
          <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 transition-all group-hover:w-2" />
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-500" />
                  Danh sách học viên
                </CardTitle>
                <CardDescription>
                  {students.length} học viên đã đăng ký
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {students.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {students.map((student: StudentItem) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-2 p-2 rounded-xl border bg-background/40 hover:border-blue-300 hover:bg-background transition-all hover:shadow-sm group/student"
                    >
                      <Avatar className="size-8 border-2 border-background shadow-sm">
                        <AvatarImage src={student.avatar} alt={student.name} />
                        <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-[10px]">
                          {student.name?.substring(0, 2).toUpperCase() || "ST"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate group-hover/student:text-blue-600 transition-colors">
                          {student.name || "N/A"}
                        </p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-tighter">Học viên</p>
                      </div>
                    </div>
                  ))}
                  {students.length > 20 && (
                    <div className="flex items-center justify-center p-2 rounded-xl border border-dashed text-muted-foreground hover:text-primary hover:border-primary transition-all cursor-pointer text-xs font-bold uppercase tracking-tight">
                      +{students.length - 20} học viên khác
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl space-y-2">
                  <Users className="size-10 opacity-20" />
                  <p>Chưa có học viên nào tham gia lớp này</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Teacher & Side info */}
        <div className="space-y-8">
          {/* Teachers Section */}
          <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 transition-all group-hover:w-2" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-500" />
                Giáo viên phụ trách
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teachers.length > 0 ? (
                <div className="space-y-3">
                  {teachers.map((teacher: TeacherItem) => (
                    <div
                      key={teacher.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl border bg-background/50 hover:border-emerald-200 transition-all hover:shadow-sm"
                    >
                      <Avatar className="size-10 border-2 border-emerald-100 shadow-sm">
                        <AvatarImage src={teacher.avatar} alt={teacher.name} />
                        <AvatarFallback className="bg-emerald-50 text-emerald-600 font-bold text-xs">
                          {teacher.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate leading-tight">{teacher.name}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Mail className="size-2.5" />
                          {teacher.email || "teacher@goedu.vn"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground italic border-2 border-dashed rounded-xl text-sm">
                  Chưa phân công giáo viên
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions / Stats */}
          <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary transition-all group-hover:w-2" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
                <div className="size-6 rounded-md bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="size-4" />
                </div>
                Tóm tắt lớp học
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Tỷ lệ lấp đầy</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-primary">
                        {Math.round((students.length / (data.max_students || 1)) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Users className="size-5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                    <span>{students.length} học viên</span>
                    <span>Tối đa {data.max_students}</span>
                  </div>
                  <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-1000 shadow-[0_0_8px_rgba(var(--primary),0.4)]"
                      style={{ width: `${Math.min(100, (students.length / (data.max_students || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Trạng thái</p>
                  <Badge className={`${statusConfig.color} border-none shadow-none text-[11px] font-bold py-0 h-5`}>
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-1 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Lịch học</p>
                  <p className="font-bold text-sm text-foreground">{data.class_schedules?.length || 0} buổi/tuần</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ClassDetailSkeleton() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[250px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
        <div className="space-y-8">
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <Skeleton className="h-[250px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
