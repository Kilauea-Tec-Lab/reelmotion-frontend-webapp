import { useState, useRef, useEffect } from "react";
import Cookies from "js-cookie";
import {
  X,
  FlaskConical,
  Sparkles,
  ImagePlus,
  Send,
  Diamond,
  Image,
  Video,
  Mic,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  ChevronDown,
  Loader2,
  Download,
  Coins,
  Ban,
  Check,
  Play,
  Pause,
  Volume2,
  Clock,
  Search,
  CreditCard,
} from "lucide-react";
import {
  getElevenLabsVoices,
  generateElevenLabsSpeech,
} from "../../create_elements/functions";

// Map frontend model IDs to backend model names
const MODEL_MAP = {
  "nano-banana-pro": "Nano Banana",
  freepik: "Freepik",
  "gpt-image-1.5": "GPT",
};

function buildApiUrl(path) {
  const rawBase = import.meta.env.VITE_APP_BACKEND_URL || "";
  const baseWithoutSlash = rawBase.replace(/\/+$/, "");
  const normalizedBase = baseWithoutSlash.endsWith("/api")
    ? baseWithoutSlash
    : `${baseWithoutSlash}/api`;
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
}

// Duraciones por modelo - se actualiza dinámicamente según el modelo seleccionado
const MODEL_DURATIONS = {
  "sora-2": [4, 8, 12],
  "sora-2-pro": [4, 8, 12],
  runway: [5, 10],
  "runway-aleph": [5, 10],
  "runway-4.5": [5, 8, 10],
  "veo-3.1": [8],
  "veo-3.1-flash": [8],
  "veo-3.1-ultra": [8],
  //"luma-labs": [5],
  //"seedance-pro": [5],
  //"kling-v1": [5, 10],
  "kling-v3-omni-pro": [3, 5, 8, 10, 15],
  "kling-v3-omni-std": [3, 5, 8, 10, 15],
};

// Upload media (image/video) to backend and return uploaded file URL
async function uploadMediaToGCS(file, type = "image") {
  const formData = new FormData();
  formData.append("files[]", file);
  formData.append("type", type);

  // The backend endpoint 'ai/upload-attachments' uses 'files[]' and 'type'
  // Presumed to handle 'video' or 'image' based on type param or MIME detection
  const response = await fetch(buildApiUrl("ai/upload-attachments"), {
    method: "POST",
    headers: {
      Authorization: "Bearer " + Cookies.get("token"),
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "Error uploading media");
  }

  const uploadedUrl =
    data?.files?.[0]?.url ||
    (typeof data?.files?.[0] === "string" ? data.files[0] : null) ||
    data?.data?.[0]?.url ||
    (typeof data?.data?.[0] === "string" ? data.data[0] : null) ||
    data?.attachments?.[0]?.url ||
    (typeof data?.attachments?.[0] === "string" ? data.attachments[0] : null) ||
    data?.urls?.[0] ||
    data?.url;

  if (!uploadedUrl) {
    throw new Error(
      data.message || "Upload completed but URL was not returned",
    );
  }

  return uploadedUrl;
}

// Keep existing uploadImageToGCS for backward compatibility or rename ref call
async function uploadImageToGCS(file) {
  return uploadMediaToGCS(file, "image");
}

// Call the AI video generation endpoint
async function generateVideoAPI({
  model,
  prompt,
  referenceImage,
  referenceVideo,
  mediaUrl,
  aspectRatio,
  duration,
}) {
  const body = {
    ai_model: model,
    prompt,
    aspect_ratio: null,
    video_duration: duration,
  };

  // Agregar campos opcionales según el tipo de generación
  if (referenceImage) {
    body.reference_image = referenceImage;
  }
  if (referenceVideo) {
    body.reference_video = referenceVideo;
  }
  if (mediaUrl) {
    body.media_url = mediaUrl;
  }

  const response = await fetch(buildApiUrl("ai/mcp-video-generation"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + Cookies.get("token"),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (data.video_url) {
    return data;
  }
  throw new Error(data.message || data.error || "Error generating video");
}

// Call the AI image generation endpoint
async function generateImagesAPI({
  model,
  type,
  prompt,
  referenceImage,
  referenceImages,
  quantity,
}) {
  const body = { model, type, prompt, quantity };

  if (type === 2 && referenceImage) {
    body.reference_image = referenceImage;
  }
  if (type === 3 && referenceImages) {
    body.reference_images = referenceImages;
  }

  const response = await fetch(buildApiUrl("ai/mcp-image-generation"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + Cookies.get("token"),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (data.success) {
    return data;
  }
  throw new Error(data.message || "Error generating images");
}

const Logos = {
  OpenAI: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.2819 9.8211C23.0819 11.6211 22.3819 13.7211 20.7819 14.7711C21.0419 16.7011 20.0819 18.5811 18.3519 19.4911C16.6219 20.4011 14.4919 20.1411 13.0019 18.8611C11.0519 19.1211 9.1019 18.1811 8.1919 16.4511C7.2819 14.7211 7.5419 12.5911 8.8219 11.1011C7.5419 9.6111 7.2819 7.4811 8.1919 5.7511C9.1019 4.0211 11.0519 3.0811 13.0019 3.3411C14.4919 2.0611 16.6219 1.8011 18.3519 2.7111C20.0819 3.6211 21.0419 5.5011 20.7819 7.4311C22.3819 8.4811 23.0819 10.5811 22.2819 12.3811V9.8211Z"
        fill="#10A37F"
      />
      <path
        d="M12.5 15.5L9.5 13.5V9.5L12.5 7.5L15.5 9.5V13.5L12.5 15.5Z"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  ),
  Freepik: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" rx="4" fill="#1273EB" />
      <path d="M7.5 6H16.5V8.5H10V11H15V13.5H10V18H7.5V6Z" fill="white" />
    </svg>
  ),
  Google: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="currentColor"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="currentColor"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="currentColor"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="currentColor"
      />
    </svg>
  ),
  Runway: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" rx="4" fill="black" />
      <path d="M7 6L17 12L7 18V6Z" fill="white" />
    </svg>
  ),
  Kling: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L2 22H22L12 2Z"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const IMAGE_MODELS = [
  {
    id: "nano-banana-pro",
    name: "Nano Banana Pro",
    // Use Google logo for Nano Banana Pro as requested
    iconComponent: Logos.Google,
    iconColor: "text-blue-400",
    description: "State-of-the-art 4K visuals with flawless typography",
    badges: ["Multi-Image", "4K"],
    isNew: false,
    type: "image",
    cost: 7, // tokens per image
  },
  {
    id: "freepik",
    name: "Freepik",
    iconComponent: Logos.Freepik,
    iconColor: "text-blue-500",
    description: "High-quality assets and creative resources",
    badges: ["Creative", "Assets"],
    isNew: false,
    type: "image",
    cost: 1, // tokens per image
  },
  {
    id: "gpt-image-1.5",
    name: "GPT IMAGE 1.5",
    iconComponent: Logos.OpenAI,
    iconColor: "text-green-400",
    description:
      "Advanced image generation with natural language understanding",
    badges: ["Advanced", "NLP"],
    isNew: true,
    type: "image",
    cost: 6, // tokens per image
  },
];

const VIDEO_MODELS = [
  {
    id: "sora-2-pro",
    name: "Sora 2 Pro",
    iconComponent: Logos.OpenAI,
    iconColor: "text-green-400",
    description: "Cinematic video generation from text or image",
    badges: ["4-12s"],
    cost: 33,
    isNew: true,
    type: "video",
    capabilities: ["text-to-video", "image-to-video"],
  },
  {
    id: "veo-3.1-ultra",
    name: "Veo 3.1 Ultra",
    iconComponent: Logos.Google,
    iconColor: "text-blue-400",
    description: "Maximum quality video generation (8s fixed)",
    badges: ["Ultra"],
    cost: 65,
    isNew: true,
    type: "video",
    capabilities: ["text-to-video", "image-to-video"],
  },
  {
    id: "runway-4.5",
    name: "Runway Gen 4.5",
    iconComponent: Logos.Runway,
    iconColor: "text-purple-400",
    description: "Advanced creative control for video generation",
    badges: ["5-10s"],
    cost: 14,
    isNew: false,
    type: "video",
    capabilities: ["text-to-video", "image-to-video"],
  },
  {
    id: "runway-aleph",
    name: "Runway Aleph",
    iconComponent: Logos.Runway,
    iconColor: "text-purple-400",
    description: "Video-to-video style transfer and editing",
    badges: ["V2V"],
    cost: 17,
    isNew: true,
    type: "video",
    capabilities: ["video-to-video"],
  },
  {
    id: "kling-v3-omni-pro",
    name: "Kling V3 Omni Pro",
    iconComponent: Logos.Kling,
    iconColor: "text-orange-400",
    description: "Professional grade, 3-15s flexible duration",
    badges: ["3-15s"],
    cost: 26,
    isNew: true,
    type: "video",
    capabilities: ["text-to-video", "image-to-video"],
  },
  {
    id: "kling-v3-omni-std",
    name: "Kling V3 Omni Std",
    iconComponent: Logos.Kling,
    iconColor: "text-orange-400",
    description: "Video-to-video editing with V3 technology",
    badges: ["V2V"],
    cost: 19,
    isNew: false,
    type: "video",
    capabilities: ["video-to-video"],
  },
  {
    id: "sora-2",
    name: "Sora 2",
    iconComponent: Logos.OpenAI,
    iconColor: "text-green-400",
    description: "Standard cinematic generation, cost-effective",
    badges: ["4-12s"],
    cost: 11,
    isNew: false,
    type: "video",
    capabilities: ["text-to-video", "image-to-video"],
  },
  {
    id: "veo-3.1",
    name: "Veo 3.1",
    iconComponent: Logos.Google,
    iconColor: "text-blue-400",
    description: "High-quality 8s video generation",
    badges: ["8s"],
    cost: 44,
    isNew: false,
    type: "video",
    capabilities: ["text-to-video", "image-to-video"],
  },
  {
    id: "veo-3.1-flash",
    name: "Veo 3.1 Flash",
    iconComponent: Logos.Google,
    iconColor: "text-blue-400",
    description: "Faster generation with good quality (8s)",
    badges: ["Fast"],
    cost: 17,
    isNew: false,
    type: "video",
    capabilities: ["text-to-video", "image-to-video"],
  },
  /*{
    id: "runway",
    name: "Runway",
    iconComponent: Logos.Runway,
    iconColor: "text-purple-400",
    description: "Image-to-video only, 5-10s",
    badges: ["I2V", "8 tok/s"],
    cost: 8,
    isNew: false,
    type: "video",
    capabilities: ["image-to-video"],
  },
  {
    id: "luma-labs",
    name: "Luma Labs",
    iconComponent: Logos.Runway,
    iconColor: "text-purple-400",
    description: "Creative 5s video generation",
    badges: ["13 tok/s", "5s"],
    cost: 13,
    isNew: false,
    type: "video",
    capabilities: ["text-to-video", "image-to-video"],
  },
  {
    id: "seedance-pro",
    name: "Seedance Pro",
    iconComponent: Logos.Runway,
    iconColor: "text-purple-400",
    description: "Pro quality 5s generation",
    badges: ["15 tok/s", "5s"],
    cost: 15,
    isNew: false,
    type: "video",
    capabilities: ["text-to-video", "image-to-video"],
  },
  {
    id: "kling-v1",
    name: "Kling V1",
    iconComponent: Logos.Kling,
    iconColor: "text-orange-400",
    description: "Previous generation Kling model",
    badges: ["35 tok/s", "5-10s"],
    cost: 35,
    isNew: false,
    type: "video",
    capabilities: ["text-to-video", "image-to-video"],
  },*/
];

const ASPECT_RATIOS = [
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "21:9",
  "9:21",
  "3:2",
  "2:3",
  "5:4",
  "4:5",
];
const RESOLUTIONS = ["1K", "2K", "4K"];
const IMAGE_COUNTS = [1, 2, 3, 4];

function ModelCard({ model, isSelected, onSelect, duration }) {
  // Calcular el costo basado en el tipo de modelo

  return (
    <button
      type="button"
      onClick={() => onSelect(model.id)}
      className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 ${
        isSelected
          ? "border-[#DC569D] bg-[#DC569D]/10"
          : "border-gray-700/60 bg-[#1a1a1a]/90 hover:border-gray-600"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-lg font-bold ${model.iconColor} w-6 h-6 flex items-center justify-center`}
          >
            {model.iconComponent ? <model.iconComponent /> : model.icon}
          </span>
          <h3 className="text-white font-semibold text-base leading-tight">
            {model.name}
          </h3>
          {model.isNew && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F2D543] text-black uppercase tracking-wide">
              New
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 text-white uppercase tracking-wide shrink-0">
          {model.cost} {model.type === "video" ? "tok/s" : "tok/img"}
        </span>
      </div>
      <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
        {model.description}
      </p>
      <div className="flex gap-2 mt-3 flex-wrap">
        {model.badges.map((badge) => (
          <span
            key={badge}
            className="text-xs px-3 py-1 rounded-full bg-[#2a2a2a] text-gray-300 border border-gray-700/40"
          >
            {badge}
          </span>
        ))}
      </div>
    </button>
  );
}

// Custom Slider Component for voice settings
const VoiceSlider = ({ value, min, max, step, onChange, className = "" }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <div className={`relative w-full h-6 ${className}`}>
      <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-gray-700 rounded-full" />
      <div
        className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-[#DC569D] rounded-full"
        style={{ width: `${percentage}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#DC569D] rounded-full border-2 border-white shadow-md"
        style={{ left: `calc(${percentage}% - 7px)` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  );
};

const FilePreview = ({ file, onRemove }) => {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!previewUrl) return null;

  const isVideoFile = file.type.startsWith("video/");

  return (
    <div className="relative shrink-0 group">
      {isVideoFile ? (
        <video
          src={previewUrl}
          className="h-16 w-16 object-cover rounded-lg border border-gray-600"
          muted
          loop
          playsInline
        />
      ) : (
        <img
          src={previewUrl}
          alt="preview"
          className="h-16 w-16 object-cover rounded-lg border border-gray-600"
        />
      )}
      <button
        onClick={onRemove}
        className="absolute -top-1 -right-1 bg-black/80 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={12} />
      </button>
    </div>
  );
};

function AiLabModal({ isOpen, onClose }) {
  const [selectedModel, setSelectedModel] = useState("nano-banana-pro");
  const [selectedVideoModel, setSelectedVideoModel] = useState("sora-2-pro");
  const [showModels, setShowModels] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [showNegativePrompt, setShowNegativePrompt] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("2K");
  const [imageCount, setImageCount] = useState(1);
  const [duration, setDuration] = useState(5);
  const [availableDurations, setAvailableDurations] = useState([5, 10]);
  const [activeTab, setActiveTab] = useState("image"); // "image" | "video" | "voice"
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadingStatus, setUploadingStatus] = useState(""); // status text for loader
  const [generatedImages, setGeneratedImages] = useState([]);
  const [generationInfo, setGenerationInfo] = useState(null);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showAspectRatioMenu, setShowAspectRatioMenu] = useState(false);
  const [showDurationMenu, setShowDurationMenu] = useState(false);
  const [showConfirmGeneration, setShowConfirmGeneration] = useState(false);
  const [uploadedVideoDuration, setUploadedVideoDuration] = useState(0);
  const fileInputRef = useRef(null);

  // ====== VOICE TAB STATES ======
  const [voiceName, setVoiceName] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [textToSpeak, setTextToSpeak] = useState("");
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceCurrentTime, setVoiceCurrentTime] = useState(0);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [showVoiceCreator, setShowVoiceCreator] = useState(true);
  const [generatedVoiceData, setGeneratedVoiceData] = useState(null);
  const [isSavingVoice, setIsSavingVoice] = useState(false);
  const [uploadedVoiceUrl, setUploadedVoiceUrl] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [filteredVoices, setFilteredVoices] = useState([]);
  const [displayedVoices, setDisplayedVoices] = useState([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [voiceSearchTerm, setVoiceSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [voiceCurrentPage, setVoiceCurrentPage] = useState(1);
  const [isLoadingMoreVoices, setIsLoadingMoreVoices] = useState(false);
  const VOICES_PER_PAGE = 50;
  const [voiceTokens, setVoiceTokens] = useState(0);
  const [isLoadingVoiceTokens, setIsLoadingVoiceTokens] = useState(false);
  const [previewAudio, setPreviewAudio] = useState(null);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [elevenLabsModel, setElevenLabsModel] = useState(
    "eleven_multilingual_v2",
  );
  const [voiceSettings, setVoiceSettings] = useState({
    stability: 0.5,
    similarity_boost: 0.5,
    style: 0.0,
    use_speaker_boost: true,
  });
  const voiceAudioRef = useRef(null);

  // ====== VOICE HELPER FUNCTIONS ======
  const getVoiceId = (voice) => (voice ? voice.voice_id : null);
  const getVoiceAudioSample = (voice) => (voice ? voice.preview_url : null);
  const getVoiceName = (voice) => (voice ? voice.name : "Unknown Voice");
  const getVoiceLanguage = (voice) =>
    voice ? voice.labels?.language || "Multi" : "Unknown";
  const getVoiceGender = (voice) =>
    voice ? voice.labels?.gender || "Unknown" : "Unknown";
  const getVoiceAge = (voice) =>
    voice ? voice.labels?.age || "Unknown" : "Unknown";

  const fetchVoiceTokens = async () => {
    setIsLoadingVoiceTokens(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}users/tokens`,
        { headers: { Authorization: "Bearer " + Cookies.get("token") } },
      );
      const data = await response.json();
      if (response.ok) setVoiceTokens(parseFloat(data.data) || 0);
    } catch (error) {
      console.error("Error fetching tokens:", error);
    } finally {
      setIsLoadingVoiceTokens(false);
    }
  };

  const reduceVoiceTokens = async (tokensToReduce) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}tokens/reduce-tokens`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify({ tokens: tokensToReduce }),
        },
      );
      const data = await response.json();
      if (response.ok) {
        console.log(`Successfully reduced ${tokensToReduce} tokens`);
        fetchVoiceTokens();
      } else {
        console.error("Error reducing tokens:", data.message);
      }
    } catch (error) {
      console.error("Error reducing tokens:", error);
    }
  };

  const calculateRequiredVoiceTokens = () => {
    const charCount = textToSpeak ? textToSpeak.length : 0;
    if (charCount <= 500) return 1;
    return 8; // 500–999 characters
  };

  // Load voices when voice tab is active
  useEffect(() => {
    if (isOpen && activeTab === "voice") {
      loadVoices();
      fetchVoiceTokens();
    }
  }, [isOpen, activeTab]);

  // Voice filter and search logic
  useEffect(() => {
    let filtered = availableVoices.filter((voice) => voice != null);
    if (voiceSearchTerm) {
      filtered = filtered.filter((voice) =>
        getVoiceName(voice)
          .toLowerCase()
          .includes(voiceSearchTerm.toLowerCase()),
      );
    }
    if (languageFilter) {
      filtered = filtered.filter(
        (voice) => getVoiceLanguage(voice) === languageFilter,
      );
    }
    if (genderFilter) {
      filtered = filtered.filter(
        (voice) => getVoiceGender(voice) === genderFilter,
      );
    }
    if (ageFilter) {
      filtered = filtered.filter((voice) => getVoiceAge(voice) === ageFilter);
    }
    setFilteredVoices(filtered);
    setVoiceCurrentPage(1);
    setDisplayedVoices(filtered.slice(0, VOICES_PER_PAGE));
  }, [
    availableVoices,
    voiceSearchTerm,
    languageFilter,
    genderFilter,
    ageFilter,
  ]);

  const loadVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const result = await getElevenLabsVoices();
      if (result.success && Array.isArray(result.voices)) {
        setAvailableVoices(result.voices);
      } else {
        console.error("Error loading voices:", result.error);
        setAvailableVoices([]);
      }
    } catch (error) {
      console.error("Error loading voices:", error);
      setAvailableVoices([]);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const loadMoreVoicesHandler = () => {
    setIsLoadingMoreVoices(true);
    const nextPage = voiceCurrentPage + 1;
    const startIndex = nextPage * VOICES_PER_PAGE;
    const endIndex = startIndex + VOICES_PER_PAGE;
    const newVoices = filteredVoices.slice(startIndex, endIndex);
    setTimeout(() => {
      setDisplayedVoices((prev) => [...prev, ...newVoices]);
      setVoiceCurrentPage(nextPage);
      setIsLoadingMoreVoices(false);
    }, 500);
  };

  const getUniqueVoiceValues = (key) => {
    let values = [];
    availableVoices.forEach((voice) => {
      if (!voice) return;
      let value = null;
      switch (key) {
        case "language":
          value = getVoiceLanguage(voice);
          break;
        case "gender":
          value = getVoiceGender(voice);
          break;
        case "age":
          value = getVoiceAge(voice);
          break;
        default:
          value = voice[key];
      }
      if (value && value !== "Unknown" && !values.includes(value))
        values.push(value);
    });
    return values.sort();
  };

  const calculateEstimatedTime = (text) => {
    if (!text || text.trim().length === 0) {
      setEstimatedTime(0);
      return 0;
    }
    const charactersPerSecond = 10;
    const totalCharacters = text.length;
    const estimatedSeconds = totalCharacters / charactersPerSecond;
    const finalEstimatedSeconds = Math.max(estimatedSeconds, 2);
    setEstimatedTime(finalEstimatedSeconds);
    return finalEstimatedSeconds;
  };

  const handleVoiceTextChange = (text) => {
    setTextToSpeak(text);
    calculateEstimatedTime(text);
  };

  const handleVoiceSelect = (voice) => setSelectedVoice(voice);

  const playVoicePreview = async (voice) => {
    const audioSampleUrl = getVoiceAudioSample(voice);
    if (!audioSampleUrl) return;
    if (previewAudio) {
      previewAudio.pause();
      setPreviewAudio(null);
      setPlayingVoiceId(null);
    }
    try {
      const audio = new Audio(audioSampleUrl);
      audio.volume = 0.7;
      audio.onplay = () => setPlayingVoiceId(getVoiceId(voice));
      audio.onended = () => {
        setPlayingVoiceId(null);
        setPreviewAudio(null);
      };
      audio.onerror = () => {
        console.error("Error playing voice preview");
        setPlayingVoiceId(null);
        setPreviewAudio(null);
      };
      setPreviewAudio(audio);
      audio.play();
    } catch (error) {
      console.error("Error creating audio for preview:", error);
    }
  };

  const stopVoicePreview = () => {
    if (previewAudio) {
      previewAudio.pause();
      setPreviewAudio(null);
    }
    setPlayingVoiceId(null);
  };

  const handleGenerateVoice = async () => {
    if (!textToSpeak.trim() || !selectedVoice) {
      setError("Please select a voice and enter the text to generate.");
      return;
    }
    const voiceId = getVoiceId(selectedVoice);
    if (!voiceId) {
      setError("Selected voice does not have a valid ID.");
      return;
    }
    const requiredTokens = calculateRequiredVoiceTokens();
    if (voiceTokens < requiredTokens) {
      setError(
        `Insufficient tokens. You need ${requiredTokens} tokens but only have ${Math.floor(voiceTokens).toLocaleString("en-US")}.`,
      );
      return;
    }
    setIsGeneratingVoice(true);
    setError(null);
    try {
      const speechResult = await generateElevenLabsSpeech({
        text: textToSpeak,
        voiceId: voiceId,
        model_id: elevenLabsModel,
        ...voiceSettings,
      });
      if (!speechResult.success)
        throw new Error(`Error generating speech: ${speechResult.error}`);
      const actualDuration = speechResult.data.duration || estimatedTime;
      const tokensToReduce = calculateRequiredVoiceTokens();
      setGeneratedAudioUrl(speechResult.data.audioUrl);
      setVoiceDuration(actualDuration);
      setGeneratedVoiceData({
        audioUrl: speechResult.data.audioUrl,
        audioBlob: speechResult.data.audioBlob,
        playableAudioUrl: speechResult.data.audioUrl,
        duration: actualDuration,
        format: speechResult.data.format || "mp3",
        textUsed: textToSpeak,
        voiceUsed: selectedVoice,
        model_id: speechResult.data.model_id,
        voice_settings: speechResult.data.voice_settings,
      });
      setShowVoiceCreator(false);

      // Auto-upload to ai/upload-attachments with type audio
      try {
        const audioFile = new File(
          [speechResult.data.audioBlob],
          `voice-${Date.now()}.${speechResult.data.format || "mp3"}`,
          { type: speechResult.data.audioBlob.type || "audio/mpeg" },
        );
        const uploadedUrl = await uploadMediaToGCS(audioFile, "audio");
        console.log("Voice auto-uploaded:", uploadedUrl);
        setUploadedVoiceUrl(uploadedUrl);
      } catch (uploadErr) {
        console.warn("Auto-upload failed:", uploadErr);
      }

      // Reduce tokens after successful generation
      await reduceVoiceTokens(tokensToReduce);
    } catch (error) {
      console.error("Error generating voice:", error);
      setError(`Error generating voice: ${error.message}`);
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const handleDiscardVoice = () => {
    if (generatedAudioUrl && generatedAudioUrl.startsWith("blob:"))
      URL.revokeObjectURL(generatedAudioUrl);
    setShowVoiceCreator(true);
    setGeneratedVoiceData(null);
    setGeneratedAudioUrl(null);
    setIsPlayingVoice(false);
    setVoiceCurrentTime(0);
    setVoiceDuration(0);
    setUploadedVoiceUrl(null);
  };

  const resetVoiceStates = () => {
    if (generatedAudioUrl && generatedAudioUrl.startsWith("blob:"))
      URL.revokeObjectURL(generatedAudioUrl);
    setVoiceName("");
    setVoiceDescription("");
    setSelectedVoice(null);
    setTextToSpeak("");
    setGeneratedAudioUrl(null);
    setIsGeneratingVoice(false);
    setIsPlayingVoice(false);
    setVoiceCurrentTime(0);
    setVoiceDuration(0);
    setEstimatedTime(0);
    setVoiceSearchTerm("");
    setLanguageFilter("");
    setGenderFilter("");
    setAgeFilter("");
    setVoiceCurrentPage(1);
    setShowVoiceCreator(true);
    setGeneratedVoiceData(null);
    setIsSavingVoice(false);
    setUploadedVoiceUrl(null);
    stopVoicePreview();
    if (voiceAudioRef.current) voiceAudioRef.current.pause();
  };

  const toggleVoicePlayPause = () => {
    if (!voiceAudioRef.current || !generatedAudioUrl) return;
    if (isPlayingVoice) {
      voiceAudioRef.current.pause();
    } else {
      voiceAudioRef.current.play();
    }
    setIsPlayingVoice(!isPlayingVoice);
  };

  const handleVoiceTimeUpdate = () => {
    if (voiceAudioRef.current)
      setVoiceCurrentTime(voiceAudioRef.current.currentTime);
  };

  const handleVoiceLoadedMetadata = () => {
    if (voiceAudioRef.current) setVoiceDuration(voiceAudioRef.current.duration);
  };

  const handleVoiceSeek = (e) => {
    if (!voiceAudioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * voiceDuration;
    voiceAudioRef.current.currentTime = newTime;
    setVoiceCurrentTime(newTime);
  };

  const formatVoiceTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!isOpen) {
      setGeneratedImages([]);
      setGenerationInfo(null);
      setError(null);
      setFiles([]);
      setPrompt("");
      setNegativePrompt("");
      setPreviewImage(null);
      setIsGenerating(false);
      setUploadingStatus("");
      setShowConfirmGeneration(false);

      setGeneratedAudioUrl((prev) => {
        if (prev && prev.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
      setVoiceName("");
      setVoiceDescription("");
      setSelectedVoice(null);
      setTextToSpeak("");
      setGeneratedAudioUrl(null);
      setIsGeneratingVoice(false);
      setIsPlayingVoice(false);
      setVoiceCurrentTime(0);
      setVoiceDuration(0);
      setEstimatedTime(0);
      setVoiceSearchTerm("");
      setLanguageFilter("");
      setGenderFilter("");
      setAgeFilter("");
      setVoiceCurrentPage(1);
      setShowVoiceCreator(true);
      setGeneratedVoiceData(null);
      setIsSavingVoice(false);
      setUploadedVoiceUrl(null);

      setPreviewAudio((prev) => {
        if (prev) prev.pause();
        return null;
      });
      setPlayingVoiceId(null);

      if (voiceAudioRef.current) voiceAudioRef.current.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const currentModels = activeTab === "image" ? IMAGE_MODELS : VIDEO_MODELS;
  const currentModelId =
    activeTab === "image" ? selectedModel : selectedVideoModel;

  // Fallback if model not found in current list
  const selectedModelData =
    currentModels.find((m) => m.id === currentModelId) || currentModels[0];

  const handleDownloadImage = async (imgUrl, index) => {
    try {
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // Extract extension from mime type or url if possible, default to png
      const type = blob.type.split("/")[1] || "png";
      link.download = `generated-image-${Date.now()}-${index + 1}.${type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading image:", err);
    }
  };

  const handleRemoveGeneratedImage = (indexToRemove) => {
    setGeneratedImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  const extractVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      if (activeTab === "video") {
        if (files.length + newFiles.length > 1) {
          setError("Video generation only supports one reference file.");
          return;
        }
        const videoFile = newFiles.find((f) => f.type.startsWith("video/"));
        if (videoFile) {
          const dur = await extractVideoDuration(videoFile);
          setUploadedVideoDuration(Math.ceil(dur));
        }
      }
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files);
      const validFiles = dropped.filter((file) => {
        if (activeTab === "image") return file.type.startsWith("image/");
        return file.type.startsWith("image/") || file.type.startsWith("video/");
      });

      if (activeTab === "video" && files.length + validFiles.length > 1) {
        setError("Video generation only supports one reference file.");
        return;
      }

      // Check for video file and update duration
      if (activeTab === "video") {
        const videoFile = validFiles.find((f) => f.type.startsWith("video/"));
        if (videoFile) {
          extractVideoDuration(videoFile).then((dur) => {
            setUploadedVideoDuration(Math.ceil(dur));
          });
        }
      }

      setFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);
      // If we removed the only video file, reset duration logic if needed
      if (activeTab === "video" && !newFiles.some(f => f.type.startsWith("video/"))) {
         setUploadedVideoDuration(0);
      }
      return newFiles;
    });
  };

  const handleTabChange = (tab) => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    setFiles([]);
    setPrompt("");
    setGeneratedImages([]);
    setError(null);
    setGenerationInfo(null);

    // Actualizar duraciones disponibles al cambiar tab
    if (tab === "video") {
      const durations = MODEL_DURATIONS[selectedVideoModel] || [5, 10];
      setAvailableDurations(durations);
      if (!durations.includes(duration)) {
        setDuration(durations[0]);
      }
    }

    // Reset voice states when leaving voice tab
    if (activeTab === "voice" && tab !== "voice") {
      resetVoiceStates();
    }
  };

  // Función para actualizar duraciones cuando cambia el modelo de video
  const handleVideoModelChange = (modelId) => {
    setSelectedVideoModel(modelId);
    const durations = MODEL_DURATIONS[modelId] || [5, 10];
    setAvailableDurations(durations);
    // Si la duración actual no está disponible, usar la primera
    if (!durations.includes(duration)) {
      setDuration(durations[0]);
    }
    setShowModels(false);
  };

  const calculateTokenCost = () => {
    if (activeTab === "image") {
      const model = IMAGE_MODELS.find((m) => m.id === selectedModel);
      return (model?.cost || 10) * imageCount;
    } else {
      const model = VIDEO_MODELS.find((m) => m.id === selectedVideoModel);
      if (selectedVideoModel === "runway-aleph") {
        return (model?.cost || 10) * (uploadedVideoDuration || 5);
      }
      return (model?.cost || 10) * duration;
    }
  };

  const handleGenerateClick = () => {
    if (!prompt.trim() || isGenerating) return;

    if (
      selectedVideoModel === "runway-aleph" &&
      activeTab === "video" &&
      !files.some((f) => f.type.startsWith("video/"))
    ) {
      setError(
        "Runway Aleph requires a reference video for video-to-video generation.",
      );
      return;
    }

    setShowConfirmGeneration(true);
  };

  const handleConfirmGeneration = async () => {
    setShowConfirmGeneration(false);
    await handleGenerate();
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);
    setGenerationInfo(null);

    try {
      // Construir el prompt final con negative prompt si existe
      let finalPrompt = prompt.trim();
      if (negativePrompt.trim()) {
        finalPrompt += `. Negative Prompt: ${negativePrompt.trim()}`;
      }

      if (activeTab === "image") {
        // --- IMAGE GENERATION ---
        let type = 1; // 1 = Solo Texto
        let referenceImage = null;
        let referenceImages = null;

        if (files.length === 1) {
          type = 2; // 2 = Texto + Imagen
          setUploadingStatus("Uploading reference image...");
          referenceImage = await uploadMediaToGCS(files[0], "image");
        } else if (files.length > 1) {
          type = 3; // 3 = Texto + Múltiples imágenes
          setUploadingStatus(`Uploading ${files.length} reference images...`);
          referenceImages = await Promise.all(
            files.map((f) => uploadMediaToGCS(f, "image")),
          );
        }

        setUploadingStatus("Generating images...");
        const modelName = MODEL_MAP[selectedModel] || "Nano Banana";

        const result = await generateImagesAPI({
          model: modelName,
          type,
          prompt: finalPrompt,
          referenceImage,
          referenceImages,
          quantity: imageCount,
        });

        const images = result.images || [];
        setGeneratedImages(images);

        // Upload generated images to backend in background
        if (images.length > 0) {
          try {
            await Promise.all(
              images.map(async (img) => {
                const url = typeof img === "string" ? img : img.url;
                if (!url) return;
                try {
                  const response = await fetch(url);
                  const blob = await response.blob();
                  const filename = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
                  const file = new File([blob], filename, { type: blob.type });
                  await uploadMediaToGCS(file, "image");
                } catch (err) {
                  console.error("Failed to save generated image:", err);
                }
              }),
            );
          } catch (uploadErr) {
            console.error("Error in background save:", uploadErr);
          }
        }

        setGenerationInfo({
          tokensUsed: result.tokens_used,
          remainingTokens: result.remaining_tokens,
          message: result.message,
        });
      } else {
        // --- VIDEO GENERATION ---
        let referenceImage = null;
        let referenceVideo = null;
        let mediaUrl = null;

        const selectedModelData = VIDEO_MODELS.find(
          (m) => m.id === selectedVideoModel,
        );
        const capabilities = selectedModelData?.capabilities || [];

        if (files.length > 0) {
          setUploadingStatus("Uploading reference media...");
          const file = files[0];
          const isVideo = file.type.startsWith("video/");

          // Validar que el modelo soporte el tipo de entrada
          if (isVideo && !capabilities.includes("video-to-video")) {
            throw new Error(
              `${selectedModelData.name} does not support video-to-video. Please select an image or use a V2V model.`,
            );
          }

          const uploadedUrl = await uploadMediaToGCS(
            file,
            isVideo ? "video" : "image",
          );

          // Asignar al campo correcto según el modelo
          if (isVideo) {
            // Video-to-video
            if (selectedVideoModel === "runway-aleph") {
              referenceVideo = uploadedUrl;
            } else if (
              selectedVideoModel === "kling-v3-omni-std" ||
              selectedVideoModel === "kling-v3-omni-pro"
            ) {
              mediaUrl = uploadedUrl;
            } else {
              referenceVideo = uploadedUrl; // fallback
            }
          } else {
            // Image-to-video
            referenceImage = uploadedUrl;
          }
        }

        // Validar requisitos de modelos específicos
        if (selectedVideoModel === "runway-aleph" && !referenceVideo) {
          throw new Error(
            "Runway Aleph requires a video input (Video-to-Video only).",
          );
        }
        if (selectedVideoModel === "runway" && !referenceImage) {
          throw new Error(
            "Runway requires an image input (Image-to-Video only).",
          );
        }

        setUploadingStatus("Generating video...");

        // Determine effective duration for model
        let effectiveDuration = duration;
        if (selectedVideoModel === "runway-aleph" && uploadedVideoDuration) {
          effectiveDuration = uploadedVideoDuration;
        }

        const result = await generateVideoAPI({
          model: selectedVideoModel,
          prompt: finalPrompt,
          referenceImage,
          referenceVideo,
          mediaUrl,
          aspectRatio,
          duration: effectiveDuration,
        });

        // La respuesta del backend debe tener video_url
        const videoUrl = result.video_url;

        if (!videoUrl) {
          throw new Error("Video generation successful but no URL returned.");
        }

        setGeneratedImages([videoUrl]);

        // Background upload for video
        try {
          const response = await fetch(videoUrl);
          const blob = await response.blob();
          const filename = `gen-vid-${Date.now()}.mp4`;
          const file = new File([blob], filename, { type: blob.type });
          await uploadMediaToGCS(file, "video");
          console.log("Generated video saved to backend");
        } catch (err) {
          console.error("Failed to save generated video:", err);
        }

        setGenerationInfo({
          tokensUsed: result.tokens_used || "N/A",
          remainingTokens: result.remaining_tokens || "N/A",
          message: result.message || "Video generated successfully",
        });
      }

      // Clear prompt, negative prompt and files after success
      setPrompt("");
      setNegativePrompt("");
      setShowNegativePrompt(false);
      setFiles([]);
    } catch (err) {
      console.error("Generation error:", err);
      // Nice error message
      let msg = err.message || "An error occurred during generation";
      if (msg.includes("Insufficient tokens")) msg = "Insufficient tokens.";
      setError(msg);
    } finally {
      setIsGenerating(false);
      setUploadingStatus("");
    }
  };

  const toggleModels = () => setShowModels(!showModels);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center pb-6">
      {/* Backdrop */}
      <div className="absolute inset-0 backdrop-blur-xs" onClick={onClose} />

      {/* Modal - dynamic height */}
      <div
        className={`
          relative w-[95vw] max-w-4xl 
          bg-[#1c1c1c]/60 backdrop-blur-xl 
          rounded-2xl border border-white/10 shadow-2xl 
          flex flex-col overflow-hidden 
          transition-all duration-300 ease-in-out
          ${showModels || isGenerating || generatedImages.length > 0 || activeTab === "voice" ? "h-[600px]" : "h-auto"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60 shrink-0">
          <h2 className="text-white text-lg font-semibold flex items-center gap-2">
            AI Lab
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* ====== VOICE TAB CONTENT ====== */}
        {activeTab === "voice" && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Top bar: tokens + selected voice badge */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800/40">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-[#2a2a2a] px-3 py-1 rounded-full border border-gray-700/50">
                  <CreditCard size={12} className="text-[#DC569D]" />
                  <span className="text-xs text-gray-300 font-medium">
                    {isLoadingVoiceTokens
                      ? "..."
                      : Math.floor(voiceTokens).toLocaleString("en-US")}{" "}
                    tokens
                  </span>
                </div>
                {selectedVoice && (
                  <div className="flex items-center gap-1.5 bg-[#DC569D]/10 px-3 py-1 rounded-full border border-[#DC569D]/30">
                    <Mic size={12} className="text-[#DC569D]" />
                    <span className="text-xs text-[#DC569D] font-medium truncate max-w-[150px]">
                      {getVoiceName(selectedVoice)}
                    </span>
                  </div>
                )}
              </div>
              {!showVoiceCreator && (
                <div className="flex items-center gap-2">
                  {uploadedVoiceUrl && (
                    <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20 font-medium">
                      Uploaded
                    </span>
                  )}
                  <button
                    onClick={handleDiscardVoice}
                    className="px-3 py-1 bg-gray-700/80 text-white rounded-full hover:bg-gray-600 transition-colors text-xs font-medium flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> New
                  </button>
                </div>
              )}
            </div>

            {showVoiceCreator ? (
              /* ===== VOICE CREATOR: 2-column layout ===== */
              <div className="flex-1 flex overflow-hidden">
                {/* LEFT COLUMN: Voice library */}
                <div className="w-[340px] border-r border-gray-800/40 flex flex-col shrink-0">
                  {/* Search & Filters */}
                  <div className="px-4 pt-3 pb-2 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
                      <input
                        type="text"
                        placeholder="Search voices..."
                        value={voiceSearchTerm}
                        onChange={(e) => setVoiceSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-[#2a2a2a] border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:border-[#DC569D] focus:outline-none text-xs"
                      />
                    </div>
                    <div className="flex gap-1.5">
                      <select
                        value={languageFilter}
                        onChange={(e) => setLanguageFilter(e.target.value)}
                        className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-gray-700/50 rounded-lg text-white text-[10px] focus:border-[#DC569D] focus:outline-none"
                      >
                        <option value="">Language</option>
                        {getUniqueVoiceValues("language").map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                      </select>
                      <select
                        value={genderFilter}
                        onChange={(e) => setGenderFilter(e.target.value)}
                        className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-gray-700/50 rounded-lg text-white text-[10px] focus:border-[#DC569D] focus:outline-none"
                      >
                        <option value="">Gender</option>
                        {getUniqueVoiceValues("gender").map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                      <select
                        value={ageFilter}
                        onChange={(e) => setAgeFilter(e.target.value)}
                        className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-gray-700/50 rounded-lg text-white text-[10px] focus:border-[#DC569D] focus:outline-none"
                      >
                        <option value="">Age</option>
                        {getUniqueVoiceValues("age").map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Voice List */}
                  <div className="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
                    {isLoadingVoices ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2
                          size={20}
                          className="text-[#DC569D] animate-spin"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {displayedVoices
                          .filter((voice) => voice && getVoiceId(voice))
                          .map((voice) => (
                            <div
                              key={getVoiceId(voice)}
                              className={`px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                getVoiceId(selectedVoice) === getVoiceId(voice)
                                  ? "border-[#DC569D] bg-[#DC569D]/10"
                                  : "border-transparent hover:bg-[#2a2a2a]"
                              }`}
                              onClick={() => handleVoiceSelect(voice)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-medium text-xs truncate">
                                    {getVoiceName(voice)}
                                  </h4>
                                  <p className="text-gray-500 text-[10px] mt-0.5">
                                    {getVoiceLanguage(voice)} ·{" "}
                                    {getVoiceGender(voice)} ·{" "}
                                    {getVoiceAge(voice)}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (playingVoiceId === getVoiceId(voice))
                                      stopVoicePreview();
                                    else playVoicePreview(voice);
                                  }}
                                  className={`ml-2 p-1 rounded-full transition-colors shrink-0 ${
                                    playingVoiceId === getVoiceId(voice)
                                      ? "bg-[#DC569D] text-white"
                                      : "bg-gray-700/60 text-gray-400 hover:bg-gray-600 hover:text-white"
                                  }`}
                                >
                                  {playingVoiceId === getVoiceId(voice) ? (
                                    <Square className="w-3 h-3" />
                                  ) : (
                                    <Play className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        {filteredVoices.length > displayedVoices.length && (
                          <button
                            onClick={loadMoreVoicesHandler}
                            disabled={isLoadingMoreVoices}
                            className="w-full mt-2 px-3 py-1.5 bg-[#2a2a2a] text-gray-400 rounded-lg hover:bg-[#333] hover:text-white transition-colors text-xs font-medium disabled:opacity-50"
                          >
                            {isLoadingMoreVoices ? "Loading..." : "Load more"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: Config + Text + Generate */}
                <div className="flex-1 flex flex-col overflow-y-auto px-5 py-3 custom-scrollbar">
                  {/* Model & Settings - compact row */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <select
                        value={elevenLabsModel}
                        onChange={(e) => setElevenLabsModel(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-[#2a2a2a] border border-gray-700/50 rounded-lg text-white focus:border-[#DC569D] focus:outline-none text-xs"
                      >
                        <option value="eleven_multilingual_v2">
                          Multilingual v2 (HQ)
                        </option>
                        <option value="eleven_flash_v2_5">
                          Flash v2.5 (Fast)
                        </option>
                        <option value="eleven_turbo_v2_5">Turbo v2.5</option>
                        <option value="eleven_v3_alpha">
                          v3 Alpha (Expressive)
                        </option>
                      </select>
                      <label className="flex items-center gap-1.5 text-[10px] text-gray-400 shrink-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={voiceSettings.use_speaker_boost}
                          onChange={(e) =>
                            setVoiceSettings((prev) => ({
                              ...prev,
                              use_speaker_boost: e.target.checked,
                            }))
                          }
                          className="accent-[#DC569D] w-3 h-3"
                        />
                        Boost
                      </label>
                    </div>

                    {/* Sliders in a row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">
                          Stability{" "}
                          <span className="text-gray-600">
                            {voiceSettings.stability}
                          </span>
                        </label>
                        <VoiceSlider
                          min={0}
                          max={1}
                          step={0.1}
                          value={voiceSettings.stability}
                          onChange={(e) =>
                            setVoiceSettings((prev) => ({
                              ...prev,
                              stability: parseFloat(e.target.value),
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">
                          Similarity{" "}
                          <span className="text-gray-600">
                            {voiceSettings.similarity_boost}
                          </span>
                        </label>
                        <VoiceSlider
                          min={0}
                          max={1}
                          step={0.1}
                          value={voiceSettings.similarity_boost}
                          onChange={(e) =>
                            setVoiceSettings((prev) => ({
                              ...prev,
                              similarity_boost: parseFloat(e.target.value),
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">
                          Style{" "}
                          <span className="text-gray-600">
                            {voiceSettings.style}
                          </span>
                        </label>
                        <VoiceSlider
                          min={0}
                          max={1}
                          step={0.1}
                          value={voiceSettings.style}
                          onChange={(e) =>
                            setVoiceSettings((prev) => ({
                              ...prev,
                              style: parseFloat(e.target.value),
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Text Input */}
                  <div className="flex-1 flex flex-col mb-3">
                    <textarea
                      placeholder="Enter the text you want to convert to speech..."
                      value={textToSpeak}
                      onChange={(e) => handleVoiceTextChange(e.target.value)}
                      className="flex-1 min-h-[120px] p-3 bg-[#2a2a2a]/60 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-[#DC569D] focus:outline-none resize-none text-sm leading-relaxed"
                    />
                    {estimatedTime > 0 && (
                      <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />~
                          {Math.ceil(estimatedTime * 2)}s · {textToSpeak.length}{" "}
                          chars
                        </span>
                        <span className="text-[#DC569D] font-medium">
                          {calculateRequiredVoiceTokens()} tokens
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerateVoice}
                    disabled={
                      isGeneratingVoice ||
                      !textToSpeak.trim() ||
                      !selectedVoice ||
                      isLoadingVoices ||
                      voiceTokens < calculateRequiredVoiceTokens()
                    }
                    className="w-full px-4 py-2.5 bg-[#DC569D] text-white rounded-xl hover:bg-[#c44d8b] transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGeneratingVoice ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" /> Generate Voice
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* ===== GENERATED VOICE PLAYER ===== */
              <div className="flex-1 flex items-center justify-center px-6 py-6">
                <div className="w-full max-w-lg">
                  {/* Waveform-style player card */}
                  <div className="bg-[#1a1a1a]/80 rounded-2xl p-6 border border-gray-700/40">
                    <div className="flex items-center gap-4 mb-5">
                      <button
                        onClick={toggleVoicePlayPause}
                        disabled={!generatedAudioUrl}
                        className={`p-4 rounded-full transition-all shadow-lg ${
                          generatedAudioUrl
                            ? "bg-[#DC569D] text-white hover:bg-[#c44d8b] hover:scale-105"
                            : "bg-gray-700 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {isPlayingVoice ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6 ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm">
                          {selectedVoice
                            ? getVoiceName(selectedVoice)
                            : "Generated Voice"}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {elevenLabsModel
                            .replace("eleven_", "")
                            .replace(/_/g, " ")}{" "}
                          · {textToSpeak.length} chars
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {generatedAudioUrl && (
                          <a
                            href={generatedAudioUrl}
                            download={`voice-${Date.now()}.mp3`}
                            className="p-2 rounded-full bg-gray-700/60 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div
                      className="w-full h-2 bg-gray-700/60 rounded-full cursor-pointer relative overflow-hidden mb-2"
                      onClick={handleVoiceSeek}
                    >
                      <div
                        className="h-full bg-gradient-to-r from-[#DC569D] to-[#DC569D]/60 rounded-full transition-all duration-100"
                        style={{
                          width:
                            voiceDuration > 0
                              ? `${(voiceCurrentTime / voiceDuration) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span>{formatVoiceTime(voiceCurrentTime)}</span>
                      <span>{formatVoiceTime(voiceDuration)}</span>
                    </div>

                    {generatedAudioUrl && (
                      <audio
                        ref={voiceAudioRef}
                        src={generatedAudioUrl}
                        onTimeUpdate={handleVoiceTimeUpdate}
                        onLoadedMetadata={handleVoiceLoadedMetadata}
                        onEnded={() => setIsPlayingVoice(false)}
                        className="hidden"
                      />
                    )}
                  </div>

                  {/* Uploaded URL display */}
                  {uploadedVoiceUrl && (
                    <div className="mt-3 p-3 bg-green-400/5 rounded-xl border border-green-400/20">
                      <p className="text-[10px] text-green-400 font-medium mb-0.5">
                        Saved to attachments
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {uploadedVoiceUrl}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Center Content - Loader / Generated Images / Placeholder */}
        {activeTab !== "voice" &&
          !showModels &&
          !isGenerating &&
          generatedImages.length === 0 &&
          !error &&
          null}

        {/* Loader */}
        {activeTab !== "voice" && isGenerating && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-[#DC569D]/20 flex items-center justify-center">
                <Loader2 size={32} className="text-[#DC569D] animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-medium text-sm">
                {uploadingStatus || "Processing..."}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                This may take a moment
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && !isGenerating && !isGeneratingVoice && (
          <div className="px-6 py-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-red-400 text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Generated Images Gallery */}
        {activeTab !== "voice" &&
          generatedImages.length > 0 &&
          !isGenerating && (
            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
              {/* Token info bar */}
              {generationInfo && (
                <div className="flex items-center gap-3 mb-4 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#DC569D]/10 border border-[#DC569D]/30 text-[#DC569D]">
                    <Coins size={12} />
                    {generationInfo.tokensUsed} tokens used
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300">
                    <Coins size={12} />
                    {generationInfo.remainingTokens} remaining
                  </span>
                </div>
              )}

              {/* Images grid */}
              <div
                className={`grid gap-3 ${
                  generatedImages.length === 1
                    ? "grid-cols-1 max-w-md mx-auto"
                    : generatedImages.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-2 md:grid-cols-3"
                }`}
              >
                {generatedImages.map((item, index) => {
                  const url = typeof item === "string" ? item : item.url;
                  const isVideo =
                    url.endsWith(".mp4") ||
                    url.includes("video") ||
                    activeTab === "video";

                  return (
                    <div
                      key={index}
                      className="relative group rounded-xl overflow-hidden border border-gray-700/50 bg-[#1a1a1a]"
                    >
                      {isVideo ? (
                        <video
                          src={url}
                          controls
                          className="w-full h-auto object-cover"
                        />
                      ) : (
                        <img
                          src={url}
                          alt={`Generated ${index + 1}`}
                          className="w-full h-auto object-cover cursor-pointer"
                          loading="lazy"
                          onClick={() => setPreviewImage(url)}
                        />
                      )}

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 pointer-events-none">
                        <div className="flex justify-end pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => handleRemoveGeneratedImage(index)}
                            className="h-8 w-8 rounded-lg bg-red-500/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                            title="Remove"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div className="flex justify-end gap-2 pointer-events-auto mb-12">
                          {!isVideo && (
                            <button
                              type="button"
                              onClick={() => setPreviewImage(url)}
                              className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                              title="Preview"
                            >
                              <Image size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDownloadImage(url, index)}
                            className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                            title="Download"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* Models Grid - Toggle height and opacity */}
        {activeTab !== "voice" && (
          <div
            className={`overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${
              showModels
                ? "opacity-100 flex-1 px-6 py-4"
                : "opacity-0 h-0 overflow-hidden py-0 px-6"
            }`}
          >
            <div className="flex flex-col h-full">
              <h3 className="text-gray-400 text-sm font-medium mb-3 shrink-0">
                Select {activeTab === "video" ? "Video " : "Image "} Model
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                {currentModels.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isSelected={currentModelId === model.id}
                    duration={duration}
                    onSelect={(id) => {
                      if (activeTab === "image") {
                        setSelectedModel(id);
                        setShowModels(false);
                      } else {
                        handleVideoModelChange(id);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Area */}
        <div className="border-t border-gray-800/60 px-6 py-4 shrink-0 z-20">
          {/* Input row */}
          <div className="flex items-end gap-3">
            {/* Left action buttons */}
            <div className="flex flex-col gap-2 pb-1">
              <button
                type="button"
                onClick={() => handleTabChange("image")}
                className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-colors ${
                  activeTab === "image"
                    ? "border-[#DC569D] text-[#DC569D] bg-[#DC569D]/10"
                    : "border-gray-700 text-gray-400 hover:bg-[#2a2a2a] hover:text-white"
                }`}
                title="Generate Image"
              >
                <Image size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("video")}
                className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-colors ${
                  activeTab === "video"
                    ? "border-[#DC569D] text-[#DC569D] bg-[#DC569D]/10"
                    : "border-gray-700 text-gray-400 hover:bg-[#2a2a2a] hover:text-white"
                }`}
                title="Generate Video"
              >
                <Video size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("voice")}
                className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-colors ${
                  activeTab === "voice"
                    ? "border-[#DC569D] text-[#DC569D] bg-[#DC569D]/10"
                    : "border-gray-700 text-gray-400 hover:bg-[#2a2a2a] hover:text-white"
                }`}
                title="Create Voice"
              >
                <Mic size={16} />
              </button>
            </div>

            {/* Text input area - hidden when voice tab is active */}
            {activeTab !== "voice" && (
              <div className="flex-1 relative">
                <div
                  className={`rounded-2xl border transition-colors ${
                    isDragOver
                      ? "border-[#DC569D] bg-[#DC569D]/10"
                      : "border-gray-700/60 bg-[#2a2a2a]/60"
                  } px-4 py-3 min-h-[120px] flex flex-col`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {/* Negative Prompt Input */}
                  {showNegativePrompt && (
                    <div className="mb-3 pb-3 border-b border-gray-700/50">
                      <label className="text-gray-400 text-xs mb-1.5 block font-medium">
                        Negative Prompt
                      </label>
                      <input
                        type="text"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="List what to exclude from your video (e.g. if you don't want trees, type 'trees')"
                        className="w-full bg-[#1a1a1a] text-white placeholder:text-gray-600 outline-none text-sm px-3 py-2 rounded-lg border border-gray-700/50 focus:border-[#DC569D]/50 transition-colors"
                      />
                    </div>
                  )}

                  {/* Files Preview */}
                  {files.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-2 custom-scrollbar">
                      {files.map((file, index) => (
                        <FilePreview
                          key={index}
                          file={file}
                          onRemove={() => removeFile(index)}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 h-full">
                    {/* Upload image button inside input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept={
                        activeTab === "video" ? "image/*,video/*" : "image/*"
                      }
                      multiple={activeTab === "image"}
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 w-8 rounded-lg border border-dashed border-gray-600 text-gray-500 flex items-center justify-center hover:border-gray-400 hover:text-gray-300 transition-colors shrink-0 mt-1"
                      title={
                        activeTab === "video"
                          ? "Upload reference (video/image)"
                          : "Upload reference image"
                      }
                    >
                      <ImagePlus size={16} />
                    </button>

                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={
                        activeTab === "video"
                          ? "Describe the video you want to create"
                          : "Describe the image you want to create"
                      }
                      className="flex-1 bg-transparent text-white placeholder:text-gray-500 outline-none text-sm resize-none h-full min-h-[80px]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleGenerateClick();
                        }
                      }}
                    />

                    {/* Send button aligned to bottom */}
                    <div className="flex flex-col justify-end">
                      <button
                        type="button"
                        onClick={handleGenerateClick}
                        className={`h-9 w-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
                          isGenerating
                            ? "bg-[#DC569D]/50 text-white cursor-wait"
                            : prompt.trim()
                              ? "bg-[#DC569D] text-white hover:bg-[#c44d8b]"
                              : "bg-gray-600 text-gray-400 cursor-not-allowed"
                        }`}
                        disabled={!prompt.trim() || isGenerating}
                        title="Generate"
                      >
                        {isGenerating ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Send size={15} />
                        )}
                      </button>
                    </div>
                  </div>

                  {isDragOver && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#1c1c1c]/80 backdrop-blur-sm rounded-2xl z-10 pointer-events-none">
                      <div className="text-center">
                        <ImagePlus
                          size={32}
                          className="mx-auto text-[#DC569D] mb-2"
                        />
                        <p className="text-white font-medium">
                          Drop images here
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom toolbar - model info & settings */}
          {activeTab !== "voice" && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {/* Selected model pill */}
              <button
                onClick={toggleModels}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border font-medium transition-colors ${
                  showModels
                    ? "bg-[#DC569D] border-[#DC569D] text-white"
                    : "bg-[#0C0C0D] border-gray-700 text-white hover:bg-[#1a1a1a]"
                }`}
              >
                <span
                  className={`text-sm font-bold ${
                    showModels
                      ? "text-white"
                      : selectedModelData?.iconColor || "text-white"
                  } w-5 h-5 flex items-center justify-center`}
                >
                  {selectedModelData?.iconComponent ? (
                    <selectedModelData.iconComponent />
                  ) : (
                    selectedModelData?.icon || "●"
                  )}
                </span>
                {selectedModelData?.name || "Select model"}
              </button>

              {/* Negative Prompt Toggle */}
              <button
                type="button"
                onClick={() => setShowNegativePrompt(!showNegativePrompt)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border font-medium transition-colors ${
                  showNegativePrompt
                    ? "bg-[#DC569D] border-[#DC569D] text-white"
                    : "bg-[#2a2a2a] text-gray-300 border-gray-700/50 hover:bg-[#333]"
                }`}
                title="Negative Prompt"
              >
                <Ban size={12} />
                Negative Prompt
              </button>

              {/* Video Duration Selector */}
              {activeTab === "video" && (
                <div className="relative">
                  {selectedVideoModel === "runway-aleph" ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-[#2a2a2a] text-gray-300 border border-gray-700/50 cursor-not-allowed opacity-80">
                      <span className="text-[10px] uppercase font-bold text-gray-500">
                        DUR:
                      </span>
                      {uploadedVideoDuration > 0
                        ? `${uploadedVideoDuration}s`
                        : "Auto"}
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowDurationMenu(!showDurationMenu)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-[#2a2a2a] text-gray-300 border border-gray-700/50 cursor-pointer hover:bg-[#333] transition-colors"
                      >
                        <span className="text-[10px] uppercase font-bold text-gray-500">
                          DUR:
                        </span>
                        {duration}s
                  </button>

                      {showDurationMenu && (
                        <div className="absolute bottom-full mb-2 left-0 w-24 bg-[#1c1c1c] border border-gray-700 rounded-xl shadow-xl overflow-hidden py-1 z-50">
                          {availableDurations.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setDuration(opt);
                                setShowDurationMenu(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors ${
                                duration === opt
                                  ? "text-[#DC569D] font-medium"
                                  : "text-gray-300"
                              }`}
                            >
                              {opt}s
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Image count */}
              {/* Removed image count and resolution controls as requested by user */}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmGeneration && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-[#1c1c1c] border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#DC569D]/10 border-2 border-[#DC569D]/30 flex items-center justify-center mx-auto mb-4">
                <Coins size={32} className="text-[#DC569D]" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">
                Confirm Generation
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                This {activeTab} generation will use
              </p>
              <div className="bg-[#DC569D]/10 border border-[#DC569D]/30 rounded-xl px-6 py-4 mb-6">
                <p className="text-[#DC569D] text-3xl font-bold">
                  {Math.floor(calculateTokenCost()).toLocaleString("en-US")} Tokens
                </p>
                {activeTab === "video" && (
                  <p className="text-gray-400 text-xs mt-1">
                    {selectedModelData?.cost || 0} tokens/sec ×{" "}
                    {selectedVideoModel === "runway-aleph"
                      ? uploadedVideoDuration || 5
                      : duration}
                    s
                  </p>
                )}
                {activeTab === "image" && imageCount > 1 && (
                  <p className="text-gray-400 text-xs mt-1">
                    {selectedModelData?.cost || 10} tokens × {imageCount} images
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmGeneration(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-700/50 text-white hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmGeneration}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#DC569D] text-white hover:bg-[#c44d8b] transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          {/* Close on backdrop click */}
          <div
            className="absolute inset-0"
            onClick={() => setPreviewImage(null)}
          />

          <div className="relative max-w-[95vw] max-h-[95vh] flex flex-col items-center">
            {/* Image */}
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />

            {/* Actions */}
            <div className="mt-4 flex gap-4 pointer-events-auto">
              <button
                onClick={() =>
                  handleDownloadImage(
                    previewImage,
                    generatedImages.findIndex(
                      (img) =>
                        (typeof img === "string" ? img : img.url) ===
                        previewImage,
                    ),
                  )
                }
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
              >
                <Download size={16} />
                Download
              </button>
              <button
                onClick={() => setPreviewImage(null)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
              >
                <X size={16} />
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AiLabModal;
