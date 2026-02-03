import {
  Plus,
  Search,
  MessageSquare,
  Library,
  ArrowLeft,
  LogOut,
  User,
  ChevronDown,
  MessageCirclePlus,
  Clapperboard,
  LibraryBig,
  Images,
  Pencil,
  Trash2,
  Loader2,
  X,
  Crown,
} from "lucide-react";
import { Link, useParams, useNavigate, useRevalidator } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import Cookies from "js-cookie";

function ChatSidebar({
  chats,
  searchQuery,
  onSearchChange,
  user,
  subscription,
}) {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  // Hover actions: edit / delete chat
  const [editChatId, setEditChatId] = useState(null);
  const [editChatTitle, setEditChatTitle] = useState("");
  const [isSavingChatTitle, setIsSavingChatTitle] = useState(false);
  const [deleteChatId, setDeleteChatId] = useState(null);
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  const [localChatTitles, setLocalChatTitles] = useState({});

  const getUserInitials = (name) => {
    if (!name) return "U";
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const handleLogOut = () => {
    Cookies.remove("token");
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const closeEditModal = () => {
    if (isSavingChatTitle) return;
    setEditChatId(null);
    setEditChatTitle("");
  };

  const closeDeleteModal = () => {
    if (isDeletingChat) return;
    setDeleteChatId(null);
  };

  const handleEditChat = async () => {
    const nextTitle = editChatTitle.trim();
    if (!editChatId || !nextTitle) return;

    setIsSavingChatTitle(true);
    try {
      const formData = new FormData();
      formData.append("chat_id", editChatId);
      formData.append("title", nextTitle);

      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}chat/edit-chat`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : {};

      if (data?.success === false) {
        throw new Error(data?.message || "Failed to edit chat");
      }

      setLocalChatTitles((prev) => ({ ...prev, [editChatId]: nextTitle }));
      closeEditModal();
      revalidator.revalidate();
    } catch (error) {
      console.error("Error editing chat:", error);
    } finally {
      setIsSavingChatTitle(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!deleteChatId) return;
    setIsDeletingChat(true);
    try {
      const formData = new FormData();
      formData.append("chat_id", deleteChatId);

      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}chat/destroy-chat`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : {};

      if (data?.success === false) {
        throw new Error(data?.message || "Failed to delete chat");
      }

      if (chatId === deleteChatId) {
        navigate("/");
      }

      closeDeleteModal();
      revalidator.revalidate();
    } catch (error) {
      console.error("Error deleting chat:", error);
    } finally {
      setIsDeletingChat(false);
    }
  };

  return (
    <div className="w-64 bg-[#171717] border-r border-gray-800 flex flex-col">
      {/* Edit Chat Modal */}
      {editChatId && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
          onClick={closeEditModal}
        >
          <div
            className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#DC569D]/20 rounded-full p-3">
                  <Pencil className="h-6 w-6 text-[#DC569D]" />
                </div>
                <h3 className="text-xl font-semibold text-white">Edit Chat</h3>
              </div>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#2f2f2f] rounded-lg"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <label className="block text-sm text-gray-400 mb-2">
              Chat name
            </label>
            <input
              type="text"
              value={editChatTitle}
              onChange={(e) => setEditChatTitle(e.target.value)}
              className="w-full px-4 py-2 bg-[#2f2f2f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#DC569D] focus:ring-1 focus:ring-[#DC569D] transition-all"
              placeholder="Enter chat name"
              autoFocus
            />

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={closeEditModal}
                disabled={isSavingChatTitle}
                className="px-4 py-2 bg-[#2f2f2f] text-gray-300 rounded-lg hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditChat}
                disabled={isSavingChatTitle || editChatTitle.trim() === ""}
                className="px-4 py-2 bg-[#DC569D] text-white rounded-lg hover:bg-[#c44a87] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingChatTitle ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Chat Modal */}
      {deleteChatId && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
          onClick={closeDeleteModal}
        >
          <div
            className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#DC569D]/20 rounded-full p-3">
                <Trash2 className="h-6 w-6 text-[#DC569D]" />
              </div>
              <h3 className="text-xl font-semibold text-white">Delete Chat</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this chat? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeDeleteModal}
                disabled={isDeletingChat}
                className="px-4 py-2 bg-[#2f2f2f] text-gray-300 rounded-lg hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChat}
                disabled={isDeletingChat}
                className="px-4 py-2 bg-[#DC569D] text-white rounded-lg hover:bg-[#c44a87] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingChat ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <img
        src="/logos/logo_reelmotion.webp"
        alt="Reelmotion AI"
        className="w-2/4 pt-4 pl-6"
      />
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <Link
          to={"/"}
          className="w-full flex items-center gap-3 px-4 py-3 font-dm-sans text-sm text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
        >
          <MessageCirclePlus size={20} />
          <span className="font-medium">New chat</span>
        </Link>
        <Link
          to={"/editor"}
          className="w-full flex items-center gap-3 px-4 py-3 font-dm-sans text-sm text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
        >
          <Clapperboard size={20} />
          <span className="font-medium">Editor</span>
        </Link>
        <Link
          to={"/library"}
          className="w-full flex items-center gap-3 px-4 py-3 font-dm-sans text-sm text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
        >
          <LibraryBig size={20} />
          <span className="font-medium">Library</span>
        </Link>
        <Link
          to={"/discover"}
          className="w-full flex items-center gap-3 px-4 py-3 font-dm-sans text-sm text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
        >
          <Images size={20} />
          <span className="font-medium">Discover</span>
        </Link>
        {subscription &&
        subscription.suscription &&
        subscription.suscription !== "free" ? (
          <Link
            to={"/my-subscription"}
            className="w-full flex items-center gap-3 px-4 py-3 font-dm-sans text-sm text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
          >
            <Crown size={20} className="text-[#DC569D]" />
            <span className="font-medium">My Subscription</span>
          </Link>
        ) : (
          <Link
            to={"/pro"}
            className="w-full flex items-center gap-3 px-4 py-3 font-dm-sans text-sm text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
          >
            <Crown size={20} className="text-[#DC569D]" />
            <span className="font-medium">Pro</span>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Search chats"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#212121] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
          />
        </div>
      </div>

      {/* Section Title */}
      <div className="px-4 py-2">
        <h3 className="text-xs text-gray-500 font-semibold uppercase">
          Your chats
        </h3>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredChats.map((chat) => (
          <div key={chat.id} className="relative group">
            <Link
              to={`/${chat.id}`}
              className={`w-full px-4 py-3 hover:bg-[#212121] transition-colors text-left border-l-2 block ${
                chatId === chat.id
                  ? "border-[#DC569D] bg-[#212121]"
                  : "border-transparent"
              }`}
            >
              <div className="flex items-start gap-2 pr-14">
                <MessageSquare
                  size={16}
                  className="mt-1 text-gray-500 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white truncate">
                    {localChatTitles[chat.id] ?? chat.title}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">
                    {chat.preview}
                  </p>
                </div>
              </div>
            </Link>

            {/* Hover actions */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditChatId(chat.id);
                  setEditChatTitle(localChatTitles[chat.id] ?? chat.title);
                }}
                className="p-2 rounded-lg bg-[#212121] hover:bg-[#2a2a2a] text-gray-300 hover:text-white transition-colors"
                title="Edit chat"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeleteChatId(chat.id);
                }}
                className="p-2 rounded-lg bg-[#212121] hover:bg-[#2a2a2a] text-gray-300 hover:text-white transition-colors"
                title="Delete chat"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* User Info */}
      <div className="border-t border-gray-800 relative" ref={menuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center gap-3 hover:bg-[#212121] p-2 transition-colors"
        >
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || "User"}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-[#DC569D] rounded-full flex items-center justify-center text-sm font-semibold">
              {getUserInitials(user.name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.name || "User"}
            </p>
            <p className="text-xs text-gray-500">{user.email || ""}</p>
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform text-gray-400 ${
              showUserMenu ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {showUserMenu && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#2f2f2f] rounded-lg shadow-xl border border-gray-700 overflow-hidden">
            <Link
              to="/profile"
              className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-[#3a3a3a] transition-colors"
              onClick={() => setShowUserMenu(false)}
            >
              <User size={16} />
              My Profile
            </Link>
            <button
              onClick={() => {
                setShowUserMenu(false);
                handleLogOut();
              }}
              className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-[#3a3a3a] transition-colors border-t border-gray-700"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatSidebar;
