import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import {
  MessageSquare,
  X,
  Minimize2,
  Maximize2,
  Bot,
  Send,
  Loader2,
  Plus,
} from "lucide-react";

function ProjectAgent({
  agents,
  onClose,
  onMinimize,
  isMinimized = false,
  onRemoveAgent,
  onAddAgent,
}) {
  const [activeAgentId, setActiveAgentId] = useState(agents[0]?.id || null);
  const [agentMessages, setAgentMessages] = useState({});
  const [agentNames, setAgentNames] = useState({}); // Store updated project names from API
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const activeAgent = agents.find((agent) => agent.id === activeAgentId);
  const currentMessages = agentMessages[activeAgentId] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Function to load conversation from API
  const loadConversation = async (projectId) => {
    setIsLoadingConversation(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_APP_BACKEND_URL
        }projects/get-conversation/${projectId}`,
        {
          method: "get",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return result.data; // Returns the conversation data object with name and messages
      } else {
        console.error("Failed to load conversation:", result.message);
        return null;
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      return null;
    } finally {
      setIsLoadingConversation(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, activeAgentId]);

  // Load conversation when switching between agents (always reload)
  useEffect(() => {
    const loadActiveAgentConversation = async () => {
      if (activeAgent) {
        const conversationData = await loadConversation(activeAgent.projectId);

        let messages = [];
        let projectName = activeAgent.projectName; // Default fallback

        if (conversationData && conversationData.messages) {
          // Use project name from API if available
          if (conversationData.name) {
            projectName = conversationData.name;
          }

          // Parse messages string to JSON array
          let parsedMessages = [];
          try {
            if (typeof conversationData.messages === "string") {
              parsedMessages = JSON.parse(conversationData.messages);
            } else {
              parsedMessages = conversationData.messages;
            }
          } catch (error) {
            console.error("Error parsing messages:", error);
            parsedMessages = [];
          }

          // Convert API messages to our message format
          if (parsedMessages.length > 0) {
            messages = parsedMessages
              .filter((msg) => msg.message && msg.message.trim() !== "") // Filter out empty messages
              .map((msg, index) => {
                // Create date without time (only date)
                const messageDate = msg.created_at
                  ? new Date(msg.created_at)
                  : new Date();
                messageDate.setHours(0, 0, 0, 0); // Remove hours, minutes, seconds, milliseconds

                return {
                  id: msg.id || index + 1,
                  text: msg.message,
                  sender: msg.type === "1" ? "user" : "agent", // type "1" = user, type "2" = agent
                  timestamp: messageDate,
                };
              });
          } else {
            // No messages - leave empty array to show "No messages yet"
            messages = [];
          }
        } else {
          // No conversation data - leave empty array to show "No messages yet"
          messages = [];
        }

        // Update both messages and project name
        setAgentMessages((prev) => ({
          ...prev,
          [activeAgentId]: messages,
        }));

        setAgentNames((prev) => ({
          ...prev,
          [activeAgentId]: projectName,
        }));
      }
    };

    loadActiveAgentConversation();
  }, [activeAgentId, activeAgent]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !activeAgent) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setAgentMessages((prev) => ({
      ...prev,
      [activeAgentId]: [...(prev[activeAgentId] || []), userMessage],
    }));
    setInputMessage("");
    setIsLoading(true);

    try {
      // Send message to API
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}projects/send-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify({
            message: inputMessage,
            project_id: activeAgent.projectId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // If API returns agent response, add it to messages
        if (result.data && result.data.ai_response) {
          const agentResponse = {
            id: Date.now() + 1, // Generate unique ID since API doesn't provide one
            text: result.data.ai_response,
            sender: "agent",
            timestamp: result.data.created_at
              ? new Date(result.data.created_at)
              : new Date(),
          };

          setAgentMessages((prev) => ({
            ...prev,
            [activeAgentId]: [...(prev[activeAgentId] || []), agentResponse],
          }));
        }
      } else {
        console.error("Failed to send message:", result.message);
        const errorMessage = {
          id: Date.now() + 1,
          text: "Sorry, failed to send message. Please try again.",
          sender: "agent",
          timestamp: new Date(),
        };
        setAgentMessages((prev) => ({
          ...prev,
          [activeAgentId]: [...(prev[activeAgentId] || []), errorMessage],
        }));
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, an error occurred. Please try again.",
        sender: "agent",
        timestamp: new Date(),
      };
      setAgentMessages((prev) => ({
        ...prev,
        [activeAgentId]: [...(prev[activeAgentId] || []), errorMessage],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isMinimized) {
    return null; // El manager se encarga de mostrar los agentes minimizados
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[480px] h-[600px] bg-darkBox rounded-lg shadow-2xl border border-darkBoxSub flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-darkBoxSub">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#F2D543] rounded-full flex items-center justify-center">
            <Bot size={16} className="text-primarioDark" />
          </div>
          <div>
            <h3 className="text-white montserrat-medium text-sm">Agents</h3>
            <p className="text-gray-400 montserrat-light text-xs">
              {agents.length}{" "}
              {agents.length === 1 ? "agent active" : "agents active"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onMinimize}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title="Minimize"
          >
            <Minimize2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title="Close all agents"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tabs de Agentes */}
      <div className="flex items-center gap-1 p-2 border-b border-darkBoxSub overflow-x-auto">
        {agents.map((agent) => (
          <div key={agent.id} className="flex items-center">
            <button
              onClick={() => setActiveAgentId(agent.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors min-w-0 ${
                activeAgentId === agent.id
                  ? "bg-[#F2D543] text-primarioDark"
                  : "bg-darkBoxSub text-gray-300 hover:bg-gray-600"
              }`}
            >
              <Bot size={12} />
              <span
                className="truncate max-w-[100px]"
                title={agentNames[agent.id] || agent.projectName}
              >
                {agentNames[agent.id] || agent.projectName}
              </span>
            </button>
            {agents.length > 1 && (
              <button
                onClick={() => onRemoveAgent(agent.id)}
                className="ml-1 text-gray-400 hover:text-red-400 transition-colors p-1"
                title={`Close agent for ${
                  agentNames[agent.id] || agent.projectName
                }`}
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        {onAddAgent && (
          <button
            onClick={onAddAgent}
            className="flex items-center gap-1 px-2 py-2 text-gray-400 hover:text-[#F2D543] transition-colors"
            title="Add new agent"
          >
            <Plus size={12} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeAgent ? (
          <>
            {isLoadingConversation ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2
                    size={32}
                    className="text-[#F2D543] mx-auto mb-4 animate-spin"
                  />
                  <p className="text-gray-400 montserrat-light">
                    Loading conversation...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {currentMessages.length === 0 ? (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-3 rounded-lg bg-darkBoxSub text-white">
                      <p className="montserrat-light text-sm">
                        Hello, I'm your project assistant. I'm here to make
                        things easier for you. Do you need any ideas,
                        suggestions or prompts? No problem, just let me know and
                        I will guide you through the entire process.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {currentMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.sender === "user"
                              ? "bg-[#F2D543] text-primarioDark"
                              : "bg-darkBoxSub text-white"
                          }`}
                        >
                          <p className="montserrat-light text-sm">
                            {message.text}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-darkBoxSub text-white p-3 rounded-lg flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin" />
                          <span className="text-xs">Agent is typing...</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bot size={48} className="text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 montserrat-light">
                Select an agent to start chatting
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-darkBoxSub">
        {activeAgent ? (
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask the agent about ${
                agentNames[activeAgentId] || activeAgent.projectName
              }...`}
              className="flex-1 bg-darkBoxSub text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm montserrat-light resize-none max-h-20 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:ring-opacity-50"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-[#F2D543] hover:bg-[#f2f243] disabled:bg-gray-600 disabled:cursor-not-allowed text-primarioDark p-2 rounded-lg transition-colors"
              title="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-500 montserrat-light text-sm py-2">
            Select an agent to write a message
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectAgent;
