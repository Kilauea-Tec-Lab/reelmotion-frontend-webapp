import React from "react";
import { useI18n } from "../../i18n/i18n-context";
import { Check, Building2, Coins, Clapperboard, Image as ImageIcon, Mic } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedSection from "./animated-section";

// ponytail: sample costs mirror ai-lab-modal (Kling V3 720p 10 tok/s, Nano Banana 2 8 tok, ElevenLabs 11 tok/1k chars)
const EXAMPLES = [
  { icon: Clapperboard, key: "video", tokens: 50, usd: "$0.50" },
  { icon: ImageIcon, key: "image", tokens: 8, usd: "$0.08" },
  { icon: Mic, key: "voice", tokens: 11, usd: "$0.11" },
];

const INCLUDED = ["video", "image", "voice", "models", "editor", "library", "agent", "api"];

const PricingSection = ({ onOpenAuth }) => {
  const { t } = useI18n();

  return (
    <section id="pricing" className="py-20 md:py-32 bg-[#0C0C0D] relative overflow-hidden">
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Top glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at top, rgba(242,213,67,0.06) 0%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      <div className="relative z-10">
        <div className="text-center">
          <AnimatedSection>
            {/* Badge */}
            <div className="flex justify-center mb-4">
              <span
                className="text-[10px] font-mono uppercase tracking-[4px] px-4 py-1.5 rounded-full"
                style={{
                  background: "rgba(242,213,67,0.07)",
                  border: "1px solid rgba(242,213,67,0.18)",
                  color: "rgba(242,213,67,0.7)",
                }}
              >
                ✦ Pricing
              </span>
            </div>

            <h2
              className="text-3xl md:text-5xl font-bold"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #ffffff 50%, rgba(255,255,255,0.55) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                paddingBottom: "0.2em",
              }}
            >
              {t("pricing.title")}
            </h2>
            <p className="text-gray-500 mt-4 text-lg max-w-2xl mx-auto px-6 leading-relaxed">
              {t("pricing.subtitle")}
            </p>
          </AnimatedSection>
        </div>

        {/* Pay-as-you-go card */}
        <AnimatedSection delay={0.1}>
          <div className="max-w-5xl mx-auto px-6 mt-12">
            <div className="rounded-2xl border border-[#DC569D]/40 ring-1 ring-[#DC569D]/20 bg-white/5 backdrop-blur-sm overflow-hidden grid md:grid-cols-[1fr_1.2fr]">
              <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-white/5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#DC569D]/20">
                    <Coins size={14} className="text-[#DC569D]" />
                  </div>
                  <span className="text-white font-semibold">{t("pricing.payg.name")}</span>
                  <span className="ml-auto text-[10px] text-[#DC569D] border border-[#DC569D]/30 rounded-full px-2 py-0.5">
                    {t("pricing.payg.badge")}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">$1</span>
                  <span className="text-lg text-white/60">= 100 tokens</span>
                </div>
                <p className="text-sm text-white/40 mt-2">{t("pricing.payg.rate")}</p>
                <p className="text-sm text-white/40">{t("pricing.payg.min")}</p>
                <button
                  onClick={onOpenAuth}
                  className="w-full mt-6 py-3 rounded-xl text-sm font-semibold bg-[#DC569D] hover:bg-[#c44a87] text-white transition-all"
                >
                  {t("pricing.payg.cta")}
                </button>
                <p className="text-xs text-white/40 text-center mt-3">{t("pricing.payg.free")}</p>
              </div>

              <div className="p-6 md:p-8">
                <p className="text-[10px] font-mono uppercase tracking-[3px] text-white/40 mb-4">
                  {t("pricing.payg.included")}
                </p>
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {INCLUDED.map((k) => (
                    <li key={k} className="flex items-center gap-2 text-sm text-white/70">
                      <Check size={15} className="text-[#DC569D] shrink-0" />
                      {t(`pricing.includes.${k}`)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Real cost examples */}
        <AnimatedSection delay={0.2}>
          <div className="max-w-5xl mx-auto px-6 mt-6 grid sm:grid-cols-3 gap-4">
            {EXAMPLES.map(({ icon: Icon, key, tokens, usd }) => (
              <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-2 text-white/40 text-xs mb-2">
                  <Icon size={14} />
                  {t(`pricing.example.${key}`)}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{usd}</span>
                  <span className="text-xs text-white/40">{tokens} tokens</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-white/30 mt-4 px-6">{t("pricing.example.note")}</p>
        </AnimatedSection>

        {/* Enterprise / custom volume */}
        <AnimatedSection delay={0.3}>
          <div className="max-w-5xl mx-auto px-6 mt-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(242,213,67,0.08)", border: "1px solid rgba(242,213,67,0.2)" }}
              >
                <Building2 size={22} className="text-[#F2D543]" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{t("pricing.enterprise.title")}</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{t("pricing.enterprise.subtitle")}</p>
                <ul className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
                  {["bullet1", "bullet2", "bullet3"].map((k) => (
                    <li key={k} className="flex items-center gap-1.5 text-xs text-white/60">
                      <Check size={14} className="text-[#F2D543]" />
                      {t(`pricing.enterprise.${k}`)}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                to="/contact"
                className="inline-flex justify-center items-center px-6 py-3 rounded-xl text-sm font-semibold border border-[#F2D543]/30 bg-[#F2D543]/5 text-[#F2D543] hover:bg-[#F2D543]/10 transition-all shrink-0"
              >
                {t("pricing.enterprise.cta")}
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default PricingSection;
