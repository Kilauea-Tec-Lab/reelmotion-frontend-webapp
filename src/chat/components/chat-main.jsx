import { Plus, Send, Mic, Image, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function ChatMain({
  selectedChat,
  message,
  onMessageChange,
  onSendMessage,
  isSending,
  isTyping = false,
  isCreating = false,
  messages = [],
}) {
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [previewMedia, setPreviewMedia] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleFileSelect = (type) => {
    setFileType(type);
    fileInputRef.current?.click();
    setShowFileMenu(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendWithFile = () => {
    onSendMessage(selectedFile, fileType);
    handleRemoveFile();
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Media Preview Modal */}
      {previewMedia && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewMedia(null)}
        >
          <button
            onClick={() => setPreviewMedia(null)}
            className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 rounded-full p-2 z-10"
          >
            <X size={24} />
          </button>
          <div
            className="max-w-5xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {previewMedia.type === "image" ? (
              <img
                src={previewMedia.url}
                alt="Preview"
                className="w-full h-auto rounded-lg"
              />
            ) : (
              <video
                src={previewMedia.url}
                className="w-full h-auto rounded-lg"
                controls
                autoPlay
              />
            )}
          </div>
        </div>
      )}

      {selectedChat ? (
        <>
          {/* Chat Header */}
          <div className="h-16 border-b border-gray-800 flex items-center px-6">
            <h2 className="text-lg font-semibold">{selectedChat.title}</h2>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-[#DC569D] text-white"
                          : "bg-[#2f2f2f] text-white"
                      }`}
                    >
                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {msg.attachments.map((attachment, idx) => (
                            <div
                              key={idx}
                              className="relative cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() =>
                                setPreviewMedia({
                                  url: attachment.url,
                                  type: attachment.file_type,
                                })
                              }
                            >
                              {attachment.file_type === "image" ? (
                                <img
                                  src={attachment.url}
                                  alt="Attachment"
                                  className="h-32 w-auto rounded-lg border border-gray-600 object-cover"
                                />
                              ) : attachment.file_type === "video" ? (
                                <video
                                  src={attachment.url}
                                  className="h-32 w-auto rounded-lg border border-gray-600 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  onClick={() =>
                                    setPreviewMedia({
                                      url: attachment.url,
                                      type: attachment.file_type,
                                    })
                                  }
                                />
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center">
                  Start the conversation
                </p>
              )}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#2f2f2f] rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-800 p-4">
            <div className="max-w-3xl mx-auto">
              {/* File Preview */}
              {selectedFile && filePreview && (
                <div className="mb-3 relative inline-block">
                  <button
                    onClick={handleRemoveFile}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1 z-10"
                  >
                    <X size={14} />
                  </button>
                  {fileType === "image" ? (
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="max-h-32 rounded-lg border border-gray-700"
                    />
                  ) : (
                    <video
                      src={filePreview}
                      className="max-h-32 rounded-lg border border-gray-700"
                      controls
                    />
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 bg-[#2f2f2f] rounded-2xl px-4 py-3 border border-gray-700 relative">
                <div className="relative">
                  <button
                    onClick={() => setShowFileMenu(!showFileMenu)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                  {showFileMenu && (
                    <div className="absolute bottom-full left-0 mb-2 bg-[#2f2f2f] border border-gray-700 rounded-lg shadow-lg overflow-hidden z-20">
                      <button
                        onClick={() => handleFileSelect("image")}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#3a3a3a] transition-colors w-full text-left"
                      >
                        <Image size={18} />
                        <span className="text-sm">Add image</span>
                      </button>
                      <button
                        onClick={() => handleFileSelect("video")}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#3a3a3a] transition-colors w-full text-left border-t border-gray-700"
                      >
                        <Video size={18} />
                        <span className="text-sm">Add video</span>
                      </button>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={fileType === "image" ? "image/*" : "video/*"}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  type="text"
                  placeholder="Ask anything..."
                  value={message}
                  onChange={(e) => onMessageChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      selectedFile ? handleSendWithFile() : onSendMessage();
                    }
                  }}
                  disabled={isSending}
                  className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none disabled:opacity-50"
                />
                <button
                  onClick={selectedFile ? handleSendWithFile : onSendMessage}
                  disabled={(!message.trim() && !selectedFile) || isSending}
                  className="bg-[#DC569D] hover:bg-[#c9458b] p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="flex-1 flex flex-col relative">
          {isCreating && messages.length === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 backdrop-blur-sm">
              <div className="bg-[#2f2f2f] rounded-2xl p-6 flex flex-col items-center gap-4">
                <div className="flex gap-2">
                  <div
                    className="w-3 h-3 bg-[#DC569D] rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-[#DC569D] rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-[#DC569D] rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
                <p className="text-white text-sm">Creating chat...</p>
              </div>
            </div>
          )}

          {messages.length > 0 ? (
            /* Show messages when preview exists */
            <>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-[#DC569D] text-white"
                            : "bg-[#2f2f2f] text-white"
                        }`}
                      >
                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-2">
                            {msg.attachments.map((attachment, idx) => (
                              <div
                                key={idx}
                                className="relative cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() =>
                                  setPreviewMedia({
                                    url: attachment.url,
                                    type: attachment.file_type,
                                  })
                                }
                              >
                                {attachment.file_type === "image" ? (
                                  <img
                                    src={attachment.url}
                                    alt="Attachment"
                                    className="h-32 w-auto rounded-lg border border-gray-600 object-cover"
                                  />
                                ) : attachment.file_type === "video" ? (
                                  <video
                                    src={attachment.url}
                                    className="h-32 w-auto rounded-lg border border-gray-600 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    onClick={() =>
                                      setPreviewMedia({
                                        url: attachment.url,
                                        type: attachment.file_type,
                                      })
                                    }
                                  />
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-[#2f2f2f] rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              <div className="border-t border-gray-800 p-4">
                <div className="max-w-3xl mx-auto">
                  {/* File Preview */}
                  {selectedFile && filePreview && (
                    <div className="mb-3 relative inline-block">
                      <button
                        onClick={handleRemoveFile}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1 z-10"
                      >
                        <X size={14} />
                      </button>
                      {fileType === "image" ? (
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="max-h-32 rounded-lg border border-gray-700"
                        />
                      ) : (
                        <video
                          src={filePreview}
                          className="max-h-32 rounded-lg border border-gray-700"
                          controls
                        />
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 bg-[#2f2f2f] rounded-2xl px-5 py-4 border border-gray-700 relative">
                    <div className="relative">
                      <button
                        onClick={() => setShowFileMenu(!showFileMenu)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                      {showFileMenu && (
                        <div className="absolute bottom-full left-0 mb-2 bg-[#2f2f2f] border border-gray-700 rounded-lg shadow-lg overflow-hidden z-20">
                          <button
                            onClick={() => handleFileSelect("image")}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[#3a3a3a] transition-colors w-full text-left"
                          >
                            <Image size={18} />
                            <span className="text-sm">Add image</span>
                          </button>
                          <button
                            onClick={() => handleFileSelect("video")}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[#3a3a3a] transition-colors w-full text-left border-t border-gray-700"
                          >
                            <Video size={18} />
                            <span className="text-sm">Add video</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={fileType === "image" ? "image/*" : "video/*"}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <input
                      type="text"
                      placeholder="Ask anything..."
                      value={message}
                      onChange={(e) => onMessageChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          selectedFile ? handleSendWithFile() : onSendMessage();
                        }
                      }}
                      disabled={isSending}
                      className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg disabled:opacity-50"
                    />
                    <button
                      onClick={
                        selectedFile ? handleSendWithFile : onSendMessage
                      }
                      disabled={(!message.trim() && !selectedFile) || isSending}
                      className="bg-[#DC569D] hover:bg-[#c9458b] p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={22} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Initial empty state */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-2xl px-6">
                <h1 className="text-4xl font-semibold mb-4">
                  How can I help you?
                </h1>
                <div className="relative mt-8">
                  {/* File Preview */}
                  {selectedFile && filePreview && (
                    <div className="mb-3 relative inline-block">
                      <button
                        onClick={handleRemoveFile}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1 z-10"
                      >
                        <X size={14} />
                      </button>
                      {fileType === "image" ? (
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="max-h-32 rounded-lg border border-gray-700"
                        />
                      ) : (
                        <video
                          src={filePreview}
                          className="max-h-32 rounded-lg border border-gray-700"
                          controls
                        />
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 bg-[#2f2f2f] rounded-2xl px-5 py-4 border border-gray-700 hover:border-gray-600 transition-colors relative">
                    <div className="relative">
                      <button
                        onClick={() => setShowFileMenu(!showFileMenu)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                      {showFileMenu && (
                        <div className="absolute bottom-full left-0 mb-2 bg-[#2f2f2f] border border-gray-700 rounded-lg shadow-lg overflow-hidden z-20">
                          <button
                            onClick={() => handleFileSelect("image")}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[#3a3a3a] transition-colors w-full text-left"
                          >
                            <Image size={18} />
                            <span className="text-sm">Add image</span>
                          </button>
                          <button
                            onClick={() => handleFileSelect("video")}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[#3a3a3a] transition-colors w-full text-left border-t border-gray-700"
                          >
                            <Video size={18} />
                            <span className="text-sm">Add video</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={fileType === "image" ? "image/*" : "video/*"}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <input
                      type="text"
                      placeholder="Ask anything..."
                      value={message}
                      onChange={(e) => onMessageChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          selectedFile ? handleSendWithFile() : onSendMessage();
                        }
                      }}
                      disabled={isSending}
                      className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg disabled:opacity-50"
                    />
                    <button
                      onClick={
                        selectedFile ? handleSendWithFile : onSendMessage
                      }
                      disabled={(!message.trim() && !selectedFile) || isSending}
                      className="bg-[#DC569D] hover:bg-[#c9458b] p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={22} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChatMain;
