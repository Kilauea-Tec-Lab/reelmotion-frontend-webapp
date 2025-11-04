import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { useEffect } from "react";
import Cookies from "js-cookie";
import "./App.css";
import Editor from "./editor/editor";
import Login from "./auth/login";
import ResetPassword from "./auth/reset-password";
import VerifyEmail from "./auth/verify-email";
import Home from "./dashboard/home";
import Profile from "./profile/profile";
import Discover from "./discover/discover";
import PostDetail from "./discover/post-detail";
import MainLayout from "./components/main-layout";
import ErrorBoundary from "./components/error-boundary";
import { getUserInfo, userInfoLoader } from "./auth/functions";
import { multiloaderGet } from "./create_elements/functions";
import MainProject from "./project/main-project";
import { getProjects } from "./project/functions";
import { getInfoToEdit } from "./editor/functions";
import { getDiscoverPosts } from "./discover/functions";

// Component to handle editor redirection
function EditorRedirect() {
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (!isMobile && import.meta.env.VITE_EDITOR_URL) {
      // Get token from cookies using js-cookie
      const token = Cookies.get("token");

      // Create URL with token as path parameter
      const editorUrl = new URL(import.meta.env.VITE_EDITOR_URL);
      if (token) {
        // Add token directly to path: /editor/{token}
        editorUrl.pathname = `/editor/${token}`;
      }

      // Small delay to ensure logs are visible
      setTimeout(() => {
        window.location.href = editorUrl.toString();
      }, 100);
    }
  }, []);

  // Check if mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // If mobile or no VITE_EDITOR_URL, show the local editor
  if (isMobile || !import.meta.env.VITE_EDITOR_URL) {
    console.log("🔍 EditorRedirect - Showing local editor:", {
      isMobile,
      hasEditorUrl: !!import.meta.env.VITE_EDITOR_URL,
    });
    return <Editor />;
  }

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center h-screen bg-primarioDark">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primarioLogo border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirecting to editor...</p>
        <p className="text-gray-400 text-sm mt-2">
          Preparing authentication...
        </p>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/reset-password/:token",
    element: <ResetPassword />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/verify-email",
    element: <VerifyEmail />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "discover/post/:id",
    element: <PostDetail />,
  },
  {
    path: "/",
    element: <MainLayout />,
    loader: userInfoLoader,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Discover />,
        loader: () => getDiscoverPosts(1, 10),
      },
      {
        path: "projects",
        element: <Home />,
        loader: multiloaderGet,
      },
      {
        path: "profile",
        element: <Profile />,
        loader: userInfoLoader,
      },
      {
        path: "project/:id",
        element: <MainProject />,
        loader: async ({ params }) => {
          const { id } = params;
          return await getProjects(id);
        },
      },
    ],
  },
  {
    path: "editor",
    element: <EditorRedirect />,
    loader: getInfoToEdit,
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
