"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  History,
  Info,
  Save,
  Search,
  UserCheck,
  UserX,
  Users
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

interface AttendanceRecord {
  student_id: number
  student_name: string
  student_avatar?: string
  status: 'present' | 'absent' | 'late' | 'not_set'
  note?: string
}

interface SessionInfo {
  id: number
  class_code: string
  date: string
  start_time: string
  end_time: string
  course_name?: string
}

interface StudentListItem {
  student_id: number
  name?: string
  student_name?: string
  avatar?: string
  status?: 'present' | 'absent' | 'late' | 'not_set'
  note?: string
}

export default function AttendancePage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [session, setSession] = React.useState<SessionInfo | null>(null)
  const [attendance, setAttendance] = React.useState<AttendanceRecord[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/teacher/sessions/${params.id}/students`)

        if (response.data?.success) {
          const data = response.data.data
          const studentList = Array.isArray(data.students) ? data.students : []

          const records: AttendanceRecord[] = studentList.map((record: StudentListItem) => ({
            student_id: record.student_id,
            student_name: record.name || record.student_name || "Unknown",
            student_avatar: record.avatar,
            status: record.status || 'present',
            note: record.note || ""
          }))
          setAttendance(records)
          setSession(data.session)
        } else {
          toast.error("Không thể tải danh sách học sinh")
        }
      } catch (error) {
        console.error("Failed to fetch attendance data:", error)
        toast.error("Đã có lỗi xảy ra")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchData()
    }
  }, [params.id])

  const handleStatusChange = (studentId: number, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => prev.map(item =>
      item.student_id === studentId ? { ...item, status } : item
    ))
  }

  const handleNoteChange = (studentId: number, note: string) => {
    setAttendance(prev => prev.map(item =>
      item.student_id === studentId ? { ...item, note } : item
    ))
  }

  const saveAttendance = async () => {
    try {
      setSaving(true)
      const payload = {
        attendance: attendance.map(item => ({
          student_id: item.student_id,
          status: item.status,
          note: item.note || ""
        }))
      }
      const response = await api.post(`/teacher/sessions/${params.id}/attendance`, payload)
      if (response.data?.success) {
        toast.success("Lưu điểm danh thành công")
        router.back()
      } else {
        toast.error(response.data?.message || "Không thể lưu điểm danh")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Lỗi khi lưu điểm danh")
    } finally {
      setSaving(false)
    }
  }

  const filteredAttendance = attendance.filter(item =>
    item.student_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
  }

  if (loading) {
    return <AttendanceSkeleton />
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p>Không tìm thấy buổi học</p>
        <Button onClick={() => router.back()}>Quay lại</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 h-8 gap-1">
            <ArrowLeft className="size-4" /> Quay lại
          </Button>
          <ChevronRight className="size-4 opacity-50" />
          <span>Điểm danh</span>
          <ChevronRight className="size-4 opacity-50" />
          <span className="text-primary font-semibold">{session.class_code}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-background/60 backdrop-blur-xl p-6 rounded-3xl border border-border/40 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                Điểm danh lớp {session.class_code}
              </h1>

            </div>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground font-medium text-sm">
              <span className="flex items-center gap-1.5"><Calendar className="size-4 text-primary/60" /> {format(new Date(session.date), "dd/MM/yyyy")}</span>
              <span className="flex items-center gap-1.5"><Clock className="size-4 text-primary/60" /> {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}</span>
            </div>
          </div>
          <Button
            onClick={saveAttendance}
            disabled={saving}
            className="bg-primary text-primary-foreground font-bold px-8 h-12 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all gap-2"
          >
            {saving ? (
              <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="size-5" />
            )}
            LƯU ĐIỂM DANH
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none bg-blue-500/10 shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-600"><Users className="size-5" /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-blue-600/70">Tổng số</p>
              <p className="text-xl font-black">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none bg-emerald-500/10 shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-600"><UserCheck className="size-5" /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-600/70">Hiện diện</p>
              <p className="text-xl font-black">{stats.present}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none bg-orange-500/10 shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-orange-500/20 text-orange-600"><History className="size-5" /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-orange-600/70">Đi muộn</p>
              <p className="text-xl font-black">{stats.late}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none bg-rose-500/10 shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-600"><UserX className="size-5" /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-rose-600/70">Vắng mặt</p>
              <p className="text-xl font-black">{stats.absent}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/60 backdrop-blur-xl">
        <CardHeader className="bg-muted/30 border-b border-border/20 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">Danh sách điểm danh</CardTitle>
              <CardDescription className="text-xs font-medium">Tích chọn trạng thái cho từng học sinh</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Tìm học sinh..."
                className="pl-9 bg-background/50 border-border/40 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="border-border/10 hover:bg-transparent">
                  <TableHead className="w-[60px] pl-6 text-[10px] font-black uppercase">STT</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Học sinh</TableHead>
                  <TableHead className="w-[300px] text-[10px] font-black uppercase text-center">Trạng thái</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center text-muted-foreground italic">
                      {searchQuery ? "Không tìm thấy học sinh" : "Không có học sinh trong danh sách"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttendance.map((item, index) => (
                    <TableRow key={item.student_id} className="border-border/5 hover:bg-muted/5 transition-colors">
                      <TableCell className="pl-6 font-medium text-muted-foreground text-xs">
                        {(index + 1).toString().padStart(2, '0')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 border border-border/40 shadow-sm">
                            <AvatarImage src={item.student_avatar} />
                            <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                              {item.student_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{item.student_name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">ID: #{item.student_id}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5 p-1 bg-muted/20 rounded-lg w-fit mx-auto border border-border/10">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all",
                              item.status === 'present'
                                ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
                                : "hover:bg-emerald-500/10 text-emerald-600"
                            )}
                            onClick={() => handleStatusChange(item.student_id, 'present')}
                          >
                            <CheckCircle2 className={cn("size-3.5 mr-1", item.status === 'present' ? "block" : "hidden")} />
                            Hiện diện
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all",
                              item.status === 'late'
                                ? "bg-orange-500 text-white shadow-sm hover:bg-orange-600"
                                : "hover:bg-orange-500/10 text-orange-600"
                            )}
                            onClick={() => handleStatusChange(item.student_id, 'late')}
                          >
                            <History className={cn("size-3.5 mr-1", item.status === 'late' ? "block" : "hidden")} />
                            Muộn
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all",
                              item.status === 'absent'
                                ? "bg-rose-500 text-white shadow-sm hover:bg-rose-600"
                                : "hover:bg-rose-500/10 text-rose-600"
                            )}
                            onClick={() => handleStatusChange(item.student_id, 'absent')}
                          >
                            <UserX className={cn("size-3.5 mr-1", item.status === 'absent' ? "block" : "hidden")} />
                            Vắng mặt
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="relative group">
                          <Info className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground opacity-40 group-focus-within:text-primary transition-colors" />
                          <Input
                            placeholder="Thêm ghi chú..."
                            value={item.note || ""}
                            onChange={(e) => handleNoteChange(item.student_id, e.target.value)}
                            className="h-9 text-xs pl-9 bg-transparent border-transparent hover:border-border/40 focus:border-primary/40 focus:bg-background/50 rounded-lg transition-all"
                          />
                        </div>
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
  )
}

function AttendanceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded-lg" />
      <div className="h-32 bg-muted rounded-3xl" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-muted rounded-lg" />)}
      </div>
      <div className="h-[400px] bg-muted rounded-xl" />
    </div>
  )
}
