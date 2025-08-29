import { useState, useRef, useEffect } from "react";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";

/**
 * Componente de video optimizado con lazy loading y control de reproducción inteligente
 */
function OptimizedVideo({
  src,
  className = "",
  onLoadedMetadata,
  onError,
  isHovered = false,
  autoPlay = true,
  ...props
}) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  // Intersection Observer para detectar visibilidad
  const [containerRef, isIntersecting] = useIntersectionObserver({
    threshold: 0.3, // 30% visible para considerar que está en pantalla
    rootMargin: "50px",
  });

  // Cargar video cuando sea visible
  useEffect(() => {
    if (isIntersecting && !shouldLoad) {
      setShouldLoad(true);
    }
  }, [isIntersecting, shouldLoad]);

  // Manejar reproducción basada en visibilidad y hover
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoLoaded || !autoPlay) return;

    const shouldPlay = isIntersecting && !isHovered;

    if (shouldPlay && !isPlaying) {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.log("Play prevented:", err);
          setIsPlaying(false);
        });
    } else if (!shouldPlay && isPlaying) {
      video.pause();
      setIsPlaying(false);
    }
  }, [isIntersecting, isHovered, videoLoaded, autoPlay, isPlaying]);

  const handleLoadedMetadata = (e) => {
    setVideoLoaded(true);
    onLoadedMetadata?.(e);
  };

  const handleError = (e) => {
    console.log("Video loading error:", e);
    setVideoLoaded(false);
    onError?.(e);
  };

  // Pausar video cuando el componente se desmonta
  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (video) {
        video.pause();
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {shouldLoad && src ? (
        <video
          ref={videoRef}
          src={src}
          className={`transition-opacity duration-300 ${
            videoLoaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleError}
          muted
          loop
          playsInline
          preload="metadata"
          style={{ display: videoLoaded ? "block" : "none" }}
          {...props}
        />
      ) : null}

      {/* Placeholder mientras carga */}
      {(!shouldLoad || !videoLoaded) && (
        <div
          className={`bg-darkBoxSub flex items-center justify-center ${className}`}
        >
          {shouldLoad ? (
            // Cargando
            <div className="w-8 h-8 border-2 border-gray-600 border-t-[#F2D543] rounded-full animate-spin" />
          ) : (
            // Placeholder lazy
            <div className="text-gray-500 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-darkBoxSub flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              </div>
              <span className="text-xs">Video</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OptimizedVideo;
