import { Plus, Search, MessageSquare, Library, ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";

function ChatSidebar({ chats, searchQuery, onSearchChange, user }) {
  const { chatId } = useParams();
  const getUserInitials = (name) => {
    if (!name) return "U";
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };
  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-64 bg-[#171717] border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 space-y-3">
        <Link
          to={"/chat"}
          className="w-full flex items-center gap-3 px-4 py-3 bg-[#212121] hover:bg-[#2a2a2a] rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span className="font-medium">New chat</span>
        </Link>
        <Link
          to={"/"}
          className="w-full flex items-center gap-3 px-4 py-3 bg-[#212121] hover:bg-[#2a2a2a] rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Return</span>
        </Link>
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

      {/* Library */}
      <div className="px-4 pb-2">
        <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#212121] rounded-lg transition-colors text-gray-400 hover:text-white">
          <Library size={18} />
          <span className="text-sm">Library</span>
        </button>
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
          <Link
            key={chat.id}
            to={`/chat/${chat.id}`}
            className={`w-full px-4 py-3 hover:bg-[#212121] transition-colors text-left border-l-2 block ${
              chatId === chat.id
                ? "border-[#DC569D] bg-[#212121]"
                : "border-transparent"
            }`}
          >
            <div className="flex items-start gap-2">
              <MessageSquare
                size={16}
                className="mt-1 text-gray-500 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white truncate">
                  {chat.title}
                </h4>
                <p className="text-xs text-gray-500 truncate">{chat.preview}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* User Info */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
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
        </div>
      </div>
    </div>
  );
}

export default ChatSidebar;
