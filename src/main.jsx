import "./polyfills.js";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { I18nProvider } from "./i18n/i18n-context.jsx";
import { HelmetProvider } from "react-helmet-async";

// LogRocket graba el DOM y la red: pesa y compite con el primer render. Se carga
// cuando el navegador esta ocioso, no en el arranque.
function initLogRocket() {
  import("logrocket")
    .then(({ default: LogRocket }) => LogRocket.init("wlthxj/reelmotion"))
    .catch(() => {});
}

if (typeof requestIdleCallback === "function") {
  requestIdleCallback(initLogRocket, { timeout: 5000 });
} else {
  setTimeout(initLogRocket, 3000);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </HelmetProvider>
  </StrictMode>
);
