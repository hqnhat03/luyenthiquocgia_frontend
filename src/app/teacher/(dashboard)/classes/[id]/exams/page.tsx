"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
    ChevronRight,
    ClipboardList,
    Eye,
    FileText,
    HelpCircle,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

interface ClassTest {
    id: number
    title: string
    end_time: string
    status: number
    submission_ratio: string
}

export default function ClassExamsPage() {
    const params = useParams()
    const classId = params.id as string
    
    const [classInfo, setClassInfo] = React.useState<{ class_code: string; course_name: string } | null>(null)
    const [tests, setTests] = React.useState<ClassTest[]>([])
    const [loading, setLoading] = React.useState(true)
    
    // Pagination states
    const [currentPage, setCurrentPage] = React.useState(1)
    const [totalPages, setTotalPages] = React.useState(1)
    const [totalTests, setTotalTests] = React.useState(0)
    const [paginationLimit] = React.useState(5)

    const fetchExams = React.useCallback(async (page: number = 1) => {
        if (!classId) return
        try {
            setLoading(true)
            const response = await api.get(`/teacher/class-tests/for-class`, {
                params: {
                    class_id: classId,
                    page: page,
                    pagination: paginationLimit,
                }
            })
            if (response.data?.status === "success") {
                const resData = response.data.data
                setClassInfo({
                    class_code: resData.class_code || "",
                    course_name: resData.course_name || "",
                })
                
                const paginatedData = resData.data
                setTests(paginatedData.data || [])
                setCurrentPage(paginatedData.current_page || 1)
                setTotalPages(paginatedData.last_page || 1)
                setTotalTests(paginatedData.total || 0)
            } else {
                toast.error(response.data?.message || "Không thể tải danh sách bài kiểm tra")
            }
        } catch (error) {
            console.error("Failed to fetch exams:", error)
            toast.error("Đã có lỗi xảy ra khi kết nối đến máy chủ")
        } finally {
            setLoading(false)
        }
    }, [classId, paginationLimit])

    React.useEffect(() => {
        if (classId) {
            fetchExams(currentPage)
        }
    }, [fetchExams, classId, currentPage])

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 2: // PUBLISHED
                return (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm">
                        Đang mở
                    </Badge>
                )
            case 0: // DRAFT
                return (
                    <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md">
                        Nháp
                    </Badge>
                )
            case 1: // STORED
                return (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md">
                        Đã lưu
                    </Badge>
                )
            case 3: // DOING
                return (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md">
                        Đang làm
                    </Badge>
                )
            case 4: // DONE
                return (
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md">
                        Hoàn thành
                    </Badge>
                )
            default:
                return (
                    <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md">
                        Không rõ
                    </Badge>
                )
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Section */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => window.history.back()}>Quản lý lớp học</span>
                    <ChevronRight className="size-4 opacity-50" />
                    <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => window.history.back()}>
                        {classInfo ? `${classInfo.course_name} (${classInfo.class_code})` : `Lớp #${classId}`}
                    </span>
                    <ChevronRight className="size-4 opacity-50" />
                    <span className="text-foreground">Bài kiểm tra</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-4">
                            Bài kiểm tra của lớp
                            {!loading && (
                                <Badge variant="secondary" className="font-bold rounded-lg text-sm bg-primary/10 text-primary border-none self-center px-3">
                                    {totalTests} bài
                                </Badge>
                            )}
                        </h1>
                        <p className="text-muted-foreground font-medium max-w-2xl">
                            Quản lý và theo dõi kết quả các bài kiểm tra được giao cho lớp học này. Xem chi tiết từng học sinh đã thực hiện bài làm.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Table */}
            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-[200px] w-full rounded-xl" />
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                </div>
            ) : tests.length === 0 ? (
                <div className="bg-background/60 backdrop-blur-xl border border-border/40 rounded-xl p-16 flex flex-col items-center justify-center min-h-[450px] text-center space-y-6 shadow-sm">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                        <div className="relative p-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/10 shadow-inner">
                            <ClipboardList className="size-20" />
                        </div>
                    </div>
                    <div className="space-y-2 max-w-sm">
                        <h3 className="text-2xl font-black tracking-tight">Không tìm thấy bài kiểm tra</h3>
                        <p className="text-muted-foreground font-medium leading-relaxed">
                            Lớp học này hiện tại chưa có bài kiểm tra nào được gán.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-background/60 backdrop-blur-xl border border-border/40 rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md">
                        <Table>
                            <TableHeader className="bg-muted/40 h-12">
                                <TableRow className="hover:bg-transparent border-border/20">
                                    <TableHead className="font-semibold text-xs pl-8">Thông tin bài kiểm tra</TableHead>
                                    <TableHead className="font-semibold text-xs">Trạng thái</TableHead>
                                    <TableHead className="font-semibold text-xs text-center">Thời gian kết thúc</TableHead>
                                    <TableHead className="text-right font-semibold text-xs pr-8">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tests.map((exam) => {
                                    return (
                                        <TableRow key={exam.id} className="hover:bg-primary/5 group/row transition-all border-border/10 h-14">
                                            <TableCell className="pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="absolute inset-0 bg-primary/20 blur opacity-0 group-hover/row:opacity-100 transition-opacity rounded-full scale-125" />
                                                        <div className="relative p-2 rounded-lg bg-primary/5 text-primary group-hover/row:bg-primary group-hover/row:text-primary-foreground transition-all duration-300">
                                                            <FileText className="size-5" />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-base group-hover/row:text-primary transition-colors">{exam.title}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(exam.status)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="text-sm font-medium text-muted-foreground">{exam.end_time}</span>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/teacher/classes/${classId}/exams/${exam.id}`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="rounded-lg h-9 px-4 gap-2 font-semibold text-xs text-primary hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20"
                                                            title="Thông tin chi tiết"
                                                        >
                                                            <Eye className="size-4" />
                                                            <span>Thông tin</span>
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/teacher/exams/${exam.id}/questions?mode=view`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="rounded-lg h-9 px-4 gap-2 font-semibold text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all border border-transparent hover:border-blue-100"
                                                            title="Xem câu hỏi"
                                                        >
                                                            <HelpCircle className="size-4" />
                                                            <span>Xem câu hỏi</span>
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8 pt-4">
                            <Button
                                variant="outline"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                className="rounded-lg font-bold"
                            >
                                Trước
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    onClick={() => setCurrentPage(page)}
                                    className={`rounded-lg w-10 h-10 p-0 font-bold ${
                                        currentPage === page 
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                            : ""
                                    }`}
                                >
                                    {page}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                className="rounded-lg font-bold"
                            >
                                Sau
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
