const translations = {
  en: {
    // Navbar
    "nav.features": "Features",
    "nav.ai-agent": "AI Agent",
    "nav.editor": "Editor",
    "nav.pricing": "Pricing",
    "nav.get-started": "Get Started",
    "nav.go-to-dashboard": "Go to Dashboard",

    // Hero
    "hero.title":
      "From Idea to Professional Video — No Prompt Skills Required.",
    "hero.subtitle":
      "Describe your idea in simple terms and let Reelmotion AI take care of everything — from prompt creation to model selection to delivering studio-quality videos, images, and voiceovers in seconds.",
    "hero.cta-primary": "Start Creating",
    "hero.cta-secondary": "See It in Action",
    "hero.go-to-dashboard": "Go to Dashboard",

    // Social Proof
    "social-proof.videos-generated": "Videos Generated",
    "social-proof.active-users": "Active Creators",
    "social-proof.ai-models": "AI Models",
    "social-proof.countries": "Countries",

    // Features
    "features.title":
      "You don't need to be an expert — the AI does the hard part",
    "features.subtitle":
      "Other AI tools expect you to already know prompt engineering. Reelmotion AI flips the script: our agent walks you through it, crafts the prompt, and generates content that looks like a pro made it.",
    "features.video.title": "AI Video Generation",
    "features.video.description":
      "Describe your scene. Our AI agent writes the prompt and lets you choose from the best models: Sora 2, Veo 3.1, Kling V3, Runway 4.5, and more.",
    "features.image.title": "AI Image Generation",
    "features.image.description":
      "Type what you want your image to look like. Our AI turns it into a pixel-perfect prompt and generates 4K images with Nano Banana 2, GPT-4o Vision, or Freepik Mystic.",
    "features.audio.title": "AI Voice & Audio",
    "features.audio.description":
      "Write your script, pick a voice, hit generate. ElevenLabs multi-language TTS delivers broadcast-ready narration — no mic, no studio, no editing.",

    // ReelBot
    "reelbot.title": "Your AI Creative Partner — Not Just Another Tool",
    "reelbot.subtitle":
      "Forget prompt engineering. Our AI asks the right questions, builds the perfect prompt for you, and generates results that look like they came from a professional studio.",
    "reelbot.feat.imageGen": "Image Generation",
    "reelbot.feat.imageGenDesc":
      "Text-to-image and image-to-image with Nano Banana 2, GPT-4o, and Freepik",
    "reelbot.feat.videoGen": "Video Generation",
    "reelbot.feat.videoGenDesc":
      "9 video models: Sora 2, Veo 3.1, Runway 4.5, Kling V3, and more",
    "reelbot.feat.tts": "Text-to-Speech",
    "reelbot.feat.ttsDesc": "Multi-language voices powered by ElevenLabs",
    "reelbot.feat.vision": "Visual Analysis",
    "reelbot.feat.visionDesc":
      "Drop an image or video and our AI understands it instantly — no manual descriptions needed",
    "reelbot.feat.prompts": "Guided Prompt Builder",
    "reelbot.feat.promptsDesc":
      "Our AI asks one question at a time to build the exact prompt that nails the result you want — zero guesswork",
    "reelbot.step1.title": "Describe your idea in your own words",
    "reelbot.step1.desc":
      "No prompt knowledge needed. Just tell our AI what you're imagining.",
    "reelbot.step2.title": "ReelBot crafts your prompt",
    "reelbot.step2.desc":
      "The agent asks smart follow-up questions, then writes a production-grade prompt for you.",
    "reelbot.step3.title": "Pick your model & settings",
    "reelbot.step3.desc":
      "Choose your AI model, resolution, aspect ratio, and duration — all in one place.",
    "reelbot.step4.title": "See the cost before you generate",
    "reelbot.step4.desc":
      "Full transparency — the exact token cost shown upfront, no surprises.",
    "reelbot.step5.title": "Generate & download",
    "reelbot.step5.desc":
      "Your content is ready in seconds. Download it or send it straight to the editor.",

    // Chat Demo
    "demo.title": "No Learning Curve. Just Results.",
    "demo.subtitle":
      "We guide you through the entire process to ensure you get the result that you need, regardless of your experience.",
    "demo.caption":
      "From rough idea to polished content — watch our AI agent do the work",
    "demo.showcaseTitle": "Create with Reelmotion AI",
    "demo.showcaseAlt": "AI-generated content",

    // Editor
    "editor.title":
      "Generate. Edit. Publish — All Without Leaving Your Browser.",
    "editor.subtitle":
      "A full professional-grade video editor built into the same platform where you can create your AI  content. One tab, zero app-switching.",
    "editor.feat.timeline": "Multi-track Timeline",
    "editor.feat.timelineDesc":
      "Drag, drop, and zoom frame-by-frame — full precision editing at your fingertips",
    "editor.feat.captions": "Text & Captions",
    "editor.feat.captionsDesc":
      "Animated text overlays, subtitles, and 9+ overlay styles ready to use",
    "editor.feat.overlays": "Image & Video Layers",
    "editor.feat.overlaysDesc":
      "Stack clips, images, shapes, stickers, and captions on separate tracks",
    "editor.feat.audio": "Audio Tracks",
    "editor.feat.audioDesc":
      "Layer music, voiceovers, and sound effects with independent volume control",
    "editor.feat.stock": "Unlimited Stock Media",
    "editor.feat.stockDesc":
      "Millions of royalty-free images and videos via Pexels — built right in",
    "editor.feat.cloud": "Video Rendering",
    "editor.feat.cloudDesc":
      "Export in high quality on the video — your laptop does zero heavy lifting",
    "editor.feat.autosave": "Auto-save & Projects",
    "editor.feat.autosaveDesc":
      "Every change saved automatically. Pick up any project exactly where you left off.",
    "editor.feat.browser": "Zero Install",
    "editor.feat.browserDesc":
      "Works on any device, any browser — open a tab and start editing",

    // Pricing
    "pricing.title": "Simple, Transparent Pricing",
    "pricing.subtitle":
      "One subscription covers AI generation, guided prompts, video editing, and publishing. No hidden fees. Upgrade or cancel anytime.",
    "pricing.monthly": "Monthly",
    "pricing.yearly": "Yearly",
    "pricing.month": "month",
    "pricing.year": "year",
    "pricing.mo": "mo",
    "pricing.save10": "Save 10%",
    "pricing.popular": "Most Popular",
    "pricing.poweredBy": "Powered by",
    "pricing.free.name": "Free",
    "pricing.free.feature1": "50 tokens to explore — no credit card",
    "pricing.free.feature2": "Image generation",
    "pricing.free.feature3": "Basic AI models",
    "pricing.free.feature4": "Community access",
    "pricing.free.feature5": "Video generation",
    "pricing.free.feature6": "Premium AI models",
    "pricing.free.feature7": "Priority rendering",
    "pricing.free.feature8": "vIDEO editor",
    "pricing.free.cta": "Start for Free",
    "pricing.pro.name": "Pro",
    "pricing.pro.feature1": "2,500 tokens/month",
    "pricing.pro.feature2": "Video + image generation",
    "pricing.pro.feature3": "All AI models (Sora 2, Veo 3.1, Kling V3...)",
    "pricing.pro.feature4": "Priority rendering",
    "pricing.pro.feature5": "Video editor",
    "pricing.pro.feature6": "Media library",
    "pricing.pro.feature7": "AI Agent",
    "pricing.pro.cta": "Go Pro",
    "pricing.elite.name": "Elite",
    "pricing.elite.feature1": "10,000 tokens/month",
    "pricing.elite.feature2": "Everything in Pro, plus:",
    "pricing.elite.feature3": "Fastest rendering priority",
    "pricing.elite.feature4": "Extended video durations",
    "pricing.elite.feature5": "Early access to new models",
    "pricing.elite.feature6": "Dedicated support",
    "pricing.elite.feature7": "Full commercial license",
    "pricing.elite.cta": "Go Elite",

    // CTA Banner
    "cta.title": "Your next video is one conversation away.",
    "cta.subtitle":
      "Join thousands of creators already producing professional content with AI. No credit card needed. Start free — Upgrade anytime.",
    "cta.button": "Start Creating",
    "cta.note": "No credit card needed. Start free — Upgrade anytime.",

    // Auth Modal
    "auth.tab.signin": "Sign In",
    "auth.tab.register": "Register",
    "auth.signin.title": "Welcome Back",
    "auth.signin.subtitle": "Enter your credentials to access your account",
    "auth.signin.email-placeholder": "Email or username",
    "auth.signin.password-placeholder": "Password",
    "auth.signin.forgot-password": "Forgot password?",
    "auth.signin.button": "Sign In",
    "auth.signin.email-required": "Email is required",
    "auth.signin.password-required": "Password is required",
    "auth.signin.invalid-credentials": "The email or username is incorrect",
    "auth.register.title": "Create Account",
    "auth.register.subtitle": "Join the new era of content creation",
    "auth.register.username-placeholder": "Username",
    "auth.register.name-placeholder": "Full Name",
    "auth.register.email-placeholder": "Email Address",
    "auth.register.password-placeholder": "Password",
    "auth.register.confirm-password-placeholder": "Confirm Password",
    "auth.register.accept-terms-prefix": "I accept the",
    "auth.register.terms": "Terms & Conditions",
    "auth.register.and": "and",
    "auth.register.privacy": "Privacy Policy",
    "auth.register.accept-terms-error":
      "You must accept the Privacy Policy and Terms & Conditions to create an account",
    "auth.register.email-invalid": "Please enter a valid email address",
    "auth.register.password-empty": "Password fields cannot be empty",
    "auth.register.password-mismatch": "Passwords do not match",
    "auth.register.button": "Create Account",
    "auth.reset.title": "Reset Password",
    "auth.reset.subtitle":
      "Enter your email address and we'll send you instructions to reset your password.",
    "auth.reset.email-label": "Email Address",
    "auth.reset.email-placeholder": "Enter your email",
    "auth.reset.email-required": "Email is required",
    "auth.reset.email-invalid": "Please enter a valid email address",
    "auth.reset.network-error": "Network error. Please try again.",
    "auth.reset.fallback-success":
      "Password reset instructions have been sent to your email.",
    "auth.reset.fallback-error": "Error sending reset email",
    "auth.reset.back": "Back to Login",
    "auth.reset.send": "Send Reset Email",
    "auth.reset.success-title": "Email Sent!",
    "auth.reset.success-subtitle":
      "Check your email inbox and follow the instructions to reset your password.",

    // Footer
    "footer.rights": "All rights reserved.",
    "footer.terms": "Terms of Service",
    "footer.privacy": "Privacy Policy",
    "footer.contact": "Contact Us",
    "footer.tagline": "From idea to published content — powered by AI.",
    "footer.copyright": "\u00a9 2026 Reelmotion AI. All rights reserved.",
    "footer.builtWith":
      "Built with React \u00b7 Tailwind CSS \u00b7 Framer Motion \u00b7 Stripe \u00b7 ElevenLabs \u00b7 Pusher \u00b7 Solana",
  },

  es: {
    // Navbar
    "nav.features": "Funciones",
    "nav.ai-agent": "Agente IA",
    "nav.editor": "Editor",
    "nav.pricing": "Precios",
    "nav.get-started": "Comenzar",
    "nav.go-to-dashboard": "Ir al Panel",

    // Hero
    "hero.title":
      "De tu idea a un video profesional — sin saber escribir prompts.",
    "hero.subtitle":
      "Dile a Reelmotion AI lo que quieres con tus propias palabras. Nuestro agente de IA construye el prompt perfecto, elige el mejor modelo y entrega videos, im\u00e1genes y voces de calidad profesional — en segundos.",
    "hero.cta-primary": "Empieza Gratis",
    "hero.cta-secondary": "Ver en Acci\u00f3n",
    "hero.go-to-dashboard": "Ir al Panel",

    // Social Proof
    "social-proof.videos-generated": "Videos Generados",
    "social-proof.active-users": "Creadores Activos",
    "social-proof.ai-models": "Modelos de IA",
    "social-proof.countries": "Pa\u00edses",

    // Features
    "features.title":
      "No necesitas ser experto — la IA hace el trabajo dif\u00edcil",
    "features.subtitle":
      "Otras herramientas de IA esperan que ya sepas ingenier\u00eda de prompts. Reelmotion cambia las reglas: nuestro agente te entrevista, crea el prompt y genera contenido que parece hecho por un profesional.",
    "features.video.title": "Generaci\u00f3n de Video con IA",
    "features.video.description":
      "Describe tu escena en tus propias palabras. ReelBot escribe el prompt y te deja elegir entre los mejores modelos del planeta: Sora 2, Veo 3.1, Kling V3, Runway 4.5 y m\u00e1s.",
    "features.image.title": "Generaci\u00f3n de Im\u00e1genes con IA",
    "features.image.description":
      "Di lo que ves en tu mente. ReelBot lo convierte en un prompt perfecto y genera im\u00e1genes 4K con Nano Banana 2, GPT-4o Vision o Freepik Mystic.",
    "features.audio.title": "Voz y Audio con IA",
    "features.audio.description":
      "Pega tu guion, elige una voz, genera. ElevenLabs TTS multiling\u00fce entrega narraci\u00f3n lista para transmitir — sin micr\u00f3fono, sin estudio, sin edici\u00f3n.",

    // ReelBot
    "reelbot.title": "Tu socio creativo con IA — no solo otra herramienta",
    "reelbot.subtitle":
      "Olv\u00eddate de la ingenier\u00eda de prompts. ReelBot hace las preguntas correctas, construye el prompt perfecto por ti y genera resultados con calidad de estudio profesional.",
    "reelbot.feat.imageGen": "Generaci\u00f3n de Im\u00e1genes",
    "reelbot.feat.imageGenDesc":
      "Texto a imagen e imagen a imagen con Nano Banana 2, GPT-4o y Freepik",
    "reelbot.feat.videoGen": "Generaci\u00f3n de Video",
    "reelbot.feat.videoGenDesc":
      "9 modelos de video: Sora 2, Veo 3.1, Runway 4.5, Kling V3 y m\u00e1s",
    "reelbot.feat.tts": "Texto a Voz",
    "reelbot.feat.ttsDesc": "Voces multiling\u00fces con ElevenLabs",
    "reelbot.feat.vision": "An\u00e1lisis Visual",
    "reelbot.feat.visionDesc":
      "Sube una imagen o video y ReelBot lo entiende al instante — sin descripciones manuales",
    "reelbot.feat.prompts": "Constructor de Prompts Guiado",
    "reelbot.feat.promptsDesc":
      "ReelBot pregunta paso a paso para construir el prompt exacto que clava el resultado que quieres — cero adivinanzas",
    "reelbot.step1.title": "Describe tu idea con tus palabras",
    "reelbot.step1.desc":
      "Sin conocimientos de prompts. Solo dile a ReelBot lo que est\u00e1s imaginando.",
    "reelbot.step2.title": "ReelBot crea tu prompt",
    "reelbot.step2.desc":
      "El agente hace preguntas inteligentes de seguimiento y escribe un prompt de nivel profesional por ti.",
    "reelbot.step3.title": "Elige modelo y ajustes",
    "reelbot.step3.desc":
      "Selecciona modelo de IA, resoluci\u00f3n, relaci\u00f3n de aspecto y duraci\u00f3n — todo en un solo lugar.",
    "reelbot.step4.title": "Ve el costo antes de generar",
    "reelbot.step4.desc":
      "Total transparencia — el costo exacto en tokens se muestra antes, sin sorpresas.",
    "reelbot.step5.title": "Genera y descarga",
    "reelbot.step5.desc":
      "Tu contenido est\u00e1 listo en segundos. Desc\u00e1rgalo o env\u00edalo directo al editor.",

    // Chat Demo
    "demo.title": "Sin prompts. Sin curva de aprendizaje. Solo resultados.",
    "demo.subtitle":
      "Habla con ReelBot como hablar\u00edas con un colega — \u00e9l se encarga de la ingenier\u00eda de prompts para que obtengas contenido profesional desde el primer intento.",
    "demo.caption":
      "De idea en bruto a contenido pulido — mira a ReelBot trabajar",
    "demo.showcaseTitle": "Creado con Reelmotion AI",
    "demo.showcaseAlt": "Contenido generado con IA",

    // Editor
    "editor.title": "Genera. Edita. Publica — sin salir de tu navegador.",
    "editor.subtitle":
      "Un editor de video profesional completo integrado en la misma plataforma donde creas tu contenido con IA. Una pesta\u00f1a, cero cambios de app.",
    "editor.feat.timeline": "Timeline Multipista",
    "editor.feat.timelineDesc":
      "Arrastra, suelta y haz zoom frame a frame — edici\u00f3n de precisi\u00f3n al alcance de tu mano",
    "editor.feat.captions": "Texto y Subt\u00edtulos",
    "editor.feat.captionsDesc":
      "Textos animados, subt\u00edtulos y m\u00e1s de 9 estilos de overlay listos para usar",
    "editor.feat.overlays": "Capas de Imagen y Video",
    "editor.feat.overlaysDesc":
      "Apila clips, im\u00e1genes, formas, stickers y subt\u00edtulos en pistas separadas",
    "editor.feat.audio": "Pistas de Audio",
    "editor.feat.audioDesc":
      "Agrega m\u00fasica, locuciones y efectos de sonido con control de volumen independiente",
    "editor.feat.stock": "Stock Ilimitado",
    "editor.feat.stockDesc":
      "Millones de im\u00e1genes y videos libres de derechos v\u00eda Pexels — integrado directamente",
    "editor.feat.cloud": "Renderizado en la Nube",
    "editor.feat.cloudDesc":
      "Exporta en alta calidad en la nube — tu computadora no hace nada pesado",
    "editor.feat.autosave": "Autoguardado y Proyectos",
    "editor.feat.autosaveDesc":
      "Cada cambio se guarda autom\u00e1ticamente. Retoma cualquier proyecto justo donde lo dejaste.",
    "editor.feat.browser": "Sin Instalaci\u00f3n",
    "editor.feat.browserDesc":
      "Funciona en cualquier dispositivo y navegador — abre una pesta\u00f1a y empieza a editar",

    // Pricing
    "pricing.title": "Precios Simples y Transparentes",
    "pricing.subtitle":
      "Una suscripci\u00f3n cubre generaci\u00f3n con IA, prompts guiados, edici\u00f3n en la nube y publicaci\u00f3n. Sin costos ocultos. Cambia o cancela cuando quieras.",
    "pricing.monthly": "Mensual",
    "pricing.yearly": "Anual",
    "pricing.month": "mes",
    "pricing.year": "a\u00f1o",
    "pricing.mo": "mes",
    "pricing.save10": "Ahorra 10%",
    "pricing.popular": "M\u00e1s Popular",
    "pricing.poweredBy": "Procesado por",
    "pricing.free.name": "Gratis",
    "pricing.free.feature1": "50 tokens para explorar — sin tarjeta",
    "pricing.free.feature2": "Generaci\u00f3n de im\u00e1genes",
    "pricing.free.feature3": "Modelos de IA b\u00e1sicos",
    "pricing.free.feature4": "Acceso a la comunidad",
    "pricing.free.feature5": "Generaci\u00f3n de video",
    "pricing.free.feature6": "Modelos premium de IA",
    "pricing.free.feature7": "Renderizado prioritario",
    "pricing.free.feature8": "Editor en la nube",
    "pricing.free.cta": "Comenzar Gratis",
    "pricing.pro.name": "Pro",
    "pricing.pro.feature1": "2,500 tokens/mes",
    "pricing.pro.feature2": "Generaci\u00f3n de video + im\u00e1genes",
    "pricing.pro.feature3": "Todos los modelos (Sora 2, Veo 3.1, Kling V3...)",
    "pricing.pro.feature4": "Renderizado prioritario",
    "pricing.pro.feature5": "Editor de video en la nube",
    "pricing.pro.feature6": "Biblioteca de medios",
    "pricing.pro.feature7": "Agente ReelBot IA",
    "pricing.pro.cta": "Hazte Pro",
    "pricing.elite.name": "Elite",
    "pricing.elite.feature1": "10,000 tokens/mes",
    "pricing.elite.feature2": "Todo lo de Pro, m\u00e1s:",
    "pricing.elite.feature3": "M\u00e1xima prioridad de renderizado",
    "pricing.elite.feature4": "Duraciones extendidas de video",
    "pricing.elite.feature5": "Acceso anticipado a nuevos modelos",
    "pricing.elite.feature6": "Soporte dedicado",
    "pricing.elite.feature7": "Licencia comercial completa",
    "pricing.elite.cta": "Hazte Elite",

    // CTA Banner
    "cta.title":
      "Tu pr\u00f3ximo video est\u00e1 a una conversaci\u00f3n de distancia.",
    "cta.subtitle":
      "\u00danete a miles de creadores que ya producen contenido profesional con IA. Sin tarjeta, sin l\u00edmite de tiempo — gratis para siempre.",
    "cta.button": "Empieza Gratis",
    "cta.note": "Sin tarjeta \u00b7 Gratis para siempre",

    // Auth Modal
    "auth.tab.signin": "Iniciar Sesi\u00f3n",
    "auth.tab.register": "Registrarse",
    "auth.signin.title": "Bienvenido de vuelta",
    "auth.signin.subtitle": "Ingresa tus credenciales para acceder a tu cuenta",
    "auth.signin.email-placeholder": "Email o nombre de usuario",
    "auth.signin.password-placeholder": "Contrase\u00f1a",
    "auth.signin.forgot-password": "\u00bfOlvidaste tu contrase\u00f1a?",
    "auth.signin.button": "Iniciar Sesi\u00f3n",
    "auth.signin.email-required": "El email es obligatorio",
    "auth.signin.password-required": "La contrase\u00f1a es obligatoria",
    "auth.signin.invalid-credentials":
      "El email o nombre de usuario es incorrecto",
    "auth.register.title": "Crear Cuenta",
    "auth.register.subtitle":
      "\u00danete a la nueva era de la creaci\u00f3n de contenido",
    "auth.register.username-placeholder": "Nombre de usuario",
    "auth.register.name-placeholder": "Nombre completo",
    "auth.register.email-placeholder": "Correo electr\u00f3nico",
    "auth.register.password-placeholder": "Contrase\u00f1a",
    "auth.register.confirm-password-placeholder": "Confirmar contrase\u00f1a",
    "auth.register.accept-terms-prefix": "Acepto los",
    "auth.register.terms": "T\u00e9rminos y Condiciones",
    "auth.register.and": "y la",
    "auth.register.privacy": "Pol\u00edtica de Privacidad",
    "auth.register.accept-terms-error":
      "Debes aceptar la Pol\u00edtica de Privacidad y los T\u00e9rminos y Condiciones para crear una cuenta",
    "auth.register.email-invalid":
      "Por favor ingresa un correo electr\u00f3nico v\u00e1lido",
    "auth.register.password-empty":
      "Los campos de contrase\u00f1a no pueden estar vac\u00edos",
    "auth.register.password-mismatch": "Las contrase\u00f1as no coinciden",
    "auth.register.button": "Crear Cuenta",
    "auth.reset.title": "Restablecer Contrase\u00f1a",
    "auth.reset.subtitle":
      "Ingresa tu correo electr\u00f3nico y te enviaremos instrucciones para restablecer tu contrase\u00f1a.",
    "auth.reset.email-label": "Correo electr\u00f3nico",
    "auth.reset.email-placeholder": "Ingresa tu correo",
    "auth.reset.email-required": "El email es obligatorio",
    "auth.reset.email-invalid":
      "Por favor ingresa un correo electr\u00f3nico v\u00e1lido",
    "auth.reset.network-error":
      "Error de red. Por favor int\u00e9ntalo de nuevo.",
    "auth.reset.fallback-success":
      "Las instrucciones para restablecer tu contrase\u00f1a han sido enviadas a tu correo.",
    "auth.reset.fallback-error":
      "Error al enviar el correo de restablecimiento",
    "auth.reset.back": "Volver al inicio de sesi\u00f3n",
    "auth.reset.send": "Enviar correo",
    "auth.reset.success-title": "Correo enviado",
    "auth.reset.success-subtitle":
      "Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contrase\u00f1a.",

    // Footer
    "footer.rights": "Todos los derechos reservados.",
    "footer.terms": "T\u00e9rminos de Servicio",
    "footer.privacy": "Pol\u00edtica de Privacidad",
    "footer.contact": "Cont\u00e1ctanos",
    "footer.tagline": "De la idea al contenido publicado — impulsado por IA.",
    "footer.copyright":
      "\u00a9 2026 Reelmotion AI. Todos los derechos reservados.",
    "footer.builtWith":
      "Hecho con React \u00b7 Tailwind CSS \u00b7 Framer Motion \u00b7 Stripe \u00b7 ElevenLabs \u00b7 Pusher \u00b7 Solana",
  },
};

export default translations;
