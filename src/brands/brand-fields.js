// Bilingual copy + field map for the brand form (self-contained, like developers/console-strings.js).
// type: text | area | list | select. Keys match the backend `profile` whitelist (Brand::TEXT_FIELDS / LIST_FIELDS).
const f = (key, en, es, type = "text", extra = {}) => ({ key, en, es, type, ...extra });

export const SECTIONS = [
  {
    id: "identity", en: "Identity", es: "Identidad",
    fields: [
      f("tagline", "Tagline", "Eslogan"),
      f("description", "What the business does", "A qué se dedica el negocio", "area"),
      f("industry", "Industry", "Industria"),
      f("website", "Website", "Sitio web"),
      f("country_market", "Country / market", "País / mercado"),
      f("languages", "Content languages", "Idiomas del contenido", "list", { hint: "es, en" }),
    ],
  },
  {
    id: "typography", en: "Typography", es: "Tipografía",
    fields: [
      f("heading_font", "Heading font", "Fuente de títulos"),
      f("body_font", "Body font", "Fuente de texto"),
      f("typography_notes", "Typography notes", "Notas de tipografía", "area"),
    ],
  },
  {
    id: "voice", en: "Voice & message", es: "Voz y mensaje",
    fields: [
      f("tone_of_voice", "Tone of voice", "Tono de voz", "area"),
      f("tone_tags", "Tone tags", "Etiquetas de tono", "list", { hint: "cercano, divertido, profesional" }),
      f("value_proposition", "Value proposition", "Propuesta de valor", "area"),
      f("key_messages", "Key messages", "Mensajes clave", "list"),
      f("words_to_use", "Words to use", "Palabras a usar", "list"),
      f("words_to_avoid", "Words to avoid", "Palabras a evitar", "list"),
      f("tagline_ctas", "Typical CTAs", "CTA típicos", "list", { hint: "Compra hoy, Reserva ya" }),
      f("hashtags", "Hashtags", "Hashtags", "list"),
      f("emoji_policy", "Emojis", "Emojis", "select", { options: ["none", "light", "free"] }),
    ],
  },
  {
    id: "audience", en: "Audience", es: "Audiencia",
    fields: [
      f("target_audience", "Target audience", "Público objetivo", "area"),
      f("personas", "Personas", "Personas / perfiles", "area"),
      f("competitors", "Competitors", "Competidores", "list"),
    ],
  },
  {
    id: "visual", en: "Visual style & video", es: "Estilo visual y video",
    fields: [
      f("visual_style", "Visual style", "Estilo visual", "area"),
      f("imagery_do", "Imagery to use", "Imágenes a usar", "area"),
      f("imagery_dont", "Imagery to avoid", "Imágenes a evitar", "area"),
      f("music_mood", "Music mood", "Ambiente musical"),
      f("pacing", "Pacing", "Ritmo", "select", { options: ["fast", "medium", "calm"] }),
      f("default_aspect_ratio", "Preferred aspect ratio", "Formato preferido", "select", { options: ["9:16", "16:9", "1:1", "4:5"] }),
      f("intro_outro_notes", "Intro / outro notes", "Notas de intro / cierre", "area"),
      f("logo_usage_notes", "Logo usage rules", "Reglas de uso del logo", "area"),
      f("color_usage_notes", "Color usage rules", "Reglas de uso del color", "area"),
      f("compliance_notes", "Legal / compliance", "Legal / restricciones", "area"),
      f("extra_notes", "Other notes", "Otras notas", "area"),
    ],
  },
];

export const SOCIALS = ["instagram", "tiktok", "youtube", "x", "linkedin", "facebook"];

export const COLOR_LABELS = {
  primary: ["Primary", "Primario"], secondary: ["Secondary", "Secundario"], accent: ["Accent", "Acento"],
  background_dark: ["Dark background", "Fondo oscuro"], background_light: ["Light background", "Fondo claro"],
  text_on_dark: ["Text on dark", "Texto sobre oscuro"], text_on_light: ["Text on light", "Texto sobre claro"],
};

export const LOGO_LABELS = {
  primary: ["Primary", "Principal"], light: ["Light version", "Versión clara"], dark: ["Dark version", "Versión oscura"],
  icon: ["Icon", "Ícono"], watermark: ["Watermark", "Marca de agua"],
};

export const OPTION_LABELS = {
  none: ["None", "Ninguno"], light: ["Light", "Pocos"], free: ["Free", "Libres"],
  fast: ["Fast", "Rápido"], medium: ["Medium", "Medio"], calm: ["Calm", "Calmado"],
};

export const UI = {
  en: {
    title: "My Brands", subtitle: "Set up your companies once. Both AI agents use the selected brand automatically.",
    new: "New brand", edit: "Edit brand", name: "Brand name", save: "Save", cancel: "Cancel", delete: "Delete",
    deleteBody: "This brand will be removed from your chats and projects. This can't be undone.",
    default: "Default", makeDefault: "Make default", empty: "No brands yet. Create your first one so the agents stop asking for your logo and colors.",
    logos: "Logos", addLogo: "Add logo", colors: "Colors", extraColors: "Extra colors (#RRGGBB, comma separated)",
    social: "Social handles", limit: "You reached the limit of 10 brands.", uploading: "Uploading…",
    logoHint: "PNG, JPG or WebP. A transparent PNG works best.",
    aiTitle: "Fill with AI", aiHint: "Add your website and/or images and PDFs (logo, screenshots, brand book) and the AI fills the form. It also tries the social profiles linked on your site and skips any it can't open. It uses tokens based on actual usage. From a website it also picks up the logos and the main colors; images/PDFs give the most accurate colors.",
    aiUrl: "Website", aiNotes: "Anything else the AI should know (optional)", aiImages: "Add images / PDF", aiRun: "Fill form", aiRunning: "Analyzing…",
    aiDone: (n) => `Form filled. ${n} tokens used. Review it before saving.`, aiOnlyEmpty: "Only empty fields were filled.",
    aiNoTokens: "Not enough tokens. Buy more and try again.", aiMax: "Up to 4 images.",
  },
  es: {
    title: "Mis marcas", subtitle: "Configura tus empresas una vez. Los dos agentes de IA usan la marca elegida automáticamente.",
    new: "Nueva marca", edit: "Editar marca", name: "Nombre de la marca", save: "Guardar", cancel: "Cancelar", delete: "Eliminar",
    deleteBody: "La marca se quitará de tus chats y proyectos. No se puede deshacer.",
    default: "Predeterminada", makeDefault: "Hacer predeterminada", empty: "Aún no tienes marcas. Crea la primera para que los agentes dejen de pedirte tu logo y colores.",
    logos: "Logos", addLogo: "Agregar logo", colors: "Colores", extraColors: "Colores extra (#RRGGBB, separados por coma)",
    social: "Redes sociales", limit: "Llegaste al límite de 10 marcas.", uploading: "Subiendo…",
    logoHint: "PNG, JPG o WebP. Un PNG con transparencia funciona mejor.",
    aiTitle: "Rellenar con IA", aiHint: "Agrega tu sitio web y/o imágenes y PDFs (logo, capturas, manual de marca) y la IA llena el formulario. También intenta abrir las redes sociales enlazadas en tu sitio y omite las que no pueda abrir. Consume tokens según el uso real. De un sitio web también toma los logos y los colores principales; las imágenes/PDFs dan los colores más exactos.",
    aiUrl: "Sitio web", aiNotes: "Algo más que la IA deba saber (opcional)", aiImages: "Agregar imágenes / PDF", aiRun: "Rellenar formulario", aiRunning: "Analizando…",
    aiDone: (n) => `Formulario rellenado. ${n} tokens usados. Revísalo antes de guardar.`, aiOnlyEmpty: "Solo se llenaron los campos vacíos.",
    aiNoTokens: "No tienes tokens suficientes. Compra más e inténtalo de nuevo.", aiMax: "Hasta 4 imágenes.",
  },
};
