import { useState } from "react";
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

  const handleSendMessage = async (files = []) => {
    if ((!message.trim() && files.length === 0) || isSending) return;

    const userMessage = message;
    setMessage("");

    // Add user message immediately with attachment preview
    const tempUserMsg = {
      id: Date.now(),
      role: "user",
      content: userMessage || (files.length > 0 ? "[Files attached]" : ""),
      attachments: files.map((f) => ({
        url: f.preview,
        file_type: f.type,
      })),
    };
    setPreviewMessages([tempUserMsg]);

    setIsSending(true);
    setIsCreating(true);
    setIsTyping(true);

    try {
      const response = await postMessage(userMessage, null, files);

      if (response.success && response.chat) {
        // Revalidate to refresh chat list in sidebar
        await revalidator.revalidate();
        // Navigate to new chat
        navigate(`/chat/${response.chat.id}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessage(userMessage);
      setPreviewMessages([]);
    } finally {
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
      isSending={isSending}
      isCreating={isCreating}
      messages={previewMessages}
      isTyping={isTyping}
    />
  );
}

export default Chat;
