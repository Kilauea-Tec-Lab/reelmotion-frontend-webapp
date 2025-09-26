import React, { useState, useEffect } from "react";
import { Outlet, useLoaderData, useLocation } from "react-router-dom";
import MainTopMenu from "./main-top-menu";
import MainSidebarMenu from "./main-sidebar-menu";
import HelpButton from "./help-button";

function MainLayout() {
  const loaderData = useLoaderData();
  const [userInfo, setUserInfo] = useState(loaderData?.data);
  const location = useLocation();
  const [showProjectsTutorial, setShowProjectsTutorial] = useState(false);

  // Verificar si necesitamos mostrar el tutorial de Projects
  useEffect(() => {
    const projectsClicked = localStorage.getItem("projectsButtonClicked");
    const isHomePage = location.pathname === "/";

    if (!projectsClicked && isHomePage) {
      setShowProjectsTutorial(true);
    } else {
      setShowProjectsTutorial(false);
    }
  }, [location.pathname]);

  // Función para manejar cuando se hace click en Projects
  const handleProjectsClick = () => {
    localStorage.setItem("projectsButtonClicked", "true");
    setShowProjectsTutorial(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Frosted Glass Overlay para tutorial de Projects */}
      {showProjectsTutorial && (
        <div className="fixed inset-0 z-40 backdrop-blur-md bg-black/30">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        </div>
      )}
      {/* Top Menu */}
      <MainTopMenu user_info={userInfo} />

      {/* Sidebar */}
      <MainSidebarMenu
        showProjectsTutorial={showProjectsTutorial}
        onProjectsClick={handleProjectsClick}
      />

      {/* Main Content Area */}
      <main className="ml-64 pt-15 min-h-screen">
        <Outlet />
      </main>

      {/* Help Button */}
      <HelpButton />
    </div>
  );
}

export default MainLayout;
