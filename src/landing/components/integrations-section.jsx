import React from "react";
import { Link } from "react-router-dom";
import { Bot, Plug, MessageSquareText, FolderCheck, ArrowRight } from "lucide-react";
import AnimatedSection from "./animated-section";
import { GlowCard } from "../../components/ui/spotlight-card";
import { useI18n } from "../../i18n/i18n-context";
import { OpenAILogo, ChatGPTLogo, ClaudeLogo } from "./brand-logos";

const MCP_URL = "https://backend.reelmotion.ai/mcp";

const steps = [
  { icon: Plug, key: "step1", accent: "#A78BFA" },
  { icon: MessageSquareText, key: "step2", accent: "#DC569D" },
  { icon: FolderCheck, key: "step3", accent: "#F2D543" },
];

const IntegrationsSection = () => {
  const { t } = useI18n();

  const logos = [
    { name: "Claude", Logo: ClaudeLogo },
    { name: "ChatGPT", Logo: ChatGPTLogo },
    { name: "OpenAI", Logo: OpenAILogo },
    { name: t("integrations.any-agent"), Logo: Bot },
  ];

  return (
    <section id="integrations" className="py-20 md:py-32 bg-[#0C0C0D] relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at top, rgba(167,139,250,0.08) 0%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <AnimatedSection>
            <div className="flex justify-center mb-4">
              <span
                className="text-[10px] font-mono uppercase tracking-[4px] px-4 py-1.5 rounded-full"
                style={{
                  background: "rgba(167,139,250,0.08)",
                  border: "1px solid rgba(167,139,250,0.2)",
                  color: "rgba(167,139,250,0.85)",
                }}
              >
                {t("integrations.badge")}
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
              {t("integrations.title")}
            </h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
              {t("integrations.subtitle")}
            </p>
          </AnimatedSection>

          {/* Logo row */}
          <AnimatedSection delay={0.1}>
            <p className="text-[10px] font-mono uppercase tracking-[3px] text-white/25 mt-10 mb-4">
              {t("integrations.logos-caption")}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {logos.map(({ name, Logo }) => {
                const Mark = Logo;
                return (
                <div
                  key={name}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-white/80"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <Mark size={22} />
                  {name}
                </div>
                );
              })}
            </div>
          </AnimatedSection>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(({ icon, key, accent }, i) => {
            const Icon = icon;
            return (
            <AnimatedSection key={key} delay={0.15 + i * 0.1} className="h-full">
              <GlowCard glowColor="purple" customSize className="w-full h-full p-6">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}
                    >
                      <Icon size={20} style={{ color: accent }} />
                    </div>
                    <span className="text-[10px] font-mono text-white/25 tracking-[3px]">0{i + 1}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{t(`integrations.${key}.title`)}</h3>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">{t(`integrations.${key}.desc`)}</p>
                </div>
              </GlowCard>
            </AnimatedSection>
            );
          })}
        </div>

        {/* Command + CTA */}
        <AnimatedSection delay={0.45}>
          <div className="mt-10 flex flex-col items-center gap-5">
            <code
              className="text-xs md:text-sm font-mono px-4 py-2.5 rounded-lg text-white/60 max-w-full overflow-x-auto whitespace-nowrap"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="text-[#A78BFA]">$</span> claude mcp add --transport http reelmotion {MCP_URL}
            </code>
            <Link
              to="/developers"
              className="inline-flex items-center gap-2 bg-[#DC569D] hover:bg-[#c44a87] text-white font-semibold px-6 py-3 rounded-xl transition-all"
            >
              {t("integrations.cta")}
              <ArrowRight size={16} />
            </Link>
            <p className="text-[11px] font-mono text-white/30">{t("integrations.note")}</p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default IntegrationsSection;
