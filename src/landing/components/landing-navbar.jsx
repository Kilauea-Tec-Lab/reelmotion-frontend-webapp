import React, { useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
} from "framer-motion";
import { useI18n } from "../../i18n/i18n-context";
import LanguageSelector from "../../i18n/language-selector";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const navLinks = [
  { labelKey: "nav.features", href: "#features" },
  { labelKey: "nav.ai-agent", href: "#ai-agent" },
  { labelKey: "nav.editor", href: "#editor" },
  { labelKey: "nav.pricing", href: "#pricing" },
];

const LandingNavbar = ({ scrollRef, onOpenAuth }) => {
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll({ container: scrollRef });

  const bgOpacity = useTransform(scrollY, [0, 100], [0, 0.95]);
  const bg = useMotionTemplate`rgba(12, 12, 13, ${bgOpacity})`;

  const handleCTA = () => {
    onOpenAuth?.();
  };

  return (
    <motion.nav
      aria-label="Main navigation"
      style={{ backgroundColor: bg }}
      className="fixed top-0 w-full z-50 transition-all"
    >
      <div className="backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <img
                src="/logos/logo_reelmotion_new.webp"
                alt="Reelmotion AI"
                className="h-8 w-auto"
              />
            </Link>

            {/* Center nav links - hidden on mobile */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.querySelector(link.href);
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {t(link.labelKey)}
                </a>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <LanguageSelector />

              <button
                onClick={handleCTA}
                className="hidden md:inline-flex bg-[#DC569D] hover:bg-[#c44a87] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all"
              >
                {t("nav.get-started")}
              </button>

              {/* Mobile hamburger */}
              <button
                className="md:hidden text-white p-2"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <motion.div
          initial={false}
          animate={
            mobileOpen
              ? { height: "auto", opacity: 1 }
              : { height: 0, opacity: 0 }
          }
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden overflow-hidden bg-[#0C0C0D]/95 backdrop-blur-lg border-t border-white/5"
        >
          <div className="px-4 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-gray-300 hover:text-white transition-colors py-2"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileOpen(false);
                  const el = document.querySelector(link.href);
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {t(link.labelKey)}
              </a>
            ))}
            <button
              onClick={() => {
                setMobileOpen(false);
                onOpenAuth?.();
              }}
              className="bg-[#DC569D] hover:bg-[#c44a87] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all text-center"
            >
              {t("nav.get-started")}
            </button>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
};

export default LandingNavbar;
