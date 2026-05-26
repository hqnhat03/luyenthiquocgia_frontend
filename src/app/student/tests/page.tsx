'use client';

import { studentAxios as api } from '@/api/student';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AxiosError } from 'axios';
import { format, isAfter, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    CheckCircle2,
    ClipboardList,
    Lock,
    Search,
    ShieldAlert,
    Timer,
    X
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Exam {
    id: number;
    title: string;
    end_time: string;
    status: number;
    submission_status: number;
}

interface TestDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    testId: number | null;
    classId: string;
}

function TestDetailModal({ open, onOpenChange, testId, classId }: TestDetailModalProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (open && testId) {
            setLoading(true);
            api.get(`/classes/tests/detail`, { params: { id: testId } })
                .then(res => {
                    if (res.data.status === 'success') {
                        setData(res.data.data);
                    }
                })
                .finally(() => setLoading(false));
        } else {
            setData(null);
        }
    }, [open, testId]);

    const formatSeconds = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const hasTimeLimit = () => {
        const submissionStatus = Number(data?.test_info?.submission_status);
        if (submissionStatus === 1 || submissionStatus === 2) return false;

        // submission_status === 0: chưa làm bài
        const durationSeconds = Number(data?.test_info?.duration ?? 0) * 60;
        const endTime = data?.test_info?.end_time
            ? new Date(data.test_info.end_time.replace(' ', 'T'))
            : null;
        const now = new Date();

        const submissionList = data?.submission_list;
        const hasSubmissions = submissionList && submissionList.length > 0;

        if (!hasSubmissions) {
            // TH1 & TH2: chưa có dữ liệu nộp
            if (!endTime) return true; // không có end_time, dùng duration
            const timeToEnd = (endTime.getTime() - now.getTime()) / 1000;
            if (timeToEnd <= 0) return false; // đã hết hạn
            // TH1: end_time - now > duration → có đủ duration để làm
            // TH2: end_time - now < duration nhưng vẫn còn thời gian
            return true;
        } else {
            // TH3: có submission nhưng chưa nộp (submit_time = null)
            const createdAt = new Date(submissionList[0].created_at);
            const elapsedSeconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
            const remainingFromStart = durationSeconds - elapsedSeconds;

            if (endTime) {
                const timeToEnd = Math.floor((endTime.getTime() - now.getTime()) / 1000);
                return Math.min(remainingFromStart, timeToEnd) > 0;
            }
            return remainingFromStart > 0;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-w-4xl p-0 overflow-hidden bg-[#f1f5f9] border-none shadow-2xl rounded-xl [&>button]:hidden">
                <DialogHeader className="p-5 pb-4 border-b border-slate-200 bg-white flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">Thông tin bài kiểm tra</DialogTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100" onClick={() => onOpenChange(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>
                
                {loading ? (
                    <div className="p-8 space-y-6 bg-[#f8fafc]">
                        <Skeleton className="h-6 w-1/2 rounded-md" />
                        <Skeleton className="h-[200px] w-full rounded-xl" />
                    </div>
                ) : data ? (
                    <div className="p-6 pt-5 space-y-6">
                        <h3 className="text-[17px] font-medium text-slate-700 pl-1">{data.test_info.title}</h3>
                        
                        <div className="bg-transparent">
                            <table className="w-full text-[13px] md:text-sm">
                                <tbody>
                                    <tr className="border-b border-slate-200/60">
                                        <td className="py-3.5 px-4 text-slate-500 font-medium text-right w-1/2">Giáo viên giao bài kiểm tra</td>
                                        <td className="py-3.5 px-4 text-slate-700 font-medium">{data.test_info.teacher_first_name} {data.test_info.teacher_last_name}</td>
                                    </tr>
                                    <tr className="border-b border-slate-200/60">
                                        <td className="py-3.5 px-4 text-slate-500 font-medium text-right">Thời gian bắt đầu</td>
                                        <td className="py-3.5 px-4 text-slate-700 font-medium">{data.test_info.start_time ? format(parseISO(data.test_info.start_time.replace(' ', 'T')), 'dd/MM/yyyy • HH:mm') : '--'}</td>
                                    </tr>
                                    <tr className="border-b border-slate-200/60">
                                        <td className="py-3.5 px-4 text-slate-500 font-medium text-right">Hạn nộp bài</td>
                                        <td className="py-3.5 px-4 text-slate-700 font-medium">{data.test_info.end_time ? format(parseISO(data.test_info.end_time.replace(' ', 'T')), 'dd/MM/yyyy • HH:mm') : '--'}</td>
                                    </tr>
                                    <tr className="border-b border-slate-200/60">
                                        <td className="py-3.5 px-4 text-slate-500 font-medium text-right">Trạng thái</td>
                                        <td className="py-3.5 px-4">
                                            {Number(data.test_info.submission_status) === 1 ? (
                                                <span className="text-blue-500 bg-[#eff6ff] px-3 py-1 rounded-md text-xs font-semibold border border-blue-100">Đã hoàn thành</span>
                                            ) : Number(data.test_info.submission_status) === 2 ? (
                                                <span className="text-slate-500 bg-slate-50 px-3 py-1 rounded-md text-xs font-semibold border border-slate-200">Hết hạn</span>
                                            ) : (
                                                <span className="text-amber-600 bg-[#fffbeb] px-3 py-1 rounded-md text-xs font-semibold border border-amber-100">Chưa làm</span>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {data.submission_list && data.submission_list.length > 0 && (
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <table className="w-full text-[13px] text-center">
                                    <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-500">
                                        <tr>
                                            <th className="py-3.5 px-2 font-medium">Nộp bài lúc</th>
                                            <th className="py-3.5 px-2 font-medium">Thời gian làm bài</th>
                                            <th className="py-3.5 px-2 font-medium">Kết quả</th>
                                            <th className="py-3.5 px-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.submission_list.map((sub: any) => (
                                            <tr key={sub.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                <td className="py-4 px-2 text-slate-700 font-medium">{sub.submit_time ? format(parseISO(sub.submit_time.replace(' ', 'T')), 'dd/MM/yyyy • HH:mm') : '--'}</td>
                                                <td className="py-4 px-2 text-slate-700 font-medium">{formatSeconds(sub.time_spent_in_seconds || 0)}</td>
                                                <td className="py-4 px-2 text-slate-700 font-medium">{sub.correct_answers}/{sub.total_questions}</td>
                                                <td className="py-4 px-2 pr-4">
                                                    <Link href={`/student/class/${classId}/tests/${sub.id}/result`}>
                                                        <Button variant="outline" size="sm" className="h-8 text-blue-500 border-blue-400 hover:bg-blue-50 hover:text-blue-600 font-medium rounded-md px-4 shadow-sm bg-white">Chi tiết</Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {hasTimeLimit() && (!data.test_info.start_time || !isAfter(parseISO(data.test_info.start_time.replace(' ', 'T')), new Date())) && (!data.test_info.end_time || !isAfter(new Date(), parseISO(data.test_info.end_time.replace(' ', 'T')))) && (
                            <div className="flex justify-end pt-2">
                                <Link href={`/student/exams/${data.test_info.id}`}>
                                    <Button className="bg-[#2563eb] hover:bg-blue-700 text-white rounded-lg px-8 h-10 shadow-md font-medium tracking-wide">Làm bài</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-500 bg-[#f8fafc]">Lỗi tải dữ liệu. Vui lòng thử lại.</div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default function ExamsPage() {
    const params = useParams();
    const id = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState<Exam[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTestId, setSelectedTestId] = useState<number | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchExams = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/classes/tests`, {
                    params: {
                        id: id,
                        page: currentPage,
                        pagination: 10
                    }
                });
                if (response.data?.status === 'success') {
                    const resData = response.data.data;
                    setExams(resData.data || []);
                    setTotalPages(resData.last_page || 1);
                } else {
                    setError(response.data?.message || 'Không thể tải danh sách bài kiểm tra');
                }
            } catch (err: unknown) {
                if (err instanceof AxiosError) {
                    setError(err.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchExams();
    }, [id, currentPage]);

    const parseDate = (dateStr: string) => {
        if (!dateStr) return new Date();
        return parseISO(dateStr.replace(' ', 'T'));
    };

    const getStatus = (exam: Exam) => {
        if (Number(exam.submission_status) === 1) {
            return {
                label: 'Đã hoàn thành',
                variant: 'default' as const,
                icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
                className: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100/50'
            };
        }

        if (Number(exam.submission_status) === 2) {
            return {
                label: 'Hết hạn',
                variant: 'outline' as const,
                icon: <Lock className="w-3.5 h-3.5 mr-1" />,
                className: 'bg-slate-50 text-slate-500 border-slate-200'
            };
        }

        return {
            label: 'Chưa làm',
            variant: 'default' as const,
            icon: <Timer className="w-3.5 h-3.5 mr-1 animate-pulse" />,
            className: 'bg-amber-50 text-amber-600 border-amber-100'
        };
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return format(parseDate(dateString), 'HH:mm - dd/MM/yyyy', { locale: vi });
    };

    const Pagination = () => {
        return (
            <div className="flex items-center justify-center gap-1.5 mt-8 pt-4 border-t border-slate-100">
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => {
                        setCurrentPage((prev) => Math.max(prev - 1, 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="rounded-lg font-bold text-xs h-9 px-3 text-slate-600 hover:bg-slate-100 gap-1"
                >
                    Trước
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => {
                            setCurrentPage(page);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`rounded-lg w-9 h-9 p-0 font-bold text-xs ${
                            currentPage === page
                                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        {page}
                    </Button>
                ))}

                <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => {
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="rounded-lg font-bold text-xs h-9 px-3 text-slate-600 hover:bg-slate-100 gap-1"
                >
                    Sau
                </Button>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="space-y-3">
                    <Skeleton className="h-10 w-[250px] rounded-md" />
                    <Skeleton className="h-4 w-[350px]" />
                </div>
                <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in zoom-in-95 duration-300">
                <div className="p-4 bg-red-50 rounded-lg text-red-500 mb-4 shadow-sm border border-red-100">
                    <ShieldAlert className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Đã có lỗi xảy ra</h3>
                <p className="text-slate-500 max-w-md mb-6">{error}</p>
                <Button
                    onClick={() => window.location.reload()}
                    variant="default"
                    className="rounded-md px-8 shadow-md hover:shadow-lg transition-all"
                >
                    Thử lại ngay
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="relative overflow-hidden p-6 rounded-xl bg-gradient-to-r from-primary/5 via-transparent to-transparent">
                <div className="relative z-10">
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg shadow-sm">
                            <ClipboardList className="h-7 w-7 text-primary" />
                        </div>
                        Danh sách bài kiểm tra
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm md:text-base max-w-2xl leading-relaxed">
                        Tham gia các bài kiểm tra định kỳ và đánh giá năng lực cho lớp
                        <span className="mx-1.5 font-bold text-primary px-2 py-0.5 bg-primary/5 rounded-sm uppercase tracking-wider">{id}</span>
                    </p>
                </div>
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            </div>

            {/* Main Content */}
            {exams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50/40 rounded-xl border-2 border-dashed border-slate-200 animate-in fade-in duration-500">
                    <div className="h-20 w-20 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                        <Search className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Chưa có bài kiểm tra</h3>
                    <p className="text-slate-500 mt-1">Danh sách bài kiểm tra sẽ xuất hiện ở đây khi giảng viên khởi tạo.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-50/80">
                                <TableRow className="hover:bg-transparent border-slate-200">
                                    <TableHead className="font-bold text-slate-700 h-12 pl-6">Tên bài kiểm tra</TableHead>
                                    <TableHead className="font-bold text-slate-700">Hạn chót</TableHead>
                                    <TableHead className="font-bold text-slate-700">Trạng thái</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700 pr-6">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {exams.map((exam) => {
                                    const status = getStatus(exam);
                                    return (
                                        <TableRow key={exam.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                                            <TableCell className="font-semibold text-slate-900 py-4 pl-6 text-base">
                                                {exam.title}
                                            </TableCell>
                                            <TableCell className="text-slate-500 font-medium">
                                                {formatDate(exam.end_time)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant} className={`font-semibold px-2.5 py-0.5 rounded-md border ${status.className}`}>
                                                    {status.icon}
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => {
                                                        setSelectedTestId(exam.id);
                                                        setModalOpen(true);
                                                    }}
                                                    className="font-bold rounded-lg border-slate-200 text-slate-600 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all h-9 px-4"
                                                >
                                                    Chi tiết
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    {/* Pagination */}
                    {totalPages > 1 && <Pagination />}
                </div>
            )}

            {/* Information Card */}
            <div className="bg-slate-900 rounded-xl p-6 md:p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="p-4 bg-white/10 rounded-lg backdrop-blur-md">
                        <ShieldAlert className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h4 className="text-lg font-bold mb-2">Quy định phòng thi trực tuyến</h4>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            Đảm bảo kết nối internet ổn định trong suốt quá trình làm bài. Hệ thống sẽ tự động nộp bài khi hết thời gian hoặc nếu bạn phát hiện hành vi gian lận.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[200px]">
                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-2 rounded-md">
                            <CheckCircle2 className="w-4 h-4" />
                            Kết nối ổn định
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-blue-400 bg-blue-400/10 px-3 py-2 rounded-md">
                            <CheckCircle2 className="w-4 h-4" />
                            Trình duyệt tương thích
                        </div>
                    </div>
                </div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-50" />
            </div>

            <TestDetailModal 
                open={modalOpen} 
                onOpenChange={setModalOpen} 
                testId={selectedTestId} 
                classId={id} 
            />
        </div>
    );
}
