'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { studentAxios as api } from '@/api/student';
import { AxiosError } from 'axios';
import {
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Clock,
    ExternalLink,
    FileText,
    PlayCircle,
    ShieldAlert,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface Lesson {
    id: number;
    class_id: number;
    lesson_name: string;
    description: string;
    duration_value: number;
    duration_unit: string;
    sort: number;
    document_url: string;
    status: number;
}

interface PaginatedResponse {
    current_page: number;
    data: Lesson[];
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

const PAGINATION = 10;

export default function LecturesPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<Omit<PaginatedResponse, 'data'> | null>(null);

    const fetchLessons = useCallback(async (page: number) => {
        if (!id) return;
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/classes/lessons', {
                params: { id, page, pagination: PAGINATION },
            });

            if (response.data.status === 'success') {
                const pageData: PaginatedResponse = response.data.data;
                setLessons(pageData.data);
                const { data: _, ...meta } = pageData;
                setPagination(meta);
            } else {
                setError(response.data.message || 'Không thể tải danh sách bài giảng');
            }
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ');
            } else {
                setError('Có lỗi xảy ra khi tải danh sách bài giảng');
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchLessons(currentPage);
    }, [fetchLessons, currentPage]);

    const formatDuration = (value: number, unit: string) => {
        if (unit === 'hour') {
            return value === 1 ? `${value} giờ` : `${value} giờ`;
        }
        if (unit === 'minute') {
            if (value >= 60) {
                const h = Math.floor(value / 60);
                const m = value % 60;
                return m > 0 ? `${h}h ${m}m` : `${h} giờ`;
            }
            return `${value} phút`;
        }
        return `${value} ${unit}`;
    };

    const stripHtml = (html: string) => {
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-in fade-in duration-500">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-3 w-[300px]" />
                </div>
                <div className="grid gap-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="p-3 bg-red-50 rounded-full text-red-500 mb-3">
                    <ShieldAlert className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Đã có lỗi xảy ra</h3>
                <p className="text-sm text-slate-500 max-w-md mb-4">{error}</p>
                <Button onClick={() => fetchLessons(currentPage)} variant="outline" size="sm">
                    Thử lại ngay
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                            <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        Nội dung bài giảng
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Theo dõi và học tập các bài giảng của lớp{' '}
                        <span className="font-semibold text-primary uppercase">{id}</span>
                    </p>
                </div>
                {pagination && (
                    <Badge className="bg-primary/10 text-primary border-none px-3 py-1 rounded-lg text-xs font-bold self-start">
                        {pagination.total} bài giảng
                    </Badge>
                )}
            </div>

            {/* Content Section */}
            {lessons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <BookOpen className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Chưa có bài giảng nào</h3>
                    <p className="text-sm text-slate-500">Danh sách bài giảng sẽ sớm được cập nhật.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {lessons.map((lesson, index) => {
                        const globalIndex = (currentPage - 1) * PAGINATION + index + 1;
                        const description = stripHtml(lesson.description);
                        return (
                            <Card
                                key={lesson.id}
                                onClick={() => router.push(`/student/lessons/${lesson.id}`)}
                                className="p-0 group overflow-hidden border-slate-100 rounded-xl hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
                            >
                                <CardContent className="p-0">
                                    <div className="flex items-center p-3 md:p-4 gap-4 md:gap-5">
                                        {/* Number Badge */}
                                        <div className="flex flex-col items-center justify-center min-w-[48px] h-[48px] bg-slate-50 group-hover:bg-primary/10 rounded-xl transition-colors shrink-0">
                                            <span className="text-[8px] font-black text-slate-400 group-hover:text-primary/70 uppercase tracking-widest leading-none mb-0.5">
                                                Bài
                                            </span>
                                            <span className="text-lg font-black text-slate-700 group-hover:text-primary leading-none">
                                                {globalIndex}
                                            </span>
                                        </div>

                                        {/* Main Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm md:text-base font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1 mb-1">
                                                {lesson.lesson_name}
                                            </h3>
                                            {description && (
                                                <p className="text-[11px] text-slate-400 line-clamp-1 mb-1.5">
                                                    {description}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
                                                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full group-hover:bg-primary/5 transition-colors">
                                                    <Clock className="w-3 h-3 text-slate-400 group-hover:text-primary" />
                                                    <span>{formatDuration(lesson.duration_value, lesson.duration_unit)}</span>
                                                </div>
                                                {lesson.document_url && (
                                                    <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full group-hover:bg-primary/5 transition-colors">
                                                        <FileText className="w-3 h-3 text-slate-400 group-hover:text-primary" />
                                                        <span>Tài liệu</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                                            {lesson.document_url && (
                                                <a
                                                    href={lesson.document_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="border border-slate-100 group-hover:border-slate-200 text-slate-500 hover:text-slate-700 rounded-lg h-9 px-3 text-xs font-bold transition-all"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                                        Tài liệu
                                                    </Button>
                                                </a>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="border border-slate-100 group-hover:border-primary group-hover:bg-primary group-hover:text-white text-slate-600 rounded-lg h-9 px-4 text-xs font-bold transition-all shadow-sm"
                                            >
                                                <PlayCircle className="w-4 h-4 mr-1.5" />
                                                Học ngay
                                                <ChevronRight className="w-3 h-3 ml-0.5 transition-transform group-hover:translate-x-1" />
                                            </Button>
                                        </div>

                                        <div className="sm:hidden">
                                            <div className="p-1.5 rounded-full bg-slate-50 group-hover:bg-primary group-hover:text-white transition-all text-slate-400">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-slate-500">
                        Trang <span className="font-semibold text-slate-700">{pagination.current_page}</span> /{' '}
                        <span className="font-semibold text-slate-700">{pagination.last_page}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs rounded-lg"
                            disabled={!pagination.prev_page_url}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        >
                            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                            Trước
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs rounded-lg"
                            disabled={!pagination.next_page_url}
                            onClick={() => setCurrentPage((p) => p + 1)}
                        >
                            Sau
                            <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Footer Tip */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                    <BookOpen className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1">
                    <p className="text-emerald-700 text-xs leading-relaxed font-medium">
                        <span className="font-bold">Lưu ý:</span> Hãy hoàn thành các bài học theo thứ tự để đạt hiệu quả tốt nhất.
                    </p>
                </div>
                <Badge className="hidden md:flex bg-emerald-500/10 text-emerald-600 border-none px-2 py-0.5 rounded-md text-[10px] font-bold">
                    Tip
                </Badge>
            </div>
        </div>
    );
}