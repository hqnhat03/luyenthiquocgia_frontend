"use client";

import { getLessonDetail, getViewLessonProgress, LessonDetail, ViewLessonProgress } from "@/api/student/lesson";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth-store";
import { ChevronLeft, GraduationCap } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DecriptionLesson from "./_components/DecriptionLesson";
import ListLesson from "./_components/ListLesson";
import ProgressStydyBar from "./_components/ProgressStydyBar";
import VideoPlayer from "./_components/VideoPlayer";

let cachedClassId: number | null = null;

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = Number(params?.id);
  const user = useAuthStore((state) => state.user);

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [progress, setProgress] = useState<ViewLessonProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    const targetClassId = lesson?.class_id || cachedClassId;
    if (targetClassId) {
      router.push(`/student/class/${targetClassId}/lectures`);
    } else {
      router.back();
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !lessonId) return;
      try {
        const [lessonRes, progressRes] = await Promise.all([
          getLessonDetail(lessonId),
          getViewLessonProgress(user.id, lessonId).catch(() => ({ status: 'error', data: null })), // handle cases where progress endpoint returns error
        ]);

        if (lessonRes.status === "success") {
          setLesson(lessonRes.data);
          cachedClassId = lessonRes.data.class_id;
        } else {
            toast.error("Không thể tải thông tin bài học");
        }

        if (progressRes.status === "success" && progressRes.data) {
          setProgress(progressRes.data);
        } else {
            // Default progress if none found
            setProgress({
                id: 0,
                lesson_id: lessonId,
                student_id: user.id,
                duration: 0,
                last_position: 0,
                is_completed: false,
                watched_percentage: 0
            });
        }
      } catch (error) {
        console.error("Error fetching lesson detail", error);
        toast.error("Đã xảy ra lỗi khi tải bài học");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [lessonId, user]);

  if (loading) {
    return (
    <div className="min-h-screen bg-slate-50 pb-12">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
            <div className="flex items-center">
                <Button 
                    variant="ghost" 
                    onClick={handleBack} 
                    className="hover:bg-slate-200/50 text-slate-600 transition-colors -ml-4"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Quay lại bài giảng
                </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="lg:col-span-2 space-y-6 animate-pulse">
                    <Skeleton className="w-full aspect-video rounded-2xl" />
                    <Skeleton className="h-[120px] w-full rounded-2xl" />
                    <Skeleton className="h-[200px] w-full rounded-2xl" />
                </div>
                <div className="space-y-6">
                    {cachedClassId ? (
                        <ListLesson classId={cachedClassId} currentLessonId={lessonId} />
                    ) : (
                        <Skeleton className="h-[calc(100vh-140px)] w-full rounded-2xl animate-pulse" />
                    )}
                </div>
            </div>
        </div>
    </div>
    );
  }

  if (!lesson) {
    return (
        <div className="container mx-auto p-8 flex flex-col items-center justify-center min-h-[60vh] bg-slate-50">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                <GraduationCap className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Không tìm thấy bài học</h2>
            <p className="text-slate-500 mb-6">Bài học có thể đã bị xóa hoặc bạn không có quyền truy cập.</p>
            <Button onClick={handleBack} variant="default">
                Quay lại
            </Button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
            <div className="flex items-center">
                <Button 
                    variant="ghost" 
                    onClick={handleBack} 
                    className="hover:bg-slate-200/50 text-slate-600 transition-colors -ml-4"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Quay lại bài giảng
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Video Player */}
                    {progress && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <VideoPlayer
                                lesson={lesson}
                                progress={progress}
                                studentId={user?.id || 0}
                            />
                        </div>
                    )}

                    {/* Lesson Info */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{lesson.lesson_name}</h1>
                                <p className="text-sm text-slate-500">
                                    Được tạo ngày {new Date(lesson.created_at).toLocaleDateString("vi-VN")}
                                </p>
                            </div>
                        </div>
                        
                        {progress && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <ProgressStydyBar progress={progress} />
                            </div>
                        )}
                    </div>

                    {/* Description & Materials */}
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <DecriptionLesson description={lesson.description} documentUrl={lesson.document_url} />
                    </div>
                </div>

                {/* Sidebar */}
                <div>
                    <ListLesson classId={lesson.class_id} currentLessonId={lesson.id} />
                </div>
            </div>
        </div>
    </div>
  );
}
