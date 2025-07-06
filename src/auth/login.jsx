import { useState } from "react";

function Login() {
  const [typeRecord, setTypeRecord] = useState(1);

  //Login States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  //Create Account States
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createPasswordConfirm, setCreatePasswordConfirm] = useState("");
  const [createName, setCreateName] = useState("");

  async function handleLogin() {
    // Implement login logic here
    console.log("Login with:", {
      email: loginEmail,
      password: loginPassword,
    });
  }

  async function handleRegister() {
    // Implement registration logic here
    console.log("Register with:", {
      name: createName,
      email: createEmail,
      password: createPassword,
      passwordConfirm: createPasswordConfirm,
    });
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
        <div className="relative z-20  flex  h-full">
          <div className="w-1/2 px-16 py-16">
            <img
              src="/logos/logo_reelmotion.webp"
              alt="Logo Reelmotion IA"
              className="w-2/6"
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
              <div className="px-10 pt-14 space-y-2">
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
              <div className="px-10 pt-14 space-y-2">
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
          <div className="w-1/2 h-full flex items-center justify-center">
            {typeRecord == 1 ? (
              <div className="text-left w-full space-y-6 flex flex-col">
                <h1 className="text-white text-2xl montserrat-light">
                  Sign In
                </h1>
                <div className="flex flex-col space-y-5 text-right w-2/5">
                  <input
                    className="bg-white rounded-lg montserrat-light text-sm px-4 py-3 text-[#161619] outline-none focus:ring-0"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Enter email or user name"
                  />
                  <input
                    className="bg-white rounded-lg montserrat-light text-sm px-4 py-3 text-[#161619] outline-none focus:ring-0"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter email or user name"
                  />
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
              <div className="text-left w-full space-y-6 flex flex-col">
                <h1 className="text-white text-2xl montserrat-light">
                  Create Account
                </h1>
                <div className="flex flex-col space-y-5 text-right w-2/5">
                  <input
                    className="bg-white rounded-lg montserrat-light text-sm px-4 py-3 text-[#161619] outline-none focus:ring-0"
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Enter your name"
                  />
                  <input
                    className="bg-white rounded-lg montserrat-light text-sm px-4 py-3 text-[#161619] outline-none focus:ring-0"
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="Enter email or user name"
                  />
                  <input
                    className="bg-white rounded-lg montserrat-light text-sm px-4 py-3 text-[#161619] outline-none focus:ring-0"
                    type="password"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                  <input
                    className="bg-white rounded-lg montserrat-light text-sm px-4 py-3 text-[#161619] outline-none focus:ring-0"
                    type="password"
                    value={createPasswordConfirm}
                    onChange={(e) => setCreatePasswordConfirm(e.target.value)}
                    placeholder="Confirm your password"
                  />
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
