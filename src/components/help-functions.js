import Cookies from "js-cookie";

// Enviar sugerencia
export async function submitSuggestion(suggestionData) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}support/suggestions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
        body: JSON.stringify(suggestionData),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error submitting suggestion:", error);
    return { success: false, error: error.message };
  }
}

// Enviar mensaje al chatbot
export async function sendChatMessage(message, conversationId = null) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}support/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
        body: JSON.stringify({
          message,
          conversation_id: conversationId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending chat message:", error);
    return { success: false, error: error.message };
  }
}

// Obtener historial de conversación
export async function getChatHistory(conversationId) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}support/chat/${conversationId}`,
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
    console.error("Error fetching chat history:", error);
    return { success: false, error: error.message };
  }
}
