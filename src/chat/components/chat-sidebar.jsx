import {
  Plus,
  Search,
  MessageSquare,
  Library,
  ArrowLeft,
  LogOut,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageCirclePlus,
  Clapperboard,
  LibraryBig,
  Images,
  Pencil,
  Trash2,
  Loader2,
  X,
  Code2,
  FlaskConical,
  LifeBuoy,
  MessageCircle,
  Film,
} from "lucide-react";
import { Link, useLocation, useParams, useNavigate, useRevalidator } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Cookies from "js-cookie";
import { useI18n } from "../../i18n/i18n-context";
import { notifyAppLogout } from "../../utils/nativeBridge";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP_URL } from "../../utils/support";

function ChatSidebar({
  chats,
  searchQuery,
  onSearchChange,
  user,
  onOpenAiLab,
  isOpen = false,
  onClose,
}) {
  // Colapsado solo en desktop; en móvil el sidebar ya es un overlay.
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("sidebar-collapsed") === "1"; } catch { return false; }
  });
  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem("sidebar-collapsed", next ? "1" : "0"); } catch { /* sin storage */ }
  };
  const lbl = collapsed ? "md:hidden" : "";
  const { pathname } = useLocation();
  // Item activo por prefijo de ruta; "/app" solo cuando es exactamente chat nuevo.
  const isActive = (to) => (to === "/app" ? pathname === "/app" || pathname === "/app/" : pathname.startsWith(to));
  const nav = (to) =>
    `relative w-full flex items-center gap-3 px-3 py-2.5 font-dm-sans text-sm rounded-lg transition-colors ${
      isActive(to) ? "bg-[#DC569D]/15 text-[#DC569D]" : "text-white hover:bg-[#2a2a2a]"
    } ${collapsed ? "md:w-10 md:h-10 md:mx-auto md:px-0 md:py-0 md:justify-center" : ""}`;
  // Punto amarillo sobre el icono cuando la etiqueta (Beta/New) esta oculta.
  const dot = collapsed ? <span className="hidden md:block absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#F2D543]" /> : null;

  const { chatId } = useParams();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const { t, locale, setLocale } = useI18n();
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
    notifyAppLogout("user");
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
        navigate("/app");
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
    <div className={`fixed md:relative inset-y-0 left-0 z-30 w-64 ${collapsed ? "md:w-16" : ""} bg-[#171717] border-r border-gray-800 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
      {/* Edit Chat Modal (portaled to body to escape sidebar transform) */}
      {editChatId && createPortal(
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
                <h3 className="text-xl font-semibold text-white">{t("sidebar.edit-chat")}</h3>
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
              {t("sidebar.chat-name")}
            </label>
            <input
              type="text"
              value={editChatTitle}
              onChange={(e) => setEditChatTitle(e.target.value)}
              className="w-full px-4 py-2 bg-[#2f2f2f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#DC569D] focus:ring-1 focus:ring-[#DC569D] transition-all"
              placeholder={t("sidebar.enter-chat-name")}
              autoFocus
            />

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={closeEditModal}
                disabled={isSavingChatTitle}
                className="px-4 py-2 bg-[#2f2f2f] text-gray-300 rounded-lg hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
              >
                {t("sidebar.cancel")}
              </button>
              <button
                onClick={handleEditChat}
                disabled={isSavingChatTitle || editChatTitle.trim() === ""}
                className="px-4 py-2 bg-[#DC569D] text-white rounded-lg hover:bg-[#c44a87] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingChatTitle ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("sidebar.saving")}
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4" />
                    {t("sidebar.save")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Chat Modal (portaled to body to escape sidebar transform) */}
      {deleteChatId && createPortal(
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
              <h3 className="text-xl font-semibold text-white">{t("sidebar.delete-chat")}</h3>
            </div>
            <p className="text-gray-400 mb-6">
              {t("sidebar.delete-confirm")}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeDeleteModal}
                disabled={isDeletingChat}
                className="px-4 py-2 bg-[#2f2f2f] text-gray-300 rounded-lg hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
              >
                {t("sidebar.cancel")}
              </button>
              <button
                onClick={handleDeleteChat}
                disabled={isDeletingChat}
                className="px-4 py-2 bg-[#DC569D] text-white rounded-lg hover:bg-[#c44a87] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingChat ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("sidebar.deleting")}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    {t("sidebar.delete")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className={`h-14 md:h-16 flex items-center shrink-0 ${collapsed ? "md:justify-center" : "pl-6"}`}>
        <img src="/logos/logo_reelmotion.webp" alt="Reelmotion AI" className={`w-2/4 ${lbl}`} />
        {collapsed && <img src="/logos/icon_r.png" alt="Reelmotion AI" className="hidden md:block h-7 w-auto" />}
      </div>
      {/* Pildora de colapso montada sobre el borde derecho (solo desktop) */}
      <button
        onClick={toggleCollapsed}
        className="hidden md:flex absolute top-6 -right-3 h-6 w-6 items-center justify-center rounded-full bg-[#2f2f2f] border border-gray-700 text-gray-400 hover:text-white hover:border-[#DC569D] hover:bg-[#DC569D]/20 transition-colors z-10"
        title={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
      {/* Header */}
      <div className={`p-3 space-y-0.5 border-b border-gray-800 ${collapsed ? "md:px-0 md:py-3 md:space-y-1.5" : ""}`}>
        <Link
          to={"/app"}
          onClick={onClose}
          title={t("sidebar.new-chat")} className={nav("/app")}
        >
          <MessageCirclePlus size={20} />
          {dot}
          <span className={`font-medium ${lbl}`}>{t("sidebar.new-chat")}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F2D543] text-black uppercase tracking-wide ${lbl}`}>
            Beta
          </span>
        </Link>
        <button
          onClick={() => { onOpenAiLab(); onClose?.(); }}
          title={t("sidebar.ai-lab")} className={nav("/app/dashboard")}
        >
          <FlaskConical size={20} />
          <span className={`font-medium ${lbl}`}>{t("sidebar.ai-lab")}</span>
        </button>
        <Link
          to={"/app/projects"}
          onClick={onClose}
          title={t("sidebar.projects")} className={nav("/app/projects")}
        >
          <Film size={20} />
          {dot}
          <span className={`font-medium ${lbl}`}>{t("sidebar.projects")}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F2D543] text-black uppercase tracking-wide ${lbl}`}>
            New
          </span>
        </Link>
        <Link
          to={"/editor"}
          onClick={onClose}
          title={t("sidebar.editor")} className={nav("/editor")}
        >
          <Clapperboard size={20} />
          <span className={`font-medium ${lbl}`}>{t("sidebar.editor")}</span>
        </Link>
        <Link
          to={"/app/library"}
          onClick={onClose}
          title={t("sidebar.library")} className={nav("/app/library")}
        >
          <LibraryBig size={20} />
          <span className={`font-medium ${lbl}`}>{t("sidebar.library")}</span>
        </Link>
        {/*
        <Link
          to={"/app/discover"}
          className={nav("/app/discover")}
        >
          <Images size={20} />
          <span className={`font-medium ${lbl}`}>Discover</span>
        </Link>
        */}
        <Link
          to={"/app/developers"}
          onClick={onClose}
          title={t("sidebar.developers")} className={nav("/app/developers")}
        >
          <Code2 size={20} className="text-[#DC569D]" />
          <span className={`font-medium ${lbl}`}>{t("sidebar.developers")}</span>
        </Link>
      </div>

      {/* Colapsado: los chats viven en el panel expandido; este icono lo abre. */}
      {collapsed && (
        <div className="hidden md:flex flex-col items-center py-3 border-b border-gray-800">
          <button
            onClick={toggleCollapsed}
            title={t("sidebar.your-chats")}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors"
          >
            <MessageSquare size={20} />
          </button>
        </div>
      )}

      {/* Search */}
      <div className={`p-4 ${lbl}`}>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            size={18}
          />
          <input
            type="text"
            placeholder={t("sidebar.search-chats")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#212121] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
          />
        </div>
      </div>

      {/* Section Title */}
      <div className={`px-4 py-2 ${lbl}`}>
        <h3 className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-2">
          {t("sidebar.your-chats")}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F2D543] text-black uppercase tracking-wide ${lbl}`}>
            Beta
          </span>
        </h3>
      </div>

      {/* Chat List */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar ${lbl}`}>
        {filteredChats.map((chat) => (
          <div key={chat.id} className="relative group">
            <Link
              to={`/app/${chat.id}`}
              onClick={onClose}
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
          className={`w-full flex items-center gap-3 hover:bg-[#212121] p-2 transition-colors ${collapsed ? "md:justify-center md:py-3" : ""}`}
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
          <div className={`flex-1 min-w-0 ${lbl}`}>
            <p className="text-sm font-medium truncate">
              {user.name || "User"}
            </p>
            <p className="text-xs text-gray-500">{user.email || ""}</p>
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform text-gray-400 ${lbl} ${
              showUserMenu ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {showUserMenu && (
          <div className={`absolute bottom-full left-4 right-4 mb-2 bg-[#2f2f2f] rounded-lg shadow-xl border border-gray-700 overflow-hidden ${collapsed ? "md:bottom-2 md:left-full md:right-auto md:ml-2 md:w-64" : ""}`}>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-gray-500">{locale === "es" ? "Idioma" : "Language"}</span>
              <div className="flex items-center bg-[#212121] rounded-full p-0.5 gap-0.5">
                <button
                  onClick={() => setLocale("en")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200 ${locale === "en" ? "bg-[#3a3a3a] text-white" : "text-gray-600 hover:text-gray-400"}`}
                >
                  <span>🇺🇸</span>
                  <span>EN</span>
                </button>
                <button
                  onClick={() => setLocale("es")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200 ${locale === "es" ? "bg-[#3a3a3a] text-white" : "text-gray-600 hover:text-gray-400"}`}
                >
                  <span>🇪🇸</span>
                  <span>ES</span>
                </button>
              </div>
            </div>
            <Link
              to="/app/profile"
              className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-[#3a3a3a] transition-colors border-t border-gray-700"
              onClick={() => setShowUserMenu(false)}
            >
              <User size={16} />
              {t("sidebar.my-profile")}
            </Link>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-[#3a3a3a] transition-colors border-t border-gray-700"
              onClick={() => setShowUserMenu(false)}
            >
              <LifeBuoy size={16} />
              {t("sidebar.support")}
            </a>
            <a
              href={SUPPORT_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-[#3a3a3a] transition-colors border-t border-gray-700"
              onClick={() => setShowUserMenu(false)}
            >
              <MessageCircle size={16} className="text-[#25D366]" />
              {t("sidebar.support-whatsapp")}
            </a>
            <button
              onClick={() => {
                setShowUserMenu(false);
                handleLogOut();
              }}
              className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-[#3a3a3a] transition-colors border-t border-gray-700"
            >
              <LogOut size={16} />
              {t("sidebar.log-out")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatSidebar;
