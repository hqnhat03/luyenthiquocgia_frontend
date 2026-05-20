"use client";

import { useEffect, useRef, useState } from "react";
import { updateViewLesson, LessonDetail, ViewLessonProgress } from "@/api/student/lesson";

interface VideoPlayerProps {
  lesson: LessonDetail;
  progress: ViewLessonProgress;
  studentId: number;
}

export default function VideoPlayer({ lesson, progress, studentId }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Extract Youtube ID
  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYoutubeId(lesson.video_url);

  useEffect(() => {
    if (!videoId) return;

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player(`youtube-player-${lesson.id}`, {
        height: "100%",
        width: "100%",
        videoId: videoId,
        playerVars: {
          start: progress.last_position || 0,
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            setIsReady(true);
          },
          onStateChange: (event: any) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      onYouTubeIframeAPIReady();
    } else {
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }

    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
  }, [videoId, lesson.id, progress.last_position]);

  useEffect(() => {
    if (!isReady || !isPlaying || !playerRef.current) return;

    const interval = setInterval(async () => {
      try {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        const watched_percentage = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
        
        await updateViewLesson({
          lesson_id: lesson.id,
          student_id: studentId,
          duration: Math.round(duration),
          last_position: Math.round(currentTime),
          is_completed: watched_percentage >= 90,
          watched_percentage: watched_percentage,
        });
      } catch (error) {
        console.error("Error updating progress:", error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isReady, isPlaying, lesson.id, studentId]);

  if (!videoId) {
    return (
        <div className="w-full aspect-video bg-slate-900 rounded-2xl flex items-center justify-center text-white font-medium shadow-sm">
            URL video không hợp lệ
        </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-lg relative border border-slate-200">
      <div id={`youtube-player-${lesson.id}`} className="absolute top-0 left-0 w-full h-full border-0"></div>
    </div>
  );
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}
