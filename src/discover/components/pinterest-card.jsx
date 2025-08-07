import { useState } from "react";
import { Heart, User } from "lucide-react";

function PinterestCard({ post, onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const handleClick = () => {
    onClick(post.id);
  };

  return (
    <div
      className="group relative cursor-pointer transition-transform duration-300 hover:scale-105"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Container */}
      <div className="bg-darkBox rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="relative">
          {(post.video_url || post.image_url) && (
            <video
              src={post.video_url || post.image_url}
              className={`w-full h-48 object-cover transition-opacity duration-300 ${
                videoLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoadedData={() => setVideoLoaded(true)}
              muted
              loop
              playsInline
              preload="metadata"
              style={{ display: videoLoaded ? "block" : "none" }}
              onMouseEnter={(e) => e.target.play()}
              onMouseLeave={(e) => {
                e.target.pause();
                e.target.currentTime = 0;
              }}
            />
          )}
          {!videoLoaded && (
            <div className="w-full h-48 bg-darkBoxSub animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-600 border-t-[#F2D543] rounded-full animate-spin">
                {" "}
              </div>
            </div>
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
              <div className="flex items-center gap-1 bg-black/30 rounded-full px-2 py-1">
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
            </div>
          </div>

          {/* Title Overlay - Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
            <h3 className="text-white montserrat-medium text-xs line-clamp-1 font-semibold drop-shadow-lg">
              {post.name}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PinterestCard;
