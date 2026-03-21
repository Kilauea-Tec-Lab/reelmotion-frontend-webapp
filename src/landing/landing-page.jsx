import React, { useRef, useState, useEffect } from "react";
import LandingNavbar from "./components/landing-navbar";
import HeroSection from "./components/hero-section";
import SocialProofSection from "./components/social-proof-section";
import FeaturesSection from "./components/features-section";
import ReelbotSection from "./components/reelbot-section";
import ChatDemoSection from "./components/chat-demo-section";
import EditorSection from "./components/editor-section";
import PricingSection from "./components/pricing-section";
import LandingFooter from "./components/landing-footer";
import AuthModal from "../auth/auth-modal";
import CtaBanner from "./components/cta-banner";
import SEO from "../components/seo";
import { useI18n } from "../i18n/i18n-context";

function LandingPage() {
  const scrollRef = useRef(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { locale } = useI18n();

  // Auto-open auth modal if referral code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("code")) {
      setShowAuthModal(true);
    }
  }, []);

  return (
    <div
      ref={scrollRef}
      className="bg-[#0C0C0D] text-white h-screen overflow-y-auto overflow-x-hidden"
      style={{ scrollBehavior: 'smooth' }}
    >
      <SEO lang={locale} />
      <LandingNavbar scrollRef={scrollRef} onOpenAuth={() => setShowAuthModal(true)} />
      <HeroSection onOpenAuth={() => setShowAuthModal(true)} />
      <SocialProofSection />
      <FeaturesSection />
      <ReelbotSection />
      <ChatDemoSection />
      <EditorSection />
      <PricingSection onOpenAuth={() => setShowAuthModal(true)} />
      <CtaBanner onOpenAuth={() => setShowAuthModal(true)} />
      <LandingFooter />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}

export default LandingPage;
