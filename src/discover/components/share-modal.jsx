import { useState } from "react";
import {
  X,
  Copy,
  Check,
  Facebook,
  Twitter,
  Instagram,
  Link,
} from "lucide-react";

function ShareModal({ post, onClose }) {
  const [copied, setCopied] = useState(false);
  const postUrl = `${window.location.origin}/discover/post/${post.id}`;

  const shareOptions = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600 hover:bg-blue-700",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        postUrl
      )}`,
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "bg-sky-500 hover:bg-sky-600",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        postUrl
      )}&text=${encodeURIComponent(
        `Check out this amazing video by ${
          post.user?.name || "ReelMotion user"
        }!`
      )}`,
    },
    {
      name: "Instagram",
      icon: Instagram,
      color:
        "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
      url: "#",
      onClick: () => {
        alert(
          "Instagram sharing is not available via web. Please use the Instagram mobile app to share this content."
        );
      },
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      // Fallback for older browsers
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
      window.open(option.url, "_blank", "width=600,height=400");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
              {post.user?.profile_image ? (
                <img
                  src={post.user.profile_image}
                  alt={post.user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                  <span className="text-white text-sm montserrat-medium">
                    {post.user?.name?.charAt(0) || "U"}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-white montserrat-medium text-sm">
                {post.user?.name || "Anonymous"}
              </h4>
              <p className="text-gray-400 montserrat-light text-xs">
                Video Post
              </p>
            </div>
          </div>

          {post.description && (
            <p className="text-gray-300 montserrat-regular text-sm line-clamp-2">
              {post.description}
            </p>
          )}
        </div>

        {/* Share Options */}
        <div className="space-y-3 mb-6">
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={() => handleShare(option)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white transition-colors ${option.color}`}
            >
              <option.icon size={20} />
              <span className="montserrat-medium">Share on {option.name}</span>
            </button>
          ))}
        </div>

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
  );
}

export default ShareModal;
