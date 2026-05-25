"use client"

import { ChevronLeft, Edit } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

interface AttendanceRecord {
  student_id: number
  student_name: string
  status: number | string
}

interface AttendanceDetail {
  class_name: string
  teacher_name: string
  date: string
  total_students: number
  class_session: number
  attendance_records: AttendanceRecord[]
}

export default function AttendanceDetailPage() {
  const params = useParams()
  const classId = params.id as string
  const sessionId = params.attendance_id as string

  const [detail, setDetail] = React.useState<AttendanceDetail | null>(null)
  const [loading, setLoading] = React.useState(true)

  const fetchDetail = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get(`/teacher/classes/attendance/detail`, {
        params: {
          class_id: classId,
          class_session: sessionId,
        }
      })
      if (response.data?.status === 'success') {
        setDetail(response.data.data)
      } else {
        setDetail(null)
      }
    } catch (error) {
      console.error("Failed to fetch attendance detail:", error)
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [classId, sessionId])

  React.useEffect(() => {
    if (classId && sessionId) {
      fetchDetail()
    }
  }, [fetchDetail, classId, sessionId])

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
        <div className="flex justify-end gap-2">
           <Skeleton className="h-10 w-24" />
           <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-[250px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground text-lg">Không tìm thấy thông tin điểm danh</p>
        <Link href={`/teacher/classes/${classId}/attendance`}>
          <Button variant="outline">Quay lại danh sách</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex justify-end items-center gap-2">
        <Link href={`/teacher/classes/${classId}/attendance`}>
          <Button variant="outline" className="gap-2 font-medium bg-white text-muted-foreground border-border/60 hover:text-foreground">
            <ChevronLeft className="size-4" />
            Trở lại
          </Button>
        </Link>
        <Link href={`/teacher/classes/${classId}/attendance/${sessionId}/edit`}>
          <Button className="bg-[#3b82f6] hover:bg-blue-600 text-white gap-2 font-medium border-0">
            <Edit className="size-4" />
            Sửa
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-md overflow-hidden shadow-sm border border-blue-50">
        <div className="bg-[#f4f8ff] px-6 py-4 border-b border-blue-50">
          <h2 className="text-[#3b82f6] font-semibold text-base">Thông tin điểm danh</h2>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center px-6 py-4 border-b border-border/40">
            <div className="w-[200px] text-right pr-6 text-muted-foreground font-medium text-sm">Giáo viên điểm danh</div>
            <div className="font-semibold text-[#1e293b] text-sm">{detail.teacher_name}</div>
          </div>
          
          <div className="flex items-center px-6 py-4 border-b border-border/40">
            <div className="w-[200px] text-right pr-6 text-muted-foreground font-medium text-sm">Ngày</div>
            <div className="font-semibold text-[#1e293b] text-sm">{detail.date}</div>
          </div>
          
          <div className="flex items-center px-6 py-4 border-b border-border/40">
            <div className="w-[200px] text-right pr-6 text-muted-foreground font-medium text-sm">Tổng số học sinh</div>
            <div className="font-semibold text-[#1e293b] text-sm">{detail.total_students}</div>
          </div>
          
          <div className="flex items-center px-6 py-4">
            <div className="w-[200px] text-right pr-6 text-muted-foreground font-medium text-sm">Buổi</div>
            <div className="font-semibold text-[#1e293b] text-sm">{detail.class_session}</div>
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
            {detail.attendance_records.map((record, index) => (
              <TableRow key={record.student_id} className="hover:bg-transparent border-b-border/40 h-14">
                <TableCell className="text-center font-medium text-[#1e293b] text-sm">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium text-[#1e293b] text-sm">
                  {record.student_name}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <Checkbox 
                      checked={String(record.status) === "0"} 
                      className="pointer-events-none data-[state=checked]:bg-[#3b82f6] data-[state=checked]:border-[#3b82f6] size-[18px] rounded-sm"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <Checkbox 
                      checked={String(record.status) === "1"} 
                      className="pointer-events-none data-[state=checked]:bg-[#3b82f6] data-[state=checked]:border-[#3b82f6] size-[18px] rounded-sm"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <Checkbox 
                      checked={String(record.status) === "2"} 
                      className="pointer-events-none data-[state=checked]:bg-[#3b82f6] data-[state=checked]:border-[#3b82f6] size-[18px] rounded-sm"
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
