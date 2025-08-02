import { useState, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import PostCard from "./components/post-card";
import PostCardSkeleton from "./components/post-card-skeleton";
import { getDiscoverPosts } from "./functions";

// Función helper para generar datos de prueba
const generateDemoData = (post) => {
  const demoUsers = [{ name: "Victor Espinosa", profile_image: null }];

  const randomUser = demoUsers[Math.floor(Math.random() * demoUsers.length)];

  const demoComments = [
    {
      id: `comment-${Math.random()}`,
      user: { name: "John Doe", profile_image: null },
      content: "This is amazing! Great work! 🔥",
      created_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      likes_count: Math.floor(Math.random() * 5),
      is_liked: false,
      replies_count: 0,
      replies: [],
    },
    {
      id: `comment-${Math.random()}`,
      user: { name: "Jane Smith", profile_image: null },
      content: "Love the creativity here! How did you make this?",
      created_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      likes_count: Math.floor(Math.random() * 3),
      is_liked: false,
      replies_count: 1,
      replies: [
        {
          id: `reply-${Math.random()}`,
          user: { name: randomUser.name, profile_image: null },
          content: "Thanks! I used ReelMotion AI to create it 😊",
          created_at: new Date(
            Date.now() - Math.random() * 43200000
          ).toISOString(),
          likes_count: Math.floor(Math.random() * 2),
          is_liked: false,
        },
      ],
    },
  ];

  const numComments = Math.floor(Math.random() * 3); // 0-2 comentarios
  const selectedComments = demoComments.slice(0, numComments);

  return {
    ...post,
    user: {
      id: post.user_id,
      name: randomUser.name,
      profile_image: randomUser.profile_image,
    },
    likes_count: post.likes || Math.floor(Math.random() * 50),
    is_liked: Math.random() > 0.7, // 30% chance de que esté liked
    comments_count: selectedComments.length,
    comments: selectedComments,
  };
};

function Discover() {
  const initialData = useLoaderData();

  // Si no hay datos del API, crear posts de prueba para la demo
  const createMockPosts = () => [
    {
      id: "demo-1",
      user_id: "user-1",
      name: "Amazing AI Video",
      description:
        "Check out this incredible video I created with ReelMotion AI! The results are mind-blowing 🤯",
      video_url: "/public/test/Video_Maya_Cumbias_y_Coca.mp4", // Usar uno de los videos de prueba
      created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
      likes: 25,
      status: "complete",
    },
    {
      id: "demo-2",
      user_id: "user-2",
      name: "Epic Space Adventure",
      description:
        "My latest creation featuring an astronaut on the moon. What do you think? 🚀",
      video_url: "/public/test/Astronauta_Noir_en_la_Luna.mp4",
      created_at: new Date(Date.now() - 7200000).toISOString(), // 2 horas atrás
      likes: 42,
      status: "complete",
    },
    {
      id: "demo-3",
      user_id: "user-3",
      name: "Marketing Video",
      description:
        "Created this promotional video for a client. Love how it turned out! 💼",
      video_url: "/public/test/Astronauta_Anuncio_Instagram_Listo.mp4",
      created_at: new Date(Date.now() - 10800000).toISOString(), // 3 horas atrás
      likes: 18,
      status: "complete",
    },
  ];

  // Procesar datos iniciales o usar datos de prueba
  const initialPosts =
    initialData?.data?.data?.length > 0
      ? initialData.data.data
      : createMockPosts();

  const processedInitialPosts = initialPosts.map(generateDemoData);

  const [posts, setPosts] = useState(processedInitialPosts);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initialData?.data?.current_page || 1);
  const [hasMore, setHasMore] = useState(
    initialData?.data?.data?.length > 0
      ? !!initialData?.data?.next_page_url
      : false // No hay más páginas para datos de prueba
  );

  const loadMorePosts = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await getDiscoverPosts(page + 1);
      if (response?.data?.data?.length > 0) {
        // Agregar datos de prueba a cada post para la demo
        const postsWithDemoData = response.data.data.map(generateDemoData);

        setPosts((prev) => [...prev, ...postsWithDemoData]);
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
      <div className="max-w-4xl mx-auto py-6 px-4">
        {posts.length > 0 ? (
          <div className="space-y-8">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
            ))}

            {loading && (
              <div className="space-y-8">
                <PostCardSkeleton />
                <PostCardSkeleton />
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
    </div>
  );
}

export default Discover;
