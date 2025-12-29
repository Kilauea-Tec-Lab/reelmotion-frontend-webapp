import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (chatData?.chat) {
      setSelectedChat(chatData.chat);
      setMessages(chatData.messages || []);
    }
  }, [chatData]);

  const handleSendMessage = async (filesData = []) => {
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

    if ((!message.trim() && actualFiles.length === 0) || isSending) return;

    const userMessage = message;
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
    setMessages((prev) => [...prev, tempUserMsg]);

    setIsSending(true);
    setIsTyping(true);

    try {
      const response = await postMessage(
        userMessage,
        selectedChat?.id,
        filesData
      );

      if (response.success) {
        const chatId = response.chat_id;

        if (!selectedChat && chatId) {
          navigate(`/chat/${chatId}`);
        } else {
          // Add AI response message
          const aiMessage = {
            id: Date.now() + 1,
            role: "assistant",
            content: response.message,
            attachments: response.attachments_count || [],
          };
          setMessages((prev) => [...prev, aiMessage]);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove temp message and restore input on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMsg.id));
      setMessage(userMessage);
    } finally {
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
      isSending={isSending}
      isTyping={isTyping}
      messages={messages}
      attachments={chatData?.attachments || []}
    />
  );
}

export default ChatView;
