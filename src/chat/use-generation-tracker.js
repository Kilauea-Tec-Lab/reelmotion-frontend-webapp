import { useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { createPusherClient } from "@/pusher";

// Kling/Evolink jobs can retry for a while; keep polling well past the old
// 15-min AI-Lab cap. The job's own terminal timeout still fires a Pusher
// "failed" event, so a stuck card resolves either way.
const MAX_TRACK_MS = 30 * 60 * 1000;

/**
 * Resuelve cuando la pestana vuelve a estar visible.
 *
 * Pusher es la via primaria y su WebSocket sigue vivo en segundo plano, asi que
 * el polling de respaldo no aporta nada mientras nadie mira: solo gasta bateria
 * y peticiones, multiplicado por cada generacion en curso.
 */
function whenVisible() {
  if (!document.hidden) return Promise.resolve();

  return new Promise((resolve) => {
    const onChange = () => {
      if (document.hidden) return;
      document.removeEventListener("visibilitychange", onChange);
      resolve();
    };
    document.addEventListener("visibilitychange", onChange);
  });
}

function buildApiUrl(path) {
  const rawBase = import.meta.env.VITE_APP_BACKEND_URL || "";
  const baseWithoutSlash = rawBase.replace(/\/+$/, "");
  const normalizedBase = baseWithoutSlash.endsWith("/api")
    ? baseWithoutSlash
    : `${baseWithoutSlash}/api`;
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
}

/**
 * Tracks in-flight async image/video generations to a terminal state, so the
 * chat can swap a "Generating…" card for the real result (or show a failure).
 *
 * Delivery is Pusher-first (private-generation-status.{userId}, event
 * "generation-status") with generation-status polling as the fallback and the
 * source of the optional progress %. Idempotent per generation_id — whichever
 * path resolves first wins.
 *
 * @param userId      current user id (for the private Pusher channel)
 * @param pending     [{ generation_id, media_type, ... }] still in flight
 * @param onFinal     (generationId, status, resultUrl, error) — status is
 *                    "completed" | "failed" | "timeout"
 * @param onProgress  (generationId, progress) — 0-100, only when the provider
 *                    reports it
 */
export function useGenerationTracker({ userId, pending, onFinal, onProgress }) {
  const settledRef = useRef(new Set());
  const trackingRef = useRef(new Set());
  const aliveRef = useRef(true);
  const onFinalRef = useRef(onFinal);
  const onProgressRef = useRef(onProgress);

  onFinalRef.current = onFinal;
  onProgressRef.current = onProgress;

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const finalize = (generationId, status, resultUrl, error) => {
    if (!generationId || settledRef.current.has(generationId)) return;
    settledRef.current.add(generationId);
    onFinalRef.current?.(generationId, status, resultUrl, error);
  };

  // Primary delivery: one shared subscription to the user's status channel.
  useEffect(() => {
    if (!userId) return;
    const client = createPusherClient();
    if (!client) return;

    const channelName = `private-generation-status.${userId}`;
    const channel = client.subscribe(channelName);
    const handler = ({ generation_id, status, result_url, error }) => {
      if (status === "completed") {
        finalize(generation_id, "completed", result_url, null);
      } else if (status === "failed") {
        finalize(generation_id, "failed", null, error);
      }
    };
    channel.bind("generation-status", handler);

    return () => {
      channel.unbind("generation-status", handler);
      client.unsubscribe(channelName);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const pollGeneration = async (id) => {
    const started = Date.now();
    // El tiempo con la pestana oculta no cuenta para el timeout: si no, volver
    // despues de un rato marcaria como "timeout" algo que sigue generandose.
    let hiddenMs = 0;
    let delay = 5000; // 5s, ramping to 15s
    while (aliveRef.current && Date.now() - started - hiddenMs < MAX_TRACK_MS) {
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay + 5000, 15000);
      if (!aliveRef.current) return;
      if (settledRef.current.has(id)) return; // Pusher resolved it first

      if (document.hidden) {
        const hiddenAt = Date.now();
        await whenVisible();
        hiddenMs += Date.now() - hiddenAt;
        if (!aliveRef.current) return;
        if (settledRef.current.has(id)) return; // Pusher lo resolvio mientras tanto
      }
      try {
        const res = await fetch(buildApiUrl(`ai/generation-status/${id}`), {
          headers: { Authorization: "Bearer " + Cookies.get("token") },
        });
        if (!res.ok) continue;
        const g = await res.json();
        if (typeof g.progress === "number") {
          onProgressRef.current?.(id, g.progress);
        }
        if (g.status === "completed" && g.result_url) {
          finalize(id, "completed", g.result_url, null);
          return;
        }
        if (g.status === "failed") {
          finalize(id, "failed", null, g.error);
          return;
        }
        // queued | processing → keep polling
      } catch {
        // transient network error → keep polling
      }
    }
    if (aliveRef.current) finalize(id, "timeout", null, null);
  };

  // Fallback delivery + progress: start one poll loop per new generation.
  const ids = (pending || [])
    .map((p) => p.generation_id)
    .filter(Boolean)
    .join(",");
  useEffect(() => {
    (pending || []).forEach((p) => {
      const id = p.generation_id;
      if (!id || settledRef.current.has(id) || trackingRef.current.has(id)) {
        return;
      }
      trackingRef.current.add(id);
      pollGeneration(id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
}
