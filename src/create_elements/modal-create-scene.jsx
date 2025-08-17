import { useState, useEffect } from "react";
import {
  X,
  Users,
  MapPin,
  Play,
  Brain,
  Clock,
  Video,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import Cookies from "js-cookie";

function ModalCreateScene({
  isOpen,
  onClose,
  projectId,
  availableFrames,
  availableScenes,
  onSceneCreated,
}) {
  const [sceneName, setSceneName] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");
  const [selectedFrame, setSelectedFrame] = useState("");
  const [selectedType, setSelectedType] = useState("image"); // "image" o "video"
  const [hoveredVideo, setHoveredVideo] = useState(null); // Para manejar hover en videos
  const [aiModel, setAiModel] = useState("runway");
  const [aiPrompt, setAiPrompt] = useState("");
  const [videoDuration, setVideoDuration] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);
  const [promptImageUrl, setPromptImageUrl] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(0);

  // Estados para generación de video
  const [videoGenerationError, setVideoGenerationError] = useState(null);

  // Estados para sistema de prompts profesionales
  const [isProPromptMode, setIsProPromptMode] = useState(true);
  const [shotType, setShotType] = useState("");
  const [characterAction, setCharacterAction] = useState("");
  const [cameraMovement, setCameraMovement] = useState("");
  const [lighting, setLighting] = useState("");
  const [additionalMotion, setAdditionalMotion] = useState("");

  // Estados específicos para Runway Aleph
  const [alephTaskType, setAlephTaskType] = useState("");
  const [alephDetails, setAlephDetails] = useState("");

  // Opciones de tareas disponibles para Runway Aleph
  const alephTaskOptions = [
    {
      id: "camera-angle",
      name: "Generate New Camera Angles",
      description: "Create different viewpoints of the same scene",
      placeholder:
        "e.g., Change to bird's eye view, close-up shot, side angle...",
    },
    {
      id: "next-shot",
      name: "Generate the Next Shot",
      description: "Continue the scene with the next logical shot",
      placeholder: "e.g., Character walks forward, camera follows action...",
    },
    {
      id: "style-transfer",
      name: "Apply Style Transfer",
      description: "Transform the video style while maintaining content",
      placeholder:
        "e.g., Make it look like a painting, film noir style, cartoon style...",
    },
    {
      id: "environment-change",
      name: "Change Environment/Location",
      description: "Modify the setting, season, or time of day",
      placeholder:
        "e.g., Move scene to beach, change to winter, make it nighttime...",
    },
    {
      id: "add-objects",
      name: "Add Things to Scene",
      description: "Insert new objects or elements into the video",
      placeholder:
        "e.g., Add a car in the background, place flowers on table...",
    },
    {
      id: "remove-objects",
      name: "Remove Things from Scene",
      description: "Remove unwanted objects or elements",
      placeholder: "e.g., Remove the person in background, delete the sign...",
    },
    {
      id: "transform-objects",
      name: "Change Objects in Scene",
      description: "Modify existing objects in the video",
      placeholder: "e.g., Change the red car to blue, turn table into desk...",
    },
    {
      id: "motion-transfer",
      name: "Apply Motion to Static Elements",
      description: "Add movement to still elements in the video",
      placeholder: "e.g., Make trees sway, add wind to hair, water flowing...",
    },
    {
      id: "character-appearance",
      name: "Alter Character Appearance",
      description: "Change how characters look",
      placeholder:
        "e.g., Change hair color, add sunglasses, different clothing...",
    },
    {
      id: "recolor",
      name: "Recolor Elements",
      description: "Change colors of specific elements",
      placeholder: "e.g., Make sky purple, change car color to green...",
    },
    {
      id: "relight",
      name: "Relight the Scene",
      description: "Modify lighting conditions",
      placeholder:
        "e.g., Add dramatic shadows, sunset lighting, studio lighting...",
    },
    {
      id: "green-screen",
      name: "Green Screen Effect",
      description: "Replace background with new environment",
      placeholder:
        "e.g., Remove background and replace with space, beach, city...",
    },
  ];

  // Mock data - En producción esto vendría de props o API

  const allAiModels = [
    {
      id: "runway",
      name: "Runway ML",
      description: "Professional video AI model",
    },
    /*{
      id: "kling",
      name: "KLING",
      description: "Advanced AI video generation model",
    },*/
    {
      id: "veo-3",
      name: "Veo-3",
      description: "Advanced video generation model",
    },
    {
      id: "runway-aleph",
      name: "Runway Aleph",
      description: "Runway Aleph model for video processing",
    },
    {
      id: "seedance",
      name: "Seedance 1.0",
      description: "Second generation Seedance model for video",
    },
  ];

  // Función para obtener modelos disponibles según el tipo seleccionado
  const getAvailableModels = () => {
    if (selectedType === "video") {
      // Si es video, solo Runway Aleph
      return allAiModels.filter((model) => model.id === "runway-aleph");
    } else {
      // Si es imagen, todos excepto Runway Aleph
      return allAiModels.filter((model) => model.id !== "runway-aleph");
    }
  };

  // Función para obtener frames de imagen
  const getImageFrames = () => {
    return (
      availableFrames?.filter(
        (frame) =>
          (frame.media_type === "image" ||
            (!frame.media_type && frame.type !== "video")) &&
          frame.type !== "video"
      ) || []
    );
  };

  // Función para obtener videos (frames de video + escenas)
  const getVideoItems = () => {
    const videoFrames =
      availableFrames?.filter(
        (frame) => frame.media_type === "video" || frame.type === "video"
      ) || [];

    const scenes =
      availableScenes?.map((scene) => ({
        ...scene,
        isScene: true, // Para identificar que es una escena
        media_url: scene.video_url || scene.media_url,
      })) || [];

    return [...videoFrames, ...scenes];
  };

  // Efecto para cambiar automáticamente el modelo cuando se cambia el tipo
  useEffect(() => {
    if (selectedType === "video") {
      setAiModel("runway-aleph");
    } else {
      // Si cambia a imagen, seleccionar el primer modelo disponible que no sea aleph
      const availableModels = allAiModels.filter(
        (model) => model.id !== "runway-aleph"
      );
      if (availableModels.length > 0) {
        setAiModel(availableModels[0].id);
      }
    }
  }, [selectedType]);

  const durationOptions = [
    { value: 5, label: "5 seconds", estimatedTime: 30 },
    { value: 10, label: "10 seconds", estimatedTime: 45 },
  ];

  // Función para crear el prompt profesional para video
  const createProVideoPrompt = () => {
    // Si es Aleph, usar el sistema específico de Aleph
    if (aiModel === "runway-aleph") {
      const selectedTask = alephTaskOptions.find(
        (task) => task.id === alephTaskType
      );

      if (!alephTaskType || !alephDetails.trim()) {
        return "Please select a task type and provide details for Runway Aleph.";
      }

      return `${selectedTask?.name}: ${alephDetails.trim()}`;
    }

    // Para otros modelos, usar el sistema tradicional
    let selectedData = null;

    if (selectedType === "image") {
      selectedData = availableFrames?.find(
        (frame) => frame.id.toString() === selectedFrame
      );
    } else {
      // Para videos, buscar en frames de video y escenas
      const videoItems = getVideoItems();
      selectedData = videoItems.find(
        (item) => item.id.toString() === selectedFrame
      );
    }

    // Crear descripción básica
    let featuring = "the main character";
    let location = "the scene location";

    if (selectedData) {
      featuring = selectedData.description || "the main character";
      location = selectedData.location || "the scene location";
    }

    // Construir el prompt profesional
    const proPrompt = `A ${
      shotType || "medium shot"
    }, featuring ${featuring}, in ${location}. The character performs ${
      characterAction || "their main action"
    }. The camera is ${cameraMovement || "static"}. Lighting is ${
      lighting || "natural daylight"
    }. Additional motion includes ${
      additionalMotion || "subtle environmental movement"
    }. Highly cinematic, photorealistic. No text or subtitles.`;

    return proPrompt;
  };

  const handleClose = () => {
    setSceneName("");
    setSceneDescription("");
    setSelectedFrame("");
    setSelectedType("image");
    setHoveredVideo(null);
    setAiModel("runway");
    setAiPrompt("");
    setVideoDuration(5);
    setGeneratedVideoUrl(null);
    setPromptImageUrl(null);
    setIsGenerating(false);
    setEstimatedTime(0);
    setVideoGenerationError(null);
    // Limpiar estados del prompt profesional
    setIsProPromptMode(true); // Mantener Pro Prompt activado por defecto
    setShotType("");
    setCharacterAction("");
    setCameraMovement("");
    setLighting("");
    setAdditionalMotion("");
    // Limpiar estados de Aleph
    setAlephTaskType("");
    setAlephDetails("");
    onClose();
  };

  const handleDurationChange = (duration) => {
    setVideoDuration(duration);
    const durationData = durationOptions.find((opt) => opt.value === duration);
    setEstimatedTime(durationData?.estimatedTime || 60);
  };

  const handleGenerateScene = async () => {
    // Validación específica según el modelo
    let hasValidPrompt = false;

    if (aiModel === "runway-aleph") {
      // Para Aleph: requiere tipo de tarea y detalles
      hasValidPrompt = alephTaskType.trim() && alephDetails.trim();
    } else {
      // Para otros modelos: validación tradicional
      hasValidPrompt = isProPromptMode
        ? shotType.trim() && characterAction.trim() // Mínimo requerido para modo pro
        : aiPrompt.trim(); // Modo simple requiere el textarea
    }

    if (!selectedFrame || !hasValidPrompt) return;

    setIsGenerating(true);
    setVideoGenerationError(null); // Limpiar errores anteriores

    try {
      // Configurar tiempo estimado según el modelo
      let estimatedTime = 60;
      switch (aiModel) {
        case "deepseek":
          estimatedTime = 60;
          break;
        case "runway":
          estimatedTime = 90;
          break;
        case "kling":
          estimatedTime = 75;
          break;
        case "dall-e":
          estimatedTime = 30;
          break;
        case "veo-3":
          estimatedTime = 90;
          break;
        case "veo-2":
          estimatedTime = 75;
          break;
      }
      setEstimatedTime(estimatedTime);

      // Preparar los datos para enviar al backend
      const finalVideoPrompt = isProPromptMode
        ? createProVideoPrompt()
        : aiPrompt;

      // Obtener el elemento seleccionado (frame o escena)
      const selectedData = getSelectedData();

      const videoPayload = {
        prompt: finalVideoPrompt, // Video Motion/Animation Description (profesional o simple)
        ai_model: aiModel, // id del modelo seleccionado (deepseek, runway, etc)
        video_duration: videoDuration, // Duración del video
        media_url:
          selectedData?.media_url ||
          selectedData?.video_url ||
          selectedData?.url, // URL de la imagen/video del frame/escena
        project_id: projectId, // ID del proyecto
      };

      // Llamar a la API para generar el video
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}ai/generate-video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify(videoPayload),
        }
      );

      const responseData = await response.json();

      if (responseData && responseData.success) {
        // Manejar la respuesta exitosa del video
        if (responseData.video_url) {
          setGeneratedVideoUrl(responseData.video_url);
        }
        if (responseData.prompt_image_url) {
          setPromptImageUrl(responseData.prompt_image_url);
        } else if (aiModel === "runway-aleph") {
          // Para Aleph, si no hay prompt_image_url, usar la URL del video/frame original como fallback
          const selectedData = getSelectedData();
          setPromptImageUrl(selectedData?.media_url || selectedData?.video_url || selectedData?.url || null);
        }
        setVideoGenerationError(null); // Limpiar errores si la generación fue exitosa
      } else {
        // Manejar errores específicos del backend
        let errorMessage = "Error generating video. Please try again.";

        if (responseData && responseData.message) {
          const message = responseData.message;

          // Detectar error de moderación
          if (
            message.includes("moderation_blocked") ||
            message.includes("safety system")
          ) {
            errorMessage =
              "Your content was blocked by the AI safety system. Please try rephrasing your description with different words or avoid potentially sensitive content.";
          }
          // Detectar otros errores específicos
          else if (message.includes("rate_limit")) {
            errorMessage =
              "Rate limit exceeded. Please wait a moment and try again.";
          } else if (
            message.includes("insufficient_quota") ||
            message.includes("billing")
          ) {
            errorMessage =
              "Service temporarily unavailable. Please try again later.";
          }
          // Error genérico con mensaje del servidor
          else {
            errorMessage = `Generation failed: ${message.split("\n")[0]}`; // Solo primera línea del error
          }
        }

        setVideoGenerationError(errorMessage);
        console.error("Error generating video:", responseData);
      }
    } catch (error) {
      console.error("Error generating scene:", error);
      setVideoGenerationError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDiscardGeneratedVideo = () => {
    setGeneratedVideoUrl(null);
    setPromptImageUrl(null);
    setVideoGenerationError(null); // Limpiar errores al descartar
  };

  const handleSubmit = async () => {
    if (
      !sceneName.trim() ||
      !sceneDescription.trim() ||
      !selectedFrame ||
      !generatedVideoUrl ||
      (aiModel !== "runway-aleph" && !promptImageUrl)
    )
      return;

    try {
      // Crear el payload con los datos requeridos para crear la escena
      const sceneData = {
        name: sceneName,
        description: sceneDescription,
        project_id: projectId,
        frame_id: selectedFrame,
        video_url: generatedVideoUrl,
        ...(promptImageUrl && { prompt_image_url: promptImageUrl }), // Solo incluir si existe
      };

      // Aquí puedes llamar a tu API para crear la escena
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}projects/create-scene`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify(sceneData),
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        if (onSceneCreated) {
          onSceneCreated(responseData.data);
        }
        handleClose();
      } else {
        console.error("Error creating scene:", responseData);
      }
    } catch (error) {
      console.error("Error creating scene:", error);
    }
  };

  if (!isOpen) return null;

  // Función para obtener el elemento seleccionado (frame o escena)
  const getSelectedData = () => {
    if (!selectedFrame) return null;

    if (selectedType === "image") {
      return getImageFrames().find(
        (frame) => frame.id.toString() === selectedFrame
      );
    } else {
      return getVideoItems().find(
        (item) => item.id.toString() === selectedFrame
      );
    }
  };

  const selectedFrameData = getSelectedData();

  return (
    <div className="fixed inset-0 bg-[#00000091] bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-darkBox rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold text-white montserrat-medium">
            Create Scene
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Frame/Video Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-4 montserrat-regular">
              Select Key Frame *
            </label>
            <p className="text-xs text-gray-400 mb-4 montserrat-regular">
              Choose a key frame from your project to create a video scene
            </p>

            {/* Tabs for Image/Video */}
            <div className="flex space-x-1 mb-4 bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => {
                  setSelectedType("image");
                  setSelectedFrame("");
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedType === "image"
                    ? "bg-[#F2D543] text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Images
              </button>
              <button
                onClick={() => {
                  setSelectedType("video");
                  setSelectedFrame("");
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedType === "video"
                    ? "bg-[#F2D543] text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Video className="w-4 h-4" />
                Videos
              </button>
            </div>

            {/* Content based on selected type */}
            {selectedType === "image" ? (
              // Image Frames
              getImageFrames().length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {getImageFrames().map((frame) => (
                    <div
                      key={frame.id}
                      onClick={() => setSelectedFrame(frame.id.toString())}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedFrame === frame.id.toString()
                          ? "border-[#F2D543] bg-[#F2D54315]"
                          : "border-gray-600 hover:border-gray-500 hover:bg-darkBoxSub"
                      }`}
                    >
                      <div className="aspect-video bg-gray-800 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {frame.media_url || frame.image_url ? (
                          <img
                            src={frame.media_url || frame.image_url}
                            alt={frame.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-white montserrat-medium text-sm mb-1">
                          {frame.name}
                        </h3>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {frame.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400 montserrat-regular mb-2">
                    No image frames found in this project
                  </p>
                  <p className="text-gray-500 text-sm">
                    Create an image frame first
                  </p>
                </div>
              )
            ) : // Video Items (Video Frames + Scenes)
            getVideoItems().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getVideoItems().map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedFrame(item.id.toString())}
                    onMouseEnter={() => setHoveredVideo(item.id)}
                    onMouseLeave={() => setHoveredVideo(null)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedFrame === item.id.toString()
                        ? "border-[#F2D543] bg-[#F2D54315]"
                        : "border-gray-600 hover:border-gray-500 hover:bg-darkBoxSub"
                    }`}
                  >
                    <div className="aspect-video bg-gray-800 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                      {item.media_url || item.video_url ? (
                        <video
                          ref={(videoRef) => {
                            if (videoRef) {
                              if (hoveredVideo === item.id) {
                                videoRef.play();
                              } else {
                                videoRef.pause();
                                videoRef.currentTime = 0;
                              }
                            }
                          }}
                          src={item.media_url || item.video_url}
                          className="w-full h-full object-cover rounded-lg"
                          muted
                          loop
                          preload="metadata"
                        />
                      ) : (
                        <Video className="w-8 h-8 text-gray-400" />
                      )}
                      {item.isScene && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Scene
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-white montserrat-medium text-sm mb-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
                <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400 montserrat-regular mb-2">
                  No video content found in this project
                </p>
                <p className="text-gray-500 text-sm">
                  Create a video frame or scene first
                </p>
              </div>
            )}

            {selectedFrame && (
              <div className="mt-4 p-3 bg-[#F2D54315] border border-[#F2D543] rounded-lg">
                <p className="text-[#F2D543] text-sm montserrat-regular">
                  ✓ Selected {selectedType === "image" ? "Image" : "Video"}:{" "}
                  <span className="font-medium">
                    {selectedType === "image"
                      ? getImageFrames().find(
                          (f) => f.id.toString() === selectedFrame
                        )?.name
                      : getVideoItems().find(
                          (v) => v.id.toString() === selectedFrame
                        )?.name}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Video Configuration Section - Only show after frame is selected and before video is generated */}
          {selectedFrame && !generatedVideoUrl && (
            <div className="mb-6 p-4 bg-darkBoxSub rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-4 h-4 text-[#F2D543]" />
                <h3 className="text-white montserrat-medium text-sm">
                  Configure Video Generation
                </h3>
              </div>

              {/* AI Model Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                  Video AI Model *
                </label>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full px-4 py-3 bg-darkBox rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular"
                >
                  {getAvailableModels().map((model) => (
                    <option
                      key={model.id}
                      value={model.id}
                      className="bg-darkBox text-white"
                    >
                      {model.name} - {model.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scene Prompt */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-white montserrat-regular">
                    {aiModel === "runway-aleph"
                      ? "Video Transformation Task *"
                      : "Video Motion/Animation Description *"}
                  </label>
                  {aiModel !== "runway-aleph" && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 montserrat-regular">
                        Simple
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsProPromptMode(!isProPromptMode)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:ring-offset-2 ${
                          isProPromptMode ? "bg-[#F2D543]" : "bg-gray-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isProPromptMode ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="text-xs text-gray-400 montserrat-regular">
                        Pro Prompt
                      </span>
                    </div>
                  )}
                </div>

                {/* Sistema específico para Runway Aleph */}
                {aiModel === "runway-aleph" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 text-sm font-medium">
                          Runway Aleph
                        </span>
                      </div>
                      <p className="text-xs text-gray-300">
                        Advanced video-to-video transformation model. Select a
                        task type and describe the specific transformation you
                        want to apply.
                      </p>
                    </div>

                    {/* Selector de Tipo de Tarea */}
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-2 montserrat-regular">
                        Task Type *
                      </label>
                      <select
                        value={alephTaskType}
                        onChange={(e) => setAlephTaskType(e.target.value)}
                        className="w-full px-3 py-2 bg-darkBox rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular text-sm"
                        required
                      >
                        <option value="">Select transformation task...</option>
                        {alephTaskOptions.map((task) => (
                          <option key={task.id} value={task.id}>
                            {task.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Descripción de la tarea seleccionada */}
                    {alephTaskType && (
                      <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-600">
                        <p className="text-xs text-gray-400 mb-1">
                          Task Description:
                        </p>
                        <p className="text-sm text-gray-200">
                          {
                            alephTaskOptions.find(
                              (task) => task.id === alephTaskType
                            )?.description
                          }
                        </p>
                      </div>
                    )}

                    {/* Campo de detalles específicos */}
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-2 montserrat-regular">
                        Transformation Details *
                      </label>
                      <textarea
                        value={alephDetails}
                        onChange={(e) => {
                          setAlephDetails(e.target.value);
                          if (videoGenerationError) {
                            setVideoGenerationError(null);
                          }
                        }}
                        placeholder={
                          alephTaskType
                            ? alephTaskOptions.find(
                                (task) => task.id === alephTaskType
                              )?.placeholder
                            : "Select a task type first..."
                        }
                        rows={3}
                        className="w-full px-4 py-3 bg-darkBox rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular resize-none"
                        required
                        disabled={!alephTaskType}
                      />
                    </div>

                    {/* Preview del Prompt para Aleph */}
                    {alephTaskType && alephDetails.trim() && (
                      <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
                        <label className="block text-xs font-medium text-gray-300 mb-2 montserrat-regular">
                          Generated Prompt Preview:
                        </label>
                        <p className="text-sm text-gray-200 montserrat-regular leading-relaxed">
                          {createProVideoPrompt()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Sistema para otros modelos AI */}
                {aiModel !== "runway-aleph" && (
                  <>
                    {/* Modo Simple */}
                    {!isProPromptMode && (
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => {
                          setAiPrompt(e.target.value);
                          // Limpiar error cuando el usuario modifica el prompt
                          if (videoGenerationError) {
                            setVideoGenerationError(null);
                          }
                        }}
                        placeholder="Describe the motion/animation for the video... (e.g., The knight slowly draws his sword while the sorceress raises her hands to cast a spell, wind blows through their hair)"
                        rows={4}
                        className="w-full px-4 py-3 bg-darkBox rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular resize-none"
                        required
                      />
                    )}

                    {/* Modo Pro Prompt */}
                    {isProPromptMode && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Tipo de Plano y Perspectiva */}
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-2 montserrat-regular">
                              Shot Type & Perspective *
                            </label>
                            <select
                              value={shotType}
                              onChange={(e) => setShotType(e.target.value)}
                              className="w-full px-3 py-2 bg-darkBox rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular text-sm"
                              required
                            >
                              <option value="">Select shot type...</option>
                              <option value="extreme wide shot">
                                Extreme Wide Shot
                              </option>
                              <option value="wide shot">Wide Shot</option>
                              <option value="medium shot">Medium Shot</option>
                              <option value="close-up">Close-up</option>
                              <option value="extreme close-up">
                                Extreme Close-up
                              </option>
                              <option value="over-the-shoulder shot">
                                Over-the-shoulder Shot
                              </option>
                              <option value="bird's eye view">
                                Bird's Eye View
                              </option>
                              <option value="low angle shot">
                                Low Angle Shot
                              </option>
                              <option value="high angle shot">
                                High Angle Shot
                              </option>
                            </select>
                          </div>

                          {/* Movimiento de Cámara */}
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-2 montserrat-regular">
                              Camera Movement
                            </label>
                            <select
                              value={cameraMovement}
                              onChange={(e) =>
                                setCameraMovement(e.target.value)
                              }
                              className="w-full px-3 py-2 bg-darkBox rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular text-sm"
                            >
                              <option value="">Select movement...</option>
                              <option value="static">Static</option>
                              <option value="slow zoom in">Slow Zoom In</option>
                              <option value="slow zoom out">
                                Slow Zoom Out
                              </option>
                              <option value="pan left">Pan Left</option>
                              <option value="pan right">Pan Right</option>
                              <option value="tilt up">Tilt Up</option>
                              <option value="tilt down">Tilt Down</option>
                              <option value="dolly in">Dolly In</option>
                              <option value="dolly out">Dolly Out</option>
                              <option value="tracking shot">
                                Tracking Shot
                              </option>
                              <option value="handheld">Handheld</option>
                            </select>
                          </div>
                        </div>

                        {/* Acción del Personaje */}
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-2 montserrat-regular">
                            Character Action *
                          </label>
                          <input
                            type="text"
                            value={characterAction}
                            onChange={(e) => setCharacterAction(e.target.value)}
                            placeholder="e.g., slowly draws his sword while looking at the enemy"
                            className="w-full px-3 py-2 bg-darkBox rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular text-sm"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Iluminación */}
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-2 montserrat-regular">
                              Lighting
                            </label>
                            <select
                              value={lighting}
                              onChange={(e) => setLighting(e.target.value)}
                              className="w-full px-3 py-2 bg-darkBox rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular text-sm"
                            >
                              <option value="">Select lighting...</option>
                              <option value="natural daylight">
                                Natural Daylight
                              </option>
                              <option value="golden hour">Golden Hour</option>
                              <option value="blue hour">Blue Hour</option>
                              <option value="moonlight">Moonlight</option>
                              <option value="candlelight">Candlelight</option>
                              <option value="firelight">Firelight</option>
                              <option value="neon lighting">
                                Neon Lighting
                              </option>
                              <option value="dramatic shadows">
                                Dramatic Shadows
                              </option>
                              <option value="soft diffused light">
                                Soft Diffused Light
                              </option>
                              <option value="harsh directional light">
                                Harsh Directional Light
                              </option>
                            </select>
                          </div>

                          {/* Movimiento Adicional */}
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-2 montserrat-regular">
                              Additional Motion
                            </label>
                            <input
                              type="text"
                              value={additionalMotion}
                              onChange={(e) =>
                                setAdditionalMotion(e.target.value)
                              }
                              placeholder="e.g., wind blowing through hair, falling leaves"
                              className="w-full px-3 py-2 bg-darkBox rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular text-sm"
                            />
                          </div>
                        </div>

                        {/* Preview del Prompt Generado */}
                        {(shotType || characterAction) && (
                          <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
                            <label className="block text-xs font-medium text-gray-300 mb-2 montserrat-regular">
                              Generated Prompt Preview:
                            </label>
                            <p className="text-sm text-gray-200 montserrat-regular leading-relaxed">
                              {createProVideoPrompt()}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Video Duration */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-4 montserrat-regular">
                  Video Duration *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {durationOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => handleDurationChange(option.value)}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all text-center ${
                        videoDuration === option.value
                          ? "border-[#F2D543] bg-[#F2D54315]"
                          : "border-gray-600 hover:border-gray-500 hover:bg-darkBoxSub"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Clock
                          className={`w-4 h-4 ${
                            videoDuration === option.value
                              ? "text-[#F2D543]"
                              : "text-gray-400"
                          }`}
                        />
                        <span className="text-white text-sm montserrat-medium">
                          {option.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          ~{option.estimatedTime}s gen
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Scene Summary - Solo mostrar si hay frame seleccionado y no hay video generado */}
          {selectedFrame && selectedFrameData && !generatedVideoUrl && (
            <div className="mb-6 p-4 bg-darkBoxSub rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-3">
                <Video className="w-4 h-4 text-[#F2D543]" />
                <h3 className="text-white montserrat-medium text-sm">
                  Scene Summary
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Selected Frame:</p>
                  <p className="text-white font-medium">
                    {selectedFrameData.name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Duration:</p>
                  <p className="text-white font-medium">
                    {videoDuration} seconds
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Video Button - Solo mostrar si no hay video generado */}
          {!generatedVideoUrl && (
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGenerateScene}
                disabled={
                  !selectedFrame ||
                  (aiModel === "runway-aleph"
                    ? !alephTaskType.trim() || !alephDetails.trim()
                    : isProPromptMode
                    ? !shotType.trim() || !characterAction.trim()
                    : !aiPrompt.trim()) ||
                  isGenerating
                }
                className={`w-full px-4 py-3 rounded-lg transition-all duration-300 font-medium montserrat-medium flex items-center justify-center gap-2 ${
                  isGenerating
                    ? "bg-[#F2D543] text-primarioDark animate-pulse cursor-not-allowed"
                    : "bg-[#F2D543] text-primarioDark hover:bg-[#f2f243] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543]"
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="relative">
                      <div className="w-5 h-5 border-3 border-primarioDark border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <span className="animate-pulse">
                      Generating video scene...
                    </span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Generate Video Scene
                  </>
                )}
              </button>

              {/* Error Message for Video Generation */}
              {videoGenerationError && (
                <div className="mt-3 p-3 bg-red-900 bg-opacity-20 border border-red-600 rounded-lg">
                  <p className="text-red-400 text-sm montserrat-regular">
                    {videoGenerationError}
                  </p>
                </div>
              )}

              {!selectedFrame && (
                <p className="text-orange-400 text-sm mt-2 text-center montserrat-regular">
                  Please select a key frame first before creating the video
                </p>
              )}
            </div>
          )}

          {/* Generating Video State - Mostrar mientras se genera el video */}
          {isGenerating && !generatedVideoUrl && (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-[#F2D543] border-t-transparent rounded-full animate-spin"></div>
                  <div
                    className="absolute inset-2 w-12 h-12 border-4 border-transparent border-r-[#F2D543] rounded-full animate-spin"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="absolute inset-4 w-8 h-8 border-4 border-[#F2D543] border-b-transparent rounded-full animate-spin"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-white text-lg font-medium montserrat-medium animate-pulse">
                  Creating video scene...
                </h3>
                <p className="text-gray-400 text-sm montserrat-regular">
                  Please wait while AI generates your video (estimated:{" "}
                  {estimatedTime}s)
                </p>
                <div className="flex justify-center space-x-1 mt-4">
                  <div className="w-2 h-2 bg-[#F2D543] rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-[#F2D543] rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-[#F2D543] rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Video Preview - Mostrar solo si ya hay video generado */}
          {generatedVideoUrl && (
            <div className="mb-6 p-4 bg-darkBoxSub rounded-lg border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white montserrat-medium text-sm">
                  ✓ Generated Scene Video
                </h3>
                <button
                  type="button"
                  onClick={handleDiscardGeneratedVideo}
                  className="text-red-400 hover:text-red-300 text-sm montserrat-regular"
                >
                  Discard & Generate New
                </button>
              </div>
              <video
                src={generatedVideoUrl}
                controls
                className="w-full max-h-80 rounded-lg bg-black"
                poster={promptImageUrl}
              >
                Your browser does not support the video tag.
              </video>
              <p className="text-green-400 text-sm mt-3 montserrat-regular">
                Video generated successfully! Now you can add scene details
                below.
              </p>
            </div>
          )}

          {/* Scene Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Scene Name *
            </label>
            <input
              type="text"
              value={sceneName}
              onChange={(e) => setSceneName(e.target.value)}
              placeholder="Enter scene name..."
              className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular"
              required
            />
          </div>

          {/* Scene Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Scene Description *
            </label>
            <textarea
              value={sceneDescription}
              onChange={(e) => setSceneDescription(e.target.value)}
              placeholder="Describe this scene and its role in your project..."
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
                !sceneName.trim() ||
                !sceneDescription.trim() ||
                !selectedFrame ||
                !generatedVideoUrl ||
                (aiModel !== "runway-aleph" && !promptImageUrl)
              }
              className="px-6 py-2 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543]"
            >
              Create Scene
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalCreateScene;
