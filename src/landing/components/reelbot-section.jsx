import React from "react";
import AnimatedSection from "./animated-section";
import { useI18n } from "../../i18n/i18n-context";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Wand2,
  Video,
  Image,
  Mic,
  Eye,
  Sparkles,
  Terminal,
  CheckCircle2,
} from "lucide-react";

const features = [
  { icon: Image, titleKey: "reelbot.feat.imageGen", descKey: "reelbot.feat.imageGenDesc", accent: "#A78BFA" },
  { icon: Video, titleKey: "reelbot.feat.videoGen", descKey: "reelbot.feat.videoGenDesc", accent: "#DC569D" },
  { icon: Mic, titleKey: "reelbot.feat.tts", descKey: "reelbot.feat.ttsDesc", accent: "#F2D543" },
  { icon: Eye, titleKey: "reelbot.feat.vision", descKey: "reelbot.feat.visionDesc", accent: "#34D399" },
  { icon: Sparkles, titleKey: "reelbot.feat.prompts", descKey: "reelbot.feat.promptsDesc", accent: "#60A5FA" },
];

const steps = [
  { titleKey: "reelbot.step1.title", descKey: "reelbot.step1.desc" },
  { titleKey: "reelbot.step2.title", descKey: "reelbot.step2.desc" },
  { titleKey: "reelbot.step3.title", descKey: "reelbot.step3.desc" },
  { titleKey: "reelbot.step4.title", descKey: "reelbot.step4.desc" },
  { titleKey: "reelbot.step5.title", descKey: "reelbot.step5.desc" },
];

const ReelbotSection = () => {
  const { t } = useI18n();

  return (
    <section
      id="ai-agent"
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

      {/* Left glow */}
      <div
        className="absolute top-1/2 left-0 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at left, rgba(167,139,250,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
        {/* Left column */}
        <AnimatedSection direction="left">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-6">
            <div
              className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center"
              style={{ background: "rgba(220,86,157,0.1)", border: "1px solid rgba(220,86,157,0.2)" }}
            >
              <img
                src="/logos/reelbot.png"
                alt="ReelBot"
                className="w-8 h-8 object-contain"
              />
            </div>
            <span
              className="text-[10px] font-mono uppercase tracking-[3px] px-3 py-1 rounded-full"
              style={{
                background: "rgba(220,86,157,0.08)",
                border: "1px solid rgba(220,86,157,0.2)",
                color: "rgba(220,86,157,0.8)",
              }}
            >
              ✦ AI Agent
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
            {t("reelbot.title")}
          </h2>
          <p className="text-gray-500 mt-4 text-lg leading-relaxed">
            {t("reelbot.subtitle")}
          </p>

          <div className="mt-8 space-y-1">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={i}
                  className="flex items-start gap-3 mt-3 group cursor-default"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110"
                    style={{
                      background: `${feat.accent}12`,
                      border: `1px solid ${feat.accent}25`,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: feat.accent }} />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{t(feat.titleKey)}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{t(feat.descKey)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatedSection>

        {/* Right column — Terminal-style steps */}
        <AnimatedSection direction="right">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(20,20,22,0.8)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 0 40px rgba(220,86,157,0.05), 0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            {/* Terminal header */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{
                background: "rgba(0,0,0,0.3)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <Terminal size={12} className="text-white/30 ml-2" />
                <span className="text-xs font-mono text-white/30">reelbot — workflow</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                <span className="text-[10px] font-mono text-green-400/70">ACTIVE</span>
              </div>
            </div>

            {/* Steps */}
            <div className="p-6">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-4 relative group"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                >
                  {/* Step indicator */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: "linear-gradient(135deg, rgba(220,86,157,0.8), rgba(242,213,67,0.7))",
                        boxShadow: "0 0 12px rgba(220,86,157,0.3)",
                        color: "white",
                      }}
                    >
                      {i + 1}
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        className="w-px mt-1"
                        style={{
                          height: "28px",
                          background: "linear-gradient(to bottom, rgba(220,86,157,0.4), transparent)",
                        }}
                      />
                    )}
                  </div>

                  {/* Step content */}
                  <div className={i < steps.length - 1 ? "pb-5" : ""}>
                    <p className="text-white font-medium text-sm leading-tight">{t(step.titleKey)}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{t(step.descKey)}</p>
                  </div>
                </motion.div>
              ))}

              {/* Terminal output footer */}
              <div
                className="mt-4 rounded-lg px-4 py-3 font-mono text-xs"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <span className="text-green-400/70">✓</span>
                <span className="text-gray-500 ml-2">Content generated successfully</span>
                <span className="text-[#DC569D]/60 ml-2">— 3.2s</span>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ReelbotSection;
