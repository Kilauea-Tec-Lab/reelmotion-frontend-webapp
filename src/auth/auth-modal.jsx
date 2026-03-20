import { useState, useEffect } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { createAccount, login } from "./functions";
import Cookies from "js-cookie";
import { useI18n } from "../i18n/i18n-context";
import { Link } from "react-router-dom";

function AuthModal({ isOpen, onClose }) {
  const { t } = useI18n();
  const [typeRecord, setTypeRecord] = useState(1);

  // Login States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Login Error states
  const [loginEmailError, setLoginEmailError] = useState(false);
  const [loginPasswordError, setLoginPasswordError] = useState(false);

  // Reset Password States
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailError, setResetEmailError] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Create Account States
  const [username, setUsername] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createPasswordConfirm, setCreatePasswordConfirm] = useState("");
  const [createName, setCreateName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Error states
  const [usernameError, setUsernameError] = useState(false);
  const [createEmailError, setCreateEmailError] = useState(false);
  const [createPasswordError, setCreatePasswordError] = useState(false);
  const [createPasswordConfirmError, setCreatePasswordConfirmError] =
    useState(false);
  const [createNameError, setCreateNameError] = useState(false);
  const [acceptTermsError, setAcceptTermsError] = useState(false);

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showCreateConfirmPassword, setShowCreateConfirmPassword] =
    useState(false);

  // Loading states
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Referral code states
  const [referralCode, setReferralCode] = useState("");

  // Check for referral code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      setReferralCode(code);
      setTypeRecord(2);
    }
  }, []);

  async function handleLogin() {
    setLoginEmailError(false);
    setLoginPasswordError(false);
    setIsLoggingIn(true);

    try {
      if (!loginEmail || !loginPassword) {
        if (!loginEmail) setLoginEmailError(t("auth.signin.email-required"));
        if (!loginPassword) setLoginPasswordError(t("auth.signin.password-required"));
        setIsLoggingIn(false);
        return;
      }

      const loginCall = await login({
        email: loginEmail.toLowerCase(),
        password: loginPassword,
      });

      if (loginCall.ok) {
        const loginResponse = await loginCall.json();
        const token = loginResponse.data.token;
        Cookies.set("token", token);
        window.location.replace("/app");
      } else {
        const errorData = await loginCall.json();
        if (errorData.success == false) {
          setLoginEmailError(t("auth.signin.invalid-credentials"));
        }
      }
    } catch (error) {
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleResetPassword() {
    setResetEmailError(false);
    setResetMessage("");
    setIsResetting(true);

    try {
      if (!resetEmail) {
        setResetEmailError(t("auth.reset.email-required"));
        setIsResetting(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(resetEmail)) {
        setResetEmailError(t("auth.reset.email-invalid"));
        setIsResetting(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}users/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetEmail.toLowerCase() }),
        }
      );

      const data = await response.json();

      if (response.ok && data.code === 200) {
        setResetSuccess(true);
        setResetMessage(
          data.message || t("auth.reset.fallback-success")
        );
      } else {
        setResetEmailError(data.message || t("auth.reset.fallback-error"));
      }
    } catch (error) {
      setResetEmailError(t("auth.reset.network-error"));
    } finally {
      setIsResetting(false);
    }
  }

  const handleBackToLogin = () => {
    setShowResetPassword(false);
    setResetEmail("");
    setResetEmailError(false);
    setResetMessage("");
    setResetSuccess(false);
  };

  async function handleRegister() {
    setUsernameError(false);
    setCreateEmailError(false);
    setCreatePasswordError(false);
    setCreatePasswordConfirmError(false);
    setCreateNameError(false);
    setAcceptTermsError(false);

    if (!acceptTerms) {
      setAcceptTermsError(t("auth.register.accept-terms-error"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createEmail)) {
      setCreateEmailError(t("auth.register.email-invalid"));
      return;
    }

    if (createPassword == "" || createPasswordConfirm == "") {
      setCreatePasswordError(t("auth.register.password-empty"));
      setCreatePasswordConfirmError(t("auth.register.password-empty"));
      return;
    }

    if (createPassword !== createPasswordConfirm) {
      setCreatePasswordError(t("auth.register.password-mismatch"));
      setCreatePasswordConfirmError(t("auth.register.password-mismatch"));
      return;
    }

    setIsRegistering(true);

    const register = await createAccount({
      username: username,
      name: createName,
      email: createEmail.toLowerCase(),
      password: createPassword,
      passwordConfirm: createPasswordConfirm,
      referral_code: referralCode || null,
    });

    if (register.ok) {
      const loginResponse = await register.json();
      const token = loginResponse.data.token;
      Cookies.set("token", token);
      window.location.replace("/app");
    } else {
      const errorData = await register.json();
      if (errorData.errors) {
        if (errorData.errors.username)
          setUsernameError(errorData.errors.username[0]);
        if (errorData.errors.name)
          setCreateNameError(errorData.errors.name[0]);
        if (errorData.errors.email)
          setCreateEmailError(errorData.errors.email[0]);
        if (errorData.errors.password)
          setCreatePasswordError(errorData.errors.password[0]);
      }
    }

    setIsRegistering(false);
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Auth Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-[#161619] border border-gray-700 rounded-3xl w-full max-w-md p-8 relative shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* Tabs */}
          <div className="flex p-1 bg-black/40 rounded-xl mb-8 mt-4">
            <button
              onClick={() => setTypeRecord(1)}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                typeRecord === 1
                  ? "bg-[#DC569D] text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t("auth.tab.signin")}
            </button>
            <button
              onClick={() => setTypeRecord(2)}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                typeRecord === 2
                  ? "bg-[#DC569D] text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t("auth.tab.register")}
            </button>
          </div>

          {/* Forms */}
          {typeRecord === 1 ? (
            <div className="space-y-6">
              <div className="text-center mb-2">
                <h3 className="text-white text-2xl font-semibold">
                  {t("auth.signin.title")}
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  {t("auth.signin.subtitle")}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  {loginEmailError && (
                    <p className="text-red-400 text-xs mb-1 text-left">
                      {loginEmailError}
                    </p>
                  )}
                  <input
                    className={`bg-black/30 border border-gray-700 w-full rounded-xl px-4 py-3.5 text-white placeholder-gray-500 outline-none focus:border-[#DC569D] transition-colors ${
                      loginEmailError ? "border-red-500" : ""
                    }`}
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={t("auth.signin.email-placeholder")}
                  />
                </div>

                <div className="relative">
                  <input
                    className={`bg-black/30 border border-gray-700 w-full rounded-xl px-4 py-3.5 pr-12 text-white placeholder-gray-500 outline-none focus:border-[#DC569D] transition-colors ${
                      loginPasswordError ? "border-red-500" : ""
                    }`}
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={t("auth.signin.password-placeholder")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLogin();
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showLoginPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="text-[#DC569D] text-sm hover:underline"
                >
                  {t("auth.signin.forgot-password")}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleLogin()}
                disabled={isLoggingIn}
                className="w-full bg-[#DC569D] text-white py-3.5 rounded-xl font-bold hover:bg-[#c9458b] transition-all shadow-lg shadow-[#DC569D]/10 flex justify-center items-center"
              >
                {isLoggingIn ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t("auth.signin.button")
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-center mb-2">
                <h3 className="text-white text-2xl font-semibold">
                  {t("auth.register.title")}
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  {t("auth.register.subtitle")}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  {usernameError && (
                    <p className="text-red-400 text-xs mb-1">
                      {usernameError}
                    </p>
                  )}
                  <input
                    className={`bg-black/30 border border-gray-700 w-full rounded-xl px-4 py-3.5 text-white placeholder-gray-500 outline-none focus:border-[#DC569D] transition-colors ${
                      usernameError ? "border-red-500" : ""
                    }`}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t("auth.register.username-placeholder")}
                  />
                </div>

                <div>
                  {createNameError && (
                    <p className="text-red-400 text-xs mb-1">
                      {createNameError}
                    </p>
                  )}
                  <input
                    className={`bg-black/30 border border-gray-700 w-full rounded-xl px-4 py-3.5 text-white placeholder-gray-500 outline-none focus:border-[#DC569D] transition-colors ${
                      createNameError ? "border-red-500" : ""
                    }`}
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder={t("auth.register.name-placeholder")}
                  />
                </div>

                <div>
                  {createEmailError && (
                    <p className="text-red-400 text-xs mb-1">
                      {createEmailError}
                    </p>
                  )}
                  <input
                    className={`bg-black/30 border border-gray-700 w-full rounded-xl px-4 py-3.5 text-white placeholder-gray-500 outline-none focus:border-[#DC569D] transition-colors ${
                      createEmailError ? "border-red-500" : ""
                    }`}
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder={t("auth.register.email-placeholder")}
                  />
                </div>

                <div className="relative">
                  {createPasswordError && (
                    <p className="text-red-400 text-xs mb-1">
                      {createPasswordError}
                    </p>
                  )}
                  <input
                    className={`bg-black/30 border border-gray-700 w-full rounded-xl px-4 py-3.5 pr-12 text-white placeholder-gray-500 outline-none focus:border-[#DC569D] transition-colors ${
                      createPasswordError ? "border-red-500" : ""
                    }`}
                    type={showCreatePassword ? "text" : "password"}
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder={t("auth.register.password-placeholder")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showCreatePassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>

                <div className="relative">
                  {createPasswordConfirmError && (
                    <p className="text-red-400 text-xs mb-1">
                      {createPasswordConfirmError}
                    </p>
                  )}
                  <input
                    className={`bg-black/30 border border-gray-700 w-full rounded-xl px-4 py-3.5 pr-12 text-white placeholder-gray-500 outline-none focus:border-[#DC569D] transition-colors ${
                      createPasswordConfirmError ? "border-red-500" : ""
                    }`}
                    type={showCreateConfirmPassword ? "text" : "password"}
                    value={createPasswordConfirm}
                    onChange={(e) => setCreatePasswordConfirm(e.target.value)}
                    placeholder={t("auth.register.confirm-password-placeholder")}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowCreateConfirmPassword(!showCreateConfirmPassword)
                    }
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showCreateConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>

                <div className="flex gap-3 items-start">
                  <input
                    type="checkbox"
                    id="acceptTermsModal"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#DC569D] bg-transparent border-gray-600 rounded focus:ring-[#DC569D] focus:ring-offset-0"
                  />
                  <label
                    htmlFor="acceptTermsModal"
                    className="text-gray-400 text-xs leading-relaxed"
                  >
                    {t("auth.register.accept-terms-prefix")}{" "}
                    <Link
                      to="/terms"
                      target="_blank"
                      className="text-[#DC569D] hover:underline"
                    >
                      {t("auth.register.terms")}
                    </Link>{" "}
                    {t("auth.register.and")}{" "}
                    <Link
                      to="/privacy"
                      target="_blank"
                      className="text-[#DC569D] hover:underline"
                    >
                      {t("auth.register.privacy")}
                    </Link>
                  </label>
                </div>
                {acceptTermsError && (
                  <p className="text-red-400 text-xs">{acceptTermsError}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleRegister()}
                disabled={!acceptTerms || isRegistering}
                className={`w-full py-3.5 rounded-xl font-bold transition-all flex justify-center items-center ${
                  acceptTerms
                    ? "bg-[#DC569D] text-white hover:bg-[#c9458b] shadow-lg shadow-[#DC569D]/10"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isRegistering ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t("auth.register.button")
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#212121] rounded-xl p-8 max-w-md w-full mx-4 border border-gray-600">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {t("auth.reset.title")}
              </h2>
              <p className="text-gray-400 text-sm">
                {t("auth.reset.subtitle")}
              </p>
            </div>

            {!resetSuccess ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    {t("auth.reset.email-label")}
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder={t("auth.reset.email-placeholder")}
                    className={`w-full px-4 py-3 rounded-lg bg-black/30 border ${
                      resetEmailError ? "border-red-500" : "border-gray-600"
                    } text-white placeholder-gray-400 focus:outline-none focus:border-[#DC569D] transition-colors`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleResetPassword();
                    }}
                  />
                  {resetEmailError && (
                    <p className="text-red-400 text-sm mt-2">
                      {resetEmailError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    {t("auth.reset.back")}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={isResetting}
                    className="flex-1 px-4 py-3 rounded-lg bg-[#DC569D] text-white hover:bg-[#c9458b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isResetting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      t("auth.reset.send")
                    )}
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
                  <h3 className="text-white text-xl font-semibold mb-2">
                    {t("auth.reset.success-title")}
                  </h3>
                  <p className="text-gray-300 text-sm">{resetMessage}</p>
                  <p className="text-gray-400 text-xs mt-2">
                    {t("auth.reset.success-subtitle")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full px-4 py-3 rounded-lg bg-[#DC569D] text-white hover:bg-[#c9458b] transition-colors"
                >
                  {t("auth.reset.back")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default AuthModal;
