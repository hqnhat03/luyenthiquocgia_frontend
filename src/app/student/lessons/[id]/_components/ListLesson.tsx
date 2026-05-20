"use client";

import { studentAxios } from "@/api/student";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Clock, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ListLessonProps {
  classId: number;
  currentLessonId: number;
}

interface LessonItem {
    id: number;
    lesson_name: string;
    duration_value: number;
    duration_unit: string;
    status: number;
}

let cachedClassId: number | null = null;
let cachedLessons: LessonItem[] = [];

export default function ListLesson({ classId, currentLessonId }: ListLessonProps) {
  const isCached = classId === cachedClassId && cachedLessons.length > 0;
  const [lessons, setLessons] = useState<LessonItem[]>(isCached ? cachedLessons : []);
  const [loading, setLoading] = useState(!isCached);

  useEffect(() => {
    if (isCached) return;

    const fetchLessons = async () => {
      try {
        const response = await studentAxios.get(`/classes/lessons?id=${classId}&page=1&pagination=100`);
        if (response.data.status === "success") {
          const fetchedLessons = response.data.data.data;
          setLessons(fetchedLessons);
          cachedClassId = classId;
          cachedLessons = fetchedLessons;
        }
      } catch (error) {
        console.error("Failed to load class lessons", error);
      } finally {
        setLoading(false);
      }
    };
    if (classId) fetchLessons();
  }, [classId, isCached]);

  const formatDuration = (value: number, unit: string) => {
    if (unit === 'hour') return `${value} giờ`;
    if (unit === 'minute') return `${value} phút`;
    return `${value} ${unit}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 space-y-4">
        <h3 className="font-bold text-lg text-slate-900 mb-4">Danh sách bài học</h3>
        {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[calc(100vh-140px)] md:sticky md:top-6">
        <div className="p-4 md:p-5 border-b border-slate-100 shrink-0 bg-slate-50/50 rounded-t-2xl">
            <h3 className="font-bold text-lg text-slate-900">Danh sách bài học</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">{lessons.length} bài học trong khóa này</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-1.5">
                {lessons.map((lesson, index) => {
                    const isActive = lesson.id === currentLessonId;
                    return (
                        <Link key={lesson.id} href={`/student/lessons/${lesson.id}`}>
                            <div className={`group flex items-center p-3 rounded-xl transition-all cursor-pointer ${isActive ? 'bg-primary/5 border border-primary/20 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}>
                                <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg shrink-0 mr-3.5 transition-colors ${isActive ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                    {isActive ? <PlayCircle className="w-5 h-5 animate-pulse" /> : <span className="font-bold text-sm">{index + 1}</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-sm font-semibold line-clamp-2 leading-tight transition-colors ${isActive ? 'text-primary' : 'text-slate-700 group-hover:text-primary'}`}>
                                        {lesson.lesson_name}
                                    </h4>
                                    <div className="flex items-center mt-1.5 text-[11px] text-slate-500 gap-2 font-medium">
                                        <div className="flex items-center gap-1 bg-slate-50/80 px-1.5 py-0.5 rounded">
                                            <Clock className="w-3 h-3 text-slate-400" />
                                            <span>{formatDuration(lesson.duration_value, lesson.duration_unit)}</span>
                                        </div>
                                    </div>
                                </div>
                                {!isActive && (
                                    <ChevronRight className="w-4 h-4 text-slate-300 ml-2 shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                )}
                            </div>
                        </Link>
                    );
                })}
                
                {lessons.length === 0 && (
                    <div className="py-8 text-center text-slate-500 text-sm">
                        Không có bài học nào.
                    </div>
                )}
        </div>
    </div>
  );
}
