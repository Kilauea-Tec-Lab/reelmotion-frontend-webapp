import { useEffect, useRef, useState } from "react";

/**
 * Hook para manejar la reproducción optimizada de videos
 * Solo permite que un número limitado de videos se reproduzcan simultáneamente
 */
export function useVideoPlaybackManager() {
  const playingVideos = useRef(new Set());
  const maxSimultaneousVideos = useRef(3); // Máximo 3 videos reproduciéndose al mismo tiempo

  const registerVideo = (videoId, videoElement) => {
    // Si ya hay demasiados videos reproduciéndose, pausar los más antiguos
    if (playingVideos.current.size >= maxSimultaneousVideos.current) {
      const firstVideo = playingVideos.current.values().next().value;
      if (firstVideo && firstVideo.element) {
        firstVideo.element.pause();
        playingVideos.current.delete(firstVideo);
      }
    }

    // Agregar el nuevo video a la lista
    playingVideos.current.add({ id: videoId, element: videoElement });
  };

  const unregisterVideo = (videoId) => {
    // Encontrar y remover el video de la lista
    for (const video of playingVideos.current) {
      if (video.id === videoId) {
        playingVideos.current.delete(video);
        break;
      }
    }
  };

  const pauseAllExcept = (videoId) => {
    for (const video of playingVideos.current) {
      if (video.id !== videoId && video.element) {
        video.element.pause();
      }
    }
  };

  return {
    registerVideo,
    unregisterVideo,
    pauseAllExcept,
    getPlayingCount: () => playingVideos.current.size,
  };
}

/**
 * Context para compartir el manager de videos entre componentes
 */
import { createContext, useContext } from "react";

const VideoManagerContext = createContext(null);

export function VideoManagerProvider({ children }) {
  const videoManager = useVideoPlaybackManager();

  return (
    <VideoManagerContext.Provider value={videoManager}>
      {children}
    </VideoManagerContext.Provider>
  );
}

export function useVideoManager() {
  const context = useContext(VideoManagerContext);
  if (!context) {
    throw new Error(
      "useVideoManager must be used within a VideoManagerProvider"
    );
  }
  return context;
}
