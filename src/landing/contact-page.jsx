import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Mail, MessageCircle, Clock, MapPin, Send, Headphones } from "lucide-react";
import { useI18n } from "../i18n/i18n-context";
import SEO from "../components/seo";
import AnimatedSection from "./components/animated-section";
import LandingNavbar from "./components/landing-navbar";
import LandingFooter from "./components/landing-footer";

const content = {
  en: {
    back: "Back to Home",
    badge: "Support",
    title: "Get in Touch",
    subtitle:
      "Have a question, feedback, or need help? Reach out through any of the channels below — we're here to help you create amazing content.",
    emailTitle: "Email Us",
    emailDesc: "For general inquiries, technical support, or partnership opportunities.",
    emailAction: "Send Email",
    whatsappTitle: "WhatsApp",
    whatsappDesc: "Quick questions? Chat with us directly on WhatsApp for faster responses.",
    whatsappAction: "Open WhatsApp",
    responseTitle: "Response Time",
    responseDesc: "We typically respond within 24 hours on business days. WhatsApp messages get faster replies.",
    hoursTitle: "Business Hours",
    hoursDesc: "Monday – Friday, 9:00 AM – 6:00 PM (GMT)",
    locationTitle: "Location",
    locationDesc: "Reel Me In Media Limited — London, United Kingdom",
    faqTitle: "Before reaching out",
    faqSubtitle: "Check if your question is already answered",
    faqItems: [
      {
        q: "How do I reset my password?",
        a: 'Click "Forgot Password" on the login screen and follow the instructions sent to your email.',
      },
      {
        q: "How are tokens consumed?",
        a: "Each AI model has a different token cost. You can see the exact cost before generating any content.",
      },
      {
        q: "Can I get a refund?",
        a: "All purchases are final per our Terms of Service. Contact us if you experience a technical issue.",
      },
      {
        q: "Which AI models are available?",
        a: "We offer 20+ models including Sora 2, Veo 3.1, Kling V3, Runway 4.5, ElevenLabs, and more.",
      },
    ],
  },
  es: {
    back: "Volver al Inicio",
    badge: "Soporte",
    title: "Contáctanos",
    subtitle:
      "¿Tienes una pregunta, comentario o necesitas ayuda? Comunícate por cualquiera de los canales a continuación — estamos aquí para ayudarte a crear contenido increíble.",
    emailTitle: "Correo Electrónico",
    emailDesc: "Para consultas generales, soporte técnico u oportunidades de colaboración.",
    emailAction: "Enviar Correo",
    whatsappTitle: "WhatsApp",
    whatsappDesc: "¿Preguntas rápidas? Escríbenos directamente por WhatsApp para respuestas más rápidas.",
    whatsappAction: "Abrir WhatsApp",
    responseTitle: "Tiempo de Respuesta",
    responseDesc: "Normalmente respondemos dentro de 24 horas en días hábiles. Los mensajes por WhatsApp reciben respuesta más rápida.",
    hoursTitle: "Horario de Atención",
    hoursDesc: "Lunes – Viernes, 9:00 AM – 6:00 PM (GMT)",
    locationTitle: "Ubicación",
    locationDesc: "Reel Me In Media Limited — Londres, Reino Unido",
    faqTitle: "Antes de contactarnos",
    faqSubtitle: "Revisa si tu pregunta ya tiene respuesta",
    faqItems: [
      {
        q: "¿Cómo restablezco mi contraseña?",
        a: 'Haz clic en "Olvidé mi contraseña" en la pantalla de inicio de sesión y sigue las instrucciones enviadas a tu correo.',
      },
      {
        q: "¿Cómo se consumen los tokens?",
        a: "Cada modelo de IA tiene un costo diferente en tokens. Puedes ver el costo exacto antes de generar cualquier contenido.",
      },
      {
        q: "¿Puedo obtener un reembolso?",
        a: "Todas las compras son finales según nuestros Términos de Servicio. Contáctanos si experimentas un problema técnico.",
      },
      {
        q: "¿Qué modelos de IA están disponibles?",
        a: "Ofrecemos más de 20 modelos incluyendo Sora 2, Veo 3.1, Kling V3, Runway 4.5, ElevenLabs y más.",
      },
    ],
  },
};

const WHATSAPP_NUMBER = "15557481227";
const EMAIL = "support@reelmotion.ai";

function ContactCard({ icon: Icon, title, description, action, href, color, delay }) {
  return (
    <AnimatedSection delay={delay}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group block h-full"
      >
        <div
          className="relative h-full rounded-2xl p-8 transition-all duration-300 overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.border = `1px solid ${color}40`;
            e.currentTarget.style.background = `${color}08`;
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border = "1px solid rgba(255,255,255,0.06)";
            e.currentTarget.style.background = "rgba(255,255,255,0.02)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {/* Ambient corner glow */}
          <div
            className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${color}15, transparent 70%)` }}
          />

          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
            style={{
              background: `linear-gradient(135deg, ${color}20, ${color}08)`,
              border: `1px solid ${color}30`,
            }}
          >
            <Icon size={24} style={{ color }} />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">{description}</p>

          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color }}>
            {action}
            <Send
              size={14}
              className="group-hover:translate-x-1 transition-transform duration-200"
            />
          </div>
        </div>
      </a>
    </AnimatedSection>
  );
}

function FaqItem({ question, answer, index }) {
  return (
    <AnimatedSection delay={0.05 * index}>
      <div
        className="rounded-xl p-6 transition-all duration-200"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <h4 className="text-white font-medium mb-2 flex items-baseline gap-3">
          <span className="text-[#DC569D] font-mono text-xs shrink-0">
            {String(index + 1).padStart(2, "0")}
          </span>
          {question}
        </h4>
        <p className="text-gray-500 text-sm leading-relaxed pl-8">{answer}</p>
      </div>
    </AnimatedSection>
  );
}

export default function ContactPage() {
  const scrollRef = useRef(null);
  const { locale } = useI18n();
  const t = content[locale] || content.en;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}`;
  const emailUrl = `mailto:${EMAIL}`;

  return (
    <div
      ref={scrollRef}
      className="bg-[#0C0C0D] text-white h-screen overflow-y-auto overflow-x-hidden"
    >
      <SEO
        title="Contact Us — Reelmotion AI"
        description="Get in touch with Reelmotion AI. Reach us via email or WhatsApp for support, questions, or partnerships."
        url="https://reelmotion.ai/contact"
        lang={locale}
      />

      <LandingNavbar scrollRef={scrollRef} />

      {/* Dot grid background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Central ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(220,86,157,0.07) 0%, transparent 55%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-28 pb-10">
        <AnimatedSection>
          <div className="flex items-center gap-3 mb-6">
            <img
              src="/logos/logo_reelmotion_new.webp"
              alt="Reelmotion AI"
              className="h-8"
            />
            <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">
              {t.badge}
            </span>
          </div>

          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight mb-5"
            style={{
              background:
                "linear-gradient(135deg, #ffffff 0%, #ffffff 50%, #DC569D 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {t.title}
          </h1>

          <p className="text-gray-500 text-lg leading-relaxed max-w-xl">
            {t.subtitle}
          </p>

          <div
            className="h-px w-full mt-10"
            style={{
              background:
                "linear-gradient(to right, rgba(220,86,157,0.3), transparent)",
            }}
          />
        </AnimatedSection>
      </div>

      {/* Contact cards */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ContactCard
            icon={Mail}
            title={t.emailTitle}
            description={t.emailDesc}
            action={t.emailAction}
            href={emailUrl}
            color="#DC569D"
            delay={0.1}
          />
          <ContactCard
            icon={MessageCircle}
            title={t.whatsappTitle}
            description={t.whatsappDesc}
            action={t.whatsappAction}
            href={whatsappUrl}
            color="#25D366"
            delay={0.2}
          />
        </div>
      </div>

      {/* Info row */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 pb-16">
        <AnimatedSection delay={0.25}>
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.05)" }}
          >
            {[
              { icon: Clock, title: t.hoursTitle, desc: t.hoursDesc },
              { icon: Headphones, title: t.responseTitle, desc: t.responseDesc },
              { icon: MapPin, title: t.locationTitle, desc: t.locationDesc },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div
                key={i}
                className="p-6"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <Icon size={18} className="text-gray-600 mb-3" />
                <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>

      {/* FAQ section */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 pb-24">
        <AnimatedSection delay={0.1}>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">{t.faqTitle}</h2>
            <p className="text-gray-600 text-sm font-mono">{t.faqSubtitle}</p>
          </div>
        </AnimatedSection>

        <div className="space-y-3">
          {t.faqItems.map((item, i) => (
            <FaqItem key={i} question={item.q} answer={item.a} index={i} />
          ))}
        </div>

      </div>

      {/* Footer */}
      <div className="relative z-10">
        <LandingFooter />
      </div>
    </div>
  );
}
