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
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Modal states
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsConditions, setShowTermsConditions] = useState(false);

  // Error states
  const [usernameError, setUsernameError] = useState(false);
  const [createEmailError, setCreateEmailError] = useState(false);
  const [createPasswordError, setCreatePasswordError] = useState(false);
  const [createPasswordConfirmError, setCreatePasswordConfirmError] =
    useState(false);
  const [createNameError, setCreateNameError] = useState(false);
  const [acceptTermsError, setAcceptTermsError] = useState(false);

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

        window.location.replace("/");
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
    setAcceptTermsError(false);

    // Validate terms acceptance
    if (!acceptTerms) {
      setAcceptTermsError(
        "You must accept the Privacy Policy and Terms & Conditions to create an account"
      );
      return;
    }

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

      window.location.replace("/");
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
                href="/documents/affiliate_program.pdf"
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
                {/* 
                <div className="items-center text-center w-2/5">
                  <span className="text-white montserrat-light text-xs">
                    Or Continue with
                  </span>
                  <div className="flex items-center justify-center space-x-4">
                    \
                  </div>
                </div>
                */}
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

                  {/* Terms and Privacy Policy Checkbox */}
                  <div className="mb-4">
                    <div className="flex gap-3">
                      <input
                        type="checkbox"
                        id="acceptTerms"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-1 w-4 h-4 text-[#F2D543] bg-white border-gray-300 rounded focus:ring-[#F2D543] focus:ring-2"
                      />
                      <label
                        htmlFor="acceptTerms"
                        className="text-white text-sm montserrat-light text-left leading-relaxed"
                      >
                        I accept the{" "}
                        <button
                          type="button"
                          onClick={() => setShowTermsConditions(true)}
                          className="text-[#F2D543] hover:text-[#f2f243] underline transition-colors"
                        >
                          {" "}
                          Terms & Conditions{" "}
                        </button>{" "}
                        and{" "}
                        <button
                          type="button"
                          onClick={() => setShowPrivacyPolicy(true)}
                          className="text-[#F2D543] hover:text-[#f2f243] underline transition-colors"
                        >
                          Privacy Policy
                        </button>{" "}
                      </label>
                    </div>
                    {acceptTermsError && (
                      <p className="text-red-400 text-xs mt-2 text-left">
                        {acceptTermsError}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRegister()}
                    disabled={!acceptTerms}
                    className={`px-6 py-2 rounded-xl font-medium transition-all ${
                      acceptTerms
                        ? "bg-[#F2D543] text-primarioDark hover:bg-[#f2f243]"
                        : "bg-gray-600 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Register
                  </button>
                </div>
                {/* 
                <div className="items-center text-center w-2/5">
                  <span className="text-white montserrat-light text-xs">
                    Or Continue with
                  </span>
                  <div className="flex items-center justify-center space-x-4">
                    \
                  </div>
                </div>*/}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-black text-white rounded-xl p-6 max-w-4xl max-h-[80vh] overflow-y-auto border border-gray-600">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
              <button
                onClick={() => setShowPrivacyPolicy(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="text-white space-y-4 text-sm leading-relaxed">
              <div className="space-y-2">
                <p>
                  <strong>Effective Date:</strong> 12/08/2025
                </p>
                <p>
                  <strong>Last Updated:</strong> 12/08/2025
                </p>
              </div>

              <p>
                Reel Me In Media Limited respects your privacy and is committed
                to protecting your personal data. This Privacy Policy explains
                how we collect, use, store, and share your information when you
                use Reelmotion AI.
              </p>

              <p>
                By using the Platform, you agree to this Privacy Policy. If you
                do not agree, you must stop using the Platform.
              </p>

              <h4 className="font-semibold text-lg">
                1. Information We Collect
              </h4>
              <p>We may collect the following types of information:</p>

              <h5 className="font-medium">1.1 Information You Provide to Us</h5>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  <strong>Account details:</strong> Name, email address,
                  password, payment details.
                </li>
                <li>
                  <strong>Uploaded content:</strong> Media, text, or prompts you
                  provide to generate AI content.
                </li>
                <li>
                  <strong>Communications:</strong> Emails, messages, or feedback
                  you send to us.
                </li>
              </ul>

              <h5 className="font-medium">
                1.2 Information We Collect Automatically
              </h5>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  <strong>Usage data:</strong> IP address, device type, browser,
                  operating system, and interaction logs.
                </li>
                <li>
                  <strong>Cookies & tracking:</strong> We use cookies, analytics
                  tools, and similar technologies to improve services.
                </li>
              </ul>

              <h5 className="font-medium">
                1.3 AI-Generated and Processed Data
              </h5>
              <p>
                Any content you create or upload may be stored temporarily or
                permanently for:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Service delivery</li>
                <li>AI training and improvement</li>
                <li>Security and moderation purposes</li>
              </ul>

              <h4 className="font-semibold text-lg">
                2. How We Use Your Information
              </h4>
              <p>We use your information to:</p>
              <ol className="list-decimal ml-6 space-y-1">
                <li>Provide and operate the Platform.</li>
                <li>Process payments and manage billing.</li>
                <li>Improve and personalise the Platform's features.</li>
                <li>Monitor compliance with our Terms & Conditions.</li>
                <li>Respond to legal requests and prevent fraud or misuse.</li>
                <li>
                  Develop AI technology, including training and refining our
                  algorithms.
                </li>
                <li>
                  Send service-related updates (we will not send marketing
                  emails without your consent).
                </li>
              </ol>

              <h4 className="font-semibold text-lg">
                3. Legal Bases for Processing (GDPR)
              </h4>
              <p>
                If you are in the UK or EU, we process your personal data under
                the following lawful bases:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  <strong>Contractual necessity:</strong> To deliver services
                  you request.
                </li>
                <li>
                  <strong>Legitimate interests:</strong> To improve security,
                  detect misuse, and enhance features.
                </li>
                <li>
                  <strong>Legal obligation:</strong> To comply with applicable
                  laws and regulations.
                </li>
                <li>
                  <strong>Consent:</strong> Where required (e.g., for marketing
                  or optional cookies).
                </li>
              </ul>

              <h4 className="font-semibold text-lg">
                4. Sharing Your Information
              </h4>
              <p>
                We do not sell your personal data. We may share your data with:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  <strong>Service providers:</strong> Payment processors, cloud
                  storage, analytics tools.
                </li>
                <li>
                  <strong>Legal authorities:</strong> Where required by law or
                  court order.
                </li>
                <li>
                  <strong>Business transfers:</strong> In the event of a merger,
                  acquisition, or sale of assets.
                </li>
              </ul>

              <h4 className="font-semibold text-lg">
                5. International Transfers
              </h4>
              <p>
                Because we operate globally, your information may be transferred
                and stored outside your country. Where required, we use Standard
                Contractual Clauses or equivalent safeguards to protect data in
                cross-border transfers.
              </p>

              <h4 className="font-semibold text-lg">6. Data Retention</h4>
              <p>We retain personal data only for as long as necessary to:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Fulfil the purposes outlined in this policy.</li>
                <li>Comply with legal obligations.</li>
                <li>Resolve disputes and enforce agreements.</li>
              </ul>
              <p>
                You may request deletion of your account and data at any time
                (see Section 8).
              </p>

              <h4 className="font-semibold text-lg">7. Security Measures</h4>
              <p>
                We use technical and organisational safeguards to protect your
                data, including:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Encryption of sensitive data in transit and at rest.</li>
                <li>Access controls and authentication.</li>
                <li>Regular system security audits.</li>
              </ul>
              <p>
                However, no system is 100% secure, and we cannot guarantee
                absolute security.
              </p>

              <h4 className="font-semibold text-lg">8. Your Rights</h4>
              <p>Depending on where you live, you may have the right to:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Access the personal data we hold about you.</li>
                <li>Request correction or deletion of your data.</li>
                <li>Object to or restrict processing of your data.</li>
                <li>Withdraw consent at any time.</li>
                <li>Receive your data in a portable format.</li>
              </ul>
              <p>
                To exercise these rights, email us at{" "}
                <strong>support@reelmotion.ai</strong>. We will respond within
                applicable legal timeframes.
              </p>

              <h4 className="font-semibold text-lg">
                9. Cookies and Tracking Technologies
              </h4>
              <p>We use cookies to:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Enable Platform functionality.</li>
                <li>Analyse site usage and performance.</li>
                <li>Customise user experience.</li>
              </ul>
              <p>
                You can control cookies via your browser settings, but disabling
                them may affect functionality.
              </p>

              <h4 className="font-semibold text-lg">10. Children's Privacy</h4>
              <p>
                The Platform is not intended for children under 13. If we become
                aware that we have collected personal data from a child under 13
                without parental consent, we will delete it promptly.
              </p>

              <h4 className="font-semibold text-lg">
                11. Changes to This Privacy Policy
              </h4>
              <p>
                We may update this Privacy Policy from time to time. Changes
                will be posted on the Platform, and the "Last Updated" date will
                be revised.
              </p>

              <h4 className="font-semibold text-lg">12. Contact Information</h4>
              <p>For privacy-related questions, contact us:</p>
              <ul className="list-none space-y-1">
                <li>
                  📧 <strong>support@reelmotion.ai</strong>
                </li>
                <li>
                  📍{" "}
                  <strong>
                    Reel Me In Media Limited, London, United Kingdom
                  </strong>
                </li>
              </ul>

              <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-300">
                  This Privacy Policy is designed to cover your global
                  operations while making sure you comply with:
                </p>
                <ul className="list-disc ml-6 mt-2 text-sm text-gray-300 space-y-1">
                  <li>UK GDPR</li>
                  <li>EU GDPR</li>
                  <li>California Consumer Privacy Act (CCPA)</li>
                  <li>
                    Global best practices for AI-generated content handling
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms and Conditions Modal */}
      {showTermsConditions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-black text-white rounded-xl p-6 max-w-4xl max-h-[80vh] overflow-y-auto border border-gray-600">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">
                Terms and Conditions
              </h2>
              <button
                onClick={() => setShowTermsConditions(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="text-white space-y-4 text-sm leading-relaxed">
              <div className="space-y-2">
                <p>
                  <strong>Effective Date:</strong> 12/08/2025
                </p>
                <p>
                  <strong>Last Updated:</strong> 12/08/2025
                </p>
              </div>

              <p>
                These Terms and Conditions constitute a legally binding
                agreement between you (the "User") and{" "}
                <strong>Reel Me In Media Limited</strong>, registered in London,
                United Kingdom, trading as
                <strong> Reelmotion AI</strong>, governing your access to and
                use of the Reelmotion AI platform, website, applications, and
                related services ("Reelmotion AI").
              </p>

              <p>
                By using our Platform, you agree to these Terms. If you do not
                agree, you must stop using the Platform immediately.
              </p>

              <h4 className="font-semibold text-lg">1. Definitions</h4>
              <p>For the purposes of these Terms:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  <strong>"Content"</strong> means any data, images, video,
                  audio, text, graphics, code, or other materials uploaded,
                  generated, or transmitted via the Platform.
                </li>
                <li>
                  <strong>"AI Output"</strong> refers to any video, image, or
                  media generated by the Platform's artificial intelligence
                  tools based on your inputs or prompts.
                </li>
                <li>
                  <strong>"User Content"</strong> means all Content provided by
                  you, including media you upload for processing.
                </li>
                <li>
                  <strong>"Prohibited Content"</strong> means material that
                  violates these Terms or applicable laws, including but not
                  limited to: nudity, sexual material, hate speech,
                  discriminatory content, harassment, extreme violence,
                  incitement, misinformation, and unlawful impersonation.
                </li>
              </ul>

              <h4 className="font-semibold text-lg">2. Eligibility</h4>
              <p>You must:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  Be at least 13 years old. If under the age of majority in your
                  jurisdiction, you must have parental/guardian consent.
                </li>
                <li>
                  Have the legal capacity to enter into binding contracts.
                </li>
                <li>
                  Not be located in a country or territory subject to UK, US, or
                  EU sanctions.
                </li>
              </ul>

              <h4 className="font-semibold text-lg">
                3. User Responsibilities
              </h4>
              <p>When using the Platform, you agree to:</p>
              <ol className="list-decimal ml-6 space-y-1">
                <li>
                  Provide accurate account information and keep it updated.
                </li>
                <li>Comply with all applicable laws in your jurisdiction.</li>
                <li>
                  Not misuse the Platform, including:
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Uploading, creating, or sharing Prohibited Content.</li>
                    <li>
                      Using the Platform to create misleading or harmful AI
                      deepfakes or to impersonate individuals without consent.
                    </li>
                    <li>
                      Uploading content you do not own or have rights to use.
                    </li>
                    <li>
                      Attempting to reverse-engineer, hack, or disrupt the
                      Platform's functionality.
                    </li>
                  </ul>
                </li>
              </ol>
              <p>
                We reserve the right to suspend or terminate your account if we
                believe you have breached these Terms.
              </p>

              <h4 className="font-semibold text-lg">4. Content Standards</h4>
              <p>You must not submit, generate, or distribute content that:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Contains nudity, sexual acts, or pornographic material.</li>
                <li>Depicts extreme violence or gore.</li>
                <li>
                  Promotes hate speech, racism, sexism, or other discriminatory
                  ideologies.
                </li>
                <li>Harasses, bullies, or threatens others.</li>
                <li>
                  Violates intellectual property rights, including copyrighted
                  or trademarked works, without permission.
                </li>
                <li>
                  Uses real individuals' faces, voices, or likenesses without
                  consent, especially in a false, defamatory, or incriminating
                  manner.
                </li>
              </ul>

              <h4 className="font-semibold text-lg">
                5. User Content & AI Output Licensing
              </h4>
              <p>By using the Platform, you:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Retain ownership of your User Content and AI Output.</li>
                <li>
                  Grant us a non-exclusive, worldwide, royalty-free, perpetual
                  license to:
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>
                      Store and process your content for service delivery.
                    </li>
                    <li>
                      Use your content for internal research, AI model
                      improvement, and quality assurance.
                    </li>
                    <li>
                      Display your content as marketing examples for the
                      Platform (unless you opt-out via written notice).
                    </li>
                  </ul>
                </li>
                <li>
                  Acknowledge that we may disclose content to law enforcement or
                  government authorities if required by law.
                </li>
              </ul>

              <h4 className="font-semibold text-lg">6. Payments & Refunds</h4>
              <ul className="list-disc ml-6 space-y-1">
                <li>The Platform is provided on a pay-per-use basis.</li>
                <li>
                  All payments are final and non-refundable, except where
                  required by law.
                </li>
                <li>
                  You are responsible for any applicable taxes, duties, and
                  charges.
                </li>
                <li>
                  We reserve the right to change pricing at any time, with
                  changes applying to future transactions.
                </li>
              </ul>

              <h4 className="font-semibold text-lg">
                7. Intellectual Property Rights
              </h4>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  All software, algorithms, trademarks, branding, and platform
                  designs are the exclusive property of Reel Me In Media
                  Limited.
                </li>
                <li>
                  You may not copy, distribute, modify, or create derivative
                  works from our intellectual property without prior written
                  permission.
                </li>
              </ul>

              <h4 className="font-semibold text-lg">
                8. Service Availability & Disclaimers
              </h4>
              <ul className="list-disc ml-6 space-y-1">
                <li>The Platform is provided "as is" and "as available".</li>
                <li>
                  We make no warranties about uninterrupted operation,
                  error-free functionality, or that results will meet your
                  expectations.
                </li>
                <li>
                  AI-generated content is produced algorithmically and may
                  contain inaccuracies or unintended results. You are solely
                  responsible for reviewing and ensuring the legality of outputs
                  before use.
                </li>
              </ul>

              <h4 className="font-semibold text-lg">
                9. Limitation of Liability
              </h4>
              <p>To the fullest extent permitted by law:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  We are not liable for indirect, incidental, special, or
                  consequential damages.
                </li>
                <li>
                  Our total liability in any claim is limited to the total
                  amount you paid for Platform access in the preceding three (3)
                  months.
                </li>
              </ul>

              <h4 className="font-semibold text-lg">10. Termination</h4>
              <p>
                We may suspend or terminate your account at any time if you:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Breach these Terms.</li>
                <li>Use the Platform for unlawful purposes.</li>
                <li>
                  Engage in conduct that could harm us, our users, or third
                  parties.
                </li>
              </ul>

              <h4 className="font-semibold text-lg">11. Dispute Resolution</h4>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  Disputes shall be resolved exclusively through binding
                  arbitration in London, United Kingdom.
                </li>
                <li>
                  Arbitration will be conducted in English under the rules of
                  the London Court of International Arbitration (LCIA).
                </li>
                <li>
                  You waive the right to participate in class actions or
                  consolidated proceedings.
                </li>
              </ul>

              <h4 className="font-semibold text-lg">12. Governing Law</h4>
              <p>
                These Terms shall be governed by and construed in accordance
                with the laws of England and Wales, without regard to
                conflict-of-law principles.
              </p>

              <h4 className="font-semibold text-lg">13. Changes to Terms</h4>
              <p>
                We may amend these Terms at any time by posting an updated
                version on our Platform. Continued use of the Platform after
                changes take effect constitutes acceptance of the updated Terms.
              </p>

              <h4 className="font-semibold text-lg">14. Contact Information</h4>
              <p>If you have questions about these Terms, contact us:</p>
              <ul className="list-none space-y-1">
                <li>
                  📧 <strong>support@reelmotion.ai</strong>
                </li>
                <li>
                  📍{" "}
                  <strong>
                    Reel Me In Media Limited, London, United Kingdom
                  </strong>
                </li>
              </ul>

              <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
                <p className="text-center font-medium text-gray-300">
                  By using Reelmotion AI, you acknowledge that you have read,
                  understood, and agree to be bound by these Terms and
                  Conditions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
