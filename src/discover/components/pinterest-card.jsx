import { useEffect, useState, useRef } from "react";
import { Heart, MessageCircle, User, Clock } from "lucide-react";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";
import OptimizedVideo from "../../components/OptimizedVideo";

function PinterestCard({ post, onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  const [videoDuration, setVideoDuration] = useState(null);

  // Intersection Observer para detectar visibilidad de la card
  const [cardRef, isIntersecting] = useIntersectionObserver({
    threshold: 0.2,
    rootMargin: "100px",
  });

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}:${remainingMinutes
        .toString()
        .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    }

    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleLoadedMetadata = (e) => {
    setVideoDuration(e.target.duration);
  };

  const handleClick = () => {
    onClick(post.id);
  };

  return (
    <div
      ref={cardRef}
      className="group relative cursor-pointer transition-transform duration-300 hover:scale-105"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Container */}
      <div className="bg-darkBox rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="relative">
          {(post.video_url || post.image_url) && (
            <OptimizedVideo
              src={post.video_url || post.image_url}
              className="w-full h-48 object-cover"
              onLoadedMetadata={handleLoadedMetadata}
              isHovered={isHovered}
              autoPlay={true}
            />
          )}

          {/* User Info and Likes Overlay - Top */}
          <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center justify-between">
              {/* User Info */}
              <div className="flex items-center gap-2">
                {post.user?.profile_image ? (
                  <img
                    src={post.user.profile_image}
                    alt={post.user.name}
                    className="w-6 h-6 rounded-full object-cover border-2 border-white"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-darkBoxSub flex items-center justify-center border-2 border-white">
                    <User size={14} className="text-gray-400" />
                  </div>
                )}
                <span className="text-white montserrat-medium text-xs line-clamp-1 font-semibold drop-shadow-lg">
                  {post.user?.name || "Anonymous"}
                </span>
              </div>

              {/* Likes */}
              <div className="flex items-center gap-3 bg-black/30 rounded-full px-2 py-1">
                <div className="flex items-center gap-1">
                  <Heart
                    size={14}
                    className={`${
                      post.own_like ? "text-red-500 fill-current" : "text-white"
                    } drop-shadow-lg`}
                  />
                  <span className="text-white montserrat-medium text-xs font-semibold drop-shadow-lg">
                    {post.likes || 0}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle
                    size={14}
                    className={"text-white drop-shadow-lg"}
                  />
                  <span className="text-white montserrat-medium text-xs font-semibold drop-shadow-lg">
                    {post.comments || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Title and Duration Overlay - Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
            <div className="flex items-center justify-between">
              <h3 className="text-white montserrat-medium text-xs line-clamp-1 font-semibold drop-shadow-lg flex-1 mr-2">
                {post.name}
              </h3>

              <div className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-1 flex-shrink-0">
                <Clock size={10} className="text-white drop-shadow-lg" />
                <span className="text-white montserrat-medium text-xs font-semibold drop-shadow-lg">
                  {formatDuration(videoDuration)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PinterestCard;
