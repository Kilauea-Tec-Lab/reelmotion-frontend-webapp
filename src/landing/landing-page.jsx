import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import LandingNavbar from "./components/landing-navbar";
import VideoHero from "./components/video-hero";
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
  const [navVisible, setNavVisible] = useState(false);
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

  // Show navbar only after scrolling past the video hero
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const handleScroll = () => {
      setNavVisible(container.scrollTop > window.innerHeight * 0.7);
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={scrollRef}
      className="bg-[#0C0C0D] text-white h-screen overflow-y-auto overflow-x-hidden"
      style={{ scrollBehavior: 'smooth' }}
    >
      <SEO lang={locale} />
      <div
        className="transition-opacity duration-500"
        style={{ opacity: navVisible ? 1 : 0, pointerEvents: navVisible ? "auto" : "none" }}
      >
        <LandingNavbar scrollRef={scrollRef} onOpenAuth={() => setShowAuthModal(true)} />
      </div>
      <VideoHero scrollRef={scrollRef} />
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
