"use client"

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search
} from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import api from "@/lib/axios"
import Image from "next/image"

interface TeacherBasicInfo {
  id: number;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface Class {
  id: number;
  class_code: string;
  start_date: string;
  end_date: string;
  status: number;
  course_name: string;
  course_image: string | null;
  teachers_basic_info: TeacherBasicInfo[];
}

export default function ClassesPage() {
  const [classes, setClasses] = React.useState<Class[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalRecords, setTotalRecords] = React.useState(0)
  const [fromRecord, setFromRecord] = React.useState(0)
  const [toRecord, setToRecord] = React.useState(0)

  const fetchClasses = React.useCallback(async (page: number) => {
    setLoading(true)
    try {
      const response = await api.get(`/teacher/classes?page=${page}`)
      if (response.data?.status === "success") {
        const paginatedData = response.data.data
        setClasses(paginatedData.data || [])
        setCurrentPage(paginatedData.current_page || 1)
        setTotalPages(paginatedData.last_page || 1)
        setTotalRecords(paginatedData.total || 0)
        setFromRecord(paginatedData.from || 0)
        setToRecord(paginatedData.to || 0)
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchClasses(currentPage)
  }, [currentPage, fetchClasses])

  const filteredClasses = classes.filter(cls =>
    cls.class_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.course_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 2: // published
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">Đang hoạt động</Badge>
      case 0: // draft
        return <Badge variant="outline" className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">Bản nháp</Badge>
      case 1: // archived
        return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">Đã đóng</Badge>
      default:
        return <Badge variant="outline" className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Quản lý lớp học</h2>
          <p className="text-muted-foreground text-sm font-medium">Danh sách các lớp học bạn đang phụ trách giảng dạy.</p>
        </div>
      </div>

      <div className="bg-background/40 p-4 rounded-xl border border-border/40 backdrop-blur-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo mã lớp, tên khóa học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-border/40 bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="w-[120px] font-bold text-[11px] uppercase tracking-widest text-muted-foreground py-4">Mã lớp</TableHead>
                <TableHead className="min-w-[200px] font-bold text-[11px] uppercase tracking-widest text-muted-foreground py-4">Khóa học</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground py-4">Giảng viên</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground py-4">Ngày bắt đầu</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground py-4">Ngày kết thúc</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground py-4">Trạng thái</TableHead>
                <TableHead className="w-[140px] text-right py-4 font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border/20">
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredClasses.length > 0 ? (
                filteredClasses.map((cls) => (
                  <TableRow key={cls.id} className="group border-border/20 hover:bg-muted/20 transition-colors">
                    <TableCell className="py-4">
                      <span className="text-sm font-bold text-foreground flex items-center h-full">
                        {cls.class_code}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-56 h-40 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0 border border-border/40 shadow-md">
                          {cls.course_image ? (
                            <Image
                              src={cls.course_image.startsWith("http") ? cls.course_image : `${process.env.NEXT_PUBLIC_API_IMAGE_URL}${cls.course_image}`}
                              alt={cls.course_name}
                              width={224}
                              height={160}
                              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <BookOpen className="size-12 text-muted-foreground/60" />
                          )}
                        </div>
                        <span className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-2 max-w-[280px]">
                          {cls.course_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center -space-x-2 overflow-hidden">
                        {cls.teachers_basic_info && cls.teachers_basic_info.length > 0 ? (
                          cls.teachers_basic_info.map((teacher) => {
                            const fullName = `${teacher.first_name} ${teacher.last_name}`;
                            return (
                              <TooltipProvider key={teacher.id}>
                                <Tooltip>
                                  <TooltipTrigger render={
                                    <div className="inline-block size-8 rounded-full ring-2 ring-background overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-transform">
                                      <Avatar className="size-full">
                                        <AvatarImage src={teacher.avatar_url ? (teacher.avatar_url.startsWith("http") ? teacher.avatar_url : `${process.env.NEXT_PUBLIC_API_IMAGE_URL}${teacher.avatar_url}`) : ""} alt={fullName} />
                                        <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                                          {teacher.last_name ? teacher.last_name.charAt(0).toUpperCase() : "GV"}
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                  } />
                                  <TooltipContent>{fullName}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Chưa phân công</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-xs font-bold text-muted-foreground">
                        {cls.start_date ? new Date(cls.start_date).toLocaleDateString('vi-VN') : "---"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-xs font-bold text-muted-foreground">
                        {cls.end_date ? new Date(cls.end_date).toLocaleDateString('vi-VN') : "---"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      {getStatusBadge(cls.status)}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex items-center justify-end">
                        <Link href={`/teacher/classes/${cls.id}`}>
                          <Button
                            size="sm"
                            className="h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                          >
                            Chi tiết
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-4 rounded-full bg-muted/20">
                        <BookOpen className="size-8 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-bold text-muted-foreground">Không tìm thấy lớp học nào</p>
                      <Button variant="link" onClick={() => setSearchQuery("")} className="text-xs font-bold uppercase tracking-widest h-auto p-0">
                        Xóa bộ lọc
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 bg-muted/10">
              <p className="text-xs font-medium text-muted-foreground">
                Hiển thị từ <span className="font-bold text-foreground">{fromRecord}</span> đến{" "}
                <span className="font-bold text-foreground">{toRecord}</span> trong tổng số{" "}
                <span className="font-bold text-foreground">{totalRecords}</span> lớp học
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  disabled={currentPage === 1 || loading}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      className="h-8 w-8 rounded-lg text-xs font-bold"
                      disabled={loading}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  disabled={currentPage === totalPages || loading}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

