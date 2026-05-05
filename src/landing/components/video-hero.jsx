import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";

const VideoHero = ({ scrollRef }) => {
  const sectionRef = useRef(null);
  const desktopVideoRef = useRef(null);
  const mobileVideoRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  const { scrollY } = useScroll({ container: scrollRef });
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (v) => {
      const visible = v < window.innerHeight;
      setIsVisible(visible);
      // Pause video when scrolled past to free resources
      if (!visible) {
        desktopVideoRef.current?.pause();
        mobileVideoRef.current?.pause();
      } else {
        desktopVideoRef.current?.play().catch(() => {});
        mobileVideoRef.current?.play().catch(() => {});
      }
    });
    return unsubscribe;
  }, [scrollY]);

  // Ensure autoplay on mount — iOS Safari requires muted + playsInline + a supported codec.
  // We listen on loadedmetadata/canplay and retry, plus a passive scroll/touch fallback.
  useEffect(() => {
    const videos = [desktopVideoRef.current, mobileVideoRef.current].filter(Boolean);

    const tryPlay = (video) => {
      if (!video) return;
      // Force-mute imperatively — some iOS versions ignore the attribute when set via React
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      if (video.paused) {
        const p = video.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      }
    };

    // Try immediately
    videos.forEach(tryPlay);

    // Retry on multiple readiness events — iOS sometimes only honors play() after metadata
    const events = ["loadedmetadata", "loadeddata", "canplay"];
    const cleanups = [];
    videos.forEach((video) => {
      events.forEach((evt) => {
        const handler = () => tryPlay(video);
        video.addEventListener(evt, handler);
        cleanups.push(() => video.removeEventListener(evt, handler));
      });
    });

    // iOS fallback: play on first user gesture (touch or scroll)
    const onGesture = () => {
      videos.forEach(tryPlay);
    };
    document.addEventListener("touchstart", onGesture, { once: true, passive: true });
    document.addEventListener("scroll", onGesture, { once: true, passive: true, capture: true });

    return () => {
      cleanups.forEach((fn) => fn());
      document.removeEventListener("touchstart", onGesture);
      document.removeEventListener("scroll", onGesture, true);
    };
  }, []);

  const handleScrollDown = () => {
    if (scrollRef?.current) {
      scrollRef.current.scrollTo({
        top: window.innerHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <motion.section
      ref={sectionRef}
      style={{ opacity }}
      className="relative h-dvh w-full flex items-center justify-center overflow-hidden flex-shrink-0"
    >
      {/* Desktop video — MP4 first so iOS/Safari pick a supported source */}
      <video
        ref={desktopVideoRef}
        className="absolute inset-0 w-full h-full object-cover hidden md:block"
        autoPlay
        muted
        defaultMuted
        loop
        playsInline
        webkit-playsinline="true"
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
      >
        <source src="/videos/showreel-desktop.mp4" type="video/mp4" />
        <source src="/videos/showreel-desktop.webm" type="video/webm" />
      </video>
      {/* Mobile video — MP4 first so iOS/Safari pick a supported source */}
      <video
        ref={mobileVideoRef}
        className="absolute inset-0 w-full h-full object-cover md:hidden"
        autoPlay
        muted
        defaultMuted
        loop
        playsInline
        webkit-playsinline="true"
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
      >
        <source src="/videos/showreel-mobile.mp4" type="video/mp4" />
        <source src="/videos/showreel-mobile.webm" type="video/webm" />
      </video>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30 z-[1]" />

      {/* Center logo */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <img
          src="/logos/logo_reelmotion_new.webp"
          alt="Reelmotion AI"
          className="h-28 md:h-44 w-auto drop-shadow-2xl"
        />
      </motion.div>

      {/* Scroll down indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 cursor-pointer"
        onClick={handleScrollDown}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        <span className="text-white/60 text-xs font-mono uppercase tracking-[0.2em]">
          Scroll Down
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={20} className="text-white/60" />
        </motion.div>
      </motion.div>

      {/* Bottom fade to match page bg */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 z-[2] pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, #0C0C0D)" }}
      />
    </motion.section>
  );
};

export default VideoHero;
