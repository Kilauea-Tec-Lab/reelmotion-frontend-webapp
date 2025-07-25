import React, { useState } from "react";
import { Outlet, useLoaderData } from "react-router-dom";
import MainTopMenu from "./main-top-menu";
import MainSidebarMenu from "./main-sidebar-menu";

function MainLayout() {
  const loaderData = useLoaderData();
  const [userInfo, setUserInfo] = useState(loaderData?.data);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Menu */}
      <MainTopMenu user_info={userInfo} />

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
