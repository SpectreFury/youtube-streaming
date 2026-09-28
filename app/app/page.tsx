import VideoCard from "@/components/VideoCard";
import Link from "next/link";

interface HomeVideo {
  _id: string;
  thumbnailUrl: string;
  name: string;
  duration: string;
  date: string;
}

export default async function Home() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL!}/api/watch`,
    { cache: "no-store" },
  );

  const result = await response.json();
  const videos = result.data;
  console.log(videos);

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
          {videos.map((video: HomeVideo) => (
            <VideoCard
              id={video._id}
              key={video._id}
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
