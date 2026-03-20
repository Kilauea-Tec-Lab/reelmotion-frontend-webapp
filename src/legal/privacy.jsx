import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "../i18n/i18n-context";
import LanguageSelector from "../i18n/language-selector";

function Section({ number, title, children }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-white flex items-baseline gap-2">
        <span className="text-[#DC569D] font-mono text-sm">{number}.</span>
        {title}
      </h2>
      <div className="text-gray-400 leading-relaxed space-y-3 pl-0 md:pl-6">
        {children}
      </div>
    </div>
  );
}

const content = {
  en: {
    back: "Back to Home",
    badge: "Legal",
    title: "Privacy Policy",
    effective: "Effective: 12/08/2025",
    updated: "Last Updated: 12/08/2025",
    intro1: (
      <>
        <strong className="text-white">Reel Me In Media Limited</strong>{" "}
        respects your privacy and is committed to protecting your personal data.
        This Privacy Policy explains how we collect, use, store, and share your
        information when you use Reelmotion AI.
      </>
    ),
    intro2:
      "By using the Platform, you agree to this Privacy Policy. If you do not agree, you must stop using the Platform.",
    s1: "Information We Collect",
    s1p: "We may collect the following types of information:",
    s1_1: "Information You Provide to Us",
    s1_1items: [
      <><strong className="text-gray-200">Account details:</strong> Name, email address, password, payment details.</>,
      <><strong className="text-gray-200">Uploaded content:</strong> Media, text, or prompts you provide to generate AI content.</>,
      <><strong className="text-gray-200">Communications:</strong> Emails, messages, or feedback you send to us.</>,
    ],
    s1_2: "Information We Collect Automatically",
    s1_2items: [
      <><strong className="text-gray-200">Usage data:</strong> IP address, device type, browser, operating system, and interaction logs.</>,
      <><strong className="text-gray-200">Cookies & tracking:</strong> We use cookies, analytics tools, and similar technologies to improve services.</>,
    ],
    s1_3: "AI-Generated and Processed Data",
    s1_3p: "Any content you create or upload may be stored temporarily or permanently for:",
    s1_3items: ["Service delivery", "AI training and improvement", "Security and moderation purposes"],
    s2: "How We Use Your Information",
    s2p: "We use your information to:",
    s2items: [
      "Provide and operate the Platform.",
      "Process payments and manage billing.",
      "Improve and personalise the Platform's features.",
      "Monitor compliance with our Terms & Conditions.",
      "Respond to legal requests and prevent fraud or misuse.",
      "Develop AI technology, including training and refining our algorithms.",
      "Send service-related updates (we will not send marketing emails without your consent).",
    ],
    s3: "Legal Bases for Processing (GDPR)",
    s3p: "If you are in the UK or EU, we process your personal data under the following lawful bases:",
    s3items: [
      <><strong className="text-gray-200">Contractual necessity:</strong> To deliver services you request.</>,
      <><strong className="text-gray-200">Legitimate interests:</strong> To improve security, detect misuse, and enhance features.</>,
      <><strong className="text-gray-200">Legal obligation:</strong> To comply with applicable laws and regulations.</>,
      <><strong className="text-gray-200">Consent:</strong> Where required (e.g., for marketing or optional cookies).</>,
    ],
    s4: "Sharing Your Information",
    s4p: "We do not sell your personal data. We may share your data with:",
    s4items: [
      <><strong className="text-gray-200">Service providers:</strong> Payment processors, cloud storage, analytics tools.</>,
      <><strong className="text-gray-200">Legal authorities:</strong> Where required by law or court order.</>,
      <><strong className="text-gray-200">Business transfers:</strong> In the event of a merger, acquisition, or sale of assets.</>,
    ],
    s5: "International Transfers",
    s5p: "Because we operate globally, your information may be transferred and stored outside your country. Where required, we use Standard Contractual Clauses or equivalent safeguards to protect data in cross-border transfers.",
    s6: "Data Retention",
    s6p: "We retain personal data only for as long as necessary to:",
    s6items: [
      "Fulfil the purposes outlined in this policy.",
      "Comply with legal obligations.",
      "Resolve disputes and enforce agreements.",
    ],
    s6note: "You may request deletion of your account and data at any time (see Section 8).",
    s7: "Security Measures",
    s7p: "We use technical and organisational safeguards to protect your data, including:",
    s7items: [
      "Encryption of sensitive data in transit and at rest.",
      "Access controls and authentication.",
      "Regular system security audits.",
    ],
    s7note: "However, no system is 100% secure, and we cannot guarantee absolute security.",
    s8: "Your Rights",
    s8p: "Depending on where you live, you may have the right to:",
    s8items: [
      "Access the personal data we hold about you.",
      "Request correction or deletion of your data.",
      "Object to or restrict processing of your data.",
      "Withdraw consent at any time.",
      "Receive your data in a portable format.",
    ],
    s8note: (
      <>To exercise these rights, email us at <strong className="text-white">support@reelmotion.ai</strong>. We will respond within applicable legal timeframes.</>
    ),
    s9: "Cookies and Tracking Technologies",
    s9p: "We use cookies to:",
    s9items: [
      "Enable Platform functionality.",
      "Analyse site usage and performance.",
      "Customise user experience.",
    ],
    s9note: "You can control cookies via your browser settings, but disabling them may affect functionality.",
    s10: "Children's Privacy",
    s10p: "The Platform is not intended for children under 13. If we become aware that we have collected personal data from a child under 13 without parental consent, we will delete it promptly.",
    s11: "Changes to This Privacy Policy",
    s11p: 'We may update this Privacy Policy from time to time. Changes will be posted on the Platform, and the "Last Updated" date will be revised.',
    s12: "Contact Information",
    s12p: "For privacy-related questions, contact us:",
  },
  es: {
    back: "Volver al Inicio",
    badge: "Legal",
    title: "Política de Privacidad",
    effective: "Vigencia: 12/08/2025",
    updated: "Última actualización: 12/08/2025",
    intro1: (
      <>
        <strong className="text-white">Reel Me In Media Limited</strong>{" "}
        respeta su privacidad y está comprometida con la protección de sus datos
        personales. Esta Política de Privacidad explica cómo recopilamos, usamos,
        almacenamos y compartimos su información cuando utiliza Reelmotion AI.
      </>
    ),
    intro2:
      "Al usar la Plataforma, usted acepta esta Política de Privacidad. Si no está de acuerdo, debe dejar de usar la Plataforma.",
    s1: "Información que Recopilamos",
    s1p: "Podemos recopilar los siguientes tipos de información:",
    s1_1: "Información que Usted Proporciona",
    s1_1items: [
      <><strong className="text-gray-200">Datos de cuenta:</strong> Nombre, dirección de correo electrónico, contraseña, datos de pago.</>,
      <><strong className="text-gray-200">Contenido subido:</strong> Medios, texto o prompts que proporciona para generar contenido con IA.</>,
      <><strong className="text-gray-200">Comunicaciones:</strong> Correos electrónicos, mensajes o comentarios que nos envía.</>,
    ],
    s1_2: "Información que Recopilamos Automáticamente",
    s1_2items: [
      <><strong className="text-gray-200">Datos de uso:</strong> Dirección IP, tipo de dispositivo, navegador, sistema operativo y registros de interacción.</>,
      <><strong className="text-gray-200">Cookies y rastreo:</strong> Usamos cookies, herramientas de análisis y tecnologías similares para mejorar los servicios.</>,
    ],
    s1_3: "Datos Generados y Procesados por IA",
    s1_3p: "Cualquier contenido que cree o suba puede almacenarse temporal o permanentemente para:",
    s1_3items: ["Prestación del servicio", "Entrenamiento y mejora de IA", "Seguridad y moderación"],
    s2: "Cómo Usamos su Información",
    s2p: "Usamos su información para:",
    s2items: [
      "Proporcionar y operar la Plataforma.",
      "Procesar pagos y gestionar la facturación.",
      "Mejorar y personalizar las funciones de la Plataforma.",
      "Supervisar el cumplimiento de nuestros Términos y Condiciones.",
      "Responder a solicitudes legales y prevenir fraude o uso indebido.",
      "Desarrollar tecnología de IA, incluyendo el entrenamiento y refinamiento de nuestros algoritmos.",
      "Enviar actualizaciones relacionadas con el servicio (no enviaremos correos de marketing sin su consentimiento).",
    ],
    s3: "Bases Legales para el Procesamiento (RGPD)",
    s3p: "Si se encuentra en el Reino Unido o la UE, procesamos sus datos personales bajo las siguientes bases legales:",
    s3items: [
      <><strong className="text-gray-200">Necesidad contractual:</strong> Para prestar los servicios que solicita.</>,
      <><strong className="text-gray-200">Intereses legítimos:</strong> Para mejorar la seguridad, detectar uso indebido y mejorar funciones.</>,
      <><strong className="text-gray-200">Obligación legal:</strong> Para cumplir con las leyes y regulaciones aplicables.</>,
      <><strong className="text-gray-200">Consentimiento:</strong> Cuando sea necesario (por ejemplo, para marketing o cookies opcionales).</>,
    ],
    s4: "Compartir su Información",
    s4p: "No vendemos sus datos personales. Podemos compartir sus datos con:",
    s4items: [
      <><strong className="text-gray-200">Proveedores de servicios:</strong> Procesadores de pago, almacenamiento en la nube, herramientas de análisis.</>,
      <><strong className="text-gray-200">Autoridades legales:</strong> Cuando lo requiera la ley u orden judicial.</>,
      <><strong className="text-gray-200">Transferencias comerciales:</strong> En caso de fusión, adquisición o venta de activos.</>,
    ],
    s5: "Transferencias Internacionales",
    s5p: "Dado que operamos globalmente, su información puede transferirse y almacenarse fuera de su país. Cuando sea necesario, usamos Cláusulas Contractuales Estándar o salvaguardas equivalentes para proteger los datos en transferencias transfronterizas.",
    s6: "Retención de Datos",
    s6p: "Retenemos datos personales solo durante el tiempo necesario para:",
    s6items: [
      "Cumplir los propósitos descritos en esta política.",
      "Cumplir con obligaciones legales.",
      "Resolver disputas y hacer cumplir acuerdos.",
    ],
    s6note: "Puede solicitar la eliminación de su cuenta y datos en cualquier momento (ver Sección 8).",
    s7: "Medidas de Seguridad",
    s7p: "Usamos salvaguardas técnicas y organizativas para proteger sus datos, incluyendo:",
    s7items: [
      "Cifrado de datos sensibles en tránsito y en reposo.",
      "Controles de acceso y autenticación.",
      "Auditorías regulares de seguridad del sistema.",
    ],
    s7note: "Sin embargo, ningún sistema es 100% seguro, y no podemos garantizar seguridad absoluta.",
    s8: "Sus Derechos",
    s8p: "Dependiendo de dónde viva, puede tener derecho a:",
    s8items: [
      "Acceder a los datos personales que tenemos sobre usted.",
      "Solicitar la corrección o eliminación de sus datos.",
      "Objetar o restringir el procesamiento de sus datos.",
      "Retirar el consentimiento en cualquier momento.",
      "Recibir sus datos en un formato portátil.",
    ],
    s8note: (
      <>Para ejercer estos derechos, escríbanos a <strong className="text-white">support@reelmotion.ai</strong>. Responderemos dentro de los plazos legales aplicables.</>
    ),
    s9: "Cookies y Tecnologías de Rastreo",
    s9p: "Usamos cookies para:",
    s9items: [
      "Habilitar la funcionalidad de la Plataforma.",
      "Analizar el uso y rendimiento del sitio.",
      "Personalizar la experiencia del usuario.",
    ],
    s9note: "Puede controlar las cookies a través de la configuración de su navegador, pero deshabilitarlas puede afectar la funcionalidad.",
    s10: "Privacidad de Menores",
    s10p: "La Plataforma no está destinada a menores de 13 años. Si nos enteramos de que hemos recopilado datos personales de un menor de 13 años sin consentimiento parental, los eliminaremos de inmediato.",
    s11: "Cambios a esta Política de Privacidad",
    s11p: "Podemos actualizar esta Política de Privacidad de vez en cuando. Los cambios se publicarán en la Plataforma y se revisará la fecha de \"Última actualización\".",
    s12: "Información de Contacto",
    s12p: "Para preguntas relacionadas con la privacidad, contáctenos:",
  },
};

export default function PrivacyPage() {
  const { locale } = useI18n();
  const t = content[locale] || content.en;

  return (
    <div className="bg-[#0C0C0D] text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-white/5 bg-[#0C0C0D]/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            {t.back}
          </Link>
          <LanguageSelector />
        </div>
      </div>

      {/* Header */}
      <div className="max-w-3xl mx-auto px-6 pt-16 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <img src="/logos/icon_reelmotion_ai.png" alt="Reelmotion AI" className="h-8" />
          <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">{t.badge}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{t.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600 font-mono">
          <span>{t.effective}</span>
          <span className="w-1 h-1 rounded-full bg-gray-700" />
          <span>{t.updated}</span>
        </div>
        <div className="h-px w-full mt-10" style={{ background: "linear-gradient(to right, rgba(220,86,157,0.3), transparent)" }} />
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 pb-24 space-y-10">
        <p className="text-gray-400 leading-relaxed">{t.intro1}</p>
        <p className="text-gray-400 leading-relaxed">{t.intro2}</p>

        <Section number="1" title={t.s1}>
          <p>{t.s1p}</p>
          <h3 className="text-base font-medium text-gray-200 mt-4">
            <span className="text-gray-500 font-mono text-sm mr-1">1.1</span> {t.s1_1}
          </h3>
          <ul className="list-disc ml-6 space-y-2">{t.s1_1items.map((item, i) => <li key={i}>{item}</li>)}</ul>
          <h3 className="text-base font-medium text-gray-200 mt-4">
            <span className="text-gray-500 font-mono text-sm mr-1">1.2</span> {t.s1_2}
          </h3>
          <ul className="list-disc ml-6 space-y-2">{t.s1_2items.map((item, i) => <li key={i}>{item}</li>)}</ul>
          <h3 className="text-base font-medium text-gray-200 mt-4">
            <span className="text-gray-500 font-mono text-sm mr-1">1.3</span> {t.s1_3}
          </h3>
          <p>{t.s1_3p}</p>
          <ul className="list-disc ml-6 space-y-2">{t.s1_3items.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </Section>

        <Section number="2" title={t.s2}>
          <p>{t.s2p}</p>
          <ol className="list-decimal ml-6 space-y-2">{t.s2items.map((item, i) => <li key={i}>{item}</li>)}</ol>
        </Section>

        <Section number="3" title={t.s3}>
          <p>{t.s3p}</p>
          <ul className="list-disc ml-6 space-y-2">{t.s3items.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </Section>

        <Section number="4" title={t.s4}>
          <p>{t.s4p}</p>
          <ul className="list-disc ml-6 space-y-2">{t.s4items.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </Section>

        <Section number="5" title={t.s5}><p>{t.s5p}</p></Section>

        <Section number="6" title={t.s6}>
          <p>{t.s6p}</p>
          <ul className="list-disc ml-6 space-y-2">{t.s6items.map((item, i) => <li key={i}>{item}</li>)}</ul>
          <p>{t.s6note}</p>
        </Section>

        <Section number="7" title={t.s7}>
          <p>{t.s7p}</p>
          <ul className="list-disc ml-6 space-y-2">{t.s7items.map((item, i) => <li key={i}>{item}</li>)}</ul>
          <p>{t.s7note}</p>
        </Section>

        <Section number="8" title={t.s8}>
          <p>{t.s8p}</p>
          <ul className="list-disc ml-6 space-y-2">{t.s8items.map((item, i) => <li key={i}>{item}</li>)}</ul>
          <p>{t.s8note}</p>
        </Section>

        <Section number="9" title={t.s9}>
          <p>{t.s9p}</p>
          <ul className="list-disc ml-6 space-y-2">{t.s9items.map((item, i) => <li key={i}>{item}</li>)}</ul>
          <p>{t.s9note}</p>
        </Section>

        <Section number="10" title={t.s10}><p>{t.s10p}</p></Section>
        <Section number="11" title={t.s11}><p>{t.s11p}</p></Section>

        <Section number="12" title={t.s12}>
          <p>{t.s12p}</p>
          <div className="mt-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-gray-300 font-medium">support@reelmotion.ai</p>
            <p className="text-gray-500 text-sm mt-1">Reel Me In Media Limited, London, United Kingdom</p>
          </div>
        </Section>
      </div>
    </div>
  );
}
