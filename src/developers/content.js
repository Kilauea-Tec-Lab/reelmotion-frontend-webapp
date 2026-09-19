// Bilingual copy for /developers. Code samples are shared (they are code).

export const BASE = "https://backend.reelmotion.ai";
export const API = `${BASE}/api/v1`;
export const MCP = `${BASE}/mcp`;

export const samples = {
  curlMe: `curl ${API}/me \\
  -H "Authorization: Bearer rm_YOUR_API_KEY"`,

  curlImage: `curl -X POST ${API}/images \\
  -H "Authorization: Bearer rm_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"nano-banana-2","prompt":"a red fox in the snow, cinematic","aspect_ratio":"16:9"}'`,

  curlVideo: `curl -X POST ${API}/videos \\
  -H "Authorization: Bearer rm_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"kling-v3","prompt":"drone shot over a misty forest","duration":5,"aspect_ratio":"16:9","resolution":"1080p"}'`,

  curlAudio: `curl -X POST ${API}/audio \\
  -H "Authorization: Bearer rm_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"eleven-multilingual-v2","text":"Welcome to Reelmotion","voice_id":"VOICE_ID"}'`,

  curlPoll: `curl ${API}/tasks/TASK_ID \\
  -H "Authorization: Bearer rm_YOUR_API_KEY"`,

  js: `const API = "${API}";
const headers = { Authorization: "Bearer " + process.env.REELMOTION_API_KEY, "Content-Type": "application/json" };

const { data: task } = await fetch(API + "/videos", {
  method: "POST", headers,
  body: JSON.stringify({ model: "seedance-2.5", prompt: "a cat surfing", duration: 5 }),
}).then(r => r.json());

let status = task;
while (!["completed", "failed"].includes(status.status)) {
  await new Promise(r => setTimeout(r, 5000));
  status = (await fetch(API + "/tasks/" + task.id, { headers }).then(r => r.json())).data;
}
console.log(status.result?.url ?? status.error);`,

  python: `import os, time, requests

API = "${API}"
H = {"Authorization": f"Bearer {os.environ['REELMOTION_API_KEY']}"}

task = requests.post(f"{API}/images", headers=H, json={
    "model": "seedream-5-pro", "prompt": "isometric coffee shop, soft light", "aspect_ratio": "1:1",
}).json()["data"]

while task["status"] not in ("completed", "failed"):
    time.sleep(3)
    task = requests.get(f"{API}/tasks/{task['id']}", headers=H).json()["data"]

print(task["result"]["url"] if task["status"] == "completed" else task["error"])`,

  task: `{
  "data": {
    "id": "9d3e…",
    "type": "video",
    "status": "queued",            // queued | processing | completed | failed
    "model": "kling-v3",
    "prompt": "drone shot over a misty forest",
    "progress": 0,
    "result": null,                // { "url": "...", "urls": [...], "mime": "video/mp4" } when completed
    "tokens": { "estimated": 140, "charged": 140, "refunded": false },
    "error": null,
    "created_at": "2026-09-18T20:15:02Z",
    "started_at": null,
    "finished_at": null
  }
}`,

  error402: `HTTP 402
{
  "error": {
    "code": "insufficient_tokens",
    "message": "Insufficient tokens: this generation needs 140 and you have 20.",
    "tokens_required": 140,
    "tokens_available": 20,
    "billing_url": "https://reelmotion.ai/app/pro"
  }
}`,

  oauthAuthorize: `${BASE}/oauth/authorize
  ?response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=https://yourapp.com/oauth/callback
  &scope=profile%20generate%20tasks:read
  &state=RANDOM_STATE
  &code_challenge=BASE64URL(SHA256(code_verifier))
  &code_challenge_method=S256`,

  oauthToken: `curl -X POST ${BASE}/oauth/token \\
  -d grant_type=authorization_code \\
  -d client_id=YOUR_CLIENT_ID \\
  -d client_secret=YOUR_CLIENT_SECRET \\
  -d code=CODE_FROM_CALLBACK \\
  -d redirect_uri=https://yourapp.com/oauth/callback \\
  -d code_verifier=YOUR_CODE_VERIFIER

# → { "access_token": "…", "token_type": "Bearer", "expires_in": 3600, "refresh_token": "…", "scope": "…" }`,

  oauthRefresh: `curl -X POST ${BASE}/oauth/token \\
  -d grant_type=refresh_token \\
  -d client_id=YOUR_CLIENT_ID \\
  -d client_secret=YOUR_CLIENT_SECRET \\
  -d refresh_token=YOUR_REFRESH_TOKEN`,

  dcr: `curl -X POST ${BASE}/oauth/register \\
  -H "Content-Type: application/json" \\
  -d '{"client_name":"My agent","redirect_uris":["http://localhost:8765/callback"],"token_endpoint_auth_method":"none"}'`,

  claudeCode: `claude mcp add --transport http reelmotion ${MCP}
# then inside Claude Code:  /mcp  → reelmotion → Authenticate`,

  cursor: `// .cursor/mcp.json
{
  "mcpServers": {
    "reelmotion": { "url": "${MCP}" }
  }
}`,

  mcpApiKey: `// Any MCP client that supports custom headers can skip OAuth and use an API key:
{
  "mcpServers": {
    "reelmotion": {
      "url": "${MCP}",
      "headers": { "Authorization": "Bearer rm_YOUR_API_KEY" }
    }
  }
}`,

  billing: `GET ${API}/billing/checkout-url   (scope: billing)
→ { "data": { "url": "https://reelmotion.ai/buy-tokens?code=…", "expires_at": "…" } }

<iframe src="https://reelmotion.ai/buy-tokens?code=…" width="480" height="720"></iframe>
// the page posts { type: "reelmotion:tokens-purchased" } to window.parent when a purchase completes`,
};

export const content = {
  en: {
    back: "Back",
    badge: "Developers",
    title: "Reelmotion API",
    subtitle: "Generate images, videos and audio with your users' Reelmotion tokens — from your backend, your product or an AI assistant.",
    nav: ["Quickstart", "Authentication", "OAuth 2.1", "Endpoints", "Tasks & errors", "Models & pricing", "Buying tokens", "MCP for AI assistants"],

    quickstart: {
      title: "Quickstart",
      steps: [
        "Open Developers in the app sidebar and create an API key. Copy it: it is shown only once.",
        `Call ${API}/me with the key to confirm it works and see your token balance.`,
        "Create a generation. Every generation returns a task immediately (HTTP 202).",
        "Poll GET /v1/tasks/{id} every few seconds until status is completed or failed. Failed tasks refund their tokens.",
      ],
      base: "Base URL",
    },

    auth: {
      title: "Authentication",
      p1: "Every request carries a bearer token. There are two kinds:",
      keys: "API keys (rm_…) — per user, created in Developers. Best for your own scripts, backends and automations. They never expire until revoked.",
      oauth: "OAuth 2.1 access tokens — obtained when a Reelmotion user connects your platform. Best when other people use their own account through your product or an AI assistant.",
      scopes: "Scopes",
      scopeList: {
        profile: "Read name, email and token balance (GET /v1/me).",
        billing: "Generate purchase links (GET /v1/billing/checkout-url).",
        generate: "Create image, video and audio tasks — spends the user's tokens.",
        "tasks:read": "Read task status, results and history.",
      },
      limits: "Rate limits: 60 requests/min per credential and at most 5 generations queued/processing per user at once (HTTP 429).",
    },

    oauth: {
      title: "OAuth 2.1",
      p1: "Reelmotion is an OAuth 2.1 authorization server: authorization code flow with PKCE (S256, required), rotating refresh tokens, and dynamic client registration. Discovery documents live at the standard locations.",
      register: "Register your app in Developers → OAuth apps (gives you a client_id + client_secret), or register dynamically (RFC 7591) for public/native clients:",
      step1: "1. Send the user to the authorization endpoint",
      step1p: "The user signs in to Reelmotion, reviews the requested scopes and is redirected back to your redirect_uri with ?code=…&state=….",
      step2: "2. Exchange the code",
      step2p: "Confidential clients authenticate with client_secret (body or HTTP Basic). Public clients send only client_id; PKCE is what protects the code.",
      step3: "3. Refresh",
      step3p: "Access tokens last 1 hour, refresh tokens 30 days. Each refresh rotates the pair; reusing an old refresh token revokes the whole family.",
      revoke: "Users can disconnect your app any time from Developers → Connected apps; POST /oauth/revoke is available for your side.",
      wellKnown: "Discovery",
    },

    endpoints: {
      title: "Endpoints",
      cols: ["Method", "Path", "Scope", "Description"],
      rows: [
        ["GET", "/v1/me", "profile", "Profile and token balance."],
        ["GET", "/v1/billing/checkout-url", "billing", "Short-lived URL to buy tokens (embeddable)."],
        ["GET", "/v1/models", "—", "Model catalog with params and prices (public)."],
        ["GET", "/v1/voices", "—", "Text-to-speech voices."],
        ["POST", "/v1/images", "generate", "Create an image task. Body: model, prompt, aspect_ratio?, reference_images[]?, quality?"],
        ["POST", "/v1/videos", "generate", "Create a video task. Body: model, prompt, duration?, aspect_ratio?, image_url?, video_url?, end_frame_url?, resolution?, generate_audio?, mode?, reference_*[]?"],
        ["POST", "/v1/audio", "generate", "Create an audio task. TTS: model, text, voice_id, stability?, similarity_boost?. SFX/music: model, prompt, duration_seconds."],
        ["GET", "/v1/tasks/{id}", "tasks:read", "Task status and result."],
        ["GET", "/v1/tasks", "tasks:read", "Your API tasks, newest first. Filters: type, status, limit, cursor."],
      ],
      inputs: "Media inputs (image_url, video_url, reference_*) must be public https URLs. Results are permanent URLs on Reelmotion storage and also appear in the user's Library.",
    },

    tasks: {
      title: "Tasks & errors",
      p1: "Creation endpoints answer 202 with a task. Tokens are reserved when the task is created and refunded automatically if it fails.",
      errors: "Errors use a single envelope { error: { code, message, … } }:",
      table: [
        ["400 invalid_request", "Missing/invalid parameter — the message says which."],
        ["401", "Missing, revoked or expired credential."],
        ["402 insufficient_tokens", "Not enough tokens; includes tokens_required, tokens_available and billing_url."],
        ["403 insufficient_scope", "The credential lacks the scope; see the WWW-Authenticate header."],
        ["404 not_found", "Task not found (or not yours)."],
        ["429 rate_limited / too_many_inflight_tasks", "Slow down, or wait for running generations."],
        ["502 provider_error", "The AI provider rejected the request; nothing was charged."],
      ],
    },

    models: {
      title: "Models & pricing",
      p1: "1 token = US$0.01. Prices are the same as in the Reelmotion app. The list below is live from GET /v1/models.",
      cols: ["Model", "Type", "Durations", "Aspect ratios", "Price"],
      loading: "Loading catalog…",
      failed: "Could not load the catalog right now — call GET /v1/models directly.",
    },

    billing: {
      title: "Buying tokens from your product",
      p1: "When a task fails with 402, send the user to buy tokens without leaving your product. checkout-url returns a link valid for 5 minutes that opens a minimal checkout already tied to that user — no Reelmotion login needed. Open it in a new window or an iframe.",
    },

    mcp: {
      title: "MCP for AI assistants",
      p1: "Reelmotion ships a remote MCP server so Claude, ChatGPT, Cursor and any MCP client can generate media on behalf of the connected user. Authentication is the OAuth flow above (the assistant handles it) or an API key.",
      url: "Server URL",
      tools: "Tools",
      toolList: [
        ["get_me", "profile and token balance"],
        ["get_billing_url", "link to buy tokens (share it on insufficient_tokens)"],
        ["list_models / list_voices", "catalog with prices; TTS voices"],
        ["create_image / create_video / create_audio", "start a generation, returns a task"],
        ["get_task / wait_for_task", "poll a task; wait_for_task blocks up to 25 s"],
      ],
      claude: "Claude.ai / Claude Desktop",
      claudeSteps: ["Settings → Connectors → Add custom connector.", `Name: Reelmotion · URL: ${MCP}`, "Click Connect: you'll be sent to reelmotion.ai to sign in and approve the scopes.", "Ask Claude: “Generate a 5-second video of a lighthouse at dawn with Reelmotion”."],
      claudeCode: "Claude Code",
      chatgpt: "ChatGPT",
      chatgptSteps: ["Settings → Connectors → Advanced → Developer mode.", `Create → URL: ${MCP} · Authentication: OAuth.`, "Approve the connection on reelmotion.ai, then enable the connector in a chat."],
      cursor: "Cursor",
      apiKey: "API key instead of OAuth",
    },
  },

  es: {
    back: "Volver",
    badge: "Desarrolladores",
    title: "API de Reelmotion",
    subtitle: "Genera imágenes, videos y audio con los tokens de Reelmotion de tus usuarios — desde tu backend, tu producto o un asistente de IA.",
    nav: ["Inicio rápido", "Autenticación", "OAuth 2.1", "Endpoints", "Tareas y errores", "Modelos y precios", "Compra de tokens", "MCP para asistentes de IA"],

    quickstart: {
      title: "Inicio rápido",
      steps: [
        "Abre Developers en la barra lateral de la app y crea una API key. Cópiala: solo se muestra una vez.",
        `Llama a ${API}/me con la key para confirmar que funciona y ver tu balance de tokens.`,
        "Crea una generación. Toda generación devuelve una tarea de inmediato (HTTP 202).",
        "Consulta GET /v1/tasks/{id} cada pocos segundos hasta que status sea completed o failed. Las tareas fallidas devuelven sus tokens.",
      ],
      base: "URL base",
    },

    auth: {
      title: "Autenticación",
      p1: "Toda petición lleva un bearer token. Hay dos tipos:",
      keys: "API keys (rm_…) — por usuario, se crean en Developers. Ideales para tus scripts, backends y automatizaciones. No expiran hasta que las revocas.",
      oauth: "Access tokens OAuth 2.1 — se obtienen cuando un usuario de Reelmotion conecta tu plataforma. Ideales cuando otras personas usan su propia cuenta a través de tu producto o de un asistente de IA.",
      scopes: "Scopes",
      scopeList: {
        profile: "Leer nombre, correo y balance de tokens (GET /v1/me).",
        billing: "Generar links de compra (GET /v1/billing/checkout-url).",
        generate: "Crear tareas de imagen, video y audio — gasta los tokens del usuario.",
        "tasks:read": "Leer estado, resultados e historial de tareas.",
      },
      limits: "Límites: 60 peticiones/min por credencial y máximo 5 generaciones en cola/proceso por usuario a la vez (HTTP 429).",
    },

    oauth: {
      title: "OAuth 2.1",
      p1: "Reelmotion es un servidor de autorización OAuth 2.1: flujo authorization code con PKCE (S256, obligatorio), refresh tokens rotativos y registro dinámico de clientes. Los documentos de descubrimiento están en las rutas estándar.",
      register: "Registra tu app en Developers → Apps OAuth (obtienes client_id + client_secret), o regístrala dinámicamente (RFC 7591) para clientes públicos/nativos:",
      step1: "1. Envía al usuario al endpoint de autorización",
      step1p: "El usuario inicia sesión en Reelmotion, revisa los scopes solicitados y vuelve a tu redirect_uri con ?code=…&state=….",
      step2: "2. Intercambia el código",
      step2p: "Los clientes confidenciales se autentican con client_secret (body o HTTP Basic). Los públicos envían solo client_id; PKCE es lo que protege el código.",
      step3: "3. Refresca",
      step3p: "Los access tokens duran 1 hora, los refresh tokens 30 días. Cada refresh rota el par; reutilizar un refresh token viejo revoca toda la familia.",
      revoke: "Los usuarios pueden desconectar tu app en cualquier momento desde Developers → Apps conectadas; POST /oauth/revoke está disponible de tu lado.",
      wellKnown: "Descubrimiento",
    },

    endpoints: {
      title: "Endpoints",
      cols: ["Método", "Ruta", "Scope", "Descripción"],
      rows: [
        ["GET", "/v1/me", "profile", "Perfil y balance de tokens."],
        ["GET", "/v1/billing/checkout-url", "billing", "URL de corta duración para comprar tokens (embebible)."],
        ["GET", "/v1/models", "—", "Catálogo de modelos con parámetros y precios (público)."],
        ["GET", "/v1/voices", "—", "Voces para texto a voz."],
        ["POST", "/v1/images", "generate", "Crea una tarea de imagen. Body: model, prompt, aspect_ratio?, reference_images[]?, quality?"],
        ["POST", "/v1/videos", "generate", "Crea una tarea de video. Body: model, prompt, duration?, aspect_ratio?, image_url?, video_url?, end_frame_url?, resolution?, generate_audio?, mode?, reference_*[]?"],
        ["POST", "/v1/audio", "generate", "Crea una tarea de audio. TTS: model, text, voice_id, stability?, similarity_boost?. SFX/música: model, prompt, duration_seconds."],
        ["GET", "/v1/tasks/{id}", "tasks:read", "Estado y resultado de la tarea."],
        ["GET", "/v1/tasks", "tasks:read", "Tus tareas de API, más recientes primero. Filtros: type, status, limit, cursor."],
      ],
      inputs: "Las entradas multimedia (image_url, video_url, reference_*) deben ser URLs https públicas. Los resultados son URLs permanentes en el almacenamiento de Reelmotion y también aparecen en la Biblioteca del usuario.",
    },

    tasks: {
      title: "Tareas y errores",
      p1: "Los endpoints de creación responden 202 con una tarea. Los tokens se reservan al crearla y se devuelven automáticamente si falla.",
      errors: "Los errores usan un solo formato { error: { code, message, … } }:",
      table: [
        ["400 invalid_request", "Parámetro faltante o inválido — el mensaje dice cuál."],
        ["401", "Credencial ausente, revocada o expirada."],
        ["402 insufficient_tokens", "Tokens insuficientes; incluye tokens_required, tokens_available y billing_url."],
        ["403 insufficient_scope", "La credencial no tiene el scope; revisa el header WWW-Authenticate."],
        ["404 not_found", "Tarea no encontrada (o no es tuya)."],
        ["429 rate_limited / too_many_inflight_tasks", "Baja el ritmo, o espera a que terminen las generaciones en curso."],
        ["502 provider_error", "El proveedor de IA rechazó la petición; no se cobró nada."],
      ],
    },

    models: {
      title: "Modelos y precios",
      p1: "1 token = US$0.01. Los precios son los mismos que en la app de Reelmotion. La lista de abajo viene en vivo de GET /v1/models.",
      cols: ["Modelo", "Tipo", "Duraciones", "Aspect ratios", "Precio"],
      loading: "Cargando catálogo…",
      failed: "No se pudo cargar el catálogo ahora — llama a GET /v1/models directamente.",
    },

    billing: {
      title: "Comprar tokens desde tu producto",
      p1: "Cuando una tarea falla con 402, manda al usuario a comprar tokens sin salir de tu producto. checkout-url devuelve un link válido 5 minutos que abre un checkout mínimo ya ligado a ese usuario — sin login de Reelmotion. Ábrelo en una ventana nueva o en un iframe.",
    },

    mcp: {
      title: "MCP para asistentes de IA",
      p1: "Reelmotion incluye un servidor MCP remoto para que Claude, ChatGPT, Cursor y cualquier cliente MCP generen medios en nombre del usuario conectado. La autenticación es el flujo OAuth de arriba (el asistente lo maneja) o una API key.",
      url: "URL del servidor",
      tools: "Herramientas",
      toolList: [
        ["get_me", "perfil y balance de tokens"],
        ["get_billing_url", "link para comprar tokens (compártelo ante insufficient_tokens)"],
        ["list_models / list_voices", "catálogo con precios; voces TTS"],
        ["create_image / create_video / create_audio", "inicia una generación, devuelve una tarea"],
        ["get_task / wait_for_task", "consulta una tarea; wait_for_task espera hasta 25 s"],
      ],
      claude: "Claude.ai / Claude Desktop",
      claudeSteps: ["Settings → Connectors → Add custom connector.", `Nombre: Reelmotion · URL: ${MCP}`, "Pulsa Connect: te llevará a reelmotion.ai para iniciar sesión y aprobar los scopes.", "Pídele a Claude: “Genera un video de 5 segundos de un faro al amanecer con Reelmotion”."],
      claudeCode: "Claude Code",
      chatgpt: "ChatGPT",
      chatgptSteps: ["Settings → Connectors → Advanced → Developer mode.", `Create → URL: ${MCP} · Authentication: OAuth.`, "Aprueba la conexión en reelmotion.ai y activa el conector en un chat."],
      cursor: "Cursor",
      apiKey: "API key en lugar de OAuth",
    },
  },
};
