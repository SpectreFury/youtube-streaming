"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import Player from "video.js/dist/types/player";
import { ArrowLeft, CalendarDays, CircleAlert } from "lucide-react";

interface VideoData {
  _id: string;
  name: string;
  description?: string;
  hlsUrl: string;
  thumbnailUrl: string;
  status?: string;
  createdAt?: string;
}

interface UpNextVideo {
  _id: string;
  name: string;
  thumbnailUrl: string;
  createdAt?: string;
}

const formatDate = (iso?: string) => {
  if (!iso) return "Unknown date";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const WatchVideo = () => {
  const params = useSearchParams();
  const videoId = params.get("v");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<Player | null>(null);

  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [upNext, setUpNext] = useState<UpNextVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(() => Boolean(videoId));
  const [error, setError] = useState<string | null>(() =>
    videoId ? null : "No video selected.",
  );
  const [showFullDescription, setShowFullDescription] = useState(false);

  // 1. Fetch video + up-next list
  useEffect(() => {
    if (!videoId) return;

    const fetchVideo = async () => {
      try {
        setLoading(true);
        setError(null);
        const base = process.env.NEXT_PUBLIC_BACKEND_URL!;

        const [videoRes, listRes] = await Promise.all([
          fetch(`${base}/api/watch/${videoId}`, { cache: "no-store" }),
          fetch(`${base}/api/watch`, { cache: "no-store" }).catch(() => null),
        ]);

        if (!videoRes.ok) throw new Error("Video fetch failed");

        const result = await videoRes.json();
        if (!result?.data) throw new Error("Video not found");
        setVideoData(result.data);

        if (listRes?.ok) {
          const list = await listRes.json();
          if (Array.isArray(list?.data)) {
            setUpNext(
              list.data.filter((v: UpNextVideo) => v._id !== videoId).slice(0, 8),
            );
          }
        }
      } catch (err: unknown) {
        console.error("Fetch error: ", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  // 2. Player initialization — runs once the <video> element exists.
  // (It is only mounted after loading finishes, so an empty-deps effect
  // would run during the skeleton phase when videoRef is still null and
  // the player would never be created.)
  useEffect(() => {
    if (loading) return;
    if (!videoRef.current || playerRef.current) return;

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
  }, [loading]);

  // 3. Dynamic source updater
  useEffect(() => {
    if (!playerRef.current || !videoData) return;

    const player = playerRef.current;
    player.src({ src: videoData.hlsUrl, type: "application/x-mpegURL" });
    player.poster(videoData.thumbnailUrl);
  }, [videoData]);

  const description = videoData?.description?.trim() || "";
  const shouldClamp = description.length > 220 && !showFullDescription;

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-sans text-blue-200 hover:text-blue-100 transition-colors"
        >
          <ArrowLeft size={14} /> View All Videos
        </Link>

        {loading ? (
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
            <div>
              <div className="aspect-video w-full animate-pulse rounded-2xl bg-[#222628]" />
              <div className="mt-5 h-7 w-3/4 animate-pulse rounded-lg bg-[#222628]" />
              <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-[#222628]" />
              <div className="mt-5 h-32 animate-pulse rounded-2xl bg-[#222628]" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-20 w-36 shrink-0 animate-pulse rounded-xl bg-[#222628]" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 animate-pulse rounded bg-[#222628]" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-[#222628]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error || !videoData ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-gray-800 bg-[#191c1e] px-6 py-20 text-center">
            <CircleAlert className="h-10 w-10 text-red-400" />
            <h1 className="mt-4 font-sans text-2xl font-semibold">
              Couldn&apos;t load this video
            </h1>
            <p className="mt-2 max-w-md font-sans text-sm text-gray-400">
              {error || "This video may have been removed or is still processing."}
            </p>
            <Link
              href="/"
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-sans text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Back to all videos
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
            {/* Main column */}
            <div className="min-w-0">
              <div className="relative w-full overflow-hidden rounded-2xl border border-gray-800 bg-black shadow-2xl shadow-black/40">
                <div className="aspect-video w-full">
                  <div data-vjs-player className="h-full w-full">
                    <video
                      ref={videoRef}
                      className="video-js vjs-big-play-centered vjs-theme-city"
                      playsInline
                    />
                  </div>
                </div>
              </div>

              <h1 className="mt-5 font-sans text-2xl font-bold leading-tight text-white md:text-3xl">
                {videoData.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="inline-flex items-center gap-1.5 font-sans text-sm text-gray-400">
                  <CalendarDays size={14} />
                  {formatDate(videoData.createdAt)}
                </span>
                {videoData.status && (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-sans text-xs font-semibold text-emerald-300">
                    {videoData.status}
                  </span>
                )}
              </div>

              <section className="mt-5 rounded-2xl border border-gray-800 bg-[#191c1e] p-5">
                <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-gray-400">
                  Description
                </h2>
                {description ? (
                  <>
                    <p
                      className={`mt-2 whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-gray-200 ${shouldClamp ? "line-clamp-3" : ""}`}
                    >
                      {description}
                    </p>
                    {description.length > 220 && (
                      <button
                        onClick={() => setShowFullDescription((v) => !v)}
                        className="mt-2 font-sans text-sm font-semibold text-blue-400 hover:text-blue-300"
                      >
                        {showFullDescription ? "Show less" : "Show more"}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="mt-2 font-sans text-sm italic text-gray-500">
                    No description added for this video yet.
                  </p>
                )}
              </section>
            </div>

            {/* Up next sidebar */}
            <aside className="min-w-0">
              <h2 className="font-sans text-lg font-semibold text-white">Up next</h2>
              {upNext.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-gray-800 bg-[#191c1e] p-5">
                  <p className="font-sans text-sm text-gray-400">
                    No other videos yet. Be the first to upload another one.
                  </p>
                  <Link
                    href="/upload"
                    className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-2.5 font-sans text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Upload Video
                  </Link>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {upNext.map((v) => (
                    <Link
                      key={v._id}
                      href={`/watch?v=${v._id}`}
                      className="group flex gap-3 rounded-xl border border-transparent p-2 transition-colors hover:border-gray-800 hover:bg-[#191c1e]"
                    >
                      <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-xl border border-gray-800 bg-black">
                        {v.thumbnailUrl ? (
                          <Image
                            src={v.thumbnailUrl}
                            alt={v.name}
                            fill
                            sizes="144px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-sans text-xs text-gray-500">
                            No thumbnail
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-sans text-sm font-semibold leading-snug text-gray-100 group-hover:text-white">
                          {v.name}
                        </p>
                        <p className="mt-1 font-sans text-xs text-gray-500">
                          {formatDate(v.createdAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
};

export default WatchVideo;
