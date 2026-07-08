"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import Player from "video.js/dist/types/player";

interface VideoData {
  hlsUrl: string;
  thumbnailUrl: string;
  name?: string;
}

const WatchVideo = () => {
  const params = useSearchParams();
  const videoId = params.get("v");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<Player | null>(null);

  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Data
  useEffect(() => {
    if (!videoId) return;

    const fetchVideo = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL!}/api/watch/${videoId}`,
        );
        
        if (!response.ok) throw new Error("Video fetch failed");
        
        const result = await response.json();
        if (result?.data) {
          setVideoData(result.data);
        } else {
          throw new Error("Video not found");
        }
      } catch (err: any) {
        console.error("Fetch error: ", err);
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  // 2. Persistent Player Initialization (Runs exactly once on mount)
  useEffect(() => {
    if (!videoRef.current || playerRef.current) return;

    // Instantiate Video.js immediately on an empty shell
    playerRef.current = videojs(videoRef.current, {
      controls: true,
      autoplay: false,
      preload: "auto",
      fluid: true,
    });

    // Clean up ONLY when the user navigates away from the page completely
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  // 3. Dynamic Source Updater (Safely pushes changes when data loads)
  useEffect(() => {
    if (!playerRef.current || !videoData) return;

    const player = playerRef.current;
    
    // Update the source and poster cleanly without changing DOM nodes
    player.src({ src: videoData.hlsUrl, type: "application/x-mpegURL" });
    player.poster(videoData.thumbnailUrl);
  }, [videoData]);

  return (
    <main className="max-w-4xl mx-auto p-4 min-h-screen">
      {/* 1. Header Title - Updates dynamically when data exists */}
      <h1 className="text-2xl font-bold mb-4">
        {loading ? "Loading..." : videoData?.name || "Watching Video"}
      </h1>

      {/* 2. The Video Player Layout - ALWAYS remains in the DOM */}
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        
        {/* Loading Overlay State */}
        {loading && (
          <div className="absolute inset-0 flex justify-center items-center bg-zinc-900/90 text-white z-10">
            <span className="animate-pulse">Setting up video stream...</span>
          </div>
        )}

        {/* Error Overlay State */}
        {error && !loading && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-zinc-900 text-red-400 z-10 p-4">
            <p className="font-semibold text-lg">Error Loading Video</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        )}

        {/* Video.js Element - Never gets unmounted, preventing the disappearing bug */}
        <div data-vjs-player className="w-full h-full">
          <video
            ref={videoRef}
            className="video-js vjs-big-play-centered vjs-theme-city"
            playsInline
          />
        </div>
      </div>
    </main>
  );
};

export default WatchVideo;
