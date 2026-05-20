'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { studentAxios as api } from '@/api/student';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Clock, Eye, Megaphone, Pin } from 'lucide-react';
import { use, useEffect, useState } from 'react';

interface Author {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  address: string;
  tel: string;
  target_student: number;
  birth_date: string;
  gender: number;
  nantionality: string;
  experience_years: number;
  introduction: string | null;
  avatar_url: string | null;
  status: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number | null;
}

interface ClassNews {
  id: number;
  class_id: number;
  content: string;
  file_url: string | null;
  is_pinned: number;
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

export default function BulletinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [newsList, setNewsList] = useState<ClassNews[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await api.get('/classes/news', {
          params: {
            id: id,
            page: currentPage,
            pagination: 10,
          }
        });
        if (response.data && response.data.status === 'success') {
          const responseData = response.data.data;
          setNewsList(responseData.data || []);
          setTotalPages(responseData.last_page || 1);
          setTotalItems(responseData.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch class news:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNews();
    }
  }, [id, currentPage]);

  const pinnedNews = newsList.filter((news) => news.is_pinned === 1);
  const regularNews = newsList.filter((news) => news.is_pinned !== 1);

  // Extract unique authors (teachers) from the list for the sidebar
  const uniqueAuthors = Array.from(
    new Map(
      newsList
        .filter((news) => news.author)
        .map((news) => [news.author.id, news.author])
    ).values()
  );

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
        {/* Page Header Skeleton */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-slate-200" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-4 w-96 ml-6" />
        </div>

        {/* Full width Loading Feed */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-slate-100 shadow-sm overflow-hidden rounded-xl bg-white">
              <CardHeader className="p-6 pb-2 border-b border-slate-50/50">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-4 space-y-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const NewsCard = ({ news, isPinnedView = false }: { news: ClassNews; isPinnedView?: boolean }) => {
    const authorName = news.author
      ? `${news.author.last_name || ''} ${news.author.first_name || ''}`.trim()
      : 'Hệ thống';

    return (
      <Card
        className={`group border-slate-100/80 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden rounded-xl bg-white relative ${
          isPinnedView ? 'border-amber-200 ring-1 ring-amber-100 bg-amber-50/5' : ''
        }`}
      >
        {isPinnedView && (
          <div className="absolute top-0 right-6 px-3 py-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-b-lg flex items-center gap-1 shadow-sm">
            <Pin className="h-2.5 w-2.5 fill-current" />
            Đã ghim
          </div>
        )}

        <CardHeader className="p-5 pb-3 border-b border-slate-50/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger>
                  <div className="cursor-pointer transition-transform hover:scale-105">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                      <AvatarImage src={news.author?.avatar_url ? getAvatarUrl(news.author.avatar_url) : ''} />
                      <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-xs">
                        {news.author?.first_name ? news.author.first_name.substring(0, 2).toUpperCase() : 'HT'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </PopoverTrigger>
                {news.author && (
                  <PopoverContent className="w-80 p-4 rounded-xl shadow-xl border-slate-100 bg-white">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                          <AvatarImage src={news.author.avatar_url ? getAvatarUrl(news.author.avatar_url) : ''} />
                          <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-xs">
                            {news.author.first_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {`${news.author.last_name || ''} ${news.author.first_name || ''}`.trim()}
                          </h4>
                          <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-full mt-0.5 inline-block">
                            Giáo viên
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-500 font-semibold border-t border-slate-50 pt-2.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Kinh nghiệm:</span>
                          <span className="text-slate-700">{news.author.experience_years} năm giảng dạy</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Quốc tịch:</span>
                          <span className="text-slate-700">{news.author.nantionality || 'Việt Nam'}</span>
                        </div>
                        {news.author.tel && (
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Điện thoại:</span>
                            <a href={`tel:${news.author.tel}`} className="text-blue-600 hover:underline">
                              {news.author.tel}
                            </a>
                          </div>
                        )}
                        {news.author.email && (
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Email:</span>
                            <a href={`mailto:${news.author.email}`} className="text-blue-600 hover:underline truncate max-w-[160px]">
                              {news.author.email}
                            </a>
                          </div>
                        )}
                      </div>

                      {news.author.introduction && (
                        <div className="border-t border-slate-50 pt-2.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Giới thiệu bản thân
                          </span>
                          <div
                            className="text-xs text-slate-600 leading-relaxed max-h-36 overflow-y-auto pr-1 select-text scrollbar-thin prose prose-sm"
                            dangerouslySetInnerHTML={{ __html: news.author.introduction }}
                          />
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                )}
              </Popover>

              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {authorName}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(news.created_at), { addSuffix: true, locale: vi })}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-4">
          <div
            className="text-slate-600 leading-relaxed text-sm prose prose-sm max-w-none prose-p:mb-3 whitespace-pre-wrap font-medium"
            dangerouslySetInnerHTML={{ __html: news.content }}
          />

          {news.file_url && (
            <Dialog>
              <DialogTrigger>
                <div className="mt-4 rounded-xl overflow-hidden border border-slate-100 bg-slate-50/50 max-w-md max-h-[300px] cursor-pointer group/img relative overflow-hidden transition-all duration-300 hover:shadow-md">
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center z-10">
                    <span className="opacity-0 group-hover/img:opacity-100 text-white bg-slate-900/60 backdrop-blur-xs text-xs font-bold py-1.5 px-3 rounded-full transition-all duration-300 flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" /> Phóng to hình ảnh
                    </span>
                  </div>
                  <img
                    src={getAvatarUrl(news.file_url)}
                    alt="Đính kèm thông báo"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-[1.02]"
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 overflow-hidden border-none bg-slate-900 shadow-2xl flex flex-col justify-center items-center">
                <div className="relative w-full h-full max-h-[80vh] flex items-center justify-center p-6">
                  <img
                    src={getAvatarUrl(news.file_url)}
                    alt="Chi tiết thông báo"
                    className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
                  />
                </div>
                <div className="w-full bg-slate-950 p-4 border-t border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-between">
                  <span>Hình ảnh đính kèm từ {authorName}</span>
                  <a
                    href={getAvatarUrl(news.file_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-bold transition-colors"
                  >
                    Mở trong tab mới
                  </a>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>
    );
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 backdrop-blur-xs">
      <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-slate-100">
        <Megaphone className="h-10 w-10 text-slate-300 animate-pulse" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">Chưa có thông báo nào</h3>
      <p className="text-slate-500 text-sm max-w-md font-medium leading-relaxed">
        Hiện tại bảng tin lớp học này chưa có thông báo nào từ giáo viên. Mọi tin tức, cập nhật và tệp đính kèm quan trọng sẽ hiển thị ở đây.
      </p>
    </div>
  );

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
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100 hover:bg-blue-700'
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 rounded-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bảng tin lớp học</h1>
        </div>
        <p className="text-slate-500 text-sm font-medium ml-4">
          Cập nhật những thông báo quan trọng, tài liệu học tập và tin tức mới nhất từ giáo viên giảng dạy.
        </p>
      </div>

      {/* Full width Feed Area */}
      <div className="space-y-6">
        {/* Pinned News */}
        {pinnedNews.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600">
              <Pin className="h-3.5 w-3.5 rotate-45 text-amber-500 fill-amber-500" />
              <span>Thông báo được ghim</span>
            </div>
            {pinnedNews.map((news) => (
              <NewsCard key={news.id} news={news} isPinnedView={true} />
            ))}
          </div>
        )}

        {/* General Feed */}
        <div className="space-y-4">
          {pinnedNews.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Tất cả bài đăng</span>
            </div>
          )}

          {regularNews.length === 0 && pinnedNews.length === 0 ? (
            <EmptyState />
          ) : (
            regularNews.map((news) => (
              <NewsCard key={news.id} news={news} />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && <Pagination />}
      </div>
    </div>
  );
}