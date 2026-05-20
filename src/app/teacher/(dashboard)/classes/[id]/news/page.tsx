'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/axios';
import { AxiosError } from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    Clock,
    Megaphone,
    MoreVertical,
    Pencil,
    Pin,
    PinOff,
    Trash2,
} from 'lucide-react';
import Image from 'next/image';
import { use, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { NewsForm } from './_components/news-form';

interface Author {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
}

interface ClassNews {
    id: number;
    class_id: number;
    content: string;
    file_url: string | null;
    is_pinned: number; // 0 or 1
    created_at: string;
    updated_at: string;
    created_by: number;
    updated_by: number | null;
    author: Author;
}

const getAvatarUrl = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_IMAGE_URL || "";
  if (baseUrl) {
    const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    return `${cleanBase}${cleanUrl}`;
  }
  return url.startsWith("/") ? url : `/${url}`;
};

export default function TeacherAnnouncementsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: classId } = use(params);
    const [newsList, setNewsList] = useState<ClassNews[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingAnnouncement, setEditingAnnouncement] = useState<ClassNews | null>(null);
    const [announcementToDelete, setAnnouncementToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [paginationLimit] = useState(5);

    const fetchNews = useCallback(async (page: number = 1) => {
        try {
            setLoading(true);
            const response = await api.get(`/teacher/class-news`, {
                params: {
                    class_id: classId,
                    page: page,
                    pagination: paginationLimit,
                }
            });
            if (response.data && response.data.status === "success") {
                const responseData = response.data.data;
                setNewsList(responseData.data || []);
                setCurrentPage(responseData.current_page || 1);
                setTotalPages(responseData.last_page || 1);
            }
        } catch (error: unknown) {
            console.error('Failed to fetch class news:', error);
            if (error instanceof AxiosError && error.response?.status === 403) {
                toast.error('Bạn không có quyền xem bản tin của lớp này');
            } else {
                toast.error('Không thể tải danh sách bản tin');
            }
        } finally {
            setLoading(false);
        }
    }, [classId, paginationLimit]);

    useEffect(() => {
        if (classId) {
            fetchNews(currentPage);
        }
    }, [classId, currentPage, fetchNews]);

    const handleCreateOrUpdateSuccess = () => {
        fetchNews(1);
        setEditingAnnouncement(null);
    };

    const handleDelete = async () => {
        if (!announcementToDelete) return;

        try {
            setIsDeleting(true);
            await api.delete(`/teacher/class-news/delete`, {
                params: {
                    id: announcementToDelete
                }
            });
            toast.success('Đã xóa bản tin');
            fetchNews(currentPage);
        } catch (error: unknown) {
            if (error instanceof AxiosError && error.response?.status === 403) {
                toast.error('Bạn không có quyền xóa bản tin này');
            } else {
                toast.error('Không thể xóa bản tin');
            }
        } finally {
            setIsDeleting(false);
            setAnnouncementToDelete(null);
        }
    };

    const togglePin = async (newsItem: ClassNews) => {
        try {
            const nextPinState = newsItem.is_pinned === 1 ? 0 : 1;
            await api.patch(`/teacher/class-news/change-pin`, {
                id: newsItem.id,
                is_pinned: nextPinState,
            });

            toast.success(nextPinState === 0 ? 'Đã bỏ ghim bản tin' : 'Đã ghim bản tin');
            fetchNews(currentPage);
        } catch (error: unknown) {
            if (error instanceof AxiosError && error.response?.status === 403) {
                toast.error('Bạn không có quyền thực hiện thao tác này');
            } else {
                toast.error('Không thể thực hiện thao tác');
            }
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
            {/* Header Title */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1.5 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                    <h1 className="text-3xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Bản tin lớp học
                    </h1>
                </div>
                <p className="text-muted-foreground font-medium ml-4">
                    Chia sẻ thông tin, cập nhật hình ảnh và quản lý các thông báo quan trọng đến học sinh.
                </p>
            </div>

            {/* Premium inline Creator Box (Facebook-like) */}
            <NewsForm
                onSuccess={handleCreateOrUpdateSuccess}
                editingAnnouncement={editingAnnouncement}
                onCancelEdit={() => setEditingAnnouncement(null)}
                classId={parseInt(classId)}
            />

            {/* List Feed Area */}
            <div className="grid gap-6 pt-2">
                {loading ? (
                    [1, 2, 3].map((i) => (
                        <Card key={i} className="border-none shadow-sm bg-background/40 backdrop-blur-md rounded-lg overflow-hidden">
                            <CardHeader className="p-6 pb-2">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-40" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 pt-2 space-y-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : newsList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-muted/20 rounded-xl border-2 border-dashed border-border/50 backdrop-blur-sm">
                        <div className="h-24 w-24 rounded-full bg-background flex items-center justify-center mb-8 shadow-xl border border-border/40">
                            <Megaphone className="h-10 w-10 text-primary animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-foreground mb-3">Chưa có bản tin nào</h3>
                        <p className="text-muted-foreground max-w-md font-medium text-lg">
                            Hãy là người đầu tiên chia sẻ thông tin, cập nhật hình ảnh gửi đến học sinh của lớp học.
                        </p>
                    </div>
                ) : (
                    newsList.map((news) => (
                        <Card
                            key={news.id}
                            className={`group border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-lg bg-background/60 backdrop-blur-md overflow-hidden relative ${news.is_pinned === 1 ? 'ring-2 ring-primary/20' : ''
                                }`}
                        >
                            {news.is_pinned === 1 && (
                                <div className="absolute top-0 right-12 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-b-lg flex items-center gap-1 shadow-sm">
                                    <Pin className="size-3 fill-current" />
                                    Đã ghim
                                </div>
                            )}

                            <CardHeader className="p-6 pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                                            <AvatarImage src={news.author?.avatar_url ? getAvatarUrl(news.author.avatar_url) : ''} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-black">
                                                {news.author?.first_name ? news.author.first_name.substring(0, 2).toUpperCase() : 'HT'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                                                {news.author ? `${news.author.last_name || ''} ${news.author.first_name || ''}`.trim() : 'Hệ thống'}
                                            </h4>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                                                <Clock className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(news.created_at), {
                                                    addSuffix: true,
                                                    locale: vi,
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger render={
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/5">
                                                <MoreVertical className="size-5 text-muted-foreground" />
                                            </Button>
                                        }>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 p-2 rounded-lg border-border/40 shadow-xl">
                                            <DropdownMenuItem
                                                onClick={() => togglePin(news)}
                                                className="rounded-lg gap-2 font-bold text-xs uppercase tracking-widest py-2.5"
                                            >
                                                {news.is_pinned === 1 ? (
                                                    <>
                                                        <PinOff className="size-4" />
                                                        Bỏ ghim
                                                    </>
                                                ) : (
                                                    <>
                                                        <Pin className="size-4" />
                                                        Ghim bản tin
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setEditingAnnouncement(news);
                                                    scrollToTop();
                                                }}
                                                className="rounded-lg gap-2 font-bold text-xs uppercase tracking-widest py-2.5"
                                            >
                                                <Pencil className="size-4 text-amber-500" />
                                                Chỉnh sửa
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setAnnouncementToDelete(news.id)}
                                                className="rounded-lg gap-2 font-bold text-xs uppercase tracking-widest py-2.5 text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="size-4" />
                                                Xóa bản tin
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6 pt-4">
                                <div
                                    className="text-muted-foreground leading-relaxed text-[15px] font-medium prose prose-sm dark:prose-invert max-w-none prose-headings:font-black prose-p:mb-4 whitespace-pre-wrap"
                                    dangerouslySetInnerHTML={{ __html: news.content }}
                                />
                                {news.file_url && (
                                    <div className="mt-3 rounded-lg overflow-hidden border border-border/10 bg-muted/25 max-w-sm max-h-[220px] aspect-video flex items-center justify-center">
                                        <Image
                                            src={getAvatarUrl(news.file_url)}
                                            alt="Bản tin đính kèm"
                                            width={220}
                                            height={220}
                                            className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-500"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
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

            <AlertDialog open={!!announcementToDelete} onOpenChange={() => setAnnouncementToDelete(null)}>
                <AlertDialogContent className="rounded-xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black">Xác nhận xóa?</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-muted-foreground">
                            Hành động này không thể hoàn tác. Bản tin này sẽ bị xóa vĩnh viễn khỏi lớp học.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="rounded-lg font-bold uppercase tracking-widest h-11">
                            Hủy bỏ
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="rounded-lg bg-destructive text-white hover:bg-destructive/90 font-bold uppercase tracking-widest h-11"
                        >
                            {isDeleting ? 'Đang xóa...' : 'Xóa bản tin'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
