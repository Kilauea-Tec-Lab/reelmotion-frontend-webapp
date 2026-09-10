import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import Cookies from "js-cookie";
import "./App.css";
import ErrorBoundary from "./components/error-boundary";
import { userInfoLoader } from "./auth/functions";
import { multiloaderGet } from "./create_elements/functions";
import { getProjects } from "./project/functions";
import { getInfoToEdit } from "./editor/functions";
import { getDiscoverPosts } from "./discover/functions";
import { getChatInfo, getChatDetails, getLibrary } from "./chat/functions";

// ChatLayout es el shell de /app y se necesita para pintar el sidebar cuanto antes.
import ChatLayout from "./chat/chat-layout";

// Chat y ChatView arrastran chat-main (4.6k lineas) y Stripe. Diferidos, no los
// descarga quien solo abre la landing, y en /app se bajan en paralelo con el loader.
const Chat = lazy(() => import("./chat/chat"));
const ChatView = lazy(() => import("./chat/chat-view"));

// Todo lo demas entra bajo demanda. El editor solo son 8k lineas, y la landing
// arrastra three.js: no tienen por que estar en el bundle de quien abre /app.
const Editor = lazy(() => import("./editor/editor"));
const ResetPassword = lazy(() => import("./auth/reset-password"));
const VerifyEmail = lazy(() => import("./auth/verify-email"));
const Home = lazy(() => import("./dashboard/home"));
const Profile = lazy(() => import("./profile/profile"));
const Discover = lazy(() => import("./discover/discover"));
const PostDetail = lazy(() => import("./discover/post-detail"));
const MainLayout = lazy(() => import("./components/main-layout"));
const MainProject = lazy(() => import("./project/main-project"));
const Library = lazy(() => import("./chat/library"));
const AiLab = lazy(() => import("./chat/ai-lab"));
const ProPage = lazy(() => import("./subscription/pro-page"));
const MySubscription = lazy(() => import("./subscription/my-subscription"));
const LandingPage = lazy(() => import("./landing/landing-page"));
const TermsPage = lazy(() => import("./legal/terms"));
const PrivacyPage = lazy(() => import("./legal/privacy"));
const ContactPage = lazy(() => import("./landing/contact-page"));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-primarioDark">
      <div className="w-12 h-12 border-4 border-primarioLogo border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/** Envuelve una ruta diferida en su propio limite de Suspense. */
function page(element) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

// Component to handle editor redirection
function EditorRedirect() {
  useEffect(() => {
    // Get token from cookies using js-cookie
    const token = Cookies.get("token");

    // Create URL with token as path parameter
    const editorUrl = new URL(import.meta.env.VITE_EDITOR_URL);
    if (token) {
      // Add token directly to path: /editor/{token}
      editorUrl.pathname = `/${token}`;
    }

    // Small delay to ensure logs are visible
    setTimeout(() => {
      window.location.href = editorUrl.toString();
    }, 100);
  }, []);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center h-screen bg-primarioDark">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primarioLogo border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      </div>
    </div>
  );
}

// Redirect /login to landing page (preserving query params for referral codes)
function LoginRedirect() {
  const search = window.location.search;
  return <Navigate to={`/${search}`} replace />;
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginRedirect />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/reset-password/:token",
    element: page(<ResetPassword />),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/verify-email",
    element: page(<VerifyEmail />),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "discover/post/:id",
    element: page(<PostDetail />),
  },
  {
    path: "/",
    element: page(<LandingPage />),
  },
  {
    path: "/terms",
    element: page(<TermsPage />),
  },
  {
    path: "/privacy",
    element: page(<PrivacyPage />),
  },
  {
    path: "/contact",
    element: page(<ContactPage />),
  },
  {
    path: "/app",
    element: <ChatLayout />,
    loader: getChatInfo,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: page(<Chat />),
      },
      {
        path: "library",
        element: page(<Library />),
        loader: () => getLibrary(),
      },
      {
        path: "dashboard",
        element: page(<AiLab />),
      },
      {
        path: "pro",
        element: page(<ProPage />),
      },
      {
        path: "my-subscription",
        element: page(<MySubscription />),
      },
      {
        path: ":chatId",
        element: page(<ChatView />),
        loader: async ({ params }) => {
          const { chatId } = params;
          return await getChatDetails(chatId);
        },
      },
      {
        path: "profile",
        element: page(<Profile />),
        loader: userInfoLoader,
      },
      {
        path: "discover",
        element: page(<Discover />),
        loader: () => getDiscoverPosts(1, 10),
      },
    ],
  },
  {
    path: "/v2",
    element: page(<MainLayout />),
    loader: userInfoLoader,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: page(<Discover />),
        loader: () => getDiscoverPosts(1, 10),
      },
      {
        path: "projects",
        element: page(<Home />),
        loader: multiloaderGet,
      },
      {
        path: "profile",
        element: page(<Profile />),
        loader: userInfoLoader,
      },
      {
        path: "project/:id",
        element: page(<MainProject />),
        loader: async ({ params }) => {
          const { id } = params;
          return await getProjects(id);
        },
      },
    ],
  },
  {
    path: "editor-2",
    element: page(<Editor />),
    loader: getInfoToEdit,
  },
  {
    path: "editor",
    element: <EditorRedirect />,
    loader: getInfoToEdit,
  },
]);

// Track SPA page views in Google Analytics and TikTok Pixel
router.subscribe((state) => {
  if (state.navigation.state !== "idle") return;

  if (window.gtag) {
    window.gtag("event", "page_view", {
      page_path: state.location.pathname + state.location.search,
      page_title: document.title,
    });
  }

  if (window.ttq) {
    window.ttq.page();
  }
});

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
