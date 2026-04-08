import React, { useRef, useEffect, useState } from "react";
import AnimatedSection from "./animated-section";
import { useI18n } from "../../i18n/i18n-context";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

const showcaseItems = [
  { src: "/landing/showcase-cyberpunk.mp4", type: "video" },
  { src: "/landing/showcase-elegant.mp4", type: "video" },
  { src: "/landing/showcase-surfer.mp4", type: "video" },
  { src: "/landing/showcase-eco-city.mp4", type: "video" },
  { src: "/landing/showcase-ai-2.mp4", type: "video" },
  { src: "/landing/showcase-ai-3.mp4", type: "video" },
  { src: "/landing/showcase-ai-4.mp4", type: "video" },
  { src: "/landing/showcase-ai-5.mp4", type: "video" },
  { src: "/landing/showcase-vogue.mp4", type: "video" },
  { src: "/landing/showcase-fashion.mp4", type: "video" },
  { src: "/landing/showcase-girl-field.mp4", type: "video" },
  { src: "/landing/showcase-image-1.jpeg", type: "image" },
];

const LazyVideo = ({ src }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          videoRef.current?.play();
        } else {
          videoRef.current?.pause();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative group overflow-hidden rounded-xl">
      <video
        ref={videoRef}
        src={shouldLoad ? src : undefined}
        muted
        loop
        playsInline
        preload="none"
        className="w-full rounded-xl transition-transform duration-500 group-hover:scale-105"
      />
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none opacity-40"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)",
        }}
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-xl bg-[#DC569D]/0 group-hover:bg-[#DC569D]/05 transition-all duration-300 pointer-events-none" />
    </div>
  );
};

const ChatDemoSection = () => {
  const { t } = useI18n();

  return (
    <section id="demo" className="py-20 md:py-32 bg-[#0C0C0D] relative overflow-hidden">
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto px-6">
          {/* Badge */}
          <div className="flex justify-center mb-4">
            <span
              className="text-[10px] font-mono uppercase tracking-[4px] px-4 py-1.5 rounded-full"
              style={{
                background: "rgba(220,86,157,0.08)",
                border: "1px solid rgba(220,86,157,0.2)",
                color: "rgba(220,86,157,0.8)",
              }}
            >
              ✦ Live Demo
            </span>
          </div>

          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #ffffff 55%, rgba(255,255,255,0.55) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {t("demo.title")}
          </h2>
          <p className="text-gray-500 mt-4 text-lg leading-relaxed">
            {t("demo.subtitle")}
          </p>
        </AnimatedSection>

        {/* Product demo video — styled as a premium player */}
        <div className="max-w-4xl mx-auto px-6 mt-12">
          <AnimatedSection>
            {/* Outer glow wrapper */}
            <div
              className="rounded-2xl p-[1px]"
              style={{
                background: "linear-gradient(135deg, rgba(220,86,157,0.3), rgba(242,213,67,0.15), rgba(255,255,255,0.05))",
                boxShadow: "0 0 60px rgba(220,86,157,0.1), 0 30px 80px rgba(0,0,0,0.5)",
              }}
            >
              <div className="rounded-2xl overflow-hidden bg-[#141416]">
                {/* Player chrome */}
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{
                    background: "rgba(0,0,0,0.4)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/70" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                      <div className="w-3 h-3 rounded-full bg-green-500/70" />
                    </div>
                    <div
                      className="flex-1 bg-[#0C0C0D] rounded-md px-3 py-1 text-xs font-mono text-gray-600"
                      style={{ minWidth: "200px" }}
                    >
                      reelmotion.ai/demo
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play size={10} className="text-[#DC569D]/70" />
                    <span className="text-[10px] font-mono text-[#DC569D]/70 uppercase tracking-wider">Demo</span>
                  </div>
                </div>

                <video
                  src="/landing/demo-reelmotion.mp4"
                  controls
                  preload="none"
                  className="w-full"
                />
              </div>
            </div>

            <p className="text-xs text-gray-600 text-center mt-4 font-mono">
              {t("demo.caption")}
            </p>
          </AnimatedSection>
        </div>

        {/* Showcase gallery */}
        <div className="mt-24">
          <AnimatedSection className="text-center px-6 mb-10">
            <div className="flex justify-center mb-3">
              <span
                className="text-[10px] font-mono uppercase tracking-[4px] px-4 py-1.5 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                ✦ Showcase
              </span>
            </div>
            <h3
              className="text-2xl md:text-3xl font-bold"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {t("demo.showcaseTitle")}
            </h3>
          </AnimatedSection>

          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 mt-8 max-w-6xl mx-auto px-6">
            {showcaseItems.map((item, i) => (
              <AnimatedSection key={i} delay={i * 0.04} className="break-inside-avoid mb-3">
                {item.type === "video" ? (
                  <LazyVideo src={item.src} />
                ) : (
                  <div className="relative group overflow-hidden rounded-xl">
                    <img
                      src={item.src}
                      alt={t("demo.showcaseAlt")}
                      loading="lazy"
                      className="w-full rounded-xl transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 rounded-xl bg-[#DC569D]/0 group-hover:bg-[#DC569D]/05 transition-all duration-300 pointer-events-none" />
                  </div>
                )}
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatDemoSection;
