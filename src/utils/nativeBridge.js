/**
 * Puente web <-> app nativa (Flutter InAppWebView).
 *
 * En un navegador normal `window.flutter_inappwebview` no existe, por lo que
 * todas estas funciones son no-ops seguras. Solo hacen algo cuando la web
 * corre dentro del WebView de la app.
 */

/** true si la web está corriendo dentro del WebView de la app nativa */
export function isNativeApp() {
  return typeof window !== "undefined" && !!window.flutter_inappwebview;
}

/**
 * Avisa a la app nativa que debe cerrar sesión y volver al login nativo.
 *
 * El nombre del handler ('logout') debe coincidir EXACTAMENTE con el
 * registrado en la app. No lo cambies.
 *
 * @param {string} reason - Motivo del logout ('user', 'session_revoked', ...).
 *   Solo se usa para logs/diagnóstico; la app cierra sesión con cualquier valor.
 */
export function notifyAppLogout(reason = "web") {
  if (isNativeApp()) {
    try {
      window.flutter_inappwebview.callHandler("logout", { reason });
    } catch (error) {
      console.error("notifyAppLogout failed:", error);
    }
  }
}
