import { useState, useEffect, useRef } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import ChatMain from "./components/chat-main";
import { postMessage } from "./functions";

function ChatView() {
  const chatData = useLoaderData();
  const navigate = useNavigate();

  const [selectedChat, setSelectedChat] = useState(chatData?.chat || null);
  const [messages, setMessages] = useState(chatData?.messages || []);
  const [attachments, setAttachments] = useState(chatData?.attachments || []);

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (chatData?.chat) {
      setSelectedChat(chatData.chat);
      setMessages(chatData.messages || []);
      setAttachments(chatData.attachments || []);
    }
  }, [chatData]);

  const handleSendMessage = async (
    filesData = [],
    retryCount = 0,
    savedMessage = null,
    tempMsgId = null,
  ) => {
    // Normalizar filesData
    let actualFiles = [];
    let forwardedAttachments = [];

    if (
      filesData &&
      typeof filesData === "object" &&
      !Array.isArray(filesData)
    ) {
      actualFiles = filesData.files || [];

      // Handle forwarded image URLs
      if (
        filesData.attachments_image_url &&
        Array.isArray(filesData.attachments_image_url)
      ) {
        filesData.attachments_image_url.forEach((url) => {
          forwardedAttachments.push({
            url: url,
            file_type: "image",
          });
        });
      }

      // Handle forwarded video URLs
      if (
        filesData.attachment_video_url &&
        Array.isArray(filesData.attachment_video_url)
      ) {
        filesData.attachment_video_url.forEach((url) => {
          forwardedAttachments.push({
            url: url,
            file_type: "video",
          });
        });
      }
    } else if (Array.isArray(filesData)) {
      actualFiles = filesData;
    }

    const MAX_RETRIES = 3;
    let userMessage = savedMessage || message;
    let currentTempMsgId = tempMsgId;

    // Solo configuración inicial en el primer intento
    if (retryCount === 0) {
      if (
        (!message.trim() &&
          actualFiles.length === 0 &&
          forwardedAttachments.length === 0) ||
        isSending
      )
        return;

      userMessage = message;
      setMessage("");

      // Add user message immediately with attachment preview
      const tempUserMsg = {
        id: Date.now(),
        role: "user",
        content:
          userMessage ||
          (actualFiles.length > 0 || forwardedAttachments.length > 0
            ? "[Files attached]"
            : ""),
        attachments: [
          ...actualFiles.map((f) => ({
            url: f.isUrl ? f.url : f.preview,
            file_type: f.type,
          })),
          ...forwardedAttachments,
        ],
      };
      currentTempMsgId = tempUserMsg.id;
      setMessages((prev) => [...prev, tempUserMsg]);

      setIsSending(true);
      setIsTyping(true);

      // Create new AbortController for this request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
    }

    try {
      console.log(
        `[handleSendMessage] Calling postMessage (Attempt ${retryCount + 1})...`,
      );
      const response = await postMessage(
        userMessage,
        selectedChat?.id,
        filesData,
        abortControllerRef.current?.signal,
      );

      // Check for backend error even if success is true
      const responseMsg = response.message ? response.message.trim() : "";

      if (
        responseMsg === "error|resonse_empty" ||
        responseMsg === "error|response_empty"
      ) {
        console.log(
          "[handleSendMessage] Detected error response, retryCount:",
          retryCount,
        );
        if (retryCount < MAX_RETRIES) {
          console.log(
            `[handleSendMessage] Retrying message... Attempt ${retryCount + 1}`,
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return handleSendMessage(
            filesData,
            retryCount + 1,
            userMessage,
            currentTempMsgId,
          );
        }
        throw new Error("Server error: " + responseMsg);
      }

      if (response.success) {
        const chatId = response.chat_id;

        if (!selectedChat && chatId) {
          navigate(`/${chatId}`);
        } else {
          // Process attachments from response
          const responseAttachments = [];

          // Nuevo: Detectar si viene en formato "files"
          if (response.files && Array.isArray(response.files)) {
            response.files.forEach((file) => {
              responseAttachments.push({
                id: file.id,
                url: file.url,
                file_type: file.file_type,
                path: file.path,
                created_at: file.created_at,
              });
            });
          }
          // Mantener compatibilidad con el formato anterior
          else {
            if (
              response.attachments_image_url &&
              Array.isArray(response.attachments_image_url)
            ) {
              response.attachments_image_url.forEach((url) => {
                responseAttachments.push({ url, file_type: "image" });
              });
            }

            if (
              response.attachment_video_url &&
              Array.isArray(response.attachment_video_url)
            ) {
              response.attachment_video_url.forEach((url) => {
                responseAttachments.push({ url, file_type: "video" });
              });
            }
          }

          // Add AI response message
          const aiMessage = {
            id: Date.now() + 1,
            role: "assistant",
            content: response.message,
            attachments:
              responseAttachments.length > 0
                ? responseAttachments
                : response.attachments || [],
          };
          setMessages((prev) => [...prev, aiMessage]);
          if (responseAttachments.length > 0) {
            setAttachments((prev) => [...prev, ...responseAttachments]);
          } else if (response.attachments && response.attachments.length > 0) {
            setAttachments((prev) => [...prev, ...response.attachments]);
          }
        }
      }

      // Success cleanup
      setIsSending(false);
      setIsTyping(false);
      abortControllerRef.current = null;
    } catch (error) {
      console.log(
        "[handleSendMessage] Catch block - error:",
        error.name,
        error.message,
      );
      if (error.name === "AbortError") {
        console.log("Request cancelled");
        // No removemos el mensaje si fue cancelado manualmente? O si? En chat.jsx no
      } else {
        // Red error or Max Retries exceeded
        if (retryCount < MAX_RETRIES) {
          console.log(
            `[handleSendMessage] Network error retry ${retryCount + 1}`,
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return handleSendMessage(
            filesData,
            retryCount + 1,
            userMessage,
            currentTempMsgId,
          );
        }

        console.error("Error sending message:", error);
        // Remove temp message and restore input on error
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== currentTempMsgId),
        );
        setMessage(userMessage);
      }

      setIsSending(false);
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsSending(false);
      setIsTyping(false);
    }
  };

  return (
    <ChatMain
      selectedChat={selectedChat}
      message={message}
      onMessageChange={setMessage}
      onSendMessage={handleSendMessage}
      onCancel={handleCancel}
      isSending={isSending}
      isTyping={isTyping}
      messages={messages}
      attachments={attachments}
    />
  );
}

export default ChatView;
