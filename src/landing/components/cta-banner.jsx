import React from "react";
import { motion } from "framer-motion";
import { useI18n } from "../../i18n/i18n-context";
import { ArrowRight, Sparkles } from "lucide-react";
import Cookies from "js-cookie";
import { Link } from "react-router-dom";

const CtaBanner = ({ onOpenAuth }) => {
  const { t } = useI18n();
  const isLoggedIn = !!Cookies.get("token");
  const handleCTA = () => {
    if (!isLoggedIn) onOpenAuth?.();
  };

  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-[#0C0C0D]">
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Central glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 100%, rgba(220,86,157,0.12) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(220,86,157,0.2), rgba(242,213,67,0.1))",
                border: "1px solid rgba(220,86,157,0.3)",
                boxShadow: "0 0 30px rgba(220,86,157,0.15)",
              }}
            >
              <Sparkles size={28} className="text-[#DC569D]" />
            </div>
          </div>

          {/* Headline */}
          <h2
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #ffffff 40%, #DC569D 75%, #F2D543 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {t("cta.title")}
          </h2>

          <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            {t("cta.subtitle")}
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <Link
                to="/app"
                className="group flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white text-lg transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, #DC569D, #c44a87)",
                  boxShadow: "0 0 30px rgba(220,86,157,0.3), 0 8px 30px rgba(0,0,0,0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 50px rgba(220,86,157,0.5), 0 8px 30px rgba(0,0,0,0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(220,86,157,0.3), 0 8px 30px rgba(0,0,0,0.3)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {t("nav.go-to-dashboard")}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <button
                onClick={handleCTA}
                className="group flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white text-lg transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, #DC569D, #c44a87)",
                  boxShadow: "0 0 30px rgba(220,86,157,0.3), 0 8px 30px rgba(0,0,0,0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 50px rgba(220,86,157,0.5), 0 8px 30px rgba(0,0,0,0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(220,86,157,0.3), 0 8px 30px rgba(0,0,0,0.3)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {t("cta.button")}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            <span className="text-xs text-gray-600 font-mono">
              {t("cta.note")}
            </span>
          </div>
        </motion.div>

        {/* Bottom separator */}
        <div className="mt-16 flex justify-center">
          <div
            className="h-px w-48"
            style={{ background: "linear-gradient(to right, transparent, rgba(220,86,157,0.3), transparent)" }}
          />
        </div>
      </div>
    </section>
  );
};

export default CtaBanner;
