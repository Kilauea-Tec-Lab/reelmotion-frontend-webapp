import React from "react";
import { Outlet } from "react-router-dom";
import MainTopMenu from "./main-top-menu";
import MainSidebarMenu from "./main-sidebar-menu";

function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Menu */}
      <MainTopMenu />

      {/* Sidebar */}
      <MainSidebarMenu />

      {/* Main Content Area */}
      <main className="ml-64 pt-15 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
