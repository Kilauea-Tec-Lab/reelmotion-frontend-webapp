import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAccount, login } from "./functions";
import Cookies from "js-cookie";

function Login() {
  const navigate = useNavigate();
  const [typeRecord, setTypeRecord] = useState(1);

  //Login States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Login Error states
  const [loginEmailError, setLoginEmailError] = useState(false);
  const [loginPasswordError, setLoginPasswordError] = useState(false);

  //Create Account States
  const [username, setUsername] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createPasswordConfirm, setCreatePasswordConfirm] = useState("");
  const [createName, setCreateName] = useState("");

  // Error states
  const [usernameError, setUsernameError] = useState(false);
  const [createEmailError, setCreateEmailError] = useState(false);
  const [createPasswordError, setCreatePasswordError] = useState(false);
  const [createPasswordConfirmError, setCreatePasswordConfirmError] =
    useState(false);
  const [createNameError, setCreateNameError] = useState(false);

  async function handleLogin() {
    // Reset error states
    setLoginEmailError(false);
    setLoginPasswordError(false);

    try {
      if (!loginEmail || !loginPassword) {
        if (!loginEmail) setLoginEmailError("Email is required");
        if (!loginPassword) setLoginPasswordError("Password is required");
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

        navigate("/", { replace: true });
      } else {
        const errorData = await loginCall.json();

        if (errorData.success == false) {
          setLoginEmailError("The email or username is incorrect");
        }
      }
    } catch (error) {}
  }

  async function handleRegister() {
    setUsernameError(false);
    setCreateEmailError(false);
    setCreatePasswordError(false);
    setCreatePasswordConfirmError(false);
    setCreateNameError(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createEmail)) {
      setCreateEmailError("Please enter a valid email address");
      return;
    }

    // Validate passwords
    if (createPassword == "" || createPasswordConfirm == "") {
      setCreatePasswordError("Password fields cannot be empty");
      setCreatePasswordConfirmError("Password fields cannot be empty");
      return;
    }

    if (createPassword !== createPasswordConfirm) {
      setCreatePasswordError("Passwords do not match");
      setCreatePasswordConfirmError("Passwords do not match");
      return;
    }

    const register = await createAccount({
      username: username,
      name: createName,
      email: createEmail.toLowerCase(),
      password: createPassword,
      passwordConfirm: createPasswordConfirm,
    });

    if (register.ok) {
      const loginResponse = await register.json();
      const token = loginResponse.data.token;

      Cookies.set("token", token);

      navigate("/", { replace: true });
    } else {
      const errorData = await register.json();

      // Handle validation errors
      if (errorData.errors) {
        if (errorData.errors.username) {
          setUsernameError(errorData.errors.username[0]);
        }
        if (errorData.errors.name) {
          setCreateNameError(errorData.errors.name[0]);
        }
        if (errorData.errors.email) {
          setCreateEmailError(errorData.errors.email[0]);
        }
        if (errorData.errors.password) {
          setCreatePasswordError(errorData.errors.password[0]);
        }
      }
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/bg_loop.mp4" type="video/mp4" />
      </video>
      {/* Capa difuminada en negro al 50% sobre el video */}
      <div className="absolute top-0 left-0 w-full h-full bg-[#00000080] z-10">
        <div className="relative z-20  sm:flex  h-full">
          <div className="sm:w-1/2 sm:px-6 sm:py-6 px-4 py-4 text-right">
            <img
              src="/logos/logo_reelmotion_new.png"
              alt="Logo Reelmotion IA"
              className="w-96"
            />
            <div className="px-10 pt-20 space-y-6">
              <h1 className="text-white text-4xl font-semibold tracking-wide montserrat-semibold">
                Sign in to a new era
              </h1>
              <h2 className="text-white text-2xl font-normal tracking-wider montserrat-regular">
                Create what you imagine
              </h2>
            </div>
            {typeRecord == 1 ? (
              <div className="px-10 pt-10 space-y-2">
                <h3 className="text-white montserrat-light tracking-wider text-sm">
                  If you don't have an account
                </h3>
                <span className="text-white montserrat-light tracking-wider text-sm">
                  you can &nbsp;
                </span>
                <button
                  type="button"
                  className="montserrat-light tracking-wider text-sm text-[#F2D543] hover:text-[#ffe969]"
                  onClick={() => setTypeRecord(2)}
                >
                  Register here!
                </button>
              </div>
            ) : (
              <div className="px-10 pt-10 space-y-2">
                <h3 className="text-white montserrat-light tracking-wider text-sm">
                  If you have an account
                </h3>
                <span className="text-white montserrat-light tracking-wider text-sm">
                  you can &nbsp;
                </span>
                <button
                  type="button"
                  className="montserrat-light tracking-wider text-sm text-[#F2D543] hover:text-[#ffe969]"
                  onClick={() => setTypeRecord(1)}
                >
                  Login Here!
                </button>
              </div>
            )}
          </div>
          <div className="sm:w-1/2 h-full justify-center">
            <div class="w-full flex justify-end gap-4 px-6 py-12">
              <a
                href="https://www.reelmeinmedia.com/"
                target="_blank"
                className="bg-primarioLogo px-4 pb-1 rounded-xl font-medium hover:bg-primarioLogo text-white"
              >
                Reel Me In Media
              </a>
              <a
                href="#"
                target="_blank"
                className="bg-primarioLogo px-4 pb-1 rounded-xl font-medium hover:bg-primarioLogo text-white"
              >
                Affiliate Program
              </a>
            </div>
            {typeRecord == 1 ? (
              <div className="text-left w-full space-y-6 flex flex-col justify-center mt-20">
                <h1 className="text-white text-2xl montserrat-light">
                  Sign In
                </h1>
                <div className="flex flex-col space-y-5 text-right w-2/5">
                  <div>
                    {loginEmailError && (
                      <p className="text-red-400 text-sm mb-1 text-left">
                        {loginEmailError}
                      </p>
                    )}
                    <input
                      className={`bg-white w-full rounded-lg montserrat-light text-sm px-4 py-3 text-[#161619] outline-none focus:ring-0 ${
                        loginEmailError ? "border-2 border-red-500" : ""
                      }`}
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="Enter email or user name"
                    />
                  </div>
                  <div>
                    <input
                      className={`bg-white w-full rounded-lg montserrat-light text-sm px-4 py-3 text-[#161619] outline-none focus:ring-0 ${
                        loginEmailError ? "border-2 border-red-500" : ""
                      }`}
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleLogin();
                      }}
                    />
                  </div>
                  <span className="text-white montserrat-light text-xs">
                    Forgot you password?
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLogin()}
                    className="bg-[#F2D543] text-primarioDark px-6 py-2 rounded-xl font-medium hover:bg-[#f2f243]"
                  >
                    Login
                  </button>
                </div>
                <div className="items-center text-center w-2/5">
                  <span className="text-white montserrat-light text-xs">
                    Or Continue with
                  </span>
                  <div className="flex items-center justify-center space-x-4">
                    \
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-left w-full space-y-6 flex flex-col justify-center mt-18">
                <h1 className="text-white text-2xl montserrat-light">
                  Create Account
                </h1>
                <div className="flex flex-col space-y-5 text-right w-2/5">
                  <div>
                    {usernameError && (
                      <p className="text-red-400 text-sm mb-1 text-left">
                        {usernameError}
                      </p>
                    )}
                    <input
                      className={`bg-white w-full rounded-lg montserrat-light text-sm px-4 py-3 text-[#161619] outline-none focus:ring-0 ${
                        usernameError ? "border-2 border-red-500" : ""
                      }`}
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                    />
                  </div>
                  <div>
                    {createNameError && (
                      <p className="text-red-400 text-sm mb-1 text-left">
                        {createNameError}
                      </p>
                    )}
                    <input
                      className={`bg-white w-full rounded-lg montserrat-light text-sm px-4 py-3 text-[#161619] outline-none focus:ring-0 ${
                        createNameError ? "border-2 border-red-500" : ""
                      }`}
                      type="text"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    {createEmailError && (
                      <p className="text-red-400 text-sm mb-1 text-left">
                        {createEmailError}
                      </p>
                    )}
                    <input
                      className={`bg-white w-full rounded-lg montserrat-light text-sm px-4 py-3 text-[#161619] outline-none focus:ring-0 ${
                        createEmailError ? "border-2 border-red-500" : ""
                      }`}
                      type="email"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    {createPasswordError && (
                      <p className="text-red-400 text-sm mb-1 text-left">
                        {createPasswordError}
                      </p>
                    )}
                    <input
                      className={`bg-white w-full rounded-lg montserrat-light text-sm px-4 py-3 text-[#161619] outline-none focus:ring-0 ${
                        createPasswordError ? "border-2 border-red-500" : ""
                      }`}
                      type="password"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </div>
                  <div>
                    {createPasswordConfirmError && (
                      <p className="text-red-400 text-xs mb-1 text-left">
                        {createPasswordConfirmError}
                      </p>
                    )}
                    <input
                      className={`bg-white rounded-lg w-full montserrat-light text-sm px-4 py-3 text-[#161619] outline-none focus:ring-0 ${
                        createPasswordConfirmError
                          ? "border-2 border-red-500"
                          : ""
                      }`}
                      type="password"
                      value={createPasswordConfirm}
                      onChange={(e) => setCreatePasswordConfirm(e.target.value)}
                      placeholder="Confirm your password"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRegister()}
                    className="bg-[#F2D543] text-primarioDark px-6 py-2 rounded-xl font-medium hover:bg-[#f2f243]"
                  >
                    Register
                  </button>
                </div>
                <div className="items-center text-center w-2/5">
                  <span className="text-white montserrat-light text-xs">
                    Or Continue with
                  </span>
                  <div className="flex items-center justify-center space-x-4">
                    \
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
