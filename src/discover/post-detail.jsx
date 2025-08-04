import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PostCard from "./components/post-card";
import { getDiscoverPosts } from "./functions";

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        // Assuming there's an endpoint to get a single post
        const response = await fetch(
          `${import.meta.env.VITE_APP_BACKEND_URL}discover/posts/${id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer " + document.cookie.split("token=")[1]?.split(";")[0],
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Post not found`);
        }

        const data = await response.json();
        setPost(data.data);
      } catch (error) {
        console.error("Error fetching post:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id]);

  const handlePostUpdate = (postId, updatedData) => {
    setPost((prev) => ({ ...prev, ...updatedData }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primarioDark flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F2D543]"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-primarioDark flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white montserrat-medium text-xl mb-4">
            Post not found
          </h2>
          <p className="text-gray-400 montserrat-light mb-6">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/discover")}
            className="bg-[#F2D543] text-primarioDark px-6 py-2 rounded-3xl montserrat-medium hover:bg-[#f2f243] transition-colors"
          >
            Back to Discover
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primarioDark">
      /* Header */
      <div className="sticky top-0 bg-primarioDark border-b border-darkBoxSub z-10 p-0 w-full">
        <div className="flex items-center justify-between px-4">
          <img
            src="/logos/logo_reelmotion.webp"
            alt="Reelmotion Logo"
            className="sm:h-10 h-8"
          />
          <button
            onClick={() => navigate("/")}
            className="bg-[#F2D543] text-primarioDark text-sm px-3 py-1 rounded-3xl montserrat-medium hover:bg-[#f2f243] transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
      <div className="max-w-2xl mx-auto py-6 px-4">
        <PostCard post={post} onUpdate={handlePostUpdate} public_post={true} />
      </div>
    </div>
  );
}

export default PostDetail;
