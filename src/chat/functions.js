import Cookies from "js-cookie";
import { notifyAppLogout } from "../utils/nativeBridge";

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
      },
    );

    // Si el token es inválido o expiró
    if (response.status === 401) {
      Cookies.remove("token");
      notifyAppLogout("session_revoked");
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
      },
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

/**
 * Una pagina de la librería de media.
 *
 * El endpoint pagina por cursor y filtra en servidor: antes devolvía todo el
 * historico del usuario en una sola respuesta.
 */
export async function getLibrary({ cursor, source, q, signal } = {}) {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (source && source !== "all") params.set("source", source);
  if (q) params.set("q", q);

  const query = params.toString();

  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}chat/get-library${query ? `?${query}` : ""}`,
      {
        headers: {
          Authorization: "Bearer " + Cookies.get("token"),
        },
        signal,
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch library");
    }

    const data = await response.json();

    return {
      ...data,
      // La UI trabaja con chatName/sourceType; el endpoint devuelve las columnas
      // crudas. Se normaliza aqui para que loader y scroll infinito coincidan.
      items: (data.items || []).map((item) => ({
        ...item,
        chatName: item.chat_name || "Unassigned",
        sourceType: item.chat_message_id ? "chat" : "unassigned",
      })),
    };
  } catch (error) {
    if (error.name === "AbortError") throw error;
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

export async function postMessage(
  message,
  chatId = null,
  filesData = [],
  signal = null,
) {
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
        signal,
      },
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

// ── ElevenLabs: proxied by the backend so the API key never ships to the browser ──
const elevenLabsFetch = (path, options = {}) =>
  fetch(`${import.meta.env.VITE_APP_BACKEND_URL}ai/elevenlabs/${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer " + Cookies.get("token"),
    },
  });

// Obtener voces disponibles de ElevenLabs
export async function getElevenLabsVoices() {
  try {
    const response = await elevenLabsFetch("voices");
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(`Voices error: ${response.status}`);
    return { success: true, voices: data.voices || [] };
  } catch (error) {
    console.error("Error fetching ElevenLabs voices:", error);
    return { success: false, error: error.message, voices: [] };
  }
}

// Generar speech: el backend cobra los tokens y guarda el mp3 en GCS
export async function generateElevenLabsSpeech(speechData) {
  try {
    const response = await elevenLabsFetch("tts", {
      method: "POST",
      body: JSON.stringify({
        text: speechData.text,
        voice_id: speechData.voiceId,
        model_id: speechData.model_id || "eleven_multilingual_v2",
        stability: speechData.stability ?? 0.5,
        similarity_boost: speechData.similarity_boost ?? 0.5,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || `TTS error: ${response.status}`);
    }

    const words = speechData.text.trim().split(/\s+/).length;
    return {
      success: true,
      data: {
        audioUrl: data.url,
        format: "mp3",
        duration: (words / 150) * 60, // rough estimate, 150 wpm
        textUsed: speechData.text,
        voiceId: speechData.voiceId,
        model_id: speechData.model_id,
        tokensDeducted: data.tokens_deducted,
      },
    };
  } catch (error) {
    console.error("Error generating ElevenLabs speech:", error);
    return { success: false, error: error.message };
  }
}
