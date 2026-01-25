import { useState, useRef } from "react";
import { useNavigate, useRevalidator } from "react-router-dom";
import ChatMain from "./components/chat-main";
import { postMessage } from "./functions";

function Chat() {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [previewMessages, setPreviewMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const abortControllerRef = useRef(null);

  const handleSendMessage = async (
    filesData = [],
    retryCount = 0,
    savedMessage = null,
  ) => {
    const MAX_RETRIES = 6;

    console.log("[handleSendMessage] Called with:", {
      retryCount,
      savedMessage,
      currentMessage: message,
    });

    // Normalizar filesData
    let actualFiles = [];
    if (
      filesData &&
      typeof filesData === "object" &&
      !Array.isArray(filesData)
    ) {
      actualFiles = filesData.files || [];
    } else if (Array.isArray(filesData)) {
      actualFiles = filesData;
    }

    // Usar savedMessage en reintentos, message en el primer intento
    const userMessage = retryCount > 0 ? savedMessage : message;

    console.log(
      "[handleSendMessage] userMessage:",
      userMessage,
      "actualFiles:",
      actualFiles.length,
    );

    // Solo validar en el primer intento
    if (retryCount === 0) {
      if ((!message.trim() && actualFiles.length === 0) || isSending) {
        console.log(
          "[handleSendMessage] Early return - no message or already sending",
        );
        return;
      }

      setMessage("");

      // Add user message immediately with attachment preview
      const tempUserMsg = {
        id: Date.now(),
        role: "user",
        content:
          userMessage || (actualFiles.length > 0 ? "[Files attached]" : ""),
        attachments: actualFiles.map((f) => ({
          url: f.isUrl ? f.url : f.preview,
          file_type: f.type,
        })),
      };
      setPreviewMessages([tempUserMsg]);

      setIsSending(true);
      setIsCreating(true);
      setIsTyping(true);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
    }

    try {
      const response = await postMessage(
        userMessage,
        null,
        filesData,
        abortControllerRef.current.signal,
      );

      // Check for backend error even if success is true
      // Backend typo is "resonse", checking both to be safe
      const responseMsg = response.message ? response.message.trim() : "";

      if (
        responseMsg === "error|resonse_empty" ||
        responseMsg === "error|response_empty"
      ) {
        if (retryCount < MAX_RETRIES) {
          console.log(
            `[handleSendMessage] Retrying message... Attempt ${retryCount + 1}`,
          );
          // Pequeña pausa antes de reintentar
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return handleSendMessage(filesData, retryCount + 1, userMessage);
        }
        console.log("[handleSendMessage] Max retries exceeded, throwing error");
        throw new Error("Server error: " + responseMsg);
      }

      if (response.success && response.chat_id) {
        console.log(
          "[handleSendMessage] Success! Navigating to:",
          response.chat_id,
        );
        // Revalidate to refresh chat list in sidebar
        await revalidator.revalidate();
        // Navigate to new chat
        navigate(`/${response.chat_id}`);
      }
    } catch (error) {
      console.log(
        "[handleSendMessage] Catch block - error:",
        error.name,
        error.message,
      );
      if (error.name === "AbortError") {
        console.log("Request cancelled");
        setPreviewMessages([]);
        setIsSending(false);
        setIsCreating(false);
        setIsTyping(false);
        abortControllerRef.current = null;
      } else {
        // Si hay error de red y no hemos excedido los reintentos, reintentar
        if (retryCount < MAX_RETRIES) {
          console.log(
            `[handleSendMessage] Network error retry ${retryCount + 1}`,
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return handleSendMessage(filesData, retryCount + 1, userMessage);
        }
        console.error("Error sending message:", error);
        setMessage(userMessage);
        setPreviewMessages([]);
        setIsSending(false);
        setIsCreating(false);
        setIsTyping(false);
        abortControllerRef.current = null;
      }
      return;
    }

    // Solo limpiar estado si es el intento final exitoso
    setIsSending(false);
    setIsCreating(false);
    setIsTyping(false);
    abortControllerRef.current = null;
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsSending(false);
      setIsCreating(false);
      setIsTyping(false);
    }
  };

  return (
    <ChatMain
      selectedChat={null}
      message={message}
      onMessageChange={setMessage}
      onSendMessage={handleSendMessage}
      onCancel={handleCancel}
      isSending={isSending}
      isCreating={isCreating}
      messages={previewMessages}
      isTyping={isTyping}
    />
  );
}

export default Chat;
