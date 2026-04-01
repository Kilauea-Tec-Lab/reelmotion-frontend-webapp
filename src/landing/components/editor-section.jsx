import React, { useRef, useEffect } from "react";
import AnimatedSection from "./animated-section";
import { useI18n } from "../../i18n/i18n-context";
import { GlowCard } from "../../components/ui/spotlight-card";
import {
  Layers,
  Type,
  ImageIcon,
  Music,
  Cloud,
  Save,
  Monitor,
  Wand2,
  Film,
  Cpu,
} from "lucide-react";

const editorFeatures = [
  { icon: Layers, titleKey: "editor.feat.timeline", descKey: "editor.feat.timelineDesc", accent: "#DC569D" },
  { icon: Type, titleKey: "editor.feat.captions", descKey: "editor.feat.captionsDesc", accent: "#A78BFA" },
  { icon: ImageIcon, titleKey: "editor.feat.overlays", descKey: "editor.feat.overlaysDesc", accent: "#60A5FA" },
  { icon: Music, titleKey: "editor.feat.audio", descKey: "editor.feat.audioDesc", accent: "#F2D543" },
  { icon: Film, titleKey: "editor.feat.stock", descKey: "editor.feat.stockDesc", accent: "#34D399" },
  { icon: Cloud, titleKey: "editor.feat.cloud", descKey: "editor.feat.cloudDesc", accent: "#F97316" },
  { icon: Save, titleKey: "editor.feat.autosave", descKey: "editor.feat.autosaveDesc", accent: "#DC569D" },
  { icon: Monitor, titleKey: "editor.feat.browser", descKey: "editor.feat.browserDesc", accent: "#A78BFA" },
];

const EditorSection = () => {
  const { t } = useI18n();
  const videoRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play();
        } else {
          videoRef.current?.pause();
        }
      },
      { threshold: 0.3 }
    );
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="editor"
      className="py-20 md:py-32 relative overflow-hidden"
      style={{ background: "#0A0A0C" }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Right glow */}
      <div
        className="absolute top-1/2 right-0 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at right, rgba(220,86,157,0.07) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
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
              ✦ Cloud Editor
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
            {t("editor.title")}
          </h2>
          <p className="text-gray-500 mt-4 text-lg leading-relaxed">
            {t("editor.subtitle")}
          </p>
        </AnimatedSection>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — Feature grid */}
          <AnimatedSection direction="left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {editorFeatures.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={i}
                    className="rounded-xl p-4 group cursor-default transition-all duration-300 hover:translate-y-[-2px]"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${feat.accent}30`;
                      e.currentTarget.style.background = `${feat.accent}06`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-all duration-200 group-hover:scale-110"
                      style={{
                        background: `${feat.accent}12`,
                        border: `1px solid ${feat.accent}25`,
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: feat.accent }} />
                    </div>
                    <p className="text-white font-medium text-sm">{t(feat.titleKey)}</p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{t(feat.descKey)}</p>
                  </div>
                );
              })}
            </div>
          </AnimatedSection>

          {/* Right — Browser mockup with glow */}
          <AnimatedSection direction="right">
            {/* Glow wrapper */}
            <div
              className="rounded-2xl p-[1px]"
              style={{
                background: "linear-gradient(135deg, rgba(220,86,157,0.25), rgba(255,255,255,0.05), rgba(242,213,67,0.1))",
                boxShadow: "0 0 50px rgba(220,86,157,0.08), 0 20px 60px rgba(0,0,0,0.5)",
              }}
            >
              <div className="rounded-2xl overflow-hidden bg-[#111113]">
                {/* Browser top bar */}
                <div
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  </div>
                  <div
                    className="flex-1 bg-[#0C0C0D] rounded-md px-3 py-1 text-xs font-mono text-gray-600"
                  >
                    reelmotion.ai/editor
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Cpu size={10} className="text-[#DC569D]/60" />
                    <span className="text-[10px] font-mono text-[#DC569D]/60">LIVE</span>
                  </div>
                </div>

                {/* Video content */}
                <video
                  ref={videoRef}
                  src="/landing/editing-tool.webm"
                  muted
                  loop
                  playsInline
                  preload="none"
                  className="w-full"
                />
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default EditorSection;
