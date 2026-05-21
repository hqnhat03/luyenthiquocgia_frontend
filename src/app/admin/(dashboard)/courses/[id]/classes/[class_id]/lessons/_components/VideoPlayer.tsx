"use client";

import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  lectureId: number;
}

export default function VideoPlayer({ videoUrl, lectureId }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const playerId = `admin-yt-player-${lectureId}`;

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYoutubeId(videoUrl);

  useEffect(() => {
    if (!videoId) return;

    const onYouTubeIframeAPIReady = () => {
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        playerRef.current.destroy();
      }
      playerRef.current = new window.YT.Player(playerId, {
        height: "100%",
        width: "100%",
        videoId: videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
        },
      });
    };

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    } else if (window.YT && window.YT.Player) {
      onYouTubeIframeAPIReady();
    } else {
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }

    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, playerId]);

  if (!videoId) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-sm opacity-60">
        URL video không hợp lệ hoặc không phải YouTube
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-black relative">
      <div id={playerId} className="absolute top-0 left-0 w-full h-full border-0" />
    </div>
  );
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}
