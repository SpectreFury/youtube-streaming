type VideoCardProps = {
  thumbnailUrl: string;
  duration: string;
  name: string;
  date: string;
};

const VideoCard = ({ thumbnailUrl, duration, name, date }: VideoCardProps) => {
  return (
    <div className="max-w-[480px]">
      <div className="rounded-xl overflow-hidden border-2 border-gray-800 relative">
        <img
          src={thumbnailUrl}
          alt="Video thumbnail"
          className="w-full h-auto object-cover"
        />

        <span className="font-sans absolute bottom-2 right-2 bg-gray-900 text-white text-xs px-2 py-1 rounded md font-medium">
          {duration}
        </span>
      </div>

      <div className="mt-2">
        <p className="font-sans text-lg">{name}</p>
        <span className="font-sans text-gray-200">{date}</span>
      </div>
    </div>
  );
};

export default VideoCard;
