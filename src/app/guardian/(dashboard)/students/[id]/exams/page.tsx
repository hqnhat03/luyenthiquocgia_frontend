"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import {
    AlertCircle,
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    BookOpen,
    Calendar,
    CheckCircle2,
    Clock,
    History,
    Info,
    Timer,
    XCircle
} from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

// --- Types ---

type ExamStatus = 'completed' | 'missed' | 'upcoming' | 'not_started';

interface ExamResult {
    student_name: string;
    id: number | null;
    exam_name: string;
    class_code: string;
    total_score: number;
    open_at: string;
    close_at: string;
    score: number;
    submitted_at: string | null;
    status: ExamStatus;
}

type SortField = 'exam_name' | 'open_at' | 'close_at' | 'submitted_at' | 'status' | 'score';
type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
    field: SortField;
    direction: SortDirection;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface ExamResultsResponse {
    success: boolean;
    message: string;
    data: ExamResult[];
    meta: PaginationMeta;
}

// --- Components ---

const StatusBadge = ({ status }: { status: ExamStatus }) => {
    const configs: Record<ExamStatus, { label: string; className: string; icon: React.ElementType }> = {
        completed: {
            label: "Hoàn thành",
            className: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
            icon: CheckCircle2,
        },
        missed: {
            label: "Bỏ lỡ",
            className: "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100",
            icon: XCircle,
        },
        upcoming: {
            label: "Sắp diễn ra",
            className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
            icon: Timer,
        },
        not_started: {
            label: "Chưa bắt đầu",
            className: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
            icon: Clock,
        },
    };

    const config = configs[status] || configs.not_started;
    const Icon = config.icon;

    return (
        <Badge className={cn("font-bold border shadow-none gap-1 py-1", config.className)}>
            <Icon className="size-3" />
            {config.label}
        </Badge>
    );
};

export default function StudentExamsPage() {
    const params = useParams();
    const studentId = params.id;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exams, setExams] = useState<ExamResult[]>([]);
    const [studentName, setStudentName] = useState<string>("");
    const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'open_at', direction: 'desc' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await api.get<ExamResultsResponse>(`/guardian/students/${studentId}/exam-results`, {
                    params: {
                        sort: sortConfig.field,
                        order: sortConfig.direction
                    }
                });

                if (response.data.success) {
                    setExams(response.data.data);
                    if (response.data.data.length > 0) {
                        setStudentName(response.data.data[0].student_name);
                    }
                } else {
                    setError(response.data.message || "Không thể tải kết quả kiểm tra");
                }
            } catch (err: unknown) {
                const axiosError = err as { response?: { data?: { message?: string } } };
                setError(axiosError.response?.data?.message || "Đã xảy ra lỗi khi kết nối đến máy chủ");
            } finally {
                setLoading(false);
            }
        };

        if (studentId) {
            fetchData();
        }
    }, [studentId, sortConfig]);

    const handleSort = (field: SortField) => {
        setSortConfig((prev) => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortConfig.field !== field) return <ArrowUpDown className="ml-2 size-3 opacity-30" />;
        return sortConfig.direction === 'asc' ?
            <ArrowUp className="ml-2 size-3 text-primary" /> :
            <ArrowDown className="ml-2 size-3 text-primary" />;
    };

    const renderLoading = () => (
        <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl w-full" />
            ))}
        </div>
    );

    if (error && exams.length === 0) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="p-4 rounded-full bg-rose-100 text-rose-600 mb-4">
                    <AlertCircle className="size-10" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Lỗi tải dữ liệu</h3>
                <p className="text-muted-foreground text-center max-w-xs">{error}</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
                    Kết quả kiểm tra
                </h2>
                <p className="text-muted-foreground font-medium">
                    {studentName ? `Theo dõi kết quả các bài kiểm tra của ${studentName}` : "Xem chi tiết điểm số và tình trạng làm bài của học sinh."}
                </p>
            </div>

            {loading && exams.length === 0 ? (
                renderLoading()
            ) : error && exams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="p-4 rounded-full bg-rose-100 text-rose-600 mb-4">
                        <AlertCircle className="size-10" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Lỗi tải dữ liệu</h3>
                    <p className="text-muted-foreground text-center max-w-xs">{error}</p>
                </div>
            ) : exams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-background/50 rounded-3xl border-2 border-dashed border-border/50">
                    <div className="p-4 rounded-full bg-muted/50 mb-4">
                        <BookOpen className="size-10 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Chưa có bài kiểm tra</h3>
                    <p className="text-muted-foreground text-center max-w-xs">
                        Hiện tại chưa có dữ liệu bài kiểm tra nào cho học sinh này.
                    </p>
                </div>
            ) : (
                <div className={cn("transition-opacity duration-300", loading ? "opacity-50 pointer-events-none" : "opacity-100")}>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-hidden rounded-2xl border border-border/40 shadow-sm bg-background/50 backdrop-blur-sm">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-border/10">
                                    <TableHead
                                        className="font-black text-foreground/70 h-14 cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => handleSort('exam_name')}
                                    >
                                        <div className="flex items-center">Bài kiểm tra <SortIcon field="exam_name" /></div>
                                    </TableHead>
                                    <TableHead
                                        className="font-black text-foreground/70 h-14 cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => handleSort('open_at')}
                                    >
                                        <div className="flex items-center justify-center text-center">Thời gian mở <SortIcon field="open_at" /></div>
                                    </TableHead>
                                    <TableHead
                                        className="font-black text-foreground/70 h-14 cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => handleSort('close_at')}
                                    >
                                        <div className="flex items-center justify-center text-center">Thời gian đóng <SortIcon field="close_at" /></div>
                                    </TableHead>
                                    <TableHead
                                        className="font-black text-foreground/70 h-14 cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => handleSort('submitted_at')}
                                    >
                                        <div className="flex items-center justify-center text-center">Thời gian nộp <SortIcon field="submitted_at" /></div>
                                    </TableHead>
                                    <TableHead
                                        className="font-black text-foreground/70 h-14 cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="flex items-center justify-center">Trạng thái <SortIcon field="status" /></div>
                                    </TableHead>
                                    <TableHead
                                        className="font-black text-foreground/70 h-14 cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => handleSort('score')}
                                    >
                                        <div className="flex items-center justify-end">Điểm số <SortIcon field="score" /></div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {exams.map((exam, index) => (
                                    <TableRow key={index} className="hover:bg-muted/20 border-border/5 group transition-colors">
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="font-black text-foreground group-hover:text-primary transition-colors">{exam.exam_name}</div>
                                                <div className="text-xs font-bold text-muted-foreground/60 px-2 py-0.5 rounded-md bg-muted w-fit">{exam.class_code}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center gap-1 text-muted-foreground font-medium text-xs">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="size-3 text-primary/60" />
                                                    <span>{new Date(exam.open_at).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="size-3 text-primary/60" />
                                                    <span>{new Date(exam.open_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center gap-1 text-muted-foreground font-medium text-xs">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="size-3 text-rose-500/60" />
                                                    <span>{new Date(exam.close_at).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="size-3 text-rose-500/60" />
                                                    <span>{new Date(exam.close_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {exam.submitted_at ? (
                                                <div className="flex flex-col items-center gap-1 text-muted-foreground font-medium text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <History className="size-3 text-emerald-500/60" />
                                                        <span>{new Date(exam.submitted_at).toLocaleDateString('vi-VN')}</span>
                                                    </div>
                                                    <span>{new Date(exam.submitted_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground/40 italic">-- : --</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <StatusBadge status={exam.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {exam.status === 'completed' ? (
                                                <div className="inline-flex flex-col items-end">
                                                    <div className={cn(
                                                        "text-xl font-black",
                                                        exam.score / exam.total_score >= 0.8 ? "text-emerald-600" :
                                                            exam.score / exam.total_score >= 0.5 ? "text-amber-600" : "text-rose-600"
                                                    )}>
                                                        {exam.score}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">trên {exam.total_score}</div>
                                                </div>
                                            ) : exam.status === 'missed' ? (
                                                <div className="text-rose-600 font-black text-xl">0</div>
                                            ) : (
                                                <div className="text-muted-foreground/30 font-black text-xl">-</div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="grid gap-4 md:hidden">
                        {exams.map((exam, index) => (
                            <Card key={index} className="border-none shadow-sm overflow-hidden bg-background/60 backdrop-blur-sm">
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{exam.class_code}</p>
                                            <h3 className="font-black text-lg leading-tight">{exam.exam_name}</h3>
                                        </div>
                                        <StatusBadge status={exam.status} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/50">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Thời gian mở</p>
                                            <div className="flex items-center gap-1.5 text-xs font-bold">
                                                <Calendar className="size-3 text-primary/60" />
                                                {new Date(exam.open_at).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Thời gian đóng</p>
                                            <div className="flex items-center gap-1.5 text-xs font-bold">
                                                <Calendar className="size-3 text-rose-500/60" />
                                                {new Date(exam.close_at).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pb-3 border-b border-border/50">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Điểm số</p>
                                            {exam.status === 'completed' ? (
                                                <div className="flex items-baseline gap-1">
                                                    <span className={cn(
                                                        "text-lg font-black",
                                                        exam.score / exam.total_score >= 0.8 ? "text-emerald-600" :
                                                            exam.score / exam.total_score >= 0.5 ? "text-amber-600" : "text-rose-600"
                                                    )}>{exam.score}</span>
                                                    <span className="text-[10px] text-muted-foreground font-bold">/ {exam.total_score}</span>
                                                </div>
                                            ) : (
                                                <span className="text-lg font-black text-muted-foreground/30">-</span>
                                            )}
                                        </div>
                                    </div>

                                    {exam.submitted_at && (
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground bg-muted/30 p-2 rounded-lg">
                                            <Info className="size-3 text-blue-500" />
                                            <span>Đã nộp lúc {new Date(exam.submitted_at).toLocaleString('vi-VN')}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
