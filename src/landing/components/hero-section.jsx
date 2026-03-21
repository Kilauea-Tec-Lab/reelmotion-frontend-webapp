import React from "react";
import { useI18n } from "../../i18n/i18n-context";
import WebGLShader from "./webgl-shader";
import { LiquidButton } from "../../components/ui/liquid-glass-button";
import { motion } from "framer-motion";
import { ChevronDown, Play, Sparkles } from "lucide-react";

const models = [
  "Sora 2", "Kling V3", "Veo 3.1", "Runway 4.5",
  "ElevenLabs TTS", "Nano Banana 2", "GPT-4o Vision",
  "Freepik Mystic", "Kling 03", "Runway 4.5",
];

const HeroSection = ({ onOpenAuth }) => {
  const { t } = useI18n();
  const handleScrollToDemo = (e) => {
    e.preventDefault();
    const el = document.getElementById("demo");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleCTA = () => {
    onOpenAuth?.();
  };

  return (
    <section aria-label="Hero" className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Layer 0: Dot grid overlay */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Layer 1: WebGL Shader background */}
      <div className="absolute inset-0 z-0">
        <WebGLShader xScale={1.0} yScale={0.5} distortion={0.05} />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/70" />
      </div>

      {/* Ambient glow blobs */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none z-[1]"
        style={{
          background: "radial-gradient(ellipse at center, rgba(220,86,157,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Layer 2: Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto pt-16 pb-36">

        {/* Tech badge */}
        <motion.div
          className="mb-6 flex items-center gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          <div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium"
            style={{
              background: "rgba(220,86,157,0.1)",
              border: "1px solid rgba(220,86,157,0.35)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DC569D] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DC569D]" />
            </span>
            <Sparkles size={13} className="text-[#DC569D]" />
            <span className="text-white/90">Kling V3 · Sora 2 · Veo 3.1 — Now Live</span>
          </div>
        </motion.div>

        {/* Title with gradient */}
        <motion.h1
          className="text-center font-extrabold tracking-tighter text-[clamp(1.7rem,4.5vw,3.8rem)] leading-[1.08]"
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

        {/* Subtitle */}
        <motion.p
          className="hero-subtitle text-base md:text-lg text-gray-300 max-w-2xl mx-auto text-center mt-4 mb-7 font-light leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          {t("hero.subtitle")}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
        >
          <LiquidButton
            size="xl"
            onClick={handleCTA}
            className="text-white border border-[#DC569D]/60 rounded-full font-bold bg-[#DC569D]/20"
          >
            {t("hero.cta-primary")}
          </LiquidButton>

          <a
            href="#demo"
            onClick={handleScrollToDemo}
            className="border border-white/20 text-white rounded-xl px-8 py-3.5 backdrop-blur-sm bg-white/5 flex items-center gap-2 hover:bg-white/10 hover:border-white/40 transition-all group"
          >
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#DC569D]/30 transition-colors">
              <Play size={14} className="ml-0.5" />
            </div>
            {t("hero.cta-secondary")}
          </a>
        </motion.div>

      </div>

      {/* Model names row — absolute, above scroll indicator */}
      <motion.div
        className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 flex-wrap justify-center px-6 w-full max-w-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1, ease: "easeOut" }}
      >
        <span className="text-[10px] text-white/25 font-mono uppercase tracking-widest mr-1">Powered by</span>
        {models.slice(0, 6).map((m) => (
          <span
            key={m}
            className="text-[10px] px-2.5 py-1 rounded-full font-mono whitespace-nowrap"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            {m}
          </span>
        ))}
        <span className="text-[10px] text-white/20 font-mono">+{models.length - 6} more</span>
      </motion.div>

      {/* Scroll indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1">
        <span className="text-gray-700 text-[10px] font-mono uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={16} className="text-gray-700" />
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 z-[2] pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, #0C0C0D)" }}
      />
    </section>
  );
};

export default HeroSection;
