import { useState } from "react";
import { Heart, MessageCircle, User, Send } from "lucide-react";
import { likeComment, replyToComment } from "../functions";

function CommentsSection({ comments, postId, onCommentsUpdate }) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState(new Set());

  const handleLikeComment = async (commentId, isLiked, likesCount) => {
    try {
      const response = await likeComment(commentId);
      if (response.success) {
        // Update the comment in the local state
        onCommentsUpdate((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  is_liked: !isLiked,
                  likes_count: isLiked ? likesCount - 1 : likesCount + 1,
                }
              : comment
          )
        );
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmittingReply) return;

    setIsSubmittingReply(true);
    try {
      const response = await replyToComment(replyingTo, replyText.trim());
      if (response.success && response.data) {
        // Add the reply to the parent comment
        onCommentsUpdate((prev) =>
          prev.map((comment) =>
            comment.id === replyingTo
              ? {
                  ...comment,
                  replies: [response.data, ...(comment.replies || [])],
                  replies_count: (comment.replies_count || 0) + 1,
                }
              : comment
          )
        );
        setReplyText("");
        setReplyingTo(null);
      }
    } catch (error) {
      console.error("Error replying to comment:", error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
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

  const CommentItem = ({ comment, isReply = false }) => (
    <div className={`${isReply ? "ml-8 mt-2" : "mt-4"}`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-darkBoxSub flex items-center justify-center flex-shrink-0 mt-2">
          {comment.user?.profile_image ? (
            <img
              src={comment.user.profile_image}
              alt={comment.user.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={16} className="text-gray-400" />
          )}
        </div>

        <div className="flex-1">
          <div className="bg-darkBoxSub rounded-2xl px-4 py-2">
            <h4 className="text-white montserrat-medium text-sm">
              {comment.user?.username || "Anonymous"}
            </h4>
            <p className="text-gray-200 montserrat-regular text-sm mt-1 leading-relaxed">
              {comment.comment}
            </p>
          </div>
          <div className="flex items-center gap-4 mt-2 px-2">
            <span className="text-gray-400 montserrat-light text-xs">
              {formatDate(comment.created_at)}
            </span>

            {/* 
            <button
              onClick={() =>
                handleLikeComment(
                  comment.id,
                  comment.is_liked,
                  comment.likes_count || 0
                )
              }
              className={`flex items-center gap-1 text-xs montserrat-medium transition-colors ${
                comment.is_liked
                  ? "text-red-500"
                  : "text-gray-400 hover:text-red-500"
              }`}
            >
              <Heart
                size={12}
                className={comment.is_liked ? "fill-current" : ""}
              />
              {comment.likes_count > 0 && comment.likes_count}
            </button>

            {!isReply && (
              <button
                onClick={() => setReplyingTo(comment.id)}
                className="text-gray-400 hover:text-white text-xs montserrat-medium transition-colors"
              >
                Reply
              </button>
            )}

            {!isReply && comment.replies_count > 0 && (
              <button
                onClick={() => toggleReplies(comment.id)}
                className="text-gray-400 hover:text-white text-xs montserrat-medium transition-colors flex items-center gap-1"
              >
                <MessageCircle size={12} />
                {expandedReplies.has(comment.id) ? "Hide" : "View"}{" "}
                {comment.replies_count}{" "}
                {comment.replies_count === 1 ? "reply" : "replies"}
              </button>
            )}
              */}
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <form
              onSubmit={handleReply}
              className="flex items-center gap-2 mt-3"
            >
              <input
                type="text"
                placeholder={`Reply to ${comment.user?.name || "Anonymous"}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-darkBox text-white placeholder-gray-400 px-3 py-2 rounded-full montserrat-light text-sm focus:outline-none focus:ring-2 focus:ring-[#F2D543]"
                disabled={isSubmittingReply}
                autoFocus
              />
              <button
                type="submit"
                disabled={!replyText.trim() || isSubmittingReply}
                className="text-[#F2D543] hover:text-[#f2f243] disabled:text-gray-500 disabled:cursor-not-allowed transition-colors p-1"
              >
                <Send size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText("");
                }}
                className="text-gray-400 hover:text-white text-xs montserrat-medium transition-colors px-2"
              >
                Cancel
              </button>
            </form>
          )}

          {/* Replies */}
          {!isReply && expandedReplies.has(comment.id) && comment.replies && (
            <div className="mt-2">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (comments.length === 0) {
    return (
      <div className="mt-4 text-center py-4">
        <p className="text-gray-400 montserrat-light text-sm">
          No comments yet. Be the first to comment!
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 max-h-96 overflow-y-auto">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}

export default CommentsSection;
