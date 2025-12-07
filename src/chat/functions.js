import Cookies from "js-cookie";

export async function getChatInfo() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}chat/get-info`,
      {
        headers: {
          Authorization: "Bearer " + Cookies.get("token"),
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch chat info");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching chat info:", error);
    throw error;
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

export async function postMessage(
  message,
  chatId = null,
  file = null,
  fileType = null
) {
  try {
    const formData = new FormData();
    formData.append("message", message);

    if (chatId) {
      formData.append("chat_id", chatId);
    }

    if (file) {
      formData.append("file", file);
      formData.append("file_type", fileType);
    }

    const response = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}chat/post-message`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + Cookies.get("token"),
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
