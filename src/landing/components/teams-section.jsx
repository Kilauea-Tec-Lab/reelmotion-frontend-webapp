import React from "react";
import { FolderOpen, Images, Workflow } from "lucide-react";
import AnimatedSection from "./animated-section";
import { GlowCard } from "../../components/ui/spotlight-card";
import { useI18n } from "../../i18n/i18n-context";

const cards = [
  { icon: FolderOpen, key: "folders", accent: "#DC569D" },
  { icon: Images, key: "library", accent: "#F2D543" },
  { icon: Workflow, key: "pipeline", accent: "#A78BFA" },
];

const TeamsSection = () => {
  const { t } = useI18n();

  return (
    <section id="teams" className="py-20 md:py-32 bg-[#0A0A0C] relative overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at top, rgba(220,86,157,0.07) 0%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <AnimatedSection>
            <div className="flex justify-center mb-4">
              <span
                className="text-[10px] font-mono uppercase tracking-[4px] px-4 py-1.5 rounded-full"
                style={{
                  background: "rgba(220,86,157,0.08)",
                  border: "1px solid rgba(220,86,157,0.2)",
                  color: "rgba(220,86,157,0.8)",
                }}
              >
                {t("teams.badge")}
              </span>
            </div>
            <h2
              className="text-4xl md:text-5xl font-bold"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #ffffff 50%, rgba(255,255,255,0.6) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                paddingBottom: "0.2em",
              }}
            >
              {t("teams.title")}
            </h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
              {t("teams.subtitle")}
            </p>
          </AnimatedSection>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map(({ icon, key, accent }, i) => {
            const Icon = icon;
            return (
            <AnimatedSection key={key} delay={i * 0.1} className="h-full">
              <GlowCard glowColor="pink" customSize className="w-full h-full p-6">
                <div className="flex flex-col h-full">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}
                  >
                    <Icon size={20} style={{ color: accent }} />
                  </div>
                  <h3 className="text-lg font-bold text-white">{t(`teams.${key}.title`)}</h3>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">{t(`teams.${key}.desc`)}</p>
                </div>
              </GlowCard>
            </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TeamsSection;
