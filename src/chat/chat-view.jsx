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

  const handleSendMessage = async (file = null, fileType = null) => {
    if ((!message.trim() && !file) || isSending) return;

    const userMessage = message;
    setMessage("");

    // Add user message immediately with attachment preview
    const tempUserMsg = {
      id: Date.now(),
      role: "user",
      content: userMessage || "[File attached]",
      attachments: file
        ? [
            {
              url: URL.createObjectURL(file),
              file_type: fileType,
            },
          ]
        : [],
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    setIsSending(true);
    setIsTyping(true);

    try {
      const response = await postMessage(
        userMessage,
        selectedChat?.id,
        file,
        fileType
      );

      if (response.success) {
        if (!selectedChat && response.chat) {
          navigate(`/chat/${response.chat.id}`);
        } else if (selectedChat) {
          // Remove temp message and add real messages from backend
          setMessages((prev) => {
            const withoutTemp = prev.filter((msg) => msg.id !== tempUserMsg.id);
            const newMessages = [];
            if (response.user_message) {
              newMessages.push(response.user_message);
            }
            if (response.assistant_message) {
              newMessages.push(response.assistant_message);
            }
            return [...withoutTemp, ...newMessages];
          });
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
    />
  );
}

export default ChatView;
