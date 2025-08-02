import Cookies from "js-cookie";

// Obtener posts del feed de descubrimiento
export async function getDiscoverPosts(page = 1, limit = 10) {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_APP_BACKEND_URL
      }discover/posts?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching discover posts:", error);
    return { data: [], error: error.message };
  }
}

// Dar like a un post
export async function likePost(postId) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}discover/posts/${postId}/like`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error liking post:", error);
    return { success: false, error: error.message };
  }
}

// Quitar like de un post
export async function unlikePost(postId) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}discover/posts/${postId}/unlike`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error unliking post:", error);
    return { success: false, error: error.message };
  }
}

// Agregar comentario a un post
export async function addComment(postId, content) {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_APP_BACKEND_URL
      }discover/posts/${postId}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
        body: JSON.stringify({ content }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error adding comment:", error);
    return { success: false, error: error.message };
  }
}

// Dar like a un comentario
export async function likeComment(commentId) {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_APP_BACKEND_URL
      }discover/comments/${commentId}/like`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error liking comment:", error);
    return { success: false, error: error.message };
  }
}

// Responder a un comentario
export async function replyToComment(commentId, content) {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_APP_BACKEND_URL
      }discover/comments/${commentId}/reply`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
        body: JSON.stringify({ content }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error replying to comment:", error);
    return { success: false, error: error.message };
  }
}
