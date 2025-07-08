import { useEffect, useState } from "react";
import { Navigate, useLoaderData } from "react-router-dom";
import Cookies from "js-cookie";

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  // Intentar obtener datos del loader primero
  let loaderData = null;
  try {
    loaderData = useLoaderData();
  } catch (error) {
    // Si no hay loader data, continuamos con la validación manual
  }

  useEffect(() => {
    // Si ya tenemos datos del loader y son exitosos, no necesitamos validar otra vez
    if (loaderData?.success) {
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = async () => {
      const token = Cookies.get("token");

      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_APP_BACKEND_URL}users/get-user-info`,
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          }
        );

        if (!response.ok) {
          setIsAuthenticated(false);
          return;
        }

        const data = await response.json();
        setIsAuthenticated(data?.success === true);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [loaderData]);

  // Mostrar loading mientras verifica
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primarioDark">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Redirigir al login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
