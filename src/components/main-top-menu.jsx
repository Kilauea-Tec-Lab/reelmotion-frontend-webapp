import React, { useState, useEffect, useRef } from "react";
import { Bell, User, Search, LogOut, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

function MainTopMenu({ user_info }) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  // Cerrar el menú cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
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
            <User className="h-5 w-5" />
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
        <button className="p-2 text-[#808191] rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

export default MainTopMenu;
