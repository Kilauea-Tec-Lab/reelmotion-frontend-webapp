import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./App.css";
import Editor from "./editor/editor";
import Login from "./auth/login";
import Home from "./dashboard/home";
import Profile from "./profile/profile";
import Discover from "./discover/discover";
import PostDetail from "./discover/post-detail";
import MainLayout from "./components/main-layout";
import ErrorBoundary from "./components/error-boundary";
import { userInfoLoader } from "./auth/functions";
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
        path: "editor",
        element: <Editor />,
        loader: getInfoToEdit,
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
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
