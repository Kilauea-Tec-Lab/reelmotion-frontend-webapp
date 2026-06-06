import React, { useEffect, useState } from "react";
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
  const label = isEs ? "Abrir app" : "Open app";
  const href = STORE_LINKS[platform];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-semibold text-white backdrop-blur-md transition-all duration-200 hover:bg-white/15 active:scale-95"
      style={{
        background: "rgba(40,40,40,0.75)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
      }}
    >
      <span
        className="w-2.5 h-2.5 rounded-full animate-bounce"
        style={{
          background: "#DC569D",
          boxShadow: "0 0 8px 2px rgba(220,86,157,0.7)",
        }}
      />
      <span>{label}</span>
    </a>
  );
};

export default DownloadAppButton;
