import React, { useRef, useEffect, useState } from "react";
import AnimatedSection from "./animated-section";
import { useI18n } from "../../i18n/i18n-context";
import { motion } from "framer-motion";
import { Video, Image, Mic } from "lucide-react";
import { GlowCard } from "../../components/ui/spotlight-card";

const features = [
  {
    icon: Video,
    titleKey: "features.video.title",
    descKey: "features.video.description",
    video: "/landing/showcase-cyberpunk.mp4",
    models: ["Kling 3.0", "Sora 2", "Veo 3.1"],
    accent: "#DC569D",
    label: "VIDEO GEN",
  },
  {
    icon: Image,
    titleKey: "features.image.title",
    descKey: "features.image.description",
    video: "/landing/showcase-elegant.mp4",
    models: ["Nano Banana 2", "GPT-4o Vision", "Freepik Mystic"],
    accent: "#A78BFA",
    label: "IMAGE GEN",
  },
  {
    icon: Mic,
    titleKey: "features.audio.title",
    descKey: "features.audio.description",
    video: "/landing/showcase-ai-1.mp4",
    models: ["ElevenLabs TTS", "Multi-voice", "Multilingual"],
    accent: "#F2D543",
    label: "VOICE & TTS",
  },
];

const LazyVideo = ({ src }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="aspect-video w-full bg-[#0C0C0D] relative">
      {isVisible && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
      {/* Scan line overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
        }}
      />
    </div>
  );
};

const FeaturesSection = () => {
  const { t } = useI18n();

  return (
    <section
      id="features"
      className="py-20 md:py-32 relative overflow-hidden"
      style={{ background: "#0C0C0D" }}
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at top, rgba(220,86,157,0.07) 0%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-16 px-6">
          <AnimatedSection>
            {/* Section badge */}
            <div className="flex justify-center mb-4">
              <span
                className="text-[10px] font-mono uppercase tracking-[4px] px-4 py-1.5 rounded-full"
                style={{
                  background: "rgba(220,86,157,0.08)",
                  border: "1px solid rgba(220,86,157,0.2)",
                  color: "rgba(220,86,157,0.8)",
                }}
              >
                ✦ Core Capabilities
              </span>
            </div>

            <h2
              className="text-4xl md:text-5xl font-bold"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #ffffff 50%, rgba(255,255,255,0.6) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {t("features.title")}
            </h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
              {t("features.subtitle")}
            </p>

            {/* Glow line */}
            <div className="mt-8 flex justify-center">
              <div
                className="h-px w-32"
                style={{ background: "linear-gradient(to right, transparent, rgba(220,86,157,0.5), transparent)" }}
              />
            </div>
          </AnimatedSection>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto px-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <AnimatedSection key={feature.titleKey} delay={index * 0.1} className="h-full">
                <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.3 }} className="h-full">
                  <GlowCard glowColor="pink" customSize className="w-full h-full p-0 overflow-hidden">
                    {/* Single flex container to avoid GlowCard's grid-rows interfering */}
                    <div className="flex flex-col h-full">
                      {/* Terminal header bar */}
                      <div
                        className="flex items-center justify-between px-4 py-2.5 shrink-0"
                        style={{
                          background: "rgba(0,0,0,0.4)",
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                        </div>
                        <span
                          className="text-[9px] font-mono uppercase tracking-[3px] px-2 py-0.5 rounded"
                          style={{
                            background: `${feature.accent}15`,
                            border: `1px solid ${feature.accent}30`,
                            color: feature.accent,
                          }}
                        >
                          {feature.label}
                        </span>
                      </div>

                      {/* Video preview */}
                      <div className="overflow-hidden shrink-0">
                        <LazyVideo src={feature.video} />
                      </div>

                      {/* Content */}
                      <div className="p-5 flex flex-col flex-1">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                          style={{
                            background: `${feature.accent}15`,
                            border: `1px solid ${feature.accent}25`,
                          }}
                        >
                          <Icon size={18} style={{ color: feature.accent }} />
                        </div>
                        <h3 className="text-lg font-bold text-white">
                          {t(feature.titleKey)}
                        </h3>
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed flex-1">
                          {t(feature.descKey)}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {feature.models.map((model) => (
                            <span
                              key={model}
                              className="text-[10px] font-mono px-2 py-0.5 rounded"
                              style={{
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                color: "rgba(255,255,255,0.45)",
                              }}
                            >
                              {model}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
