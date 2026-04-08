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

  // Ensure autoplay on mount — iOS needs canplay + touch fallback
  useEffect(() => {
    const videos = [desktopVideoRef.current, mobileVideoRef.current].filter(Boolean);

    const tryPlay = (video) => {
      if (video && video.paused) {
        video.play().catch(() => {});
      }
    };

    // Try immediately
    videos.forEach(tryPlay);

    // Retry when video is ready to play
    const handlers = videos.map((video) => {
      const handler = () => tryPlay(video);
      video.addEventListener("canplay", handler);
      return { video, handler };
    });

    // iOS fallback: play on first user touch
    const onTouch = () => {
      videos.forEach(tryPlay);
      document.removeEventListener("touchstart", onTouch);
    };
    document.addEventListener("touchstart", onTouch, { once: true });

    return () => {
      handlers.forEach(({ video, handler }) =>
        video.removeEventListener("canplay", handler)
      );
      document.removeEventListener("touchstart", onTouch);
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
      {/* Desktop video */}
      <video
        ref={desktopVideoRef}
        className="absolute inset-0 w-full h-full object-cover hidden md:block"
        src="/videos/showreel-desktop.webm"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      {/* Mobile video */}
      <video
        ref={mobileVideoRef}
        className="absolute inset-0 w-full h-full object-cover md:hidden"
        src="/videos/showreel-mobile.webm"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

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
