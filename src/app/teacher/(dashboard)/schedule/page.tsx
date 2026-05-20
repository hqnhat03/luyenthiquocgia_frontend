"use client"

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
import { BookOpen, ClipboardList, ExternalLink, GraduationCap, Search, Video } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"

interface ClassSchedule {
  id: number
  class_id: number
  day_of_week: number
  start_time: string
  end_time: string
}

interface ClassItem {
  id: number
  class_code: string
  start_date: string
  end_date: string
  meeting_url?: string
  status?: string | number
  course_id: number
  course_name: string
  class_schedules: ClassSchedule[]
}

export default function SchedulePage() {
  const [loading, setLoading] = React.useState(false)
  const [classes, setClasses] = React.useState<ClassItem[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")

  const fetchSchedules = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get("/teacher/schedule-classes?pagination=100")
      if (response?.data?.status === "success") {
        setClasses(response.data.data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error)
      toast.error("Không thể tải lịch dạy")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const getDayName = (dayNum: number) => {
    if (dayNum === 8) return "Chủ nhật"
    return `Thứ ${dayNum}`
  }

  const filteredClasses = React.useMemo(() => {
    return classes.filter(cls => 
      cls.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.class_code.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [classes, searchQuery])

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-background/60 backdrop-blur-xl p-6 rounded-3xl border border-border/40 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-2 py-0.5 text-[10px] font-bold">Quản lý</Badge>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hệ thống lịch dạy</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Quản lý Lịch dạy & Lớp học
          </h1>
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <ClipboardList className="size-4 text-primary/60" />
            Bảng điều khiển quản lý và theo dõi thông tin các lớp học được phân công.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm khóa học, lớp học..."
            className="pl-9 bg-background/50 border-border/40 rounded-xl h-11 focus-visible:ring-primary focus-visible:border-primary/40 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table Container Card */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/60 backdrop-blur-xl rounded-2xl">
        <CardHeader className="bg-muted/30 border-b border-border/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">Danh sách lớp giảng dạy</CardTitle>
              <CardDescription className="text-xs font-medium">
                {filteredClasses.length > 0 
                  ? `Tìm thấy ${filteredClasses.length} lớp học được phân công`
                  : "Không có lớp học được hiển thị"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="border-border/10 hover:bg-transparent">
                  <TableHead className="w-[70px] pl-6 text-[10px] font-black uppercase text-center">STT</TableHead>
                  <TableHead className="text-[10px] font-black uppercase min-w-[200px]">Khóa học</TableHead>
                  <TableHead className="text-[10px] font-black uppercase min-w-[150px]">Lớp học</TableHead>
                  <TableHead className="text-[10px] font-black uppercase min-w-[280px]">Lịch học chi tiết</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-right pr-6 w-[200px]">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, rIndex) => (
                    <TableRow key={rIndex} className="border-border/5">
                      <TableCell className="pl-6 text-center"><Skeleton className="h-4 w-6 mx-auto rounded" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40 rounded" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28 rounded" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48 rounded" /></TableCell>
                      <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-20 ml-auto rounded-lg" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredClasses.length > 0 ? (
                  filteredClasses.map((cls, index) => (
                    <TableRow key={cls.id} className="border-border/5 hover:bg-muted/5 transition-colors">
                      <TableCell className="pl-6 font-bold text-muted-foreground/60 text-xs text-center">
                        {(index + 1).toString().padStart(2, '0')}
                      </TableCell>
                      <TableCell className="font-bold text-foreground py-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="size-4 text-primary/60 shrink-0" />
                          <span className="truncate max-w-[240px]">{cls.course_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground/80">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="size-4 text-primary/60 shrink-0" />
                          <span>{cls.class_code}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5 py-1">
                          {cls.class_schedules && cls.class_schedules.length > 0 ? (
                            cls.class_schedules.map((sched) => (
                              <Badge
                                key={sched.id}
                                variant="secondary"
                                className="px-2 py-0.5 text-[10px] font-semibold bg-primary/5 hover:bg-primary/10 text-primary border-none whitespace-nowrap transition-colors"
                              >
                                {getDayName(sched.day_of_week)}: {sched.start_time.slice(0, 5)} - {sched.end_time.slice(0, 5)}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[11px] text-muted-foreground/60 italic">Chưa có lịch</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="pr-6 text-right py-4">
                        <div className="flex items-center justify-end gap-2">
                          {cls.meeting_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 border-emerald-500/20 hover:bg-emerald-500/5 text-emerald-600 font-bold gap-1 text-[11px]"
                              onClick={() => window.open(cls.meeting_url, '_blank')}
                            >
                              <Video className="size-3.5" />
                              Vào lớp
                            </Button>
                          )}
                          <Link href={`/teacher/classes/${cls.id}`}>
                            <Button
                              size="sm"
                              className="h-8 px-3 bg-primary text-primary-foreground font-bold gap-1 text-[11px] hover:shadow transition-all group/btn"
                            >
                              Chi tiết
                              <ExternalLink className="size-3 group-hover/btn:translate-x-0.5 transition-transform" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="p-3.5 rounded-full bg-muted/50 animate-pulse">
                          <BookOpen className="size-8 text-muted-foreground/40" />
                        </div>
                        <p className="text-muted-foreground font-medium text-xs">Không tìm thấy lớp học nào phù hợp</p>
                        {searchQuery && (
                          <Button variant="link" size="sm" onClick={() => setSearchQuery("")} className="text-xs font-bold uppercase tracking-widest">Xóa tìm kiếm</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
