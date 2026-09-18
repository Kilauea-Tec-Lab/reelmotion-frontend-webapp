import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import LandingNavbar from "./components/landing-navbar";
import VideoHero from "./components/video-hero";
import SocialProofSection from "./components/social-proof-section";
import FeaturesSection from "./components/features-section";
import ReelbotSection from "./components/reelbot-section";
import ChatDemoSection from "./components/chat-demo-section";
import EditorSection from "./components/editor-section";
import IntegrationsSection from "./components/integrations-section";
import TeamsSection from "./components/teams-section";
import PricingSection from "./components/pricing-section";
import LandingFooter from "./components/landing-footer";
import AuthModal from "../auth/auth-modal";
import CtaBanner from "./components/cta-banner";
import DownloadAppButton from "./components/download-app-button";
import SEO from "../components/seo";
import { useI18n } from "../i18n/i18n-context";

function LandingPage() {
  const scrollRef = useRef(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { locale } = useI18n();

  if (Cookies.get("token")) {
    return <Navigate to="/app" replace />;
  }

  // Auto-open auth modal if referral code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("code")) {
      setShowAuthModal(true);
    }
  }, []);

  // Arriving at /#section from another page (e.g. /contact footer links)
  useEffect(() => {
    const el = window.location.hash && document.querySelector(window.location.hash);
    if (el) el.scrollIntoView();
  }, []);

  return (
    <div
      ref={scrollRef}
      className="bg-[#0C0C0D] text-white h-dvh overflow-y-auto overflow-x-hidden"
      style={{ scrollBehavior: 'smooth' }}
    >
      <SEO lang={locale} />
      <LandingNavbar scrollRef={scrollRef} onOpenAuth={() => setShowAuthModal(true)} />
      <VideoHero scrollRef={scrollRef} onOpenAuth={() => setShowAuthModal(true)} />
      <SocialProofSection />
      <IntegrationsSection />
      <FeaturesSection />
      <ReelbotSection />
      <ChatDemoSection />
      <EditorSection />
      <TeamsSection />
      <CtaBanner onOpenAuth={() => setShowAuthModal(true)} />
      <PricingSection onOpenAuth={() => setShowAuthModal(true)} />
      <LandingFooter />

      <DownloadAppButton />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}

export default LandingPage;
