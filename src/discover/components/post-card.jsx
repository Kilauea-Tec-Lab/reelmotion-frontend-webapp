import { useState, useRef, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  User,
  Send,
  Maximize,
  Minimize,
  Expand,
  Volume2,
  VolumeX,
  Play,
  Pause,
} from "lucide-react";
import { likePost, addComment, getPostById } from "../functions";
import CommentsSection from "./comments-section";
import ShareModal from "./share-modal";
import { createPusherClient } from "../../pusher";

function PostCard({ post, onUpdate, public_post }) {
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoFullWidth, setIsVideoFullWidth] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef(null);
  const [postInfo, setPostInfo] = useState(post);
  const [isSameUser, setIsSameUser] = useState(post?.own_person);

  const pusherClient = createPusherClient();

  async function getPost(postId) {
    const info = await getPostById(postId);
    setPostInfo(info?.data);
  }

  // WebSocket Effects
  useEffect(() => {
    if (public_post == true) return;
    let channel = pusherClient.subscribe(
      `private-get-project-discover.${postInfo?.id}`
    );

    channel.bind("fill-project-discover", ({ project_id }) => {
      getPost(project_id);
    });

    return () => {
      pusherClient.unsubscribe(`private-get-project-discover.${postInfo?.id}`);
    };
  }, []);

  // Video initialization
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, []);

  const handleLike = async () => {
    const newLikedState = !postInfo?.own_like;

    try {
      const response = await likePost(postInfo.id);

      if (response.success) {
        onUpdate(postInfo.id, {
          is_liked: newLikedState,
        });
      } else {
      }
    } catch (error) {}
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await addComment(postInfo.id, commentText.trim());
      setCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setCommentText("");
      setIsSubmittingComment(false);
    }
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.mozRequestFullScreen) {
        videoRef.current.mozRequestFullScreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
    }
  };

  const handleVolumeToggle = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      videoRef.current.muted = newMutedState;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      if (newVolume === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "now";
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-darkBox rounded-2xl overflow-auto max-h-[90vh] w-full max-w-4xl mx-auto">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-darkBoxSub flex items-center justify-center">
            {postInfo?.user?.profile_image ? (
              <img
                src={postInfo?.user?.profile_image}
                alt={postInfo.user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={20} className="text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-white montserrat-medium text-sm">
              {postInfo.user?.name || "Anonymous"}
            </h3>
            <p className="text-gray-400 montserrat-light text-xs">
              {formatDate(postInfo.updated_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Post Content */}
      {postInfo.description && (
        <div className="px-4 pb-3">
          <p className="text-white montserrat-regular text-sm leading-relaxed">
            {postInfo.description}
          </p>
        </div>
      )}

      {/* Video Content */}
      <div
        className="relative"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={postInfo.video_url}
          className={`w-full object-cover cursor-pointer transition-all duration-300 ${
            isVideoFullWidth ? "object-contain bg-black" : "object-cover"
          }`}
          style={{
            height: isVideoFullWidth ? "65vh" : "55vh",
            minHeight: window.innerWidth < 768 ? "250px" : "350px",
          }}
          loop
          muted={isMuted}
          playsInline
          onClick={handleVideoClick}
          onPlay={() => setIsVideoPlaying(true)}
          onPause={() => setIsVideoPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />

        {/* Video Controls Top Right - Always visible */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVideoFullWidth(!isVideoFullWidth);
            }}
            className="bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-full transition-all backdrop-blur-sm"
            title={isVideoFullWidth ? "Exit full width" : "Full width"}
          >
            {isVideoFullWidth ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFullscreen();
            }}
            className="bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-full transition-all backdrop-blur-sm"
            title="Fullscreen"
          >
            <Expand size={18} />
          </button>
        </div>

        {/* Video Controls Bottom - Show on hover for normal view, always for full width */}
        <div
          className={`absolute bottom-4 left-4 right-4 z-10 transition-opacity duration-300 ${
            isVideoFullWidth || showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="bg-black bg-opacity-60 backdrop-blur-sm rounded-lg flex p-3 gap-4">
            {/* Timeline */}
            <div className="flex items-center gap-3 w-3/4">
              {/* Play/Pause */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleVideoClick();
                }}
                className="text-white hover:text-[#F2D543] transition-colors"
              >
                {isVideoPlaying ? <Pause size={15} /> : <Play size={15} />}
              </button>
              <span className="text-white text-xs font-mono min-w-[35px]">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-0"
              />
              <span className="text-white text-xs font-mono min-w-[35px]">
                {formatTime(duration)}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between w-1/4">
              <div className="flex items-center gap-3">
                {/* Volume */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVolumeToggle();
                    }}
                    className="text-white hover:text-[#F2D543] transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX size={15} />
                    ) : (
                      <Volume2 size={15} />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Play/Pause Overlay - Only show when paused and no controls visible */}
        {!isVideoPlaying && !showControls && !isVideoFullWidth && (
          <div
            className="absolute inset-0 flex items-center justify-center transition-opacity cursor-pointer"
            onClick={handleVideoClick}
          >
            <div className="bg-black bg-opacity-50 rounded-full p-4">
              <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1"></div>
            </div>
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="p-4 border-t border-darkBoxSub ">
        <div className="flex items-center justify-between mb-3">
          {public_post == false ? (
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 transition-colors ${
                  postInfo?.own_like
                    ? "text-red-500"
                    : "text-gray-400 hover:text-red-500"
                }`}
              >
                <Heart
                  size={24}
                  className={postInfo?.own_like ? "fill-current" : ""}
                />
                <span className="montserrat-medium text-sm">
                  {postInfo?.likes}
                </span>
              </button>

              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <MessageCircle size={24} />
                <span className="montserrat-medium text-sm">
                  {postInfo?.comments?.length || 0}
                </span>
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Share size={24} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 transition-colors ${
                  postInfo?.own_like
                    ? "text-red-500"
                    : "text-gray-400 hover:text-red-500"
                }`}
              >
                <Heart
                  size={24}
                  className={postInfo?.own_like ? "fill-current" : ""}
                />
                <span className="montserrat-medium text-sm">
                  {postInfo?.likes}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <MessageCircle size={24} />
                <span className="montserrat-medium text-sm">
                  {postInfo?.comments?.length || 0}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Like count */}
        {likesCount > 0 && (
          <p className="text-white montserrat-medium text-sm mb-2">
            {likesCount === 1 ? "1 like" : `${likesCount} likes`}
          </p>
        )}

        {/* Add Comment */}
        {public_post == false ? (
          <form
            onSubmit={handleAddComment}
            className="flex items-center gap-3 mt-3"
          >
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-darkBoxSub text-white placeholder-gray-400 px-4 py-2 rounded-full montserrat-light text-sm focus:outline-none focus:ring-2 focus:ring-[#F2D543]"
              disabled={isSubmittingComment}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmittingComment}
              className="text-[#F2D543] hover:text-[#f2f243] disabled:text-gray-500 disabled:cursor-not-allowed transition-colors p-2"
            >
              <Send size={18} />
            </button>
          </form>
        ) : (
          false
        )}

        {/* Comments Section */}
        {showComments && public_post == false ? (
          <div className="mt-4">
            <CommentsSection
              comments={postInfo?.comments || []}
              postId={postInfo.id}
            />
          </div>
        ) : (
          false
        )}
      </div>

      {/* Share Modal */}

      <ShareModal
        post={post}
        onClose={() => setShowShareModal(false)}
        showShare={showShareModal}
        isSameUser={isSameUser}
      />
    </div>
  );
}

export default PostCard;
