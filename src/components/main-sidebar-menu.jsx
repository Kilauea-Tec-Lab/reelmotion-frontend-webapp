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
} from "lucide-react";
import { div } from "framer-motion/client";

function MainSidebarMenu() {
  const menuItems = [
    { id: 1, name: "Projects", icon: VideoIcon, path: "/" },
    { id: 2, name: "Editor", icon: Film, path: "/editor" },
    { id: 1, name: "Profile", icon: User2, path: "/profile" },
    { id: 1, name: "Settings", icon: Settings2Icon, path: "/settings" },
  ];

  return (
    <aside className="bg-primarioDark text-white w-64 min-h-screen fixed left-0 top-15 z-40">
      <div className="flex flex-col h-full px-6 pt-8">
        <h1 className="text-[#808191] text-xs tracking-wider">MENU</h1>
        {/* Navegación principal */}
        <nav className="flex-1 pt-5">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `space-x-3 py-2`}
                >
                  {({ isActive }) => (
                    <div className="flex py-2 gap-5 align-center items-center ">
                      <div
                        className={`px-2 py-2 rounded-xl ${
                          isActive ? "bg-primarioLogo" : "bg-darkBoxSub"
                        }`}
                      >
                        <item.icon
                          size={20}
                          className={`${
                            isActive
                              ? "text-white"
                              : "text-[#808191] hover:text-white"
                          }`}
                        />
                      </div>
                      <span
                        className={`font-semibold text-md tracking-widest ${
                          isActive
                            ? "text-white"
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
  );
}

export default MainSidebarMenu;
