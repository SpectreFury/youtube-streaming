"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import videojs from "video.js";
import "video.js/dist/video-js.css";

// Define a type for your API video data structure
interface VideoData {
  hlsUrl: string;
  thumbnailUrl: string;
  name?: string;
}

const WatchVideo = () => {
  const params = useSearchParams();
  const videoId = params.get("v");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any | null>(null); // Stores the video.js instance

  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Fetch data from backend
  useEffect(() => {
    if (!videoId) return;

    const fetchVideo = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL!}/api/watch/${videoId}`,
        );
        const result = await response.json();

        if (result?.data) {
          setVideoData(result.data);
        }
      } catch (error) {
        console.log("Fetch error: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  // 2. Initialize Video.js when data is ready and the element is in the DOM
  useEffect(() => {
    if (!videoData || !videoRef.current) return;

    // Make sure we don't accidentally initialize it twice
    if (!playerRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        autoplay: false,
        preload: "auto",
        fluid: true, // Makes the player responsive (16:9 natively)
        poster: videoData.thumbnailUrl,
        sources: [
          {
            src: videoData.hlsUrl,
            type: "application/x-mpegURL", // Essential MIME type for HLS streams
          },
        ],
      });
    } else {
      // If player already exists but the URL changed, just update the source & poster
      const player = playerRef.current;
      player.src({ src: videoData.hlsUrl, type: "application/x-mpegURL" });
      player.poster(videoData.thumbnailUrl);
    }

    // Cleanup player instance when component unmounts
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [videoData]);

  if (loading) {
    return (
      <main className="flex justify-center items-center h-screen">
        Loading video setup...
      </main>
    );
  }

  if (!videoData) {
    return (
      <main className="flex justify-center items-center h-screen">
        Video not found.
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {videoData.name || "Watching Video"}
      </h1>

      {/* Video.js wrapper wrapper built-in styles */}
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered vjs-theme-city"
        />
      </div>
    </main>
  );
};

export default WatchVideo;
