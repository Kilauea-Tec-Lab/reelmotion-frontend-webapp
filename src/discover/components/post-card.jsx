import { useState, useRef } from "react";
import {
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  User,
  Send,
  Maximize,
  Minimize,
} from "lucide-react";
import { likePost, addComment } from "../functions";
import CommentsSection from "./comments-section";
import ShareModal from "./share-modal";

function PostCard({ post, onUpdate, public_post }) {
  const [isLiked, setIsLiked] = useState(post.own_like || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoFullWidth, setIsVideoFullWidth] = useState(false);
  const videoRef = useRef(null);

  const handleLike = async () => {
    const newLikedState = !isLiked;

    // Optimistic update
    setIsLiked(newLikedState);

    try {
      const response = await likePost(post.id);

      if (response.success) {
        onUpdate(post.id, {
          is_liked: newLikedState,
          likes_count: newCount,
        });
      } else {
        // Revert on error
        setIsLiked(!newLikedState);
        setLikesCount(newLikedState ? newCount - 1 : newCount + 1);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(!newLikedState);
      setLikesCount(newLikedState ? newCount - 1 : newCount + 1);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await addComment(post.id, commentText.trim());
      if (response.success && response.data) {
        setComments((prev) => [response.data, ...prev]);
        setCommentText("");
        onUpdate(post.id, {
          comments_count: (post.comments_count || 0) + 1,
        });
      }
    } catch (error) {
    } finally {
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
    <div className="bg-darkBox rounded-2xl overflow-hidden max-h-[90vh] flex flex-col w-full max-w-4xl mx-auto">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-darkBoxSub flex items-center justify-center">
            {post?.user?.profile_image ? (
              <img
                src={post?.user?.profile_image}
                alt={post.user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={20} className="text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-white montserrat-medium text-sm">
              {post.user?.name || "Anonymous"}
            </h3>
            <p className="text-gray-400 montserrat-light text-xs">
              {formatDate(post.updated_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Post Content */}
      {post.description && (
        <div className="px-4 pb-3">
          <p className="text-white montserrat-regular text-sm leading-relaxed">
            {post.description}
          </p>
        </div>
      )}

      {/* Video Content */}
      <div className="relative flex-1 min-h-0">
        <video
          ref={videoRef}
          src={post.video_url}
          className={`w-full h-full object-cover cursor-pointer transition-all duration-300 ${
            isVideoFullWidth ? "object-contain bg-black" : "object-cover"
          }`}
          style={{
            maxHeight: isVideoFullWidth ? "65vh" : "55vh",
            minHeight: window.innerWidth < 768 ? "250px" : "350px",
          }}
          loop
          muted
          playsInline
          onClick={handleVideoClick}
          onPlay={() => setIsVideoPlaying(true)}
          onPause={() => setIsVideoPlaying(false)}
        />

        {/* Video Controls Overlay */}
        <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 hover:opacity-100 transition-opacity">
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
        </div>

        {/* Play/Pause Overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
          onClick={handleVideoClick}
        >
          {!isVideoPlaying && (
            <div className="bg-black bg-opacity-50 rounded-full p-4">
              <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1"></div>
            </div>
          )}
        </div>
      </div>

      {/* Post Actions */}
      <div className="p-4 flex-shrink-0 border-t border-darkBoxSub">
        <div className="flex items-center justify-between mb-3">
          {public_post == false ? (
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 transition-colors ${
                  isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                }`}
              >
                <Heart size={24} className={isLiked ? "fill-current" : ""} />
                <span className="montserrat-medium text-sm">{post?.likes}</span>
              </button>

              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <MessageCircle size={24} />
                <span className="montserrat-medium text-sm">
                  {post?.comments?.lenght || 0}
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
                  isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                }`}
              >
                <Heart size={24} className={isLiked ? "fill-current" : ""} />
                <span className="montserrat-medium text-sm">{post?.likes}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <MessageCircle size={24} />
                <span className="montserrat-medium text-sm">
                  {post?.comments?.lenght || 0}
                </span>
              </div>

              <div className="text-gray-400 hover:text-white transition-colors">
                <Share size={24} />
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
          <div className="max-h-32 overflow-y-auto">
            <CommentsSection
              comments={comments}
              postId={post.id}
              onCommentsUpdate={setComments}
            />
          </div>
        ) : (
          false
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal post={post} onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
}

export default PostCard;
