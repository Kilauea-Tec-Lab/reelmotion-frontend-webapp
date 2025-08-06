import { useState, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import PostCard from "./components/post-card";
import PostCardSkeleton from "./components/post-card-skeleton";
import PinterestGrid from "./components/pinterest-grid";
import PostModal from "./components/post-modal";
import { getDiscoverPosts } from "./functions";

function Discover() {
  const initialData = useLoaderData();

  // Procesar datos iniciales o usar datos de prueba
  const initialPosts = initialData?.data?.length > 0 ? initialData.data : null;

  const [posts, setPosts] = useState(initialPosts || []);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initialData?.data?.current_page || 1);
  const [hasMore, setHasMore] = useState(
    initialData?.data?.length > 0 ? !!initialData?.data?.next_page_url : false
  );
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadMorePosts = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await getDiscoverPosts(page + 1);
      if (response.data?.length > 0) {
        setPosts((prev) => [...prev, ...response?.data]);
        setPage(response.data.current_page);
        setHasMore(!!response.data.next_page_url);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more posts:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = (postId, updatedPost) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, ...updatedPost } : post
      )
    );
  };

  const handleCardClick = (postId) => {
    setSelectedPostId(postId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPostId(null);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop !==
          document.documentElement.offsetHeight ||
        loading ||
        !hasMore
      ) {
        return;
      }
      loadMorePosts();
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore, page]);

  return (
    <div className="min-h-screen bg-primarioDark">
      {/* Header */}

      {/* Posts Feed */}
      <div className="max-w-7xl mx-auto py-6 px-4">
        {posts.length > 0 ? (
          <div className="space-y-8">
            {/* Pinterest Grid */}
            <PinterestGrid posts={posts} onCardClick={handleCardClick} />

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-8">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-darkBox rounded-lg overflow-hidden"
                  >
                    <div className="w-full h-48 bg-darkBoxSub animate-pulse"></div>
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-darkBoxSub animate-pulse rounded"></div>
                      <div className="h-3 bg-darkBoxSub animate-pulse rounded w-3/4"></div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-darkBoxSub animate-pulse rounded-full"></div>
                          <div className="h-3 bg-darkBoxSub animate-pulse rounded w-16"></div>
                        </div>
                        <div className="h-3 bg-darkBoxSub animate-pulse rounded w-8"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <div className="text-center py-8">
                <span className="text-gray-400 montserrat-light">
                  You've reached the end!
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-gray-400 montserrat-light text-lg mb-4">
              No posts found
            </div>
            <p className="text-gray-500 montserrat-light text-sm text-center max-w-md">
              Be the first to share your amazing video projects with the
              community!
            </p>
          </div>
        )}
      </div>

      {/* Post Modal */}
      <PostModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        postId={selectedPostId}
      />
    </div>
  );
}

export default Discover;
