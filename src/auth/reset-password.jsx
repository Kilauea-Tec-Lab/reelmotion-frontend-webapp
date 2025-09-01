import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();

  // States
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [tokenValid, setTokenValid] = useState(true);

  // Password visibility states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verify token on component mount
  useEffect(() => {
    if (!token || token.length !== 32) {
      setTokenValid(false);
    }
  }, [token]);

  const handleResetPassword = async () => {
    // Reset error states
    setNewPasswordError(false);
    setConfirmPasswordError(false);
    setResetMessage("");
    setIsResetting(true);

    try {
      // Validation
      if (!newPassword || !confirmPassword) {
        if (!newPassword) setNewPasswordError("New password is required");
        if (!confirmPassword)
          setConfirmPasswordError("Please confirm your password");
        setIsResetting(false);
        return;
      }

      if (newPassword.length < 8) {
        setNewPasswordError("Password must be at least 8 characters long");
        setIsResetting(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match");
        setIsResetting(false);
        return;
      }

      // API call to reset password
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}users/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reset_token: token,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setResetSuccess(true);
        setResetMessage("Your new password already works!");
      } else {
        setNewPasswordError(data.message || "Error updating password");
      }
    } catch (error) {
      setNewPasswordError("Network error. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-primarioDark flex items-center justify-center p-4">
        <div className="bg-darkBox rounded-xl p-8 max-w-md w-full mx-4 border border-gray-600 text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white montserrat-medium mb-2">
            Invalid Reset Link
          </h2>
          <p className="text-gray-400 text-sm montserrat-light mb-6">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <button
            onClick={handleBackToLogin}
            className="w-full px-4 py-3 rounded-lg bg-[#F2D543] text-primarioDark hover:bg-[#f2f243] transition-colors montserrat-medium"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primarioDark flex items-center justify-center p-4">
      <div className="bg-darkBox rounded-xl p-8 max-w-md w-full mx-4 border border-gray-600">
        <div className="text-center mb-6">
          <img
            src="/logos/logo_reelmotion.webp"
            alt="Reelmotion AI"
            className="h-8 w-auto mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-white montserrat-medium mb-2">
            Reset Your Password
          </h2>
          <p className="text-gray-400 text-sm montserrat-light">
            Enter your new password below to complete the reset process.
          </p>
        </div>

        {!resetSuccess ? (
          <div className="space-y-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2 montserrat-medium">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className={`w-full px-4 py-3 pr-12 rounded-lg bg-darkBoxSub border ${
                    newPasswordError ? "border-red-500" : "border-gray-600"
                  } text-white placeholder-gray-400 focus:outline-none focus:border-[#F2D543] transition-colors montserrat-regular`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {newPasswordError && (
                <p className="text-red-400 text-sm mt-2 montserrat-light">
                  {newPasswordError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2 montserrat-medium">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className={`w-full px-4 py-3 pr-12 rounded-lg bg-darkBoxSub border ${
                    confirmPasswordError ? "border-red-500" : "border-gray-600"
                  } text-white placeholder-gray-400 focus:outline-none focus:border-[#F2D543] transition-colors montserrat-regular`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleResetPassword();
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="text-red-400 text-sm mt-2 montserrat-light">
                  {confirmPasswordError}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isResetting}
                className="w-full px-4 py-3 rounded-lg bg-[#F2D543] text-primarioDark hover:bg-[#f2f243] transition-colors montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isResetting ? (
                  <div className="w-5 h-5 border-2 border-primarioDark border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Update Password"
                )}
              </button>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full px-4 py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors montserrat-medium"
              >
                Back to Login
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-white text-xl font-semibold montserrat-medium mb-2">
                Password Updated!
              </h3>
              <p className="text-gray-300 montserrat-regular text-sm">
                {resetMessage}
              </p>
              <p className="text-gray-400 montserrat-light text-xs mt-2">
                You can now log in with your new password.
              </p>
            </div>
            <button
              type="button"
              onClick={handleBackToLogin}
              className="w-full px-4 py-3 rounded-lg bg-[#F2D543] text-primarioDark hover:bg-[#f2f243] transition-colors montserrat-medium"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
