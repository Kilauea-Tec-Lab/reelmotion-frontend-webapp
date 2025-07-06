import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./App.css";
import Editor from "./editor/editor";
import Login from "./auth/login";
import Home from "./dashboard/home";
import MainLayout from "./components/main-layout";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "editor",
        element: <Editor />,
      },
      {
        path: "videos",
        element: (
          <div className="p-6 min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Videos</h1>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600">Gestiona tus videos aquí.</p>
            </div>
          </div>
        ),
      },
      {
        path: "images",
        element: (
          <div className="p-6 min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Imágenes</h1>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600">Gestiona tus imágenes aquí.</p>
            </div>
          </div>
        ),
      },
      {
        path: "music",
        element: (
          <div className="p-6 min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Música</h1>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600">Gestiona tu música aquí.</p>
            </div>
          </div>
        ),
      },
      {
        path: "projects",
        element: (
          <div className="p-6 min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Proyectos</h1>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600">Gestiona tus proyectos aquí.</p>
            </div>
          </div>
        ),
      },
      {
        path: "settings",
        element: (
          <div className="p-6 min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Configuración
            </h1>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600">Configura tu aplicación aquí.</p>
            </div>
          </div>
        ),
      },
      {
        path: "help",
        element: (
          <div className="p-6 min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Ayuda</h1>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600">Centro de ayuda y documentación.</p>
            </div>
          </div>
        ),
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
