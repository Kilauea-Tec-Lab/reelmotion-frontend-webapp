import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, Play, Sparkles } from "lucide-react";
import { useI18n } from "../../i18n/i18n-context";
import { LiquidButton } from "../../components/ui/liquid-glass-button";

const MODELS = [
  "Seedance 2.5", "Kling V3", "Veo 3.1", "Runway 4.5",
  "ElevenLabs TTS", "Nano Banana 2", "GPT Image 2",
  "Seedream 5.0", "Kling O3", "Kling O1",
];

const VideoHero = ({ scrollRef, onOpenAuth }) => {
  const { t } = useI18n();
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
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-black/45 to-black/75" />

      {/* Copy over the showreel */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto pt-16 pb-28">
        <motion.div
          className="mb-6 flex items-center gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          <div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap"
            style={{
              background: "rgba(220,86,157,0.15)",
              border: "1px solid rgba(220,86,157,0.4)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DC569D] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DC569D]" />
            </span>
            <Sparkles size={13} className="text-[#DC569D]" />
            <span className="text-white/90">{t("hero.badge")}</span>
          </div>
        </motion.div>

        <motion.h1
          className="text-center font-extrabold tracking-tighter text-[clamp(1.9rem,5vw,4.2rem)] leading-[1.06] drop-shadow-lg"
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #ffffff 40%, #DC569D 70%, #F2D543 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          {t("hero.title")}
        </motion.h1>

        <motion.p
          className="hero-subtitle text-sm md:text-lg text-gray-200 max-w-2xl mx-auto text-center mt-5 mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          {t("hero.subtitle")}
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
        >
          <LiquidButton
            size="xl"
            onClick={() => onOpenAuth?.()}
            className="text-white border border-[#DC569D]/60 rounded-full font-bold bg-[#DC569D]/30"
          >
            {t("hero.cta-primary")}
          </LiquidButton>
          <a
            href="#demo"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="border border-white/25 text-white rounded-xl px-8 py-3.5 backdrop-blur-sm bg-white/10 flex items-center gap-2 hover:bg-white/15 hover:border-white/40 transition-all group"
          >
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#DC569D]/30 transition-colors">
              <Play size={14} className="ml-0.5" />
            </div>
            {t("hero.cta-secondary")}
          </a>
        </motion.div>
      </div>

      {/* Model names row */}
      <motion.div
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 hidden sm:flex items-center gap-2 flex-wrap justify-center px-6 w-full max-w-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1, ease: "easeOut" }}
      >
        <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest mr-1">Powered by</span>
        {MODELS.slice(0, 6).map((m) => (
          <span
            key={m}
            className="text-[10px] px-2.5 py-1 rounded-full font-mono whitespace-nowrap"
            style={{
              background: "rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {m}
          </span>
        ))}
        <span className="text-[10px] text-white/35 font-mono">+{MODELS.length - 6} more</span>
      </motion.div>

      {/* Scroll down indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 cursor-pointer"
        onClick={handleScrollDown}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
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
