import VideoCard from "@/components/VideoCard";
import Image from "next/image";
import Link from "next/link";

const VIDEOS = [
  {
    id: 1,
    thumbnailUrl: "thumbnail.jpg",
    duration: "12 min",
    name: "Youtube Thumbnail Videos",
    date: "12 Oct, 2024",
  },
  {
    id: 2,
    thumbnailUrl: "thumbnail.jpg",
    duration: "12 min",
    name: "Youtube Thumbnail Videos",
    date: "12 Oct, 2024",
  },
  {
    id: 3,
    thumbnailUrl: "thumbnail.jpg",
    duration: "12 min",
    name: "Youtube Thumbnail Videos",
    date: "12 Oct, 2024",
  },
  {
    id: 4,
    thumbnailUrl: "thumbnail.jpg",
    duration: "12 min",
    name: "Youtube Thumbnail Videos",
    date: "12 Oct, 2024",
  },
  {
    id: 5,
    thumbnailUrl: "thumbnail.jpg",
    duration: "12 min",
    name: "Youtube Thumbnail Videos",
    date: "12 Oct, 2024",
  },
  {
    id: 6,
    thumbnailUrl: "thumbnail.jpg",
    duration: "12 min",
    name: "Youtube Thumbnail Videos",
    date: "12 Oct, 2024",
  },
];

export default function Home() {
  return (
    <main>
      <div className="container mx-auto">
        <section className="mt-10">
          <p className="text-4xl font-semibold">All Videos</p>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">
              All the videos uploaded are shown below
            </span>
            <Link
              href="/upload"
              className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded shadow font-sans cursor-pointer"
            >
              Upload Video
            </Link>
          </div>
        </section>

        <section className="mt-10 flex flex-wrap gap-6">
          {VIDEOS.map((video) => (
            <VideoCard
              key={video.id}
              thumbnailUrl={video.thumbnailUrl}
              name={video.name}
              duration={video.duration}
              date={video.date}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
