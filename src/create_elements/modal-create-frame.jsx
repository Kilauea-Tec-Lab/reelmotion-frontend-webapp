import { useState, useEffect } from "react";
import {
  X,
  Users,
  MapPin,
  Upload,
  Image as ImageIcon,
  Sparkles,
  FileVideo,
  Layers,
  CreditCard,
} from "lucide-react";
import Cookies from "js-cookie";

function ModalCreateFrame({
  isOpen,
  onClose,
  projectId,
  spots,
  characters,
  existingFrames,
  onFrameCreated,
}) {
  const [frameName, setFrameName] = useState("");
  const [frameDescription, setFrameDescription] = useState("");
  const [creationMode, setCreationMode] = useState(""); // "upload", "existing", "ai"

  // Estados para modo AI
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [selectedImageStyle, setSelectedImageStyle] = useState("");
  const [aiModel, setAiModel] = useState("nano_banana"); // Modelo AI por defecto
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [imageGenerationError, setImageGenerationError] = useState(null);

  // Estados para modo upload
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);

  // Estados para modo existing frame
  const [selectedExistingFrame, setSelectedExistingFrame] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedExistingImageStyle, setSelectedExistingImageStyle] =
    useState("");
  const [existingAiModel, setExistingAiModel] = useState("nano_banana"); // Modelo AI por defecto para existing frame
  const [isGeneratingFromExisting, setIsGeneratingFromExisting] =
    useState(false);
  const [existingGeneratedImageUrl, setExistingGeneratedImageUrl] =
    useState(null);
  const [existingImageGenerationError, setExistingImageGenerationError] =
    useState(null);

  // Estados para aspect ratio y controles de tomas
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("16:9"); // 16:9 por defecto
  const [selectedCameraAngle, setSelectedCameraAngle] = useState("");
  const [selectedCameraShot, setSelectedCameraShot] = useState("");

  // Estado para el botón de submit
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Token system states
  const [tokens, setTokens] = useState(0);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  // Costos por modo de creación
  const MODE_COSTS = {
    existing: 10, // Use Another Frame
    ai: 15, // Create with AI
  };

  // Estilos de imagen disponibles
  const imageStyles = [
    {
      id: "hyper-realism",
      name: "Hyper-realism",
      prompt: `Hyper-realistic 8K image with ultra-realistic textures. The result must exactly match the provided reference images.Adjust the white balance so the image doesn’t look so yellow.`,
    },
    {
      id: "cartoon",
      name: "Cartoon",
      prompt: `Cartoon style, colorful and playful. The result must exactly match the provided reference images.`,
    },
    {
      id: "anime",
      name: "Anime",
      prompt: `Anime style, manga-inspired. The result must exactly match the provided reference images while drawn in detailed anime art.`,
    },
    {
      id: "oil-painting",
      name: "Oil Painting",
      prompt: `Oil painting style with classic brushstrokes. The result must exactly match the provided reference images while painted as an oil portrait.`,
    },
    {
      id: "watercolor",
      name: "Watercolor",
      prompt: `Watercolor painting style with soft colors. The result must exactly match the provided reference images while expressed in watercolor textures.`,
    },
    {
      id: "comic-book",
      name: "Comic Book",
      prompt: `Comic book style with bold lines and dynamic look. The result must exactly match the provided reference images while illustrated as a comic panel.`,
    },
    {
      id: "fantasy",
      name: "Fantasy Art",
      prompt: `Fantasy art style, magical and ethereal. The result must exactly match the provided reference images while placed in a fantasy setting.`,
    },
    {
      id: "cyberpunk",
      name: "Cyberpunk",
      prompt: `Cyberpunk style with neon lights and futuristic details. The result must exactly match the provided reference images while set in a sci-fi cityscape.`,
    },
  ];

  // Token management functions
  const fetchUserTokens = async () => {
    setIsLoadingTokens(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}users/tokens`,
        {
          headers: {
            Authorization: "Bearer " + Cookies.get("token"),
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        const newTokens = data.data || 0;
        console.log(`Fetched tokens from server: ${newTokens}`);
        setTokens(newTokens);
      }
    } catch (error) {
      console.error("Error fetching tokens:", error);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}users/get-user-info`,
        {
          headers: {
            Authorization: "Bearer " + Cookies.get("token"),
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setUserInfo(data.data || null);
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  // useEffect para cargar tokens y user info cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      fetchUserTokens();
      fetchUserInfo();
    }
  }, [isOpen]);

  // Opciones de aspect ratio
  const aspectRatioOptions = [
    {
      id: "16:9",
      name: "16:9 (Fullwidth/Desktop)",
      description: "Ideal for widescreen displays",
    },
    {
      id: "9:16",
      name: "9:16 (Mobile/Vertical)",
      description: "Ideal for mobile devices",
    },
  ];

  // Opciones de ángulos de cámara
  const cameraAngles = [
    { id: "front", name: "Front", description: "Front View Camera " },
    { id: "side", name: "Side", description: "Side View Camera" },
    { id: "back", name: "Back", description: "Back View Camera" },
    {
      id: "three-quarter",
      name: "Three Quarter",
      description: "Diagonal View",
    },
    { id: "low-angle", name: "Low Angle", description: "Camera Low Angle" },
    {
      id: "high-angle",
      name: "High Angle",
      description: "Camera High Angle",
    },
    { id: "bird-eye", name: "Bird Eye", description: "Sky Show" },
  ];

  // Opciones de tipos de toma
  const cameraShots = [
    { id: "close-up", name: "Close-up", description: "Close Up Shot" },
    { id: "medium-shot", name: "Medium shot", description: "Medium Shot" },
    { id: "long-shot", name: "Long shot", description: "General Shot" },
    {
      id: "extreme-close-up",
      name: "Extreme close-up",
      description: "Primerísimo primer plano",
    },
    { id: "full-shot", name: "Full shot", description: "Full Shot" },
    { id: "wide-shot", name: "Wide shot", description: "Great Full Shot" },
    {
      id: "over-shoulder",
      name: "Over shoulder",
      description: "Over the Shoulder",
    },
  ];

  const handleClose = () => {
    setFrameName("");
    setFrameDescription("");
    setCreationMode("");
    setSelectedCharacters([]);
    setSelectedSpot("");
    setImagePrompt("");
    setSelectedImageStyle("");
    setIsGeneratingImage(false);
    setGeneratedImageUrl(null);
    setImageGenerationError(null);
    setUploadedFile(null);
    setUploadPreview(null);
    setSelectedExistingFrame("");
    setCustomPrompt("");
    setSelectedExistingImageStyle("");
    setIsGeneratingFromExisting(false);
    setExistingGeneratedImageUrl(null);
    setExistingImageGenerationError(null);
    setSelectedAspectRatio("");
    setSelectedCameraAngle("");
    setSelectedCameraShot("");
    setIsSubmitting(false);
    onClose();
  };

  const handleCharacterToggle = (characterId) => {
    setSelectedCharacters((prev) => {
      if (prev.includes(characterId)) {
        return prev.filter((id) => id !== characterId);
      } else {
        return [...prev, characterId];
      }
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if it's a video file
      if (file.type.startsWith("video/")) {
        // Create a video element to check duration
        const video = document.createElement("video");
        video.preload = "metadata";

        video.onloadedmetadata = () => {
          // Release the video element
          window.URL.revokeObjectURL(video.src);

          // Check if duration is more than 10 seconds
          if (video.duration > 10) {
            alert(
              "Video duration must be 10 seconds or less. Please select a shorter video."
            );
            event.target.value = ""; // Clear the input
            return;
          }

          // If duration is valid, proceed with upload
          setUploadedFile(file);
          setUploadPreview(window.URL.createObjectURL(file));
        };

        video.onerror = () => {
          alert("Error loading video file. Please try a different file.");
          event.target.value = ""; // Clear the input
          window.URL.revokeObjectURL(video.src);
        };

        video.src = window.URL.createObjectURL(file);
      } else {
        // For image files, proceed normally
        setUploadedFile(file);

        // Crear preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadPreview(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const createFinalPrompt = () => {
    const basePrompt = imagePrompt.trim();
    const stylePrompt = selectedImageStyle
      ? imageStyles?.find((style) => style.id === selectedImageStyle)?.prompt ||
        ""
      : "";

    // Agregar controles de cámara al prompt
    let cameraPrompt = "";
    if (selectedCameraAngle) {
      const angleData = cameraAngles.find(
        (angle) => angle.id === selectedCameraAngle
      );
      cameraPrompt += `. Camera angle: ${angleData?.name} (${angleData?.description})`;
    }
    if (selectedCameraShot) {
      const shotData = cameraShots.find(
        (shot) => shot.id === selectedCameraShot
      );
      cameraPrompt += `. Camera shot: ${shotData?.name} (${shotData?.description})`;
    }

    return (
      basePrompt +
      (stylePrompt ? ". The style is: " + stylePrompt : "") +
      cameraPrompt
    );
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || !selectedAspectRatio) {
      setImageGenerationError(
        "Por favor, ingresa un prompt y selecciona el aspect ratio."
      );
      return;
    }

    // Validar tokens suficientes para AI (15 tokens)
    const requiredTokens = MODE_COSTS["ai"];
    if (tokens < requiredTokens) {
      setImageGenerationError(
        `Insufficient tokens. You need ${requiredTokens} tokens but only have ${Math.floor(
          tokens
        ).toLocaleString("en-US")}.`
      );
      return;
    }

    setIsGeneratingImage(true);
    setImageGenerationError(null);

    try {
      const finalPrompt = createFinalPrompt();
      const payload = {
        prompt: finalPrompt,
        ai_model: aiModel, // Agregar modelo AI
        characters: selectedCharacters, // Opcional
        spot: selectedSpot, // Opcional
        aspect_ratio: selectedAspectRatio,
        camera_angle: selectedCameraAngle,
        camera_shot: selectedCameraShot,
        project_id: projectId,
      };

      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}ai/create-scene-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json();

      if (
        responseData &&
        responseData.success &&
        responseData.data &&
        responseData.data.image_base64
      ) {
        const base64Image = `data:image/jpeg;base64,${responseData.data.image_base64}`;
        setGeneratedImageUrl(base64Image);
        setImageGenerationError(null);

        // Refrescar tokens desde el servidor después de generación exitosa (AI)
        console.log(
          "Frame AI generation successful, refreshing tokens from server..."
        );
        fetchUserTokens();
      } else {
        let errorMessage = "Error generating image. Please try again.";
        if (responseData && responseData.message) {
          const message = responseData.message;
          if (
            message.includes("moderation_blocked") ||
            message.includes("safety system")
          ) {
            errorMessage =
              "Your content was blocked by the AI safety system. Please try rephrasing your description with different words or avoid potentially sensitive content.";
          } else if (message.includes("rate_limit")) {
            errorMessage =
              "Rate limit exceeded. Please wait a moment and try again.";
          } else if (
            message.includes("insufficient_quota") ||
            message.includes("billing")
          ) {
            errorMessage =
              "Service temporarily unavailable. Please try again later.";
          } else {
            errorMessage = `Generation failed: ${message.split("\n")[0]}`;
          }
        }
        setImageGenerationError(errorMessage);
      }
    } catch (error) {
      console.error("Error generating image:", error);
      setImageGenerationError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateFromExisting = async () => {
    if (
      !selectedExistingFrame ||
      !customPrompt.trim() ||
      !selectedAspectRatio
    ) {
      setExistingImageGenerationError(
        "Por favor, completa el prompt y selecciona el aspect ratio."
      );
      return;
    }

    // Validar tokens suficientes para usar otro frame (10 tokens)
    const requiredTokens = MODE_COSTS["existing"];
    if (tokens < requiredTokens) {
      setExistingImageGenerationError(
        `Insufficient tokens. You need ${requiredTokens} tokens but only have ${Math.floor(
          tokens
        ).toLocaleString("en-US")}.`
      );
      return;
    }

    setIsGeneratingFromExisting(true);
    setExistingImageGenerationError(null);

    try {
      const selectedFrameData = existingFrames.find(
        (frame) => frame.id.toString() === selectedExistingFrame
      );

      const stylePrompt = selectedExistingImageStyle
        ? imageStyles?.find((style) => style.id === selectedExistingImageStyle)
            ?.prompt || ""
        : "";

      // Agregar controles de cámara al prompt
      let cameraPrompt = "";
      if (selectedCameraAngle) {
        const angleData = cameraAngles.find(
          (angle) => angle.id === selectedCameraAngle
        );
        cameraPrompt += `. Camera angle: ${angleData?.name} (${angleData?.description})`;
      }
      if (selectedCameraShot) {
        const shotData = cameraShots.find(
          (shot) => shot.id === selectedCameraShot
        );
        cameraPrompt += `. Camera shot: ${shotData?.name} (${shotData?.description})`;
      }

      const finalPrompt =
        customPrompt.trim() +
        (stylePrompt ? ". The style is: " + stylePrompt : "") +
        cameraPrompt;

      const payload = {
        prompt: finalPrompt,
        ai_model: existingAiModel, // Agregar modelo AI
        image_url: selectedFrameData?.media_url,
        aspect_ratio: selectedAspectRatio,
        camera_angle: selectedCameraAngle,
        camera_shot: selectedCameraShot,
      };

      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}ai/create-scene-by-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json();

      if (
        responseData &&
        responseData.success &&
        responseData.data &&
        responseData.data.image_base64
      ) {
        const base64Image = `data:image/jpeg;base64,${responseData.data.image_base64}`;
        setExistingGeneratedImageUrl(base64Image);
        setExistingImageGenerationError(null);

        // Refrescar tokens desde el servidor después de generación exitosa (Use Another Frame)
        console.log(
          "Frame existing generation successful, refreshing tokens from server..."
        );
        fetchUserTokens();
      } else {
        let errorMessage = "Error generating image. Please try again.";
        if (responseData && responseData.message) {
          const message = responseData.message;
          if (
            message.includes("moderation_blocked") ||
            message.includes("safety system")
          ) {
            errorMessage =
              "Your content was blocked by the AI safety system. Please try rephrasing your description with different words or avoid potentially sensitive content.";
          } else if (message.includes("rate_limit")) {
            errorMessage =
              "Rate limit exceeded. Please wait a moment and try again.";
          } else if (
            message.includes("insufficient_quota") ||
            message.includes("billing")
          ) {
            errorMessage =
              "Service temporarily unavailable. Please try again later.";
          } else {
            errorMessage = `Generation failed: ${message.split("\n")[0]}`;
          }
        }
        setExistingImageGenerationError(errorMessage);
      }
    } catch (error) {
      console.error("Error generating image from existing frame:", error);
      setExistingImageGenerationError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsGeneratingFromExisting(false);
    }
  };

  const handleSubmit = async () => {
    if (!frameName.trim() || !frameDescription.trim() || !creationMode) return;

    setIsSubmitting(true);

    let frameData = {
      name: frameName,
      description: frameDescription,
      project_id: projectId,
      creation_mode: creationMode,
    };

    // Agregar datos específicos según el modo
    if (creationMode === "ai" && generatedImageUrl) {
      frameData.image_base64 = generatedImageUrl.replace(
        "data:image/jpeg;base64,",
        ""
      );
      frameData.characters = selectedCharacters;
      frameData.spot = selectedSpot;
      frameData.prompt = imagePrompt;
      frameData.media_type = "image"; // AI siempre genera imágenes
    } else if (creationMode === "upload" && uploadedFile) {
      // Determinar el tipo de media basado en el archivo
      let mediaType = "image"; // default
      if (uploadedFile.type.startsWith("video/")) {
        mediaType = "video";
      } else if (uploadedFile.type.startsWith("image/")) {
        mediaType = "image";
      }

      frameData.media_type = mediaType;

      // Convertir archivo a base64
      const reader = new FileReader();
      reader.onload = async () => {
        frameData.image_base64 = reader.result.split(",")[1]; // Remover prefijo
        await submitFrame(frameData);
      };
      reader.readAsDataURL(uploadedFile);
      return;
    } else if (creationMode === "existing" && selectedExistingFrame) {
      if (existingGeneratedImageUrl) {
        // Si se generó una nueva imagen con IA, usar esa
        frameData.image_base64 = existingGeneratedImageUrl.replace(
          "data:image/jpeg;base64,",
          ""
        );
        frameData.source_frame_id = selectedExistingFrame;
        frameData.custom_prompt = customPrompt;
        frameData.media_type = "image"; // IA siempre genera imágenes
      } else {
        // Si no se generó nueva imagen, solo referenciar el frame existente
        frameData.source_frame_id = selectedExistingFrame;
        frameData.custom_prompt = customPrompt;
        frameData.media_type = "iframe"; // Reutilización de frame existente
      }
    }

    await submitFrame(frameData);
  };

  const submitFrame = async (frameData) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}projects/create-frame`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify(frameData),
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        if (onFrameCreated) {
          onFrameCreated(responseData.data);
        }
        handleClose();
      } else {
        console.error("Error creating frame:", responseData);
      }
    } catch (error) {
      console.error("Error creating frame:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedCharacterNames = characters
    .filter((char) => selectedCharacters.includes(char.id))
    .map((char) => char.name)
    .join(", ");

  const selectedSpotData = spots.find(
    (spot) => spot.id.toString() === selectedSpot
  );

  return (
    <div className="fixed inset-0 bg-[#00000091] bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-darkBox rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold text-white montserrat-medium">
            Create Key Frame
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Creation Mode Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-4 montserrat-regular">
              How do you want to create the frame? *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Upload Frame */}
              <div
                onClick={() => setCreationMode("upload")}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  creationMode === "upload"
                    ? "border-[#F2D543] bg-[#F2D54315]"
                    : "border-gray-600 hover:border-gray-500 hover:bg-darkBoxSub"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`p-3 rounded-lg ${
                      creationMode === "upload"
                        ? "bg-[#F2D543] text-primarioDark"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium text-white montserrat-medium text-sm">
                      Upload Frame
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Upload a photo or video
                    </p>
                  </div>
                </div>
              </div>

              {/* Use Existing Frame */}
              <div
                onClick={() => setCreationMode("existing")}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  creationMode === "existing"
                    ? "border-[#F2D543] bg-[#F2D54315]"
                    : "border-gray-600 hover:border-gray-500 hover:bg-darkBoxSub"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`p-3 rounded-lg ${
                      creationMode === "existing"
                        ? "bg-[#F2D543] text-primarioDark"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    <Layers className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium text-white montserrat-medium text-sm">
                      Use Another Frame
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Select and modify existing frame
                    </p>
                  </div>
                </div>
              </div>

              {/* Create with AI */}
              <div
                onClick={() => setCreationMode("ai")}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  creationMode === "ai"
                    ? "border-[#F2D543] bg-[#F2D54315]"
                    : "border-gray-600 hover:border-gray-500 hover:bg-darkBoxSub"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`p-3 rounded-lg ${
                      creationMode === "ai"
                        ? "bg-[#F2D543] text-primarioDark"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium text-white montserrat-medium text-sm">
                      Create with AI
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Generate with AI assistance
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Mode Content */}
          {creationMode === "upload" && (
            <div className="mb-6 p-4 bg-darkBoxSub rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-4 h-4 text-[#F2D543]" />
                <h3 className="text-white montserrat-medium text-sm">
                  Upload Your Frame
                </h3>
              </div>

              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <FileVideo className="w-12 h-12 text-gray-400" />
                  <div>
                    <p className="text-white montserrat-medium">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      PNG, JPG, GIF, MP4 up to 10MB (videos max 10 seconds)
                    </p>
                  </div>
                </label>
              </div>

              {uploadPreview && (
                <div className="mt-4">
                  <p className="text-white montserrat-medium text-sm mb-2">
                    Preview:
                  </p>
                  {uploadedFile?.type?.startsWith("video/") ? (
                    <video
                      src={uploadPreview}
                      controls
                      className="w-full max-h-[512px] rounded-lg bg-black"
                    />
                  ) : (
                    <img
                      src={uploadPreview}
                      alt="Upload preview"
                      className="w-full max-h-[512px] object-contain rounded-lg bg-black"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Existing Frame Mode Content */}
          {creationMode === "existing" && (
            <div className="mb-6 p-4 bg-darkBoxSub rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-[#F2D543]" />
                <h3 className="text-white montserrat-medium text-sm">
                  Select Existing Frame
                </h3>
              </div>

              {/* AI Model Selection for Existing Frame */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                  AI Model *
                </label>
                <select
                  value={existingAiModel}
                  onChange={(e) => setExistingAiModel(e.target.value)}
                  className="w-full px-4 py-3 bg-darkBox rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular"
                >
                  <option value="nano_banana" className="bg-darkBox text-white">
                    Nano Banana
                  </option>
                  <option value="sora" className="bg-darkBox text-white">
                    Sora
                  </option>
                </select>
              </div>

              {existingFrames && existingFrames.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {existingFrames.map((frame) => (
                      <div
                        key={frame.id}
                        onClick={() =>
                          setSelectedExistingFrame(frame.id.toString())
                        }
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedExistingFrame === frame.id.toString()
                            ? "border-[#F2D543] bg-[#F2D54315]"
                            : "border-gray-600 hover:border-gray-500 hover:bg-darkBox"
                        }`}
                      >
                        <div className="aspect-video bg-gray-800 rounded mb-2 flex items-center justify-center overflow-hidden">
                          {frame.media_url || frame.image_url ? (
                            frame?.media_type === "video" ||
                            frame?.type === "video" ? (
                              <video
                                src={frame.media_url || frame.image_url}
                                className="w-full h-full object-cover rounded"
                                muted
                                loop
                                preload="metadata"
                              />
                            ) : (
                              <img
                                src={frame.media_url || frame.image_url}
                                alt={frame.name}
                                className="w-full h-full object-cover rounded"
                              />
                            )
                          ) : (
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <p className="text-white text-xs montserrat-medium truncate">
                          {frame.name}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Select Image Style */}
                  {selectedExistingFrame && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-white mb-3 montserrat-regular">
                        Select Image Style
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {imageStyles.map((style) => (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() =>
                              setSelectedExistingImageStyle(
                                style.id === selectedExistingImageStyle
                                  ? ""
                                  : style.id
                              )
                            }
                            className={`p-2 rounded-lg text-xs montserrat-regular transition-all ${
                              selectedExistingImageStyle === style.id
                                ? "bg-[#F2D543] text-black"
                                : "bg-darkBox text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-600"
                            }`}
                          >
                            {style.name}
                          </button>
                        ))}
                      </div>
                      {selectedExistingImageStyle && (
                        <p className="mt-2 text-sm text-[#F2D543] montserrat-regular">
                          Selected style:{" "}
                          {
                            imageStyles.find(
                              (s) => s.id === selectedExistingImageStyle
                            )?.name
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {/* Select Aspect Ratio - REQUIRED */}
                  {selectedExistingFrame && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-white mb-3 montserrat-regular">
                        Select Aspect Ratio *
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aspectRatioOptions.map((option) => (
                          <div
                            key={option.id}
                            onClick={() => setSelectedAspectRatio(option.id)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedAspectRatio === option.id
                                ? "border-[#F2D543] bg-[#F2D54315]"
                                : "border-gray-600 hover:border-gray-500 hover:bg-darkBox"
                            }`}
                          >
                            <div className="text-center">
                              <h3 className="font-medium text-white montserrat-medium text-sm mb-1">
                                {option.name}
                              </h3>
                              <p className="text-xs text-gray-400">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {selectedAspectRatio && (
                        <p className="mt-2 text-sm text-[#F2D543] montserrat-regular">
                          Selected:{" "}
                          {
                            aspectRatioOptions.find(
                              (opt) => opt.id === selectedAspectRatio
                            )?.name
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {/* Camera Controls - Always show if frame is selected */}
                  {selectedExistingFrame && (
                    <div className="mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Camera Angle */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                            Camera Angle (Optional)
                          </label>
                          <select
                            value={selectedCameraAngle}
                            onChange={(e) =>
                              setSelectedCameraAngle(e.target.value)
                            }
                            className="w-full px-3 py-2 bg-darkBox border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent"
                          >
                            <option value="">Select angle...</option>
                            {cameraAngles.map((angle) => (
                              <option key={angle.id} value={angle.id}>
                                {angle.name} - {angle.description}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Camera Shot */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                            Camera Shot (Optional)
                          </label>
                          <select
                            value={selectedCameraShot}
                            onChange={(e) =>
                              setSelectedCameraShot(e.target.value)
                            }
                            className="w-full px-3 py-2 bg-darkBox border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent"
                          >
                            <option value="">Select shot type...</option>
                            {cameraShots.map((shot) => (
                              <option key={shot.id} value={shot.id}>
                                {shot.name} - {shot.description}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {(selectedCameraAngle || selectedCameraShot) && (
                        <p className="mt-2 text-sm text-[#F2D543] montserrat-regular">
                          Camera settings:{" "}
                          {selectedCameraAngle &&
                            cameraAngles.find(
                              (a) => a.id === selectedCameraAngle
                            )?.name}
                          {selectedCameraAngle && selectedCameraShot && ", "}
                          {selectedCameraShot &&
                            cameraShots.find((s) => s.id === selectedCameraShot)
                              ?.name}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                      Custom Prompt (Optional)
                    </label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => {
                        setCustomPrompt(e.target.value);
                        if (existingImageGenerationError) {
                          setExistingImageGenerationError(null);
                        }
                      }}
                      placeholder="Add modifications or new prompt for this frame..."
                      rows={3}
                      className="w-full px-4 py-3 bg-darkBox rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular resize-none"
                    />
                  </div>

                  {/* AI Enhancement Section - Only show if frame is selected */}
                  {selectedExistingFrame && selectedAspectRatio && (
                    <div className="mt-6 p-4 bg-darkBox rounded-lg border border-gray-600">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-[#F2D543]" />
                        <h3 className="text-white montserrat-medium text-sm">
                          AI Enhancement (Optional)
                        </h3>
                      </div>

                      {!existingGeneratedImageUrl && (
                        <>
                          {/* Style Selection for Existing Frame */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-white mb-3 montserrat-regular">
                              Select Style (Optional)
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {imageStyles.map((style) => (
                                <button
                                  key={style.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedExistingImageStyle(
                                      style.id === selectedExistingImageStyle
                                        ? ""
                                        : style.id
                                    )
                                  }
                                  className={`p-2 border rounded-lg text-xs transition-all ${
                                    selectedExistingImageStyle === style.id
                                      ? "border-[#F2D543] bg-[#F2D54315] text-[#F2D543]"
                                      : "border-gray-600 hover:border-gray-500 hover:bg-darkBoxSub text-gray-300"
                                  }`}
                                >
                                  {style.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Token Information for Use Another Frame */}
                          <div className="mb-4 bg-darkBoxSub p-4 rounded-lg border border-gray-600">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-[#F2D543]" />
                                <span className="text-white text-sm font-medium montserrat-medium">
                                  Current Tokens:
                                </span>
                              </div>
                              <span className="text-[#F2D543] text-sm font-semibold montserrat-medium">
                                {isLoadingTokens
                                  ? "..."
                                  : Math.floor(tokens).toLocaleString("en-US")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-sm montserrat-regular">
                                Cost (Use Another Frame -{" "}
                                {existingAiModel === "sora"
                                  ? "Sora"
                                  : "Nano Banana"}
                                ):
                              </span>
                              <span className="text-white text-sm font-medium montserrat-medium">
                                {MODE_COSTS["existing"]} tokens
                              </span>
                            </div>
                            {tokens < MODE_COSTS["existing"] && (
                              <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                                <p className="text-red-400 text-xs montserrat-regular text-center">
                                  Insufficient tokens for generation
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Generate Enhanced Frame Button */}
                          <button
                            type="button"
                            onClick={handleGenerateFromExisting}
                            disabled={
                              isGeneratingFromExisting ||
                              !selectedExistingFrame ||
                              !selectedAspectRatio ||
                              !customPrompt.trim() ||
                              tokens < MODE_COSTS["existing"]
                            }
                            className={`w-full px-4 py-3 rounded-lg transition-all duration-300 font-medium montserrat-medium flex items-center justify-center gap-2 ${
                              isGeneratingFromExisting ||
                              !selectedExistingFrame ||
                              !selectedAspectRatio ||
                              !customPrompt.trim() ||
                              tokens < MODE_COSTS["existing"]
                                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                : "bg-purple-600 text-white hover:bg-purple-700"
                            }`}
                          >
                            {isGeneratingFromExisting ? (
                              <>
                                <div className="relative">
                                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                <span className="animate-pulse">
                                  Generating enhanced frame...
                                </span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                Generate Enhanced Frame
                              </>
                            )}
                          </button>

                          {/* Error Message for Enhancement */}
                          {existingImageGenerationError && (
                            <div className="mt-3 p-3 bg-red-900 bg-opacity-20 border border-red-600 rounded-lg">
                              <p className="text-red-400 text-sm montserrat-regular">
                                {existingImageGenerationError}
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Enhanced Image Preview */}
                      {existingGeneratedImageUrl && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white montserrat-medium text-sm">
                              Enhanced Frame
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setExistingGeneratedImageUrl(null);
                                setExistingImageGenerationError(null);
                              }}
                              className="text-red-400 hover:text-red-300 text-sm montserrat-regular"
                            >
                              Discard & Use Original
                            </button>
                          </div>
                          <img
                            src={existingGeneratedImageUrl}
                            alt="Enhanced frame"
                            className="w-full max-h-[512px] object-contain rounded-lg bg-black"
                          />
                          <p className="mt-2 text-green-400 text-sm montserrat-regular">
                            ✓ Frame enhanced successfully!
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400 montserrat-regular">
                    No existing frames found in this project
                  </p>
                </div>
              )}
            </div>
          )}

          {/* AI Mode Content */}
          {creationMode === "ai" && (
            <>
              {/* AI Model Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                  AI Model *
                </label>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular"
                >
                  <option
                    value="nano_banana"
                    className="bg-darkBoxSub text-white"
                  >
                    Nano Banana
                  </option>
                  <option value="sora" className="bg-darkBoxSub text-white">
                    Sora
                  </option>
                </select>
              </div>

              {/* Character Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                  Select Characters (Optional)
                </label>
                <p className="text-xs text-gray-400 mb-4 montserrat-regular">
                  You can select characters only, spot only, or both for
                  keyframe generation
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {characters.map((character) => (
                    <div
                      key={character.id}
                      onClick={() => handleCharacterToggle(character.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedCharacters.includes(character.id)
                          ? "border-[#F2D543] bg-[#F2D54315]"
                          : "border-gray-600 hover:border-gray-500 hover:bg-darkBoxSub"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            selectedCharacters.includes(character.id)
                              ? "bg-[#F2D543] text-primarioDark"
                              : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white montserrat-medium text-sm">
                            {character.name}
                          </h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedCharacters.length > 0 && (
                  <p className="mt-2 text-sm text-[#F2D543] montserrat-regular">
                    Selected: {selectedCharacterNames}
                  </p>
                )}
              </div>

              {/* Spot Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-4 montserrat-regular">
                  Select Spot/Location (Optional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {spots.map((spot) => (
                    <div
                      key={spot.id}
                      onClick={() => setSelectedSpot(spot.id.toString())}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedSpot === spot.id.toString()
                          ? "border-[#F2D543] bg-[#F2D54315]"
                          : "border-gray-600 hover:border-gray-500 hover:bg-darkBoxSub"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            selectedSpot === spot.id.toString()
                              ? "bg-[#F2D543] text-primarioDark"
                              : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white montserrat-medium text-sm">
                            {spot.name}
                          </h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio Selection - REQUIRED */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-4 montserrat-regular">
                  Select Aspect Ratio *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aspectRatioOptions.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => setSelectedAspectRatio(option.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedAspectRatio === option.id
                          ? "border-[#F2D543] bg-[#F2D54315]"
                          : "border-gray-600 hover:border-gray-500 hover:bg-darkBoxSub"
                      }`}
                    >
                      <div className="text-center">
                        <h3 className="font-medium text-white montserrat-medium text-sm mb-1">
                          {option.name}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedAspectRatio && (
                  <p className="mt-2 text-sm text-[#F2D543] montserrat-regular">
                    Selected:{" "}
                    {
                      aspectRatioOptions.find(
                        (opt) => opt.id === selectedAspectRatio
                      )?.name
                    }
                  </p>
                )}
              </div>

              {/* Step 1: Image Generation Section */}
              <div className="mb-6 p-4 bg-darkBoxSub rounded-lg border border-gray-600">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-4 h-4 text-[#F2D543]" />
                  <h3 className="text-white montserrat-medium text-sm">
                    Step 1: Generate Key Frame
                  </h3>
                </div>

                {/* Image Style Selection */}
                {!generatedImageUrl && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white mb-3 montserrat-regular">
                      Select Image Style
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {imageStyles.map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() =>
                            setSelectedImageStyle(
                              style.id === selectedImageStyle ? "" : style.id
                            )
                          }
                          className={`p-2 border rounded-lg text-xs transition-all ${
                            selectedImageStyle === style.id
                              ? "border-[#F2D543] bg-[#F2D54315] text-[#F2D543]"
                              : "border-gray-600 hover:border-gray-500 hover:bg-darkBox text-gray-300"
                          }`}
                        >
                          {style.name}
                        </button>
                      ))}
                    </div>
                    {selectedImageStyle && (
                      <p className="mt-2 text-xs text-[#F2D543] montserrat-regular">
                        Style selected:{" "}
                        {
                          imageStyles.find((s) => s.id === selectedImageStyle)
                            ?.name
                        }
                      </p>
                    )}
                  </div>
                )}

                {/* Image Prompt */}
                {!generatedImageUrl && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                        Key Frame Description *
                      </label>
                      <textarea
                        value={imagePrompt}
                        onChange={(e) => {
                          setImagePrompt(e.target.value);
                          if (imageGenerationError) {
                            setImageGenerationError(null);
                          }
                        }}
                        placeholder="Describe the main frame/scene you want to generate... (e.g., A knight and sorceress facing each other in a moonlit castle courtyard)"
                        rows={3}
                        className="w-full px-4 py-3 bg-darkBox rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular resize-none"
                        required
                      />
                    </div>

                    {/* Camera Controls */}
                    <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Camera Angle */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                          Camera Angle (Optional)
                        </label>
                        <select
                          value={selectedCameraAngle}
                          onChange={(e) =>
                            setSelectedCameraAngle(e.target.value)
                          }
                          className="w-full px-3 py-2 bg-darkBox border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent"
                        >
                          <option value="">Select angle...</option>
                          {cameraAngles.map((angle) => (
                            <option key={angle.id} value={angle.id}>
                              {angle.name} - {angle.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Camera Shot */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                          Camera Shot (Optional)
                        </label>
                        <select
                          value={selectedCameraShot}
                          onChange={(e) =>
                            setSelectedCameraShot(e.target.value)
                          }
                          className="w-full px-3 py-2 bg-darkBox border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent"
                        >
                          <option value="">Select shot type...</option>
                          {cameraShots.map((shot) => (
                            <option key={shot.id} value={shot.id}>
                              {shot.name} - {shot.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Token Information for Create with AI */}
                    <div className="mb-4 bg-darkBoxSub p-4 rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-[#F2D543]" />
                          <span className="text-white text-sm font-medium montserrat-medium">
                            Current Tokens:
                          </span>
                        </div>
                        <span className="text-[#F2D543] text-sm font-semibold montserrat-medium">
                          {isLoadingTokens
                            ? "..."
                            : Math.floor(tokens).toLocaleString("en-US")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm montserrat-regular">
                          Cost (Create with AI -{" "}
                          {aiModel === "sora" ? "Sora" : "Nano Banana"}):
                        </span>
                        <span className="text-white text-sm font-medium montserrat-medium">
                          {MODE_COSTS["ai"]} tokens
                        </span>
                      </div>
                      {tokens < MODE_COSTS["ai"] && (
                        <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                          <p className="text-red-400 text-xs montserrat-regular text-center">
                            Insufficient tokens for generation
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Generate Image Button */}
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={handleGenerateImage}
                        disabled={
                          !imagePrompt.trim() ||
                          !selectedAspectRatio ||
                          isGeneratingImage ||
                          tokens < MODE_COSTS["ai"]
                        }
                        className={`w-full px-4 py-3 rounded-lg transition-all duration-300 font-medium montserrat-medium flex items-center justify-center gap-2 ${
                          isGeneratingImage
                            ? "bg-blue-600 text-white animate-pulse cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                        }`}
                      >
                        {isGeneratingImage ? (
                          <>
                            <div className="relative">
                              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <span className="animate-pulse">
                              Generating key frame...
                            </span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Generate Key Frame
                          </>
                        )}
                      </button>

                      {/* Error Message for Image Generation */}
                      {imageGenerationError && (
                        <div className="mt-3 p-3 bg-red-900 bg-opacity-20 border border-red-600 rounded-lg">
                          <p className="text-red-400 text-sm montserrat-regular">
                            {imageGenerationError}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Generating Image State */}
                {isGeneratingImage && !generatedImageUrl && (
                  <div className="text-center py-8 space-y-4">
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <div
                          className="absolute inset-2 w-12 h-12 border-4 border-transparent border-r-blue-500 rounded-full animate-spin"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="absolute inset-4 w-8 h-8 border-4 border-blue-500 border-b-transparent rounded-full animate-spin"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-white text-lg font-medium montserrat-medium animate-pulse">
                        Creating key frame...
                      </h3>
                      <p className="text-gray-400 text-sm montserrat-regular">
                        Please wait while AI generates your scene image
                      </p>
                      <div className="flex justify-center space-x-1 mt-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Generated Image Preview */}
                {generatedImageUrl && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white montserrat-medium text-sm">
                        Generated Key Frame
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setGeneratedImageUrl(null);
                          setImageGenerationError(null);
                        }}
                        className="text-red-400 hover:text-red-300 text-sm montserrat-regular"
                      >
                        Discard & Generate New
                      </button>
                    </div>
                    <img
                      src={generatedImageUrl}
                      alt="Generated frame"
                      className="w-full max-h-[512px] object-contain rounded-lg bg-black"
                    />
                    <div className="mt-4 flex flex-col gap-3">
                      <p className="text-green-400 text-sm montserrat-regular">
                        ✓ Key frame generated successfully!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Frame Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Frame Name *
            </label>
            <input
              type="text"
              value={frameName}
              onChange={(e) => setFrameName(e.target.value)}
              placeholder="Enter frame name..."
              className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular"
              required
            />
          </div>

          {/* Frame Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Frame Description *
            </label>
            <textarea
              value={frameDescription}
              onChange={(e) => setFrameDescription(e.target.value)}
              placeholder="Describe this frame and its purpose..."
              rows={3}
              className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular resize-none"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors montserrat-regular"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                !frameName.trim() ||
                !frameDescription.trim() ||
                !creationMode ||
                (creationMode === "ai" && !generatedImageUrl) ||
                (creationMode === "upload" && !uploadedFile) ||
                (creationMode === "existing" && !selectedExistingFrame) ||
                isSubmitting
              }
              className={`px-6 py-2 rounded-lg transition-all duration-300 font-medium montserrat-medium flex items-center justify-center gap-2 min-w-[140px] ${
                isSubmitting
                  ? "bg-green-600 text-white animate-pulse cursor-not-allowed"
                  : "bg-[#F2D543] text-primarioDark hover:bg-[#f2f243] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543]"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="relative">
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <span className="animate-pulse">Creating...</span>
                </>
              ) : (
                "Create Frame"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalCreateFrame;
