import { useState, useEffect, useRef } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import ChatMain from "./components/chat-main";
import { postMessage } from "./functions";

function ChatView() {
  const chatData = useLoaderData();
  const navigate = useNavigate();

  const [selectedChat, setSelectedChat] = useState(chatData?.chat || null);
  const [messages, setMessages] = useState(chatData?.messages || []);

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (chatData?.chat) {
      setSelectedChat(chatData.chat);
      setMessages(chatData.messages || []);
    }
  }, [chatData]);

  const handleSendMessage = async (filesData = []) => {
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

    if (
      (!message.trim() &&
        actualFiles.length === 0 &&
        forwardedAttachments.length === 0) ||
      isSending
    )
      return;

    const userMessage = message;
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
    setMessages((prev) => [...prev, tempUserMsg]);

    setIsSending(true);
    setIsTyping(true);

    // Create new AbortController for this request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await postMessage(
        userMessage,
        selectedChat?.id,
        filesData,
        abortControllerRef.current.signal
      );

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
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request cancelled");
      } else {
        console.error("Error sending message:", error);
      }
      // Remove temp message and restore input on error
      if (error.name !== "AbortError") {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMsg.id));
        setMessage(userMessage);
      }
    } finally {
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
      attachments={chatData?.attachments || []}
    />
  );
}

export default ChatView;
