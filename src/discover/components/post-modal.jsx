import { useState, useEffect } from "react";
import { X } from "lucide-react";
import PostCard from "./post-card";
import { getPostById } from "../functions";

function PostModal({ isOpen, onClose, postId }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && postId) {
      fetchPost();
    }
  }, [isOpen, postId]);

  const fetchPost = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getPostById(postId);
      if (response.data) {
        setPost(response.data);
      } else {
        setError("Failed to load post");
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      setError("Error loading post");
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = (postId, updatedPost) => {
    setPost((prev) => ({ ...prev, ...updatedPost }));
  };

  const handleClose = () => {
    setPost(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000040] bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-transparent rounded-lg overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-8 right-8 z-10 bg-darkBox hover:bg-darkBoxSub transition-colors p-2 rounded-full text-white"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-gray-600 border-t-[#F2D543] rounded-full animate-spin"></div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-red-400 montserrat-medium mb-2">Error</p>
                <p className="text-gray-400 montserrat-light">{error}</p>
                <button
                  onClick={fetchPost}
                  className="mt-4 px-4 py-2 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors montserrat-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {post && !loading && !error && (
            <PostCard
              post={post}
              onUpdate={handlePostUpdate}
              public_post={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PostModal;
