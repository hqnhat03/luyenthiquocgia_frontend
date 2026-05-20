"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  XCircle
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface StudentStats {
  attendance: {
    total_sessions: number;
    present: number;
    late: number;
    absent: number;
    rate: number;
  };
  academic: {
    total_exams: number;
    avg_score: number;
  };
}

export default function StudentStatsPage() {
  const params = useParams();
  const id = params.id;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [student, setStudent] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, studentRes] = await Promise.all([
          api.get(`/guardian/students/${id}/stats`),
          api.get(`/guardian/students/${id}`)
        ]);

        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
        if (studentRes.data.success) {
          setStudent(studentRes.data.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
        <AlertCircle className="size-12 mb-4 opacity-20" />
        <p>Không tìm thấy dữ liệu thống kê của học sinh.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
          {student?.name || "Thống kê học tập"}
        </h2>
        <p className="text-muted-foreground font-medium">
          {student?.name ? `Thông tin học tập và chuyên cần của ${student.name}` : "Xem tổng quan về tình hình học tập và chuyên cần của học sinh."}
        </p>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-blue-50/50 dark:bg-blue-900/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-blue-600 dark:text-blue-400">Tỉ lệ chuyên cần</CardTitle>
            <Calendar className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.attendance.rate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Dựa trên {stats.attendance.total_sessions} buổi học</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-amber-50/50 dark:bg-amber-900/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-amber-600 dark:text-amber-400">Điểm trung bình</CardTitle>
            <Award className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.academic.avg_score.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Trên thang điểm 10</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-emerald-50/50 dark:bg-emerald-900/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Số bài kiểm tra</CardTitle>
            <BookOpen className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.academic.total_exams}</div>
            <p className="text-xs text-muted-foreground mt-1">Bài đã thực hiện</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-rose-50/50 dark:bg-rose-900/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-rose-600 dark:text-rose-400">Số buổi vắng</CardTitle>
            <XCircle className="size-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-600">{stats.attendance.absent}</div>
            <p className="text-xs text-muted-foreground mt-1">Cần lưu ý nhắc nhở</p>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-4xl">
        {/* Attendance Breakdown */}
        <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/10 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-2 rounded-md bg-blue-100 text-blue-600">
                <Clock className="size-4" />
              </div>
              Chi tiết chuyên cần
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span>Tỉ lệ tham gia</span>
                <span className={cn(
                  stats.attendance.rate >= 90 ? "text-emerald-600" :
                    stats.attendance.rate >= 75 ? "text-blue-600" : "text-rose-600"
                )}>
                  {stats.attendance.rate}%
                </span>
              </div>
              <Progress value={stats.attendance.rate} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800">
                <p className="text-xs font-bold text-emerald-600 mb-1">Hiện diện</p>
                <p className="text-2xl font-black">{stats.attendance.present}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800">
                <p className="text-xs font-bold text-amber-600 mb-1">Đi trễ</p>
                <p className="text-2xl font-black">{stats.attendance.late}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800">
                <p className="text-xs font-bold text-rose-600 mb-1">Vắng mặt</p>
                <p className="text-2xl font-black">{stats.attendance.absent}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-xs font-medium text-muted-foreground flex items-start gap-3">
              <TrendingUp className="size-4 shrink-0 text-blue-500 mt-0.5" />
              <p>Tỉ lệ chuyên cần được tính dựa trên tổng số buổi học đã diễn ra. Việc đi trễ nhiều lần có thể ảnh hưởng đến kết quả học tập chung.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
