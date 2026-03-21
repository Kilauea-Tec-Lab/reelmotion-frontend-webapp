import React from "react";
import AnimatedCounter from "./animated-counter";
import AnimatedSection from "./animated-section";
import { useI18n } from "../../i18n/i18n-context";
import { Zap, Users, Cpu, Globe } from "lucide-react";

const stats = [
  { target: 50, suffix: "K+", icon: Zap, labelKey: "social-proof.videos-generated" },
  { target: 10, suffix: "K+", icon: Users, labelKey: "social-proof.active-users" },
  { target: 15, suffix: "+", icon: Cpu, labelKey: "social-proof.ai-models" },
  { target: 120, suffix: "+", icon: Globe, labelKey: "social-proof.countries" },
];

const aiModels = [
  "Sora 2", "Kling V3", "Veo 3.1", "Runway Gen-4", "Luma Dream Machine",
  "ElevenLabs TTS", "Nano Banana 2", "GPT-4o Vision",
  "Freepik Mystic", "Kling 03", "Runway 4.5", "Luma Dream Machine",
  "Sora 2", "Kling V3", "Veo 3.1", "Runway Gen-4", "Luma Dream Machine",
  "ElevenLabs TTS", "Nano Banana 2", "GPT-4o Vision",
  "Freepik Mystic", "Kling 03", "Runway 4.5", "Luma Dream Machine",
];

const SocialProofSection = () => {
  const { t } = useI18n();

  return (
    <section className="bg-[#0C0C0D]">
      {/* Stats row */}
      <div className="border-y border-white/5 py-16 md:py-20">
        <AnimatedSection className="max-w-6xl mx-auto px-6">
          <div className="social-proof grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.labelKey} className="flex flex-col items-center gap-2 group">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-1 transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: "rgba(220,86,157,0.1)",
                      border: "1px solid rgba(220,86,157,0.2)",
                    }}
                  >
                    <Icon size={18} className="text-[#DC569D]" />
                  </div>
                  <AnimatedCounter
                    target={stat.target}
                    suffix={stat.suffix}
                    className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#DC569D] to-[#F2D543] bg-clip-text text-transparent"
                  />
                  <span className="text-sm text-gray-500">{t(stat.labelKey)}</span>
                </div>
              );
            })}
          </div>
        </AnimatedSection>
      </div>

      {/* AI Models marquee */}
      <div className="py-5 overflow-hidden relative border-b border-white/5">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, #0C0C0D, transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, #0C0C0D, transparent)" }} />

        <style>{`
          @keyframes marquee-scroll {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .marquee-track {
            display: flex;
            width: max-content;
            animation: marquee-scroll 30s linear infinite;
          }
          .marquee-track:hover {
            animation-play-state: paused;
          }
        `}</style>

        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[10px] font-mono uppercase tracking-[3px] text-white/25 pl-6 shrink-0"
            style={{ position: "relative", zIndex: 20 }}
          >
            Powered by
          </span>
        </div>
        <div className="marquee-track">
          {aiModels.map((model, i) => (
            <span
              key={i}
              className="mx-3 text-xs font-mono px-3 py-1.5 rounded-full whitespace-nowrap"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              {model}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
