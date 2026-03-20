import React from "react";
import { useI18n } from "../../i18n/i18n-context";
import { Link } from "react-router-dom";
import { Twitter, Instagram, Youtube, Linkedin } from "lucide-react";

const LandingFooter = () => {
  const { t } = useI18n();
  const isEs = t("footer.terms") === "Términos de Servicio";

  const product = [
    { label: t("nav.features"),  href: "#features" },
    { label: t("nav.ai-agent"),  href: "#ai-agent" },
    { label: t("nav.editor"),    href: "#editor" },
    { label: t("nav.pricing"),   href: "#pricing" },
  ];

  const legal = [
    { label: t("footer.terms"),   href: "/terms" },
    { label: t("footer.privacy"), href: "/privacy" },
    { label: t("footer.contact"), href: "/contact" },
  ];

  const socials = [
    { icon: Twitter,   href: "https://x.com/ReelmotionAI",                                                            label: "Twitter / X" },
    { icon: Instagram, href: "https://www.instagram.com/reelmotion_ai/",                                              label: "Instagram" },
    { icon: Youtube,   href: "https://www.youtube.com/playlist?list=PLus6MnxFx_4XkYHEAy5XhfiJr9F3tkIBZ",            label: "YouTube" },
    { icon: Linkedin,  href: "https://www.linkedin.com/company/reelmotion-ai/",                                       label: "LinkedIn" },
  ];

  const handleAnchor = (e, href) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer style={{ background: "#060608", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      {/* Top glow line */}
      <div
        className="h-px w-full"
        style={{ background: "linear-gradient(to right, transparent, rgba(220,86,157,0.25), transparent)" }}
      />

      {/* Main footer body */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Col 1 — Brand */}
          <div className="md:col-span-2 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <img
                src="/logos/logo_reelmotion_new.webp"
                alt="Reelmotion AI"
                className="h-8 w-auto"
              />
            </div>

            <p className="text-sm text-gray-600 max-w-xs leading-relaxed font-mono">
              {t("footer.tagline")}
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2.5 mt-1">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 transition-all duration-200 hover:text-white hover:scale-110"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(220,86,157,0.12)";
                    e.currentTarget.style.borderColor = "rgba(220,86,157,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  }}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Product */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-mono uppercase tracking-[3px] text-white/25">
              {isEs ? "Producto" : "Product"}
            </h4>
            <ul className="flex flex-col gap-3">
              {product.map(({ label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    onClick={(e) => handleAnchor(e, href)}
                    className="text-sm text-gray-600 hover:text-white transition-colors duration-150"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Legal */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-mono uppercase tracking-[3px] text-white/25">
              Legal
            </h4>
            <ul className="flex flex-col gap-3">
              {legal.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    to={href}
                    className="text-sm text-gray-600 hover:text-white transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-700 font-mono">
            {t("footer.copyright")}
          </p>
          <p className="text-xs text-gray-700 font-mono flex items-center gap-1.5">
            {isEs ? "Desarrollado por" : "Powered by"}
            <span style={{ color: "rgba(220,86,157,0.7)" }} className="font-medium">Kilauea Tec Lab</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
