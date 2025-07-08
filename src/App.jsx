import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./App.css";
import Editor from "./editor/editor";
import Login from "./auth/login";
import Home from "./dashboard/home";
import MainLayout from "./components/main-layout";
import ErrorBoundary from "./components/error-boundary";
import { userInfoLoader } from "./auth/functions";
import { multiloaderGet } from "./create_elements/functions";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/",
    element: <MainLayout />,
    loader: userInfoLoader,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Home />,
        loader: multiloaderGet,
      },
      {
        path: "editor",
        element: <Editor />,
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
