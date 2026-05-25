"use client"

import { ChevronLeft, Save, Users } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

interface Student {
  id: number
  first_name: string
  last_name: string
  email: string
  avatar_url: string | null
}

interface ClassDetailResponse {
  classes: {
    id: number
    course_name: string
    class_code: string
    total_students: number
  }
  teachers: Array<{
    id: number
    first_name: string
    last_name: string
  }>
  students: Student[]
}

export default function CreateAttendancePage() {
  const params = useParams()
  const router = useRouter()
  const classId = params.id as string

  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [classDetail, setClassDetail] = React.useState<ClassDetailResponse | null>(null)
  
  const [sessionNumber, setSessionNumber] = React.useState<number>(1)
  const [attendanceData, setAttendanceData] = React.useState<Record<number, number>>({})

  const fetchClassDetail = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get(`/teacher/classes/detail`, {
        params: { id: classId }
      })
      if (response.data?.status === 'success') {
        const data = response.data.data
        setClassDetail(data)
        
        // Initialize attendance data with 0 (Present) for all students
        if (data.students && Array.isArray(data.students)) {
          const initialData: Record<number, number> = {}
          data.students.forEach((student: Student) => {
            initialData[student.id] = 0
          })
          setAttendanceData(initialData)
        }
      } else {
        toast.error("Không thể tải thông tin lớp học")
      }
    } catch (error) {
      console.error("Failed to fetch class detail:", error)
      toast.error("Đã xảy ra lỗi khi tải dữ liệu")
    } finally {
      setLoading(false)
    }
  }, [classId])

  React.useEffect(() => {
    if (classId) {
      fetchClassDetail()
    }
  }, [fetchClassDetail, classId])

  const handleStatusChange = (studentId: number, status: number) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleSubmit = async () => {
    if (!classDetail) return

    if (!sessionNumber || sessionNumber < 1) {
      toast.error("Vui lòng nhập buổi học hợp lệ")
      return
    }

    const studentsPayload = Object.entries(attendanceData).map(([studentId, status]) => ({
      student_id: Number(studentId),
      status: status
    }))

    const payload = {
      class_id: Number(classId),
      class_session: sessionNumber,
      students: studentsPayload
    }

    try {
      setSubmitting(true)
      const response = await api.post(`/teacher/classes/attendance`, payload)
      if (response.data?.status === 'success') {
        toast.success(response.data.message || "Tạo phiên điểm danh thành công")
        router.push(`/teacher/classes/${classId}/attendance`)
      } else {
        let errorMsg = "Không thể tạo phiên điểm danh"
        if (typeof response.data?.message === 'string') {
          errorMsg = response.data.message
        } else if (typeof response.data?.message === 'object' && response.data.message !== null) {
          const firstKey = Object.keys(response.data.message)[0]
          if (firstKey && Array.isArray(response.data.message[firstKey])) {
            errorMsg = response.data.message[firstKey][0]
          }
        }
        toast.error(errorMsg)
      }
    } catch (error: any) {
      console.error("Failed to create attendance:", error)
      if (error.response?.status === 422 && error.response?.data?.message) {
        const messageData = error.response.data.message
        if (typeof messageData === 'object') {
          const firstKey = Object.keys(messageData)[0]
          if (firstKey && Array.isArray(messageData[firstKey]) && messageData[firstKey].length > 0) {
            toast.error(messageData[firstKey][0])
            return
          }
        }
      }
      
      const errorMessage = typeof error.response?.data?.message === 'string' 
        ? error.response.data.message 
        : "Đã xảy ra lỗi khi lưu dữ liệu"
        
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectAll = (status: number) => {
    if (!classDetail?.students) return
    const newData: Record<number, number> = {}
    classDetail.students.forEach(student => {
      newData[student.id] = status
    })
    setAttendanceData(newData)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (!classDetail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="p-4 rounded-full bg-muted">
          <Users className="size-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">Không tìm thấy thông tin</h2>
        <Link href={`/teacher/classes/${classId}/attendance`}>
          <Button variant="outline">Quay lại danh sách</Button>
        </Link>
      </div>
    )
  }

  const teacherName = classDetail.teachers && classDetail.teachers.length > 0 
    ? `${classDetail.teachers[0].last_name || ''} ${classDetail.teachers[0].first_name || ''}`.trim()
    : "Chưa cập nhật"

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex justify-end items-center gap-2">
        <Link href={`/teacher/classes/${classId}/attendance`}>
          <Button variant="outline" className="gap-2 font-medium bg-white text-muted-foreground border-border/60 hover:text-foreground">
            <ChevronLeft className="size-4" />
            Trở lại
          </Button>
        </Link>
        <Button 
          onClick={handleSubmit} 
          disabled={submitting || classDetail.students?.length === 0}
          className="bg-[#3b82f6] hover:bg-blue-600 text-white gap-2 font-medium border-0"
        >
          <Save className="size-4" />
          {submitting ? "Đang lưu..." : "Lưu"}
        </Button>
      </div>

      <div className="bg-white rounded-md overflow-hidden shadow-sm border border-blue-50">
        <div className="bg-[#f4f8ff] px-6 py-4 border-b border-blue-50">
          <h2 className="text-[#3b82f6] font-semibold text-base">Thông tin điểm danh</h2>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center px-6 py-4 border-b border-border/40">
            <div className="w-[200px] text-right pr-6 text-muted-foreground font-medium text-sm">Giáo viên điểm danh</div>
            <div className="font-semibold text-[#1e293b] text-sm">{teacherName}</div>
          </div>
          
          <div className="flex items-center px-6 py-4 border-b border-border/40">
            <div className="w-[200px] text-right pr-6 text-muted-foreground font-medium text-sm">Ngày</div>
            <div className="font-semibold text-[#1e293b] text-sm">
              {new Date().toLocaleDateString('vi-VN')}
            </div>
          </div>
          
          <div className="flex items-center px-6 py-4 border-b border-border/40">
            <div className="w-[200px] text-right pr-6 text-muted-foreground font-medium text-sm">Tổng số học sinh</div>
            <div className="font-semibold text-[#1e293b] text-sm">{classDetail.students?.length || 0}</div>
          </div>
          
          <div className="flex items-center px-6 py-4">
            <div className="w-[200px] text-right pr-6 text-muted-foreground font-medium text-sm">Buổi</div>
            <div className="flex-1">
              <Input 
                type="number" 
                min={1} 
                value={sessionNumber || ''} 
                onChange={(e) => setSessionNumber(parseInt(e.target.value) || 0)} 
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-md overflow-hidden shadow-sm border border-border/40">
        <Table>
          <TableHeader className="bg-[#f8fafc]">
            <TableRow className="hover:bg-transparent border-b-border/40 h-12">
              <TableHead className="w-[80px] text-center font-medium text-muted-foreground text-xs">STT</TableHead>
              <TableHead className="font-medium text-muted-foreground text-xs">Học sinh</TableHead>
              <TableHead className="w-[150px] text-center font-medium text-muted-foreground text-xs">Có mặt</TableHead>
              <TableHead className="w-[150px] text-center font-medium text-muted-foreground text-xs">Nghỉ có phép</TableHead>
              <TableHead className="w-[150px] text-center font-medium text-muted-foreground text-xs">Nghỉ không phép</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classDetail.students?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Lớp học chưa có học sinh nào.
                </TableCell>
              </TableRow>
            ) : (
              classDetail.students?.map((student, index) => {
                const studentName = `${student.last_name || ''} ${student.first_name || ''}`.trim()
                const status = attendanceData[student.id]
                
                return (
                  <TableRow key={student.id} className="hover:bg-transparent border-b-border/40 h-14">
                    <TableCell className="text-center font-medium text-[#1e293b] text-sm">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-[#1e293b] text-sm">
                      {studentName || "Chưa cập nhật"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox 
                          checked={status === 0} 
                          onCheckedChange={() => handleStatusChange(student.id, 0)}
                          className="data-[state=checked]:bg-[#3b82f6] data-[state=checked]:border-[#3b82f6] size-[18px] rounded-sm cursor-pointer"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox 
                          checked={status === 1} 
                          onCheckedChange={() => handleStatusChange(student.id, 1)}
                          className="data-[state=checked]:bg-[#3b82f6] data-[state=checked]:border-[#3b82f6] size-[18px] rounded-sm cursor-pointer"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox 
                          checked={status === 2} 
                          onCheckedChange={() => handleStatusChange(student.id, 2)}
                          className="data-[state=checked]:bg-[#3b82f6] data-[state=checked]:border-[#3b82f6] size-[18px] rounded-sm cursor-pointer"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
