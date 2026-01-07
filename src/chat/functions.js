import Cookies from "js-cookie";

export async function getChatInfo() {
  const token = Cookies.get("token");

  // Si no hay token, redirigir inmediatamente al login
  if (!token) {
    throw new Response("No token found", {
      status: 401,
      statusText: "Authentication required",
    });
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}chat/get-info`,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );

    // Si el token es inválido o expiró
    if (response.status === 401) {
      Cookies.remove("token");
      throw new Response("Token expired", {
        status: 401,
        statusText: "Token expired or invalid",
      });
    }

    if (!response.ok) {
      throw new Response(`Server error: ${response.status}`, {
        status: response.status,
        statusText: `Server responded with ${response.status}`,
      });
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Si es un Response ya creado, lo devolvemos tal como está
    if (error instanceof Response) {
      throw error;
    }

    console.error("Error fetching chat info:", error);

    // Para errores de red, JSON parse, etc.
    throw new Response("Network error", {
      status: 500,
      statusText: "Failed to connect to server",
    });
  }
}

export async function getChatDetails(chatId) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}chat/get-chat-info/${chatId}`,
      {
        headers: {
          Authorization: "Bearer " + Cookies.get("token"),
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch chat details");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching chat details:", error);
    throw error;
  }
}

export async function getLibrary() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}chat/get-library`,
      {
        headers: {
          Authorization: "Bearer " + Cookies.get("token"),
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch library");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching library:", error);
    throw error;
  }
}

// Generate or retrieve conversation UUID
let conversationUUID = sessionStorage.getItem("conversation_uuid");
if (!conversationUUID) {
  conversationUUID = crypto.randomUUID();
  sessionStorage.setItem("conversation_uuid", conversationUUID);
}

export async function postMessage(message, chatId = null, filesData = []) {
  try {
    const formData = new FormData();
    formData.append("message", message);

    if (chatId) {
      formData.append("chat_id", chatId);
    }

    // Si filesData es un objeto con files y URLs
    if (
      filesData &&
      typeof filesData === "object" &&
      !Array.isArray(filesData)
    ) {
      const { files, attachments_image_url, attachment_video_url } = filesData;

      // Agregar archivos nuevos
      if (files && files.length > 0) {
        files.forEach((f) => {
          formData.append("files[]", f.file);
          formData.append("file_types[]", f.type);
        });
      }

      // Agregar URLs de imágenes
      if (attachments_image_url && attachments_image_url.length > 0) {
        attachments_image_url.forEach((url) => {
          formData.append("attachments_image_url[]", url);
        });
      }

      // Agregar URLs de videos
      if (attachment_video_url && attachment_video_url.length > 0) {
        attachment_video_url.forEach((url) => {
          formData.append("attachment_video_url[]", url);
        });
      }
    }
    // Si filesData es un array (compatibilidad con versión anterior)
    else if (Array.isArray(filesData) && filesData.length > 0) {
      filesData.forEach((f) => {
        if (f.file) {
          formData.append("files[]", f.file);
          formData.append("file_types[]", f.type);
        }
      });
    }

    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}chat/post-message`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + Cookies.get("token"),
          Accept: "application/json",
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    return response.json();
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}
