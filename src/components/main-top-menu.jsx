import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  User,
  Search,
  LogOut,
  ChevronDown,
  Cog,
  Play,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { searchProjects } from "../create_elements/functions";
import PostModal from "../discover/components/post-modal";
import { getUserNotifications, deleteNotification } from "../auth/functions";
import { getPostById } from "../discover/functions";
import { createPusherClient } from "@/pusher";

function MainTopMenu({ user_info }) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const menuRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [notificationsInfo, setNotificationsInfo] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedNotificationPost, setSelectedNotificationPost] =
    useState(null);

  //WEBSOCKET
  const pusherClient = createPusherClient();

  // Calcular notificaciones no leídas
  const unreadCount = notificationsInfo.filter((n) => n.unread).length;

  // Cerrar los menús cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Búsqueda de proyectos con debounce
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await searchProjects(searchTerm.trim());

        if (response.success && response.data && Array.isArray(response.data)) {
          setSearchResults(response.data);
          setShowSearchResults(response.data.length > 0);
        } else {
          setSearchResults([]);
          setShowSearchResults(false);
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms delay

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  function handleLogOut() {
    Cookies.remove("token");
    navigate("/login", { replace: true });
  }

  const handleProjectSelect = (project) => {
    // Abrir el visualizador de proyectos con el ID seleccionado
    setSelectedProjectId(project.id);
    setSearchTerm("");
    setSearchResults([]);
    setShowSearchResults(false);
    setShowProjectModal(true);
  };

  const handleCloseProjectModal = () => {
    setShowProjectModal(false);
    setSelectedProjectId(null);
  };

  async function getNotifications() {
    const response = await getUserNotifications();
    setNotificationsInfo(response?.data || []);
  }

  // Socket para notificaciones
  useEffect(() => {
    if (!user_info?.id) return;

    let channel = pusherClient.subscribe(
      `private-get-notifications.${user_info.id}`
    );

    channel.bind("fill-notifications", ({ user_id }) => {
      getNotifications();
    });

    return () => {
      pusherClient.unsubscribe(`private-get-notifications.${user_info.id}`);
    };
  }, [user_info?.id]);

  useEffect(() => {
    getNotifications();
  }, []);

  // Helper function to format date as "hace 1 min", "hace 2 hrs", etc.
  function timeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000); // seconds

    if (isNaN(diff) || diff < 0) return "";

    if (diff < 60) return "hace unos segundos";
    if (diff < 3600) {
      const mins = Math.floor(diff / 60);
      return `hace ${mins} min${mins > 1 ? "s" : ""}`;
    }
    if (diff < 86400) {
      const hrs = Math.floor(diff / 3600);
      return `hace ${hrs} hr${hrs > 1 ? "s" : ""}`;
    }
    const days = Math.floor(diff / 86400);
    return `hace ${days} día${days > 1 ? "s" : ""}`;
  }

  // Función para manejar el click en notificaciones
  const handleNotificationClick = async (notification) => {
    try {
      // 1. Eliminar la notificación
      await deleteNotification(notification.id);

      // 3. Si es una notificación de post, obtener la info y abrir el modal
      if (notification.type == "post" && notification.referente_to_go) {
        const postResponse = await getPostById(notification.referente_to_go);
        if (postResponse.data) {
          setSelectedNotificationPost(postResponse.data);
          setShowNotificationModal(true);
        }
      }

      if (notification.type == "folder_shared") {
        // Redirigir al usuario a la carpeta compartida
        navigate(`/projects`);
      }

      // Cerrar el dropdown de notificaciones
      setShowNotifications(false);
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const handleCloseNotificationModal = () => {
    setShowNotificationModal(false);
    setSelectedNotificationPost(null);
  };

  return (
    <header className="bg-primarioDark h-15 pt-1 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50  border-b pb-2 border-gray-800">
      {/* Project Modal */}
      <PostModal
        isOpen={showProjectModal}
        onClose={handleCloseProjectModal}
        postId={selectedProjectId}
      />

      {/* Notification Post Modal */}
      <PostModal
        isOpen={showNotificationModal}
        onClose={handleCloseNotificationModal}
        postId={selectedNotificationPost?.id}
      />

      {/* Logo y navegación principal */}

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <img
            src="/logos/logo_reelmotion.webp"
            alt="Reelmotion AI"
            className="h-7 w-auto"
          />
        </div>
      </div>

      {/* Barra de búsqueda central */}
      <div
        className="flex-1 max-w-lg mx-8 bg-darkBoxSub rounded-lg relative"
        ref={searchRef}
      >
        <div className="relative">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-0 focus:outline-none text-white bg-transparent montserrat-medium wider placeholder-[#808191]"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#808191] h-4 w-4" />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-[#F2D543] rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-darkBoxSub rounded-lg shadow-xl border border-gray-600 max-h-96 overflow-y-auto z-50">
            {searchResults.length > 0 ? (
              <div className="p-2">
                {searchResults.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project)}
                    className="w-full flex items-center gap-3 px-3 py-3 text-white hover:bg-darkBox transition-colors text-left rounded-lg"
                  >
                    {/* Video thumbnail */}
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center flex-shrink-0">
                      {project.video_url ? (
                        <video
                          src={project.video_url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <Play size={20} className="text-gray-400" />
                      )}
                    </div>

                    {/* Project info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white montserrat-medium truncate">
                        {project.name}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <ChevronDown className="rotate-[-90deg] text-gray-400 w-4 h-4 flex-shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-gray-400 text-sm montserrat-light">
                {searchTerm.trim().length < 2
                  ? "Type at least 2 characters to search"
                  : "No projects found"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controles del usuario */}
      <div className="flex items-center space-x-6">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-2 text-[#808191] rounded-lg transition-colors hover:bg-darkBoxSub"
          >
            {user_info?.image ? (
              <img
                src={user_info.image}
                alt="User Avatar"
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <User className="h-8 w-8 rounded-full" />
            )}
            <span className="text-sm font-medium">{user_info?.name}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                showUserMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute top-12 right-0 bg-darkBoxSub rounded-lg shadow-lg z-10 min-w-[160px]">
              <Link
                to="/profile"
                className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-white montserrat-light hover:bg-darkBox transition-colors rounded-lg"
              >
                <Cog size={16} />
                Settings
              </Link>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  handleLogOut();
                }}
                className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-white montserrat-light hover:bg-darkBox transition-colors rounded-lg"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-[#808191] rounded-lg transition-colors hover:bg-darkBoxSub relative"
          >
            <Bell className="h-5 w-5" />
            {notificationsInfo.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notificationsInfo.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-12 right-0 bg-darkBoxSub rounded-lg shadow-lg z-10 w-80 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-white montserrat-medium text-sm">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-xs text-[#F2D543] montserrat-light">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notificationsInfo.length > 0 ? (
                  notificationsInfo.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-700 hover:bg-darkBox transition-colors cursor-pointer ${
                        notification.unread ? "bg-darkBox bg-opacity-30" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        {notification?.other_user?.image ? (
                          <img
                            src={notification?.other_user?.image}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                            <User className="text-gray-200" size={15} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`text-sm montserrat-medium ${
                              notification.unread
                                ? "text-white"
                                : "text-gray-300"
                            }`}
                          >
                            {notification.type == "post"
                              ? "Discovery"
                              : "Notification"}
                          </h4>
                          <p className="text-xs text-gray-400 montserrat-light mt-1 line-clamp-2">
                            {notification.notification}
                          </p>
                          <span className="text-xs text-gray-500 montserrat-light mt-2 block">
                            {timeAgo(notification.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm montserrat-light">
                      No notifications yet
                    </p>
                  </div>
                )}
              </div>

              {notificationsInfo.length > 0 && (
                <div className="p-3">
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="w-full text-center text-xs text-[#F2D543] montserrat-light hover:text-[#f2f243] transition-colors"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default MainTopMenu;
