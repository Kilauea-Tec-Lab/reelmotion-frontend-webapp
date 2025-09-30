import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Video,
  Image,
  Music,
  Folder,
  Settings,
  HelpCircle,
  Plus,
  Film,
  VideoIcon,
  User2,
  Cog,
  Settings2Icon,
  HomeIcon,
} from "lucide-react";
import { div } from "framer-motion/client";

function MainSidebarMenu({ showProjectsTutorial, onProjectsClick }) {
  const menuItems = [
    { id: 1, name: "Discovery", icon: HomeIcon, path: "/" }, //9390  Entrega a Efectivo  1940 Es en tarjeta   4087 egreso de caja    3083   Lo que es 3363   Corte de ayer
    { id: 2, name: "Projects", icon: VideoIcon, path: "/projects" },
    { id: 3, name: "Editor", icon: Film, path: "/editor" },
    { id: 4, name: "Profile", icon: User2, path: "/profile" },
    //{ id: 5, name: "Settings", icon: Settings2Icon, path: "/settings" },
  ];

  const handleItemClick = (item) => {
    if (item.id === 2 && showProjectsTutorial) {
      onProjectsClick();
    }
  };

  return (
    <>
      {/* CSS para animación del botón Projects */}
      {showProjectsTutorial && (
        <style>{`
          @keyframes projectsButtonPulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(242, 213, 67, 0.7);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 0 0 10px rgba(242, 213, 67, 0);
            }
          }
          
          .projects-button-animated {
            animation: projectsButtonPulse 0.8s ease-in-out infinite;
          }
        `}</style>
      )}

      <aside
        className={`bg-primarioDark text-white w-64 min-h-screen fixed left-0 top-15 border-r border-gray-800 ${
          showProjectsTutorial ? "z-40" : "z-30"
        }`}
      >
        <div className="flex flex-col h-full px-6 pt-8">
          <div className="pb-4 border-b border-gray-800">
            <h1 className="text-[#808191] text-xs tracking-wider">MENU</h1>
          </div>
          {/* Navegación principal */}
          <nav className="flex-1 pt-5">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `space-x-3 py-2`}
                    onClick={() => handleItemClick(item)}
                  >
                    {({ isActive }) => (
                      <div
                        className={`flex py-2 gap-5 align-center items-center ${
                          item.id === 2 && showProjectsTutorial
                            ? "projects-button-animated relative z-50"
                            : ""
                        }`}
                      >
                        <div
                          className={`px-2 py-2 rounded-xl ${
                            isActive
                              ? "bg-primarioLogo"
                              : item.id === 2 && showProjectsTutorial
                              ? "bg-[#F2D543] relative z-200"
                              : "bg-darkBoxSub"
                          }`}
                        >
                          <item.icon
                            size={20}
                            className={`${
                              isActive
                                ? "text-white"
                                : item.id === 2 && showProjectsTutorial
                                ? "text-primarioDark"
                                : "text-[#808191] hover:text-white"
                            }`}
                          />
                        </div>
                        <span
                          className={`font-semibold text-md tracking-widest ${
                            isActive
                              ? "text-white"
                              : item.id === 2 && showProjectsTutorial
                              ? "text-[#F2D543] relative z-200"
                              : "text-[#808191] hover:text-white"
                          }`}
                        >
                          {item.name}
                        </span>
                      </div>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}

export default MainSidebarMenu;
