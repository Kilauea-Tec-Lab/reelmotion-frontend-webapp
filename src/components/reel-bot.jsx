import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User } from "lucide-react";

function ReelBot({ onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Hi! I'm Reelbot, your support assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      text: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        type: "bot",
        text: getBotResponse(inputMessage),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getBotResponse = (userInput) => {
    const input = userInput.toLowerCase();

    if (
      input.includes("video") ||
      input.includes("generate") ||
      input.includes("create")
    ) {
      return "To create AI videos, go to the Projects section and select 'Create Project'. Then you can add scenes, characters and use our AI tools to generate amazing content.";
    }

    if (
      input.includes("error") ||
      input.includes("problem") ||
      input.includes("issue") ||
      input.includes("bug")
    ) {
      return "I'm sorry you're having problems. Could you be more specific about the error you're experiencing? Meanwhile, try refreshing the page or restarting the application.";
    }

    if (
      input.includes("account") ||
      input.includes("profile") ||
      input.includes("user")
    ) {
      return "To manage your account, go to the user menu in the top right corner. There you can edit your profile, change settings and manage your subscription.";
    }

    if (
      input.includes("price") ||
      input.includes("cost") ||
      input.includes("plan") ||
      input.includes("subscription") ||
      input.includes("billing")
    ) {
      return "We offer different plans to suit your needs. Visit our pricing section or contact our sales team for more information about our premium plans.";
    }

    if (
      input.includes("export") ||
      input.includes("download") ||
      input.includes("save")
    ) {
      return "To export your videos, go to your completed project and click the export button. You can choose different formats and qualities based on your subscription plan.";
    }

    if (
      input.includes("hello") ||
      input.includes("hi") ||
      input.includes("hey")
    ) {
      return "Hello! I'm glad I can help you. What would you like to know about Reelmotion?";
    }

    return "Thank you for your question. If you need more specific help, our support team is available 24/7. You can also check our documentation or submit a support ticket for personalized assistance.";
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed bottom-6 left-20 z-50 bg-darkBox rounded-2xl shadow-2xl w-96 h-[500px] flex flex-col border border-darkBoxSub">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-darkBoxSub">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F2D543] flex items-center justify-center">
            <img
              src="/logos/reelbot.png"
              size={35}
              alt="Reelbot"
              className="rounded-4xl"
            />
          </div>
          <div>
            <h3 className="text-white montserrat-medium text-sm">Reelbot</h3>
            <p className="text-green-400 montserrat-light text-xs">Online</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.type === "user"
                  ? "bg-[#F2D543] text-primarioDark ml-auto"
                  : "bg-darkBoxSub text-white"
              }`}
            >
              <div className="flex items-start gap-2">
                {message.type === "bot" && (
                  <img
                    src="/logos/reelbot.png"
                    alt="Reelbot"
                    className="rounded-4xl mt-1 flex-shrink-0 w-7"
                  />
                )}
                <div className="flex-1">
                  <p className="montserrat-regular text-sm leading-relaxed">
                    {message.text}
                  </p>
                  <p
                    className={`montserrat-light text-xs mt-1 ${
                      message.type === "user"
                        ? "text-primarioDark opacity-70"
                        : "text-gray-400"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
                {message.type === "user" && (
                  <User
                    size={16}
                    className="text-primarioDark mt-1 flex-shrink-0"
                  />
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-darkBoxSub text-white rounded-2xl px-4 py-2 max-w-[80%]">
              <div className="flex items-center gap-2">
                <img
                  src="/logos/reelbot.png"
                  alt="Reelbot"
                  className="rounded-4xl mt-1 flex-shrink-0 w-7"
                />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-darkBoxSub"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-darkBoxSub text-white placeholder-gray-400 px-4 py-2 rounded-full montserrat-regular text-sm focus:outline-none focus:ring-2 focus:ring-[#F2D543]"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="bg-[#F2D543] hover:bg-[#f2f243] disabled:bg-gray-600 disabled:cursor-not-allowed text-primarioDark p-2 rounded-full transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReelBot;
