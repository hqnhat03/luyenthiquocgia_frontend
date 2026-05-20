"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { studentAxios as api } from "@/api/student"

interface TeacherBasicInfo {
  id: number;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface StudentClass {
  id: number;
  course_id: number;
  course_name: string;
  class_code: string;
  total_tests: number;
  completed_tests: number;
  pending_tests: number;
  teachers_basic_info: TeacherBasicInfo[];
}

interface StudentRegistration {
  course_id: number;
  course_name: string;
  registration_date?: string;
  note?: string;
}

const getAvatarUrl = (url?: string) => {
  if (!url) return ""
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }
  return `${process.env.NEXT_PUBLIC_API_IMAGE_URL || ""}${url}`
}

export default function ClassesTable({ onRegistrationsLoad }: { onRegistrationsLoad?: (count: number) => void }) {
  const [classes, setClasses] = useState<StudentClass[]>([])
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true)
        const classesRes = await api.get('/classes?order_by_course_name=&order_by_pending_tests=&order_by_total_tests=')

        if (classesRes.data.status === 'success' || classesRes.data.success) {
          const rawData = classesRes.data.data || []
          
          // Filter active classes (items having class_code)
          const activeClasses = rawData.filter((item: any) => item.class_code)
          
          // Filter pending registrations (items having course_name but no class_code)
          const pendingRegistrations = rawData.filter((item: any) => !item.class_code && item.course_name)

          setClasses(activeClasses)
          setRegistrations(pendingRegistrations)
          
          if (onRegistrationsLoad) {
            onRegistrationsLoad(pendingRegistrations.length)
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard classes:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchClasses()
  }, [onRegistrationsLoad])

  return (
    <div className="space-y-6">
      {/* Recent Classes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Lớp học hiện tại</h2>
          <Link href="/classes">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              Xem tất cả <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700 py-3.5 pl-6">Tên khóa học</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-3.5">Mã khóa học</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-3.5">Giáo viên</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-3.5 text-center">Bài được giao</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-3.5 text-center">Bài chưa làm</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 py-3.5 pr-6">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-8 w-20 ml-auto rounded-lg" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : classes.length === 0 ? (
          <Card className="border-dashed border-2 bg-slate-50/50">
            <CardContent className="p-10 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900">Chưa có lớp học nào</h3>
              <p className="text-sm text-slate-500 max-w-[200px] mt-1">Bạn chưa tham gia lớp học nào trong thời gian này.</p>
              <Link href="/courses" className="mt-4">
                <Button size="sm" variant="outline">Khám phá khóa học</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/75 border-b border-slate-100">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold text-slate-700 py-3.5 pl-6">Tên khóa học</TableHead>
                  <TableHead className="font-bold text-slate-700 py-3.5">Mã khóa học</TableHead>
                  <TableHead className="font-bold text-slate-700 py-3.5">Giáo viên</TableHead>
                  <TableHead className="font-bold text-slate-700 py-3.5 text-center">Bài được giao</TableHead>
                  <TableHead className="font-bold text-slate-700 py-3.5 text-center">Bài chưa làm</TableHead>
                  <TableHead className="text-right font-bold text-slate-700 py-3.5 pr-6">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((cls) => (
                  <TableRow key={cls.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100/50">
                    <TableCell className="font-semibold text-slate-900 py-4 pl-6 min-w-[220px]">
                      {cls.course_name}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-slate-500 py-4">
                      {cls.class_code}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        {cls.teachers_basic_info && cls.teachers_basic_info.length > 0 ? (
                          <>
                            <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                              {cls.teachers_basic_info.slice(0, 3).map((teacher) => (
                                <Avatar key={teacher.id} className="h-6 w-6 border-2 border-white shrink-0 ring-1 ring-slate-100">
                                  <AvatarImage src={getAvatarUrl(teacher.avatar_url || undefined)} alt={teacher.first_name} />
                                  <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-[8px]">
                                    {teacher.first_name.substring(0, 1).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                              {cls.teachers_basic_info.slice(0, 2).map(t => `${t.last_name || ""} ${t.first_name || ""}`.trim()).join(", ")}
                              {cls.teachers_basic_info.length > 2 && (
                                <span className="text-blue-600 font-medium"> +{cls.teachers_basic_info.length - 2}</span>
                              )}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa phân công</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-700 py-4">
                      {cls.total_tests} bài
                    </TableCell>
                    <TableCell className="text-center py-4">
                      {cls.pending_tests > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full text-xs">
                          {cls.pending_tests} bài
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-full text-xs">
                          0 bài
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-4 pr-6">
                      <Link href={`/class/${cls.id}/bulletin`}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-8 px-3 font-bold group/btn text-xs shadow-sm shadow-blue-100 transition-all">
                          Chi tiết
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pending Course Registrations Section */}
      {!isLoading && registrations.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-900">Khóa học chờ xếp lớp</h2>
            <p className="text-xs text-slate-500 mt-1">
              Các khóa học bạn đã đăng ký và đang được ban quản trị sắp xếp lớp học.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {registrations.map((reg) => (
              <Card key={reg.course_id} className="group border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden">
                <CardContent className="p-5 flex flex-col justify-between h-full min-h-[140px]">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Clock size={10} /> Chờ xếp lớp
                      </span>
                      {reg.registration_date && (
                        <span className="text-[10px] font-medium text-slate-400">
                          Đăng ký: {new Date(reg.registration_date).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1 text-sm">
                      {reg.course_name}
                    </h3>

                    {reg.note && (
                      <p className="text-xs text-slate-500 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50 italic line-clamp-2">
                        &ldquo;{reg.note}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end mt-4 pt-2 border-t border-slate-50">
                    <Button disabled size="sm" variant="ghost" className="h-7 text-[11px] font-bold text-slate-400 bg-slate-50 select-none">
                      Đang chuẩn bị...
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
