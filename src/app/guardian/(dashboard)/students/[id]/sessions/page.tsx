"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCcw,
  SearchX,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, Suspense } from "react";

// --- Types ---

type AttendanceStatus = "present" | "absent" | "late";

interface Attendance {
  id: number;
  status: AttendanceStatus;
  note: string | null;
}

interface Session {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  course_name: string;
  class_code: string;
  attendance: Attendance | null;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface SessionsResponse {
  success: boolean;
  message: string;
  data: Session[];
  meta: PaginationMeta;
}

// --- Components ---

const AttendanceBadge = ({ attendance }: { attendance: Attendance | null }) => {
  if (!attendance) {
    return (
      <Badge 
        variant="secondary" 
        className="bg-slate-100 text-slate-500 font-bold border-slate-200/50 shadow-none gap-1.5 py-1 px-2.5"
      >
        <div className="size-1.5 rounded-full bg-slate-400 animate-pulse" />
        Chưa điểm danh
      </Badge>
    );
  }

  const configs: Record<AttendanceStatus, { label: string; className: string }> = {
    present: {
      label: "Có mặt",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    },
    absent: {
      label: "Vắng mặt",
      className: "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100",
    },
    late: {
      label: "Đi trễ",
      className: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
    },
  };

  const config = configs[attendance.status];

  return (
    <Badge className={cn("font-bold border shadow-none", config.className)}>
      {config.label}
    </Badge>
  );
};

function StudentSessionsContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = params.id;

  const [type, setType] = useState<"upcoming" | "past">((searchParams.get("type") as "upcoming" | "past") || "upcoming");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Session[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<SessionsResponse>(`/guardian/students/${studentId}/sessions`, {
        params: { type, page },
      });

      if (response.data.success) {
        setData(response.data.data);
        setMeta(response.data.meta);
      } else {
        setError(response.data.message || "Không thể tải danh sách lịch học");
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Đã xảy ra lỗi khi kết nối đến máy chủ");
    } finally {
      setLoading(false);
    }
  }, [studentId, type, page]);

  useEffect(() => {
    if (studentId) {
      fetchSessions();
    }
  }, [fetchSessions, studentId]);

  const handleTypeChange = (newType: string) => {
    const t = newType as "upcoming" | "past";
    setType(t);
    setPage(1);
    router.push(`?type=${t}&page=1`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    router.push(`?type=${type}&page=${newPage}`, { scroll: false });
  };

  // --- Rendering Helpers ---

  const TableSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i} className="border-border/5">
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="h-5 w-32" />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-5 w-24" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-5 w-48" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          {type === "past" && (
            <TableCell className="text-right">
              <Skeleton className="h-8 w-28 ml-auto rounded-lg" />
            </TableCell>
          )}
        </TableRow>
      ))}
    </>
  );

  const CardSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="border-none shadow-sm overflow-hidden bg-background/60 backdrop-blur-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-28" />
              </div>
              {type === "past" && <Skeleton className="h-7 w-24 rounded-full" />}
            </div>
            <div className="h-px bg-border/50" />
            <div className="space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-20 bg-background/50 rounded-3xl border-2 border-dashed border-border/50">
      <div className="p-4 rounded-full bg-muted/50 mb-4">
        <SearchX className="size-10 text-muted-foreground/40" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">Không có lịch học</h3>
      <p className="text-muted-foreground text-center max-w-xs">
        Hiện tại không có dữ liệu lịch học {type === "upcoming" ? "sắp tới" : "trong quá khứ"} cho học sinh này.
      </p>
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-20 bg-rose-50/50 dark:bg-rose-950/10 rounded-3xl border-2 border-dashed border-rose-200/50">
      <div className="p-4 rounded-full bg-rose-100 text-rose-600 mb-4">
        <AlertCircle className="size-10" />
      </div>
      <h3 className="text-xl font-bold text-rose-900 dark:text-rose-100 mb-2">Lỗi tải dữ liệu</h3>
      <p className="text-rose-700/70 dark:text-rose-300/70 text-center max-w-xs mb-6">
        {error}
      </p>
      <Button 
        onClick={fetchSessions} 
        variant="outline" 
        className="gap-2 border-rose-200 hover:bg-rose-100 hover:text-rose-900"
      >
        <RefreshCcw className="size-4" />
        Thử lại
      </Button>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            Lịch học học sinh
          </h2>
          <p className="text-muted-foreground font-medium">
            Xem chi tiết các buổi học sắp tới và lịch sử tham gia lớp học.
          </p>
        </div>

        <Tabs value={type} onValueChange={handleTypeChange} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 backdrop-blur-sm border border-border/50 rounded-xl h-12">
            <TabsTrigger 
              value="upcoming" 
              className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Sắp tới
            </TabsTrigger>
            <TabsTrigger 
              value="past"
              className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Lịch sử
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {error ? (
          renderError()
        ) : !loading && data.length === 0 ? (
          renderEmpty()
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-border/40 shadow-sm bg-background/50 backdrop-blur-sm">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-border/10">
                    <TableHead className="font-black text-foreground/70 h-14">Ngày học</TableHead>
                    <TableHead className="font-black text-foreground/70 h-14">Thời gian</TableHead>
                    <TableHead className="font-black text-foreground/70 h-14">Khóa học</TableHead>
                    <TableHead className="font-black text-foreground/70 h-14">Lớp</TableHead>
                    {type === "past" && <TableHead className="font-black text-foreground/70 h-14 text-right">Điểm danh</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableSkeleton />
                  ) : (
                    data.map((session) => (
                      <TableRow key={session.id} className="hover:bg-muted/20 border-border/5 group transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 group-hover:scale-110 transition-transform">
                              <Calendar className="size-5" />
                            </div>
                            <div className="font-bold">{new Date(session.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground font-medium">
                            <Clock className="size-4" />
                            <span>{session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-black text-foreground">{session.course_name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-muted-foreground">{session.class_code}</div>
                        </TableCell>
                        {type === "past" && (
                          <TableCell className="text-right">
                            <AttendanceBadge attendance={session.attendance} />
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="grid gap-4 md:hidden">
              {loading ? (
                <CardSkeleton />
              ) : (
                data.map((session) => (
                  <Card key={session.id} className="border-none shadow-sm overflow-hidden bg-background/60 backdrop-blur-sm">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-blue-600 uppercase tracking-wider">{new Date(session.date).toLocaleDateString('vi-VN', { weekday: 'long' })}</p>
                          <p className="font-black text-lg leading-tight">{new Date(session.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })}</p>
                        </div>
                        {type === "past" && <AttendanceBadge attendance={session.attendance} />}
                      </div>

                      <div className="h-px bg-border/50" />

                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Khóa học</p>
                          <p className="font-bold text-sm">{session.course_name}</p>
                          <p className="mt-0.5 text-xs font-bold text-muted-foreground">{session.class_code}</p>
                        </div>

                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/30 p-2 rounded-lg">
                          <Clock className="size-4 text-primary" />
                          <span>{session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/50">
                <p className="text-sm font-medium text-muted-foreground">
                  Hiển thị <span className="font-black text-foreground">{data.length}</span> trên <span className="font-black text-foreground">{meta.total}</span> buổi học
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="rounded-xl border-border/40 hover:bg-muted"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: meta.last_page }).map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        meta.last_page <= 5 ||
                        pageNum === 1 ||
                        pageNum === meta.last_page ||
                        Math.abs(pageNum - page) <= 1
                      ) {
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className={cn(
                              "w-9 h-9 rounded-xl font-bold transition-all",
                              page === pageNum 
                                ? "shadow-md shadow-primary/20 scale-110" 
                                : "border-border/40 hover:bg-muted"
                            )}
                          >
                            {pageNum}
                          </Button>
                        );
                      } else if (
                        (pageNum === 2 && page > 3) ||
                        (pageNum === meta.last_page - 1 && page < meta.last_page - 2)
                      ) {
                        return <span key={pageNum} className="px-1 text-muted-foreground">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === meta.last_page}
                    className="rounded-xl border-border/40 hover:bg-muted"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function StudentSessionsPage() {
  return (
    <Suspense fallback={
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-12 w-48 rounded-xl" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    }>
      <StudentSessionsContent />
    </Suspense>
  );
}
