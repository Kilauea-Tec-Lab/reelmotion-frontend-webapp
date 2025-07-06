import React from "react";
import { Bell, User, Search, Menu } from "lucide-react";

function MainTopMenu() {
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
        <button className="flex items-center space-x-2 p-2 text-[#808191] rounded-lg transition-colors">
          <User className="h-5 w-5" />
          <span className="text-sm font-medium">Usuario</span>
        </button>
        <button className="p-2 text-[#808191] rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

export default MainTopMenu;
