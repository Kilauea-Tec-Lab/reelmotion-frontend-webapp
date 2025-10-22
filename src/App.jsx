import { RouterProvider, createBrowserRouter } from "react-router-dom";
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
        index: true,
        element: <Discover />,
        loader: () => getDiscoverPosts(1, 10),
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
    element: <Editor />,
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
