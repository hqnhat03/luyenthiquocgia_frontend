"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import api from "@/lib/axios"
import { format } from "date-fns"
import {
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Clock,
  GraduationCap,
  Search,
  User,
  Users
} from "lucide-react"
import { useParams } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

interface Schedule {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
}

interface Teacher {
  id: number
  name: string
  avatar: string
}

interface Student {
  id: number
  name: string
  avatar: string
  email?: string
  phone?: string
}

interface ClassDetail {
  id: number
  class_code: string
  start_day: string
  end_day: string
  max_student: number
  student_count: number
  meeting_url: string
  status: string
  course_name: string
  schedules: Schedule[]
  teachers: Teacher[]
  students: Student[]
}

const getDayName = (day: number) => {
  const days: Record<number, string> = {
    2: "Thứ Hai",
    3: "Thứ Ba",
    4: "Thứ Tư",
    5: "Thứ Năm",
    6: "Thứ Sáu",
    7: "Thứ Bảy",
    8: "Chủ Nhật",
    1: "Chủ Nhật"
  }
  return days[day] || `Thứ ${day}`
}

const formatTime = (time: string) => {
  return time.split(":").slice(0, 2).join(":")
}

const getAvatarUrl = (url?: string) => {
  if (!url) return ""
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }
  return `${process.env.NEXT_PUBLIC_API_IMAGE_URL || ""}${url}`
}

const getStatusLabel = (status: string | number) => {
  const s = String(status);
  if (s === "2" || s === "published") return "published";
  if (s === "0" || s === "draft") return "Bản nháp";
  if (s === "1" || s === "archived") return "Lưu trữ";
  return s;
}

export default function ClassDetailPage() {
  const params = useParams()
  const [classDetail, setClassDetail] = React.useState<ClassDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredStudents = React.useMemo(() => {
    if (!classDetail?.students) return []
    return classDetail.students.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toString().includes(searchQuery)
    )
  }, [classDetail?.students, searchQuery])

  React.useEffect(() => {
    const fetchClassDetail = async () => {
      try {
        setLoading(true)
        const response = await api.get('/teacher/classes/detail', {
          params: { id: params.id }
        })
        if (response.data?.status === "success" || response.data?.success) {
          const data = response.data.data
          const classes = data?.classes || {}
          
          const mappedDetail: ClassDetail = {
            id: classes.id,
            class_code: classes.class_code || "",
            start_day: classes.start_date || classes.start_day || "",
            end_day: classes.end_date || classes.end_day || "",
            max_student: classes.max_students ?? classes.max_student ?? 0,
            student_count: classes.total_students ?? classes.student_count ?? 0,
            meeting_url: classes.meeting_url || "",
            status: getStatusLabel(classes.status),
            course_name: classes.course_name || "",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            schedules: (classes.class_schedules || []).map((s: any) => ({
              id: String(s.id),
              day_of_week: Number(s.day_of_week),
              start_time: s.start_time,
              end_time: s.end_time
            })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            teachers: (data.teachers || []).map((t: any) => ({
              id: t.id,
              name: `${t.last_name || ""} ${t.first_name || ""}`.trim() || t.name || "Chưa cập nhật",
              avatar: getAvatarUrl(t.avatar_url || t.avatar),
            })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            students: (data.students || []).map((s: any) => ({
              id: s.id,
              name: `${s.last_name || ""} ${s.first_name || ""}`.trim() || s.name || "Chưa cập nhật",
              avatar: getAvatarUrl(s.avatar_url || s.avatar),
              email: s.email,
              phone: s.phone || s.phone_number || "",
            }))
          }
          setClassDetail(mappedDetail)
        } else {
          toast.error(response.data?.message || "Không thể tải thông tin lớp học")
        }
      } catch (error) {
        console.error("Failed to fetch class detail:", error)
        toast.error("Đã có lỗi xảy ra khi kết nối đến máy chủ")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchClassDetail()
    }
  }, [params.id])

  if (loading) {
    return <ClassDetailSkeleton />
  }

  if (!classDetail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="p-4 rounded-full bg-muted">
          <GraduationCap className="size-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">Không tìm thấy lớp học</h2>
        <p className="text-muted-foreground">Thông tin lớp học không tồn tại hoặc bạn không có quyền truy cập.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Quay lại
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <span>Quản lý lớp học</span>
          <ChevronRight className="size-4 opacity-50" />
          <span className="text-primary font-semibold">{classDetail.class_code}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                {classDetail.class_code}
              </h1>
              <Badge
                variant="outline"
                className={`
                  px-3 py-1 rounded-full font-bold text-[11px] uppercase tracking-wider
                  ${classDetail.status === 'published'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}
                `}
              >
                {classDetail.status === 'published' ? 'Đang hoạt động' : classDetail.status}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground font-medium">
              {classDetail.course_name}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="rounded-xl border-none shadow-sm bg-gradient-to-br from-blue-500/10 to-transparent overflow-hidden group py-0">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3.5 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 scale-100 group-hover:scale-110 transition-transform">
                  <Users className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Số lượng học sinh</p>
                  <p className="text-2xl font-black">{classDetail.student_count} / {classDetail.max_student}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-none shadow-sm bg-gradient-to-br from-purple-500/10 to-transparent overflow-hidden group py-0">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3.5 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 scale-100 group-hover:scale-110 transition-transform">
                  <CalendarDays className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Thời gian khóa học</p>
                  <p className="text-sm font-black pt-1">
                    {format(new Date(classDetail.start_day), 'dd/MM/yyyy')} - {format(new Date(classDetail.end_day), 'dd/MM/yyyy')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schedule Section */}
          <Card className="rounded-xl border-border/40 shadow-sm overflow-hidden bg-background/60 backdrop-blur-xl py-0">
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-4 px-6 pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Clock className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Lịch học cố định</CardTitle>
                  <CardDescription className="font-medium text-muted-foreground">Khung giờ lên lớp hàng tuần</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/20">
                {classDetail.schedules.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground font-medium">
                    Chưa có lịch học được thiết lập
                  </div>
                ) : (
                  classDetail.schedules.map((schedule) => (
                    <div key={schedule.id} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className="w-28">
                          <Badge variant="secondary" className="px-3 py-1 rounded-lg text-sm font-bold w-full justify-center">
                            {getDayName(schedule.day_of_week)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 font-black text-lg">
                          <span>{formatTime(schedule.start_time)}</span>
                          <span className="text-muted-foreground font-medium">→</span>
                          <span className="text-primary">{formatTime(schedule.end_time)}</span>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                        <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        Online Zoom
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Students List Section */}
          <Card className="rounded-xl border-border/40 shadow-sm overflow-hidden bg-background/60 backdrop-blur-xl py-0">
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-4 px-6 pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Danh sách học sinh</CardTitle>
                    <CardDescription className="font-medium text-muted-foreground">Tổng số {classDetail.students?.length || 0} học sinh trong lớp</CardDescription>
                  </div>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm học sinh..."
                    className="pl-9 bg-background/50 border-border/40 rounded-lg focus-visible:ring-primary/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-border/20">
                      <TableHead className="w-[80px] font-bold text-xs uppercase tracking-wider pl-6">STT</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Học sinh</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Email</TableHead>
                      <TableHead className="text-right font-bold text-xs uppercase tracking-wider pr-6">Đánh giá cuối khóa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground font-medium">
                          {searchQuery ? "Không tìm thấy học sinh phù hợp" : "Chưa có học sinh nào tham gia lớp học"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student, index) => (
                        <TableRow key={student.id} className="hover:bg-muted/30 transition-colors border-border/10">
                          <TableCell className="pl-6 font-medium text-muted-foreground">
                            {(index + 1).toString().padStart(2, '0')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="size-10 border border-border/40">
                                <AvatarImage src={student.avatar} alt={student.name} />
                                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                  {student.name ? student.name.charAt(0).toUpperCase() : "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-black text-sm">{student.name || "Chưa cập nhật"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-semibold text-muted-foreground">{student.email || "---"}</span>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-lg h-9 px-4 font-bold border-2 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary transition-all duration-300 gap-1.5 shadow-sm"
                              onClick={() => {
                                toast.info(`Chức năng đánh giá cuối khóa cho học sinh ${student.name || ""} đang được phát triển.`)
                              }}
                            >
                              <ClipboardCheck className="size-4" />
                              <span>Đánh giá</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info Area */}
        <div className="space-y-8">
          {/* Teacher Info */}
          <Card className="rounded-xl border-border/40 shadow-sm overflow-hidden bg-background/60 backdrop-blur-xl py-0">
            <CardHeader className="border-b border-border/40 bg-muted/20 px-6 pt-6 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <User className="size-5 text-primary" />
                Giảng viên phụ trách
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {classDetail.teachers.map((teacher) => (
                <div key={teacher.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-border/40 group">
                  <Avatar className="size-14 border-2 border-primary/10 group-hover:border-primary/30 transition-all">
                    <AvatarImage src={teacher.avatar} alt={teacher.name} />
                    <AvatarFallback className="bg-primary/5 text-primary font-bold">
                      {teacher.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5">
                    <p className="font-black text-lg group-hover:text-primary transition-colors">{teacher.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-black px-1.5 py-0">Giảng viên</Badge>
                      <span className="text-xs text-muted-foreground font-medium italic">Chính thức</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ClassDetailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
          <Skeleton className="h-12 w-40 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
        <div className="space-y-8">
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
