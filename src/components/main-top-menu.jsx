import React, { useState, useEffect, useRef } from "react";
import { Bell, User, Search, LogOut, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

function MainTopMenu({ user_info }) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef(null);
  const notificationsRef = useRef(null);

  // Mock notifications data - en producción vendría del backend
  const notifications = [];

  const unreadCount = notifications.filter((n) => n.unread).length;

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
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogOut() {
    Cookies.remove("token");
    navigate("/login", { replace: true });
  }

  return (
    <header className="bg-primarioDark h-15 pt-1 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50">
      {/* Logo y navegación principal */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <img
            src="/logos/logo_reelmotion.webp"
            alt="ReelMotion AI"
            className="h-7 w-auto"
          />
        </div>
      </div>

      {/* Barra de búsqueda central */}
      <div className="flex-1 max-w-lg mx-8 bg-darkBoxSub rounded-lg">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-0 focus:outline-none text-[#808191] montserrat-medium wider"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#808191] h-4 w-4" />
        </div>
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
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
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
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-700 hover:bg-darkBox transition-colors cursor-pointer ${
                        notification.unread ? "bg-darkBox bg-opacity-30" : ""
                      }`}
                      onClick={() => {
                        // Aquí puedes manejar el click en la notificación
                        setShowNotifications(false);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            notification.type === "success"
                              ? "bg-green-500"
                              : notification.type === "warning"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                          }`}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`text-sm montserrat-medium ${
                              notification.unread
                                ? "text-white"
                                : "text-gray-300"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          <p className="text-xs text-gray-400 montserrat-light mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <span className="text-xs text-gray-500 montserrat-light mt-2 block">
                            {notification.time}
                          </span>
                        </div>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-[#F2D543] rounded-full flex-shrink-0 mt-2"></div>
                        )}
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

              {notifications.length > 0 && (
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
