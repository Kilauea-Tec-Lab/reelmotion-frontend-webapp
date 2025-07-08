import { useRouteError, Navigate } from "react-router-dom";
import Cookies from "js-cookie";

function ErrorBoundary() {
  const error = useRouteError();

  // Si es un error de autenticación, limpiar token y redirigir al login
  if (error?.status === 401) {
    Cookies.remove("token");
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex items-center bg-red-500 justify-center min-h-screen bg-primarioDark">
      <div className="align-middle space-y-6 text-center items-center text-white">
        <h1 className="text-white montserrat-medium text-2xl tracking-wider">
          Oops! Something went wrong
        </h1>
        <h2 className="text-gray-300 mb-8">
          {error?.statusText ||
            error?.message ||
            "An unexpected error occurred"}
        </h2>
        <button
          onClick={() => window.location.assign("/")}
          className="bg-[#F2D543] text-primarioDark px-8 py-2 rounded-3xl font-medium hover:bg-[#f2f243] items-center gap-2 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export default ErrorBoundary;
