"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth-store";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  School,
  Users,
  Video
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

interface GuardianDashboardStats {
  total_students: number;
  classes_today: number;
  new_exam_results: number;
}

interface TodaySchedule {
  student_name: string;
  class_code: string;
  course_name: string;
  start_time: string;
  end_time: string;
  meeting_url: string | null;
}

interface RecentExamResult {
  student_name: string;
  exam_name: string;
  class_code: string;
  score: number;
  total_score: number;
  status: string;
  submitted_at: string;
}

interface StudentOverview {
  id: number;
  name: string;
  avatar: string | null;
  school: string | null;
  grade: string | null;
}

interface GuardianDashboardData {
  stats: GuardianDashboardStats;
  today_schedules: TodaySchedule[];
  recent_exam_results: RecentExamResult[];
  students_overview: StudentOverview[];
}

export default function GuardianDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = React.useState<GuardianDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get("/guardian/dashboard/stats");
        if (response.data?.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch guardian dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: "Học sinh",
      value: data?.stats.total_students ?? "0",
      description: "Đang được quản lý",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100/50",
    },
    {
      title: "Lớp học hôm nay",
      value: data?.stats.classes_today ?? "0",
      description: "Tiết học trong ngày",
      icon: Calendar,
      color: "text-orange-600",
      bg: "bg-orange-100/50",
    },
    {
      title: "Kết quả mới",
      value: data?.stats.new_exam_results ?? "0",
      description: "Bài kiểm tra chưa xem",
      icon: FileText,
      color: "text-purple-600",
      bg: "bg-purple-100/50",
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-1 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            {user?.name ? `Xin chào, ${user.name}! 👋` : "Xin chào! 👋"}
          </h2>
          <p className="text-muted-foreground font-medium">Bảng điều khiển phụ huynh - Theo dõi tình hình học tập của các con.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border border-border/20">
          <Clock className="size-3" />
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-background/60 backdrop-blur-sm transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full ${stat.bg} opacity-20 blur-2xl group-hover:scale-150 transition-transform duration-500`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg} relative z-10`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-black tracking-tight">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1.5 font-medium flex items-center gap-1">
                    {stat.description}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/10 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                <Clock className="size-4" />
              </div>
              Lịch học hôm nay
            </CardTitle>
            <CardDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">Lịch học của các con trong ngày</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border/20 bg-muted/5">
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-4">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
              ))
            ) : data?.today_schedules && data.today_schedules.length > 0 ? (
              data.today_schedules.map((item, index) => (
                <div key={index} className="flex flex-col gap-3 p-4 rounded-lg border border-border/20 bg-muted/5 hover:bg-muted/10 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-bold text-sm group-hover:text-primary transition-colors">{item.course_name}</p>
                      <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Users className="size-3 text-primary/60" /> {item.student_name}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="size-3 text-primary/60" /> Lớp {item.class_code}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      <Clock className="size-3 text-primary" />
                      {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}
                    </div>
                    {item.meeting_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-3 text-[10px] font-bold border-primary/20 hover:bg-primary/5 text-primary gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(item.meeting_url!, '_blank');
                        }}
                      >
                        <Video className="size-3" />
                        VÀO HỌC
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/5 rounded-lg border border-dashed border-border/40">
                <Calendar className="size-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Không có lịch học nào trong ngày hôm nay</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="gap-0 border-none shadow-sm bg-background/60 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/10 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <div className="p-2 rounded-md bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="size-4" />
                </div>
                Kết quả kiểm tra gần đây
              </CardTitle>
              <CardDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">Điểm số mới nhất của các con</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/20 bg-muted/5">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-8 w-12 rounded-md" />
                  </div>
                ))
              ) : data?.recent_exam_results && data.recent_exam_results.length > 0 ? (
                data.recent_exam_results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border/20 bg-muted/5 hover:bg-muted/10 transition-colors">
                    <div className="space-y-1.5">
                      <p className="font-bold text-sm text-foreground">{result.exam_name}</p>
                      <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="size-3" /> {result.student_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="size-3" /> {result.class_code}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="px-3 py-1 rounded-md bg-emerald-100 text-emerald-700 font-black text-sm">
                        {result.score} / {result.total_score} <span className="text-[10px] font-medium opacity-70">điểm</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center bg-muted/5 rounded-lg border border-dashed border-border/40">
                  <FileText className="size-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Chưa có kết quả kiểm tra nào gần đây</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 border-none shadow-sm bg-background/60 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/10 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <div className="p-2 rounded-md bg-indigo-100 text-indigo-600">
                  <GraduationCap className="size-4" />
                </div>
                Học sinh đang theo dõi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))
              ) : data?.students_overview && data.students_overview.length > 0 ? (
                data.students_overview.map((student) => (
                  <Link
                    key={student.id}
                    href={`/guardian/students/${student.id}`}
                    className="flex items-center gap-4 p-2 rounded-lg hover:bg-primary/5 transition-all group"
                  >
                    <Avatar className="size-10 border border-border/50 group-hover:border-primary/30">
                      <AvatarImage src={student.avatar || undefined} />
                      <AvatarFallback className="bg-primary/5 text-primary font-bold">
                        {student.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-bold group-hover:text-primary transition-colors">{student.name}</p>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
                        {student.school && (
                          <span className="flex items-center gap-1">
                            <School className="size-3" /> {student.school}
                          </span>
                        )}
                        {student.grade && (
                          <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                            Lớp {student.grade}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Không tìm thấy học sinh
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
