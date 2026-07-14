import { useState, useEffect, useRef } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import ChatMain from "./components/chat-main";
import { postMessage } from "./functions";
import { useGenerationTracker } from "./use-generation-tracker";

function ChatView() {
  const chatData = useLoaderData();
  const navigate = useNavigate();

  const [selectedChat, setSelectedChat] = useState(chatData?.chat || null);
  const [messages, setMessages] = useState(chatData?.messages || []);
  const [attachments, setAttachments] = useState(chatData?.attachments || []);
  // Async generations still in flight, keyed by generation_id. Each renders a
  // "Generating…" card under its message until the tracker resolves it.
  const [pendingGenerations, setPendingGenerations] = useState(
    chatData?.pending_generations || [],
  );

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  // Hint from the last agent turn that the NEXT message kicks off a generation
  // (the bot just quoted a cost). Lets us show the loader optimistically for
  // sync models (Veo/Sora) that block the whole request. {type, model} | null.
  const [nextTurnGeneration, setNextTurnGeneration] = useState(null);
  // The loader shown during the current in-flight request (captured at send).
  const [activeGenLoader, setActiveGenLoader] = useState(null);
  // Delays showing the optimistic loader so a fast text answer (a question at
  // the cost step) doesn't flash the card; real generations outlast the delay.
  const genLoaderTimerRef = useRef(null);
  const clearGenLoader = () => {
    if (genLoaderTimerRef.current) clearTimeout(genLoaderTimerRef.current);
    genLoaderTimerRef.current = null;
    setActiveGenLoader(null);
  };
  const abortControllerRef = useRef(null);
  // Mirror of pendingGenerations for the tracker callbacks (avoids stale reads
  // and side effects inside state updaters).
  const pendingGenerationsRef = useRef(pendingGenerations);
  useEffect(() => {
    pendingGenerationsRef.current = pendingGenerations;
  }, [pendingGenerations]);

  useEffect(() => {
    if (chatData?.chat) {
      setSelectedChat(chatData.chat);
      setMessages(chatData.messages || []);
      setAttachments(chatData.attachments || []);
      setPendingGenerations(chatData.pending_generations || []);
    }
  }, [chatData]);

  const handleGenerationProgress = (generationId, progress) => {
    setPendingGenerations((prev) =>
      prev.map((g) =>
        g.generation_id === generationId ? { ...g, progress } : g,
      ),
    );
  };

  const handleGenerationFinal = (generationId, status, resultUrl, error) => {
    const entry = pendingGenerationsRef.current.find(
      (g) => g.generation_id === generationId,
    );
    if (!entry) return;

    if (status === "completed" && resultUrl) {
      const newAttachment = {
        id: "gen-" + generationId,
        url: resultUrl,
        file_type: entry.media_type,
        path: "ia",
        created_at: new Date().toISOString(),
      };
      setMessages((msgs) =>
        msgs.map((m) =>
          m.id === entry.chat_message_id
            ? { ...m, attachments: [...(m.attachments || []), newAttachment] }
            : m,
        ),
      );
      setAttachments((atts) => [...atts, newAttachment]);
      setPendingGenerations((prev) =>
        prev.filter((g) => g.generation_id !== generationId),
      );
    } else {
      // failed | timeout: keep the card in its terminal state.
      setPendingGenerations((prev) =>
        prev.map((g) =>
          g.generation_id === generationId ? { ...g, status, error } : g,
        ),
      );
    }
  };

  useGenerationTracker({
    userId: chatData?.user_id,
    pending: pendingGenerations,
    onFinal: handleGenerationFinal,
    onProgress: handleGenerationProgress,
  });

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
      // If the bot's last turn was a cost quote, this send may kick off a
      // generation. Sync models (Veo/Sora) block the whole request, so show the
      // loader optimistically — but only after a short delay, so a quick text
      // reply (a question at the cost step) doesn't flash the card.
      if (nextTurnGeneration) {
        genLoaderTimerRef.current = setTimeout(
          () => setActiveGenLoader(nextTurnGeneration),
          1200,
        );
      }

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

          // Add AI response message. Use the DB message id when present so the
          // "Generating…" cards (keyed by chat_message_id) attach to it.
          const aiMessage = {
            id: response.message_id || Date.now() + 1,
            role: "assistant",
            content: response.message,
            actions: Array.isArray(response.actions) ? response.actions : null,
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

          // Register any async generations so their cards start tracking.
          if (
            Array.isArray(response.pending_generations) &&
            response.pending_generations.length > 0
          ) {
            setPendingGenerations((prev) => [
              ...prev,
              ...response.pending_generations,
            ]);
          }
        }
      }

      // Success cleanup. Carry the bot's confirmation hint into the next turn.
      setNextTurnGeneration(response?.awaiting_generation || null);
      clearGenLoader();
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

      clearGenLoader();
      setIsSending(false);
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      clearGenLoader();
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
      pendingGenerations={pendingGenerations}
      activeGenLoader={activeGenLoader}
    />
  );
}

export default ChatView;
