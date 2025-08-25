import { useState } from "react";
import {
  X,
  Copy,
  Check,
  Facebook,
  Twitter,
  Instagram,
  Download,
  MessageCircle,
  Share,
  Phone,
} from "lucide-react";
import Cookies from "js-cookie";

function ShareModal({ post, onClose, showShare, isSameUser, videoUrl }) {
  const [copied, setCopied] = useState(false);
  const postUrl = `${window.location.origin}/discover/post/${post?.id}`;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const downloadVideo = async () => {
    if (!videoUrl) {
      alert("No video available to download.");
      return;
    }

    try {
      // Show loading message
      console.log("Downloading video... Please wait.");

      // Call your backend endpoint
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}editor/download-video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            // Add authorization header if needed
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
          body: JSON.stringify({
            video_url: videoUrl,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      if (result.code !== 200 || !result.video_data) {
        throw new Error(result.message || "Failed to download video");
      }

      // Convert base64 to blob
      const base64Data = result.video_data;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "video/mp4" });

      // Create download link
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `video-${post?.id || "download"}.mp4`;
      a.style.display = "none";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up blob URL
      window.URL.revokeObjectURL(blobUrl);

      console.log("Video downloaded successfully via backend");
    } catch (error) {
      console.error("Error downloading video:", error);

      // Show user-friendly error message
      let errorMessage = "Failed to download video. ";

      if (error.message.includes("Server error: 500")) {
        errorMessage += "Server error occurred. Please try again later.";
      } else if (error.message.includes("Network")) {
        errorMessage += "Network error. Please check your connection.";
      } else {
        errorMessage += "Please try again or contact support.";
      }

      alert(errorMessage);
    }
  };

  const shareOptions = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600 hover:bg-blue-700",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        videoUrl
      )}`,
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "bg-sky-500 hover:bg-sky-600",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        videoUrl
      )}&text=${encodeURIComponent(
        `Check out this amazing video by ${
          post?.user?.name || "Reelmotion user"
        }! in Reelmotion`
      )}`,
    },
    {
      name: "WhatsApp",
      icon: Phone,
      color: "bg-green-500 hover:bg-green-600",
      url: `https://wa.me/?text=${encodeURIComponent(
        `Check out this amazing video by ${
          post?.user?.name || "Reelmotion user"
        }! ${postUrl}`
      )}`,
    },
    {
      name: "Telegram",
      icon: MessageCircle,
      color: "bg-blue-500 hover:bg-blue-600",
      url: `https://t.me/share/url?url=${encodeURIComponent(
        videoUrl
      )}&text=${encodeURIComponent(
        `Check out this amazing video by ${
          post?.user?.name || "Reelmotion user"
        }! in Reelmotion`
      )}`,
    },
    {
      name: "Pinterest",
      icon: Share,
      color: "bg-red-600 hover:bg-red-700",
      url: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
        videoUrl
      )}&description=${encodeURIComponent(
        `Amazing video by ${post?.user?.name || "Reelmotion user"}! ${
          post?.description || ""
        }`
      )}`,
    },
    {
      name: "Download Video",
      icon: Download,
      color:
        "bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600",
      onClick: downloadVideo,
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      const textArea = document.createElement("textarea");
      textArea.value = postUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = (option) => {
    if (option.onClick) {
      option.onClick();
    } else {
      window.open(option?.url, "_blank");
    }
  };

  return showShare ? (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-darkBox rounded-2xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white montserrat-medium text-lg">Share Post</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Post Preview */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-darkBoxSub flex items-center justify-center">
              {post?.user?.profile_image ? (
                <img
                  src={post?.user.profile_image}
                  alt={post?.user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                  <span className="text-white text-sm montserrat-medium">
                    {post?.user?.name?.charAt(0) || "U"}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-white montserrat-medium text-sm">
                {post?.user?.name || "Anonymous"}
              </h4>
              <p className="text-gray-400 montserrat-light text-xs">
                Video Post
              </p>
            </div>
          </div>

          {post?.description && (
            <p className="text-gray-300 montserrat-regular text-sm line-clamp-2">
              {post?.description}
            </p>
          )}
        </div>

        {/* Share Options */}
        {isSameUser && (
          <div className="space-y-3 mb-6">
            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => handleShare(option)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white transition-colors ${option.color}`}
              >
                <option.icon size={20} />
                <span className="montserrat-medium">{option.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Copy Link */}
        <div className="border-t border-darkBoxSub pt-4">
          <p className="text-gray-400 montserrat-light text-sm mb-3">
            Or copy link
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-darkBoxSub rounded-lg px-3 py-2">
              <input
                type="text"
                value={postUrl}
                readOnly
                className="w-full bg-transparent text-white text-sm montserrat-regular focus:outline-none"
              />
            </div>
            <button
              onClick={copyToClipboard}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-[#F2D543] text-primarioDark hover:bg-[#f2f243]"
              }`}
            >
              {copied ? (
                <>
                  <Check size={16} />
                  <span className="montserrat-medium text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span className="montserrat-medium text-sm">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
}

export default ShareModal;
