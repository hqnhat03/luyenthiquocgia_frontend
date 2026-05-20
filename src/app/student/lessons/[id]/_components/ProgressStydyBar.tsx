"use client";

import { ViewLessonProgress } from "@/api/student/lesson";
import { Trophy, PlayCircle } from "lucide-react";

interface ProgressStydyBarProps {
  progress: ViewLessonProgress;
}

export default function ProgressStydyBar({ progress }: ProgressStydyBarProps) {
  const percentage = Math.min(100, Math.max(0, progress.watched_percentage));
  const isCompleted = progress.is_completed || percentage >= 90;

  return (
    <div className="space-y-3 mt-5">
      <div className="flex justify-between items-end text-sm">
        <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600 flex items-center gap-1.5">
                {isCompleted ? (
                    <Trophy className="w-4 h-4 text-amber-500" />
                ) : (
                    <PlayCircle className="w-4 h-4 text-primary" />
                )}
                Tiến trình học tập
            </span>
        </div>
        <span className={`font-bold text-lg ${isCompleted ? 'text-amber-500' : 'text-primary'}`}>
            {percentage}%
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
        <div 
          className={`h-2.5 rounded-full transition-all duration-700 ease-out ${isCompleted ? 'bg-amber-500' : 'bg-primary'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isCompleted && (
          <p className="text-xs text-amber-600 font-medium animate-in fade-in slide-in-from-top-1">
              🎉 Chúc mừng bạn đã hoàn thành bài học này!
          </p>
      )}
    </div>
  );
}
