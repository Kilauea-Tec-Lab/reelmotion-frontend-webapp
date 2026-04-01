import "./polyfills.js";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { I18nProvider } from "./i18n/i18n-context.jsx";
import { HelmetProvider } from "react-helmet-async";
import LogRocket from "logrocket";

LogRocket.init("wlthxj/reelmotion");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </HelmetProvider>
  </StrictMode>
);
