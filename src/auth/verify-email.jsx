import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Obtener el email de los parámetros de búsqueda
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }

    // Simular loader de 5 segundos
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [searchParams]);

  const handleContinue = () => {
    // Redirigir al login después de la verificación
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-primarioDark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-darkBox rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/logos/logo_reelmotion_new.png"
              alt="ReelMotion"
              className="h-12"
            />
          </div>

          {isLoading ? (
            /* Loading State */
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <Loader2 size={48} className="text-[#F2D543] animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4 montserrat-bold">
                Verifying Email
              </h2>
              <p className="text-gray-400 montserrat-regular">
                Please wait while we verify your email address...
              </p>
              {email && (
                <p className="text-[#F2D543] montserrat-medium mt-2 text-sm">
                  {email}
                </p>
              )}
            </div>
          ) : (
            /* Success State */
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <CheckCircle size={48} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4 montserrat-bold">
                Email Verified Successfully!
              </h2>
              <p className="text-gray-400 montserrat-regular mb-6">
                Your email address has been verified successfully. You can now
                proceed to login.
              </p>
              {email && (
                <p className="text-[#F2D543] montserrat-medium mb-6 text-sm">
                  {email}
                </p>
              )}
              <button
                onClick={handleContinue}
                className="w-full bg-[#F2D543] hover:bg-[#f2f243] text-primarioDark font-bold py-3 px-4 rounded-lg transition-colors montserrat-bold"
              >
                Continue to Login
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm montserrat-light">
            © 2024 ReelMotion. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
