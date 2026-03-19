import React, { useState } from "react";
import { useI18n } from "../../i18n/i18n-context";
import { Crown, Zap, Star, Check, Minus } from "lucide-react";
import AnimatedSection from "./animated-section";
import {
  PricingTable,
  PricingTableHeader,
  PricingTableBody,
  PricingTableRow,
  PricingTableHead,
  PricingTableCell,
  PricingTablePlan,
} from "../../components/ui/pricing-table";
import { Button } from "../../components/ui/button";

const PricingSection = ({ onOpenAuth }) => {
  const { t } = useI18n();
  const [isYearly, setIsYearly] = useState(false);

  const isEs = t("pricing.monthly") === "Mensual";
  const ctaLabel = isEs ? "Comenzar" : "Get Started";

  const COMPARISON_FEATURES = [
    { label: isEs ? "Tokens / mes"             : "Tokens / month",     values: ["50", "2,500", "10,000"] },
    { label: isEs ? "Generación de video"      : "Video generation",   values: [false, true, true] },
    { label: isEs ? "Generación de imágenes"   : "Image generation",   values: [true, true, true] },
    { label: isEs ? "Modelos de IA"            : "AI models",          values: [isEs ? "Básicos" : "Basic", isEs ? "Todos" : "All", isEs ? "Todos" : "All"] },
    { label: isEs ? "Prioridad de renderizado" : "Rendering priority", values: [isEs ? "Estándar" : "Standard", isEs ? "Prioritario" : "Priority", isEs ? "Máxima" : "Highest"] },
    { label: isEs ? "Editor en la nube"        : "Cloud editor",       values: [false, true, true] },
    { label: isEs ? "Biblioteca de medios"     : "Media library",      values: [false, true, true] },
    { label: "ReelBot AI Agent",                                        values: [false, true, true] },
    { label: isEs ? "Duración de video"        : "Video duration",     values: [isEs ? "Corta" : "Short", isEs ? "Estándar" : "Standard", isEs ? "Extendida" : "Extended"] },
    { label: isEs ? "Acceso anticipado"        : "Early model access", values: [false, false, true] },
    { label: isEs ? "Soporte"                  : "Support",            values: [isEs ? "Comunidad" : "Community", isEs ? "Estándar" : "Standard", isEs ? "Dedicado" : "Dedicated"] },
    { label: isEs ? "Licencia comercial"       : "Commercial license", values: [false, false, true] },
  ];

  const plans = [
    {
      name: t("pricing.free.name"),
      badge: "Personal",
      price: "$0",
      compareAt: null,
      icon: Star,
      accentColor: "#ffffff",
      borderClass: "border-white/10",
      btnClass: "border-white/10 bg-white/5 text-white hover:bg-white/10",
      btnVariant: "outline",
      colIndex: 0,
    },
    {
      name: t("pricing.pro.name"),
      badge: t("pricing.popular"),
      price: isYearly ? "$194.99" : "$17.99",
      compareAt: isYearly ? "$215.88" : null,
      icon: Zap,
      accentColor: "#DC569D",
      borderClass: "border-[#DC569D]/40",
      btnClass: "bg-[#DC569D] hover:bg-[#c44a87] text-white border-0",
      btnVariant: "default",
      colIndex: 1,
      popular: true,
    },
    {
      name: t("pricing.elite.name"),
      badge: isEs ? "Profesional" : "Professional",
      price: isYearly ? "$518.28" : "$47.99",
      compareAt: isYearly ? "$575.88" : null,
      icon: Crown,
      accentColor: "#F2D543",
      borderClass: "border-[#F2D543]/20",
      btnClass: "border-[#F2D543]/30 bg-[#F2D543]/5 text-[#F2D543] hover:bg-[#F2D543]/10",
      btnVariant: "outline",
      colIndex: 2,
    },
  ];

  const renderFeatureValue = (value, accentColor) => {
    if (value === true)  return <Check size={16} style={{ color: accentColor }} />;
    if (value === false) return <Minus size={16} className="text-white/20" />;
    return <span className="text-white/70 text-sm">{value}</span>;
  };

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
            }}
          >
            {t("pricing.title")}
          </h2>
          <p className="text-gray-500 mt-4 text-lg max-w-2xl mx-auto px-6 leading-relaxed">
            {t("pricing.subtitle")}
          </p>
        </AnimatedSection>

        {/* Monthly/Yearly Toggle */}
        <AnimatedSection delay={0.1}>
          <div className="bg-[#141416] rounded-full p-1 inline-flex mt-8">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 text-sm font-medium rounded-full transition-colors ${
                !isYearly ? "bg-[#DC569D] text-white" : "text-gray-400"
              }`}
            >
              {t("pricing.monthly")}
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
                isYearly ? "bg-[#DC569D] text-white" : "text-gray-400"
              }`}
            >
              {t("pricing.yearly")}
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
                {t("pricing.save10")}
              </span>
            </button>
          </div>
        </AnimatedSection>
      </div>

      {/* ── MOBILE: stacked cards ── */}
      <div className="md:hidden flex flex-col gap-4 max-w-sm mx-auto px-6 mt-10">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <AnimatedSection key={plan.name} delay={plan.colIndex * 0.1}>
              <div
                className={`rounded-2xl border bg-white/5 backdrop-blur-sm overflow-hidden ${plan.borderClass} ${
                  plan.popular ? "ring-1 ring-[#DC569D]/40" : ""
                }`}
              >
                {/* Plan header */}
                <div className="p-5 border-b border-white/5">
                  {plan.popular && (
                    <div className="flex justify-center mb-3">
                      <span className="bg-[#DC569D] text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Zap size={10} /> {plan.badge}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: `${plan.accentColor}20` }}
                    >
                      <Icon size={14} style={{ color: plan.accentColor }} />
                    </div>
                    <span className="text-white font-semibold">{plan.name}</span>
                    {!plan.popular && (
                      <span className="ml-auto text-[10px] text-white/30 border border-white/10 rounded-full px-2 py-0.5">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    {plan.compareAt && (
                      <span className="text-sm text-white/30 line-through">{plan.compareAt}</span>
                    )}
                  </div>
                  <button
                    onClick={onOpenAuth}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold border transition-all ${plan.btnClass}`}
                  >
                    {ctaLabel}
                  </button>
                </div>

                {/* Feature rows */}
                <div className="divide-y divide-white/5">
                  {COMPARISON_FEATURES.map((feat) => {
                    const val = feat.values[plan.colIndex];
                    return (
                      <div key={feat.label} className="flex items-center justify-between px-5 py-3">
                        <span className="text-xs text-white/40">{feat.label}</span>
                        <span className="flex items-center">
                          {renderFeatureValue(val, plan.accentColor)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </AnimatedSection>
          );
        })}
      </div>

      {/* ── DESKTOP: comparison table ── */}
      <AnimatedSection delay={0.2}>
        <div className="hidden md:block max-w-5xl mx-auto px-6 mt-12">
          <PricingTable className="[&_thead_tr]:border-b-0 [&_tbody_tr]:border-white/5 [&_tbody_tr]:divide-white/5 text-white/80">
            <PricingTableHeader>
              <PricingTableRow>
                <th className="p-2 w-1/4" />
                {plans.map((plan) => {
                  const Icon = plan.icon;
                  return (
                    <th key={plan.name} className="p-1">
                      <PricingTablePlan
                        name={plan.name}
                        badge={plan.badge}
                        price={plan.price}
                        compareAt={plan.compareAt}
                        icon={Icon}
                        className={`${plan.borderClass} ${
                          plan.popular
                            ? "after:pointer-events-none after:absolute after:-inset-0.5 after:rounded-[inherit] after:bg-gradient-to-b after:from-[#DC569D]/20 after:to-transparent after:blur-[2px]"
                            : ""
                        }`}
                      >
                        <Button
                          onClick={onOpenAuth}
                          size="lg"
                          className={`w-full rounded-lg ${plan.btnClass}`}
                        >
                          {ctaLabel}
                        </Button>
                      </PricingTablePlan>
                    </th>
                  );
                })}
              </PricingTableRow>
            </PricingTableHeader>
            <PricingTableBody>
              {COMPARISON_FEATURES.map((feature, index) => (
                <PricingTableRow key={index}>
                  <PricingTableHead className="text-white/50 font-normal text-sm py-3">
                    {feature.label}
                  </PricingTableHead>
                  {feature.values.map((value, i) => (
                    <PricingTableCell key={i} className="text-white/70 text-sm">
                      {value}
                    </PricingTableCell>
                  ))}
                </PricingTableRow>
              ))}
            </PricingTableBody>
          </PricingTable>
        </div>
      </AnimatedSection>
      </div>
    </section>
  );
};

export default PricingSection;
