import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useI18n } from "../../i18n/i18n-context";

const STORE_LINKS = {
  windows:
    "https://apps.microsoft.com/detail/9plhs353n3kc?hl=es-ES&gl=UY",
  android:
    "https://play.google.com/store/apps/details?id=ai.reelmotion.app",
};

// Detect the user's platform from the user agent.
// Returns "windows", "android", or null when there is no matching app.
function detectPlatform() {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  // Exclude Windows Phone (covered by other stores) — only desktop Windows.
  if (/Windows NT/i.test(ua) && !/Windows Phone/i.test(ua)) return "windows";
  return null;
}

const DownloadAppButton = () => {
  const { locale } = useI18n();
  const [platform, setPlatform] = useState(null);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  // Hide the button when there is no app for the current platform.
  if (!platform) return null;

  const isEs = locale === "es";
  const label = isEs ? "Descargar app" : "Download app";
  const href = STORE_LINKS[platform];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105"
      style={{
        background: "#DC569D",
        boxShadow: "0 8px 24px rgba(220,86,157,0.4)",
      }}
    >
      <Download size={18} />
      <span>{label}</span>
    </a>
  );
};

export default DownloadAppButton;
