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
                          onClick={() => setShowPrivacyPolicy(true)}
                          className="text-[#F2D543] hover:text-[#f2f243] underline transition-colors"
                        >
                          Privacy Policy
                        </button>{" "}
                        and{" "}
                        <button
                          type="button"
                          onClick={() => setShowTermsConditions(true)}
                          className="text-[#F2D543] hover:text-[#f2f243] underline transition-colors"
                        >
                          Terms & Conditions
                        </button>
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

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Privacy Policy
              </h2>
              <button
                onClick={() => setShowPrivacyPolicy(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <h3 className="font-bold text-lg">
                Privacy Policy for ReelMotion
              </h3>
              <p>
                <strong>Effective Date:</strong> [Insert Date]
              </p>

              <h4 className="font-semibold">1. Introduction</h4>
              <p>
                Welcome to ReelMotion, an AI-powered video creation platform. We
                are committed to protecting your privacy and personal
                information. This Privacy Policy explains how we collect, use,
                disclose, and safeguard your information when you use our
                website and services.
              </p>

              <h4 className="font-semibold">2. Information We Collect</h4>
              <h5 className="font-medium">Personal Information:</h5>
              <ul className="list-disc ml-6">
                <li>
                  Name and contact information (email address, phone number)
                </li>
                <li>Account credentials (username, password)</li>
                <li>
                  Payment information (processed through secure third-party
                  providers)
                </li>
                <li>Profile information and preferences</li>
              </ul>

              <h5 className="font-medium">Usage Data:</h5>
              <ul className="list-disc ml-6">
                <li>Videos created, uploaded, and shared on our platform</li>
                <li>Usage patterns and interactions with our services</li>
                <li>Device information and technical data</li>
                <li>Cookies and tracking technologies</li>
              </ul>

              <h4 className="font-semibold">3. How We Use Your Information</h4>
              <ul className="list-disc ml-6">
                <li>To provide and maintain our video creation services</li>
                <li>To process your transactions and manage your account</li>
                <li>To improve our AI algorithms and platform functionality</li>
                <li>
                  To communicate with you about your account and our services
                </li>
                <li>
                  To provide customer support and respond to your inquiries
                </li>
                <li>
                  To send you marketing communications (with your consent)
                </li>
                <li>To comply with legal obligations and protect our rights</li>
              </ul>

              <h4 className="font-semibold">
                4. Information Sharing and Disclosure
              </h4>
              <p>
                We do not sell, trade, or rent your personal information to
                third parties. We may share your information in the following
                circumstances:
              </p>
              <ul className="list-disc ml-6">
                <li>
                  <strong>Service Providers:</strong> With trusted third-party
                  providers who assist us in operating our platform
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law or
                  to protect our rights and safety
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with a
                  merger, acquisition, or sale of assets
                </li>
                <li>
                  <strong>With Your Consent:</strong> When you explicitly agree
                  to share your information
                </li>
              </ul>

              <h4 className="font-semibold">5. Data Security</h4>
              <p>
                We implement appropriate technical and organizational security
                measures to protect your personal information against
                unauthorized access, alteration, disclosure, or destruction.
                However, no method of transmission over the internet is 100%
                secure.
              </p>

              <h4 className="font-semibold">6. Your Rights and Choices</h4>
              <ul className="list-disc ml-6">
                <li>
                  <strong>Access:</strong> Request access to your personal
                  information
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate
                  information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal
                  information
                </li>
                <li>
                  <strong>Portability:</strong> Request a copy of your data in a
                  portable format
                </li>
                <li>
                  <strong>Opt-out:</strong> Unsubscribe from marketing
                  communications
                </li>
              </ul>

              <h4 className="font-semibold">
                7. Cookies and Tracking Technologies
              </h4>
              <p>
                We use cookies and similar technologies to enhance your
                experience, analyze usage patterns, and provide personalized
                content. You can control cookie settings through your browser
                preferences.
              </p>

              <h4 className="font-semibold">8. Children's Privacy</h4>
              <p>
                Our services are not intended for children under 13 years of
                age. We do not knowingly collect personal information from
                children under 13. If we become aware that we have collected
                such information, we will take steps to delete it.
              </p>

              <h4 className="font-semibold">9. International Data Transfers</h4>
              <p>
                Your information may be transferred to and processed in
                countries other than your own. We ensure appropriate safeguards
                are in place to protect your information during such transfers.
              </p>

              <h4 className="font-semibold">
                10. Changes to This Privacy Policy
              </h4>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of any material changes by posting the new policy on
                our website and updating the effective date.
              </p>

              <h4 className="font-semibold">11. Contact Us</h4>
              <p>
                If you have any questions about this Privacy Policy or our
                privacy practices, please contact us at:
              </p>
              <ul className="list-none">
                <li>Email: privacy@reelmotion.com</li>
                <li>Address: [Insert Company Address]</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Terms and Conditions Modal */}
      {showTermsConditions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Terms and Conditions
              </h2>
              <button
                onClick={() => setShowTermsConditions(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <h3 className="font-bold text-lg">
                Terms and Conditions for ReelMotion
              </h3>
              <p>
                <strong>Effective Date:</strong> [Insert Date]
              </p>

              <h4 className="font-semibold">1. Acceptance of Terms</h4>
              <p>
                By accessing and using ReelMotion ("we," "our," or "us"), you
                accept and agree to be bound by the terms and provision of this
                agreement. If you do not agree to abide by the above, please do
                not use this service.
              </p>

              <h4 className="font-semibold">2. Description of Service</h4>
              <p>
                ReelMotion is an AI-powered video creation platform that allows
                users to create, edit, and share videos using artificial
                intelligence technology. Our services include but are not
                limited to video generation, editing tools, character creation,
                and social sharing features.
              </p>

              <h4 className="font-semibold">3. User Accounts</h4>
              <ul className="list-disc ml-6">
                <li>
                  You must create an account to access certain features of our
                  service
                </li>
                <li>
                  You are responsible for maintaining the confidentiality of
                  your account credentials
                </li>
                <li>
                  You agree to provide accurate and complete information when
                  creating your account
                </li>
                <li>
                  You are responsible for all activities that occur under your
                  account
                </li>
                <li>
                  You must notify us immediately of any unauthorized use of your
                  account
                </li>
              </ul>

              <h4 className="font-semibold">4. Acceptable Use Policy</h4>
              <p>You agree not to use the service to:</p>
              <ul className="list-disc ml-6">
                <li>
                  Create content that is illegal, harmful, threatening, abusive,
                  harassing, defamatory, vulgar, obscene, or invasive of privacy
                </li>
                <li>
                  Infringe upon the intellectual property rights of others
                </li>
                <li>
                  Upload, post, or transmit any content that contains viruses or
                  malicious code
                </li>
                <li>
                  Impersonate any person or entity or misrepresent your
                  affiliation
                </li>
                <li>
                  Engage in any activity that disrupts or interferes with our
                  services
                </li>
                <li>
                  Use our platform for commercial purposes without our written
                  consent
                </li>
                <li>
                  Create deepfakes or misleading content intended to deceive
                </li>
              </ul>

              <h4 className="font-semibold">5. Content Ownership and Rights</h4>
              <ul className="list-disc ml-6">
                <li>
                  <strong>Your Content:</strong> You retain ownership of the
                  original content you create using our platform
                </li>
                <li>
                  <strong>License to Us:</strong> By using our service, you
                  grant us a non-exclusive, worldwide, royalty-free license to
                  use, display, and distribute your content as necessary to
                  provide our services
                </li>
                <li>
                  <strong>AI-Generated Content:</strong> Content generated by
                  our AI algorithms may be subject to additional terms and
                  limitations
                </li>
                <li>
                  <strong>Third-Party Content:</strong> You must respect the
                  intellectual property rights of third parties when creating
                  content
                </li>
              </ul>

              <h4 className="font-semibold">
                6. Subscription and Payment Terms
              </h4>
              <ul className="list-disc ml-6">
                <li>Certain features require a paid subscription</li>
                <li>
                  Subscription fees are billed in advance and are non-refundable
                </li>
                <li>
                  You authorize us to charge your payment method for all
                  applicable fees
                </li>
                <li>
                  We reserve the right to change our pricing with 30 days'
                  notice
                </li>
                <li>
                  You may cancel your subscription at any time, but fees are
                  non-refundable
                </li>
              </ul>

              <h4 className="font-semibold">7. Privacy and Data Protection</h4>
              <p>
                Your privacy is important to us. Please review our Privacy
                Policy, which also governs your use of the service, to
                understand our practices.
              </p>

              <h4 className="font-semibold">8. Intellectual Property Rights</h4>
              <ul className="list-disc ml-6">
                <li>
                  ReelMotion and its original content are protected by
                  copyright, trademark, and other laws
                </li>
                <li>
                  Our AI algorithms, software, and platform design are our
                  proprietary technology
                </li>
                <li>
                  You may not reverse engineer, decompile, or attempt to extract
                  our source code
                </li>
                <li>
                  All trademarks and service marks are the property of their
                  respective owners
                </li>
              </ul>

              <h4 className="font-semibold">
                9. Disclaimers and Limitation of Liability
              </h4>
              <ul className="list-disc ml-6">
                <li>
                  <strong>Service Availability:</strong> We do not guarantee
                  uninterrupted access to our services
                </li>
                <li>
                  <strong>Content Accuracy:</strong> AI-generated content may
                  contain errors or inaccuracies
                </li>
                <li>
                  <strong>Limitation of Liability:</strong> Our liability is
                  limited to the amount you paid for the service in the
                  preceding 12 months
                </li>
                <li>
                  <strong>No Warranties:</strong> Our service is provided "as
                  is" without warranties of any kind
                </li>
              </ul>

              <h4 className="font-semibold">10. Indemnification</h4>
              <p>
                You agree to indemnify and hold harmless ReelMotion, its
                affiliates, officers, directors, employees, and agents from any
                claims, damages, losses, or expenses arising from your use of
                our service or violation of these terms.
              </p>

              <h4 className="font-semibold">11. Termination</h4>
              <ul className="list-disc ml-6">
                <li>Either party may terminate this agreement at any time</li>
                <li>
                  We may suspend or terminate your account for violation of
                  these terms
                </li>
                <li>
                  Upon termination, your right to use the service ceases
                  immediately
                </li>
                <li>
                  We may retain certain information as required by law or for
                  legitimate business purposes
                </li>
              </ul>

              <h4 className="font-semibold">
                12. Governing Law and Dispute Resolution
              </h4>
              <p>
                These terms are governed by the laws of [Insert Jurisdiction].
                Any disputes will be resolved through binding arbitration in
                accordance with the rules of [Insert Arbitration Organization].
              </p>

              <h4 className="font-semibold">13. Changes to Terms</h4>
              <p>
                We reserve the right to modify these terms at any time. We will
                notify you of material changes by posting the updated terms on
                our website. Your continued use of the service constitutes
                acceptance of the modified terms.
              </p>

              <h4 className="font-semibold">14. Severability</h4>
              <p>
                If any provision of these terms is found to be unenforceable,
                the remaining provisions will continue to be valid and
                enforceable.
              </p>

              <h4 className="font-semibold">15. Contact Information</h4>
              <p>
                If you have any questions about these Terms and Conditions,
                please contact us at:
              </p>
              <ul className="list-none">
                <li>Email: legal@reelmotion.com</li>
                <li>Address: [Insert Company Address]</li>
              </ul>

              <p className="mt-6 text-center font-medium">
                By using ReelMotion, you acknowledge that you have read,
                understood, and agree to be bound by these Terms and Conditions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
