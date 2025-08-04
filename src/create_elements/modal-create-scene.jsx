import { useState } from "react";
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
import { createRunwayVideo } from "../project/functions";

function ModalCreateScene({
  isOpen,
  onClose,
  projectId,
  spots,
  characters,
  onSceneCreated,
}) {
  const [sceneName, setSceneName] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState("");
  const [aiModel, setAiModel] = useState("runway");
  const [aiPrompt, setAiPrompt] = useState("");
  const [videoDuration, setVideoDuration] = useState(15);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);
  const [promptImageUrl, setPromptImageUrl] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(0);

  // Estados para generación de imagen de frame
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [hasGeneratedImage, setHasGeneratedImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [selectedImageStyle, setSelectedImageStyle] = useState("");

  // Mock data - En producción esto vendría de props o API

  const aiModels = [
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
      id: "dall-e",
      name: "",
      description: "DALL-E model for video generation",
    },
    {
      id: "veo-3",
      name: "Veo-3",
      description: "Advanced video generation model",
    },
    /*{
      id: "veo-2",
      name: "Veo-2",
      description: "Second generation Veo model for video",
    },*/
  ];

  const durationOptions = [
    { value: 5, label: "5 seconds", estimatedTime: 30 },
    { value: 10, label: "10 seconds", estimatedTime: 45 },
  ];

  // Estilos de imagen disponibles
  const imageStyles = [
    {
      id: "hyper-realism",
      name: "Hyper-realism",
      prompt: `A hyper-realistic 8K composite image of the provided characters merged into a single scene.
Each character must preserve their facial features, body shape, proportions, hair style, clothing, and skin texture as seen in the reference images.
Ultra realistic cinematic lighting with real shadows, film grain, visible pores, slight imperfections, and lifelike skin tones.
`,
    },
    {
      id: "cartoon",
      name: "Cartoon",
      prompt: ", cartoon style, animated, colorful, whimsical",
    },
    {
      id: "anime",
      name: "Anime",
      prompt: ", anime style, manga inspired, detailed character design",
    },
    {
      id: "oil-painting",
      name: "Oil Painting",
      prompt: ", oil painting style, artistic brushstrokes, classic art",
    },
    {
      id: "watercolor",
      name: "Watercolor",
      prompt: ", watercolor painting, soft colors, artistic",
    },
    {
      id: "comic-book",
      name: "Comic Book",
      prompt: ", comic book style, bold colors, dynamic poses",
    },
    {
      id: "fantasy",
      name: "Fantasy Art",
      prompt: ", fantasy art style, magical, ethereal, detailed",
    },
    {
      id: "cyberpunk",
      name: "Cyberpunk",
      prompt: ", cyberpunk style, neon lights, futuristic, high-tech",
    },
  ];

  // Función para crear el prompt final con el estilo seleccionado
  const createFinalPrompt = () => {
    const basePrompt = imagePrompt.trim();
    const stylePrompt = selectedImageStyle
      ? imageStyles.find((style) => style.id === selectedImageStyle)?.prompt ||
        ""
      : "";
    return basePrompt + stylePrompt;
  };

  const handleClose = () => {
    setSceneName("");
    setSceneDescription("");
    setSelectedCharacters([]);
    setSelectedSpot("");
    setAiModel("runway");
    setAiPrompt("");
    setVideoDuration(5);
    setGeneratedVideoUrl(null);
    setPromptImageUrl(null);
    setIsGenerating(false);
    setEstimatedTime(0);
    setIsGeneratingImage(false);
    setGeneratedImageUrl(null);
    setHasGeneratedImage(false);
    setImagePrompt("");
    setSelectedImageStyle("");
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

  const handleDurationChange = (duration) => {
    setVideoDuration(duration);
    const durationData = durationOptions.find((opt) => opt.value === duration);
    setEstimatedTime(durationData?.estimatedTime || 60);
  };

  const handleGenerateImage = async () => {
    // Validar que al menos tengamos characters O spot, y el prompt
    if ((!selectedCharacters.length && !selectedSpot) || !imagePrompt.trim())
      return;

    setIsGeneratingImage(true);
    try {
      // Crear el payload con los datos requeridos
      const finalPrompt = createFinalPrompt();
      const payload = {
        prompt: finalPrompt,
        characters: selectedCharacters, // Array de character IDs (puede estar vacío)
        spot: selectedSpot, // Spot ID (puede estar vacío)
        project_id: projectId, // ID del proyecto
      };

      // Llamar a la API para generar la imagen de la escena
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

      // Verificar si la respuesta fue exitosa y tiene la imagen
      if (
        responseData &&
        responseData.success &&
        responseData.data &&
        responseData.data.image_base64
      ) {
        // La imagen viene en base64, crear la URL completa
        const base64Image = `data:image/jpeg;base64,${responseData.data.image_base64}`;
        setGeneratedImageUrl(base64Image);
        setHasGeneratedImage(true);
      } else {
        console.error("Error: No se pudo generar la imagen", responseData);
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSaveKeyFrame = async () => {
    if (
      !selectedCharacters.length ||
      !selectedSpot ||
      !imagePrompt.trim() ||
      !generatedImageUrl
    ) {
      return;
    }

    try {
      const keyFrameData = {
        characters: selectedCharacters,
        spot: selectedSpot,
        image_prompt: imagePrompt,
        image_base64: generatedImageUrl.replace("data:image/jpeg;base64,", ""), // Remover el prefijo
        project_id: projectId,
      };

      // Aquí puedes llamar a tu API para guardar el key frame
      // Por ahora solo mostraremos los datos en consola
      console.log("Key Frame Data to save:", keyFrameData);

      // Cerrar el modal después de guardar
      handleClose();
    } catch (error) {
      console.error("Error saving key frame:", error);
    }
  };

  const handleDiscardGeneratedImage = () => {
    setGeneratedImageUrl(null);
    setHasGeneratedImage(false);
    setSelectedImageStyle("");
  };

  const handleGenerateScene = async () => {
    if (
      (!selectedCharacters.length && !selectedSpot) ||
      !aiPrompt.trim() ||
      !hasGeneratedImage
    )
      return;

    setIsGenerating(true);

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
      const videoPayload = {
        prompt: aiPrompt, // Video Motion/Animation Description
        ai_model: aiModel, // id del modelo seleccionado (deepseek, runway, etc)
        video_duration: videoDuration, // Duración del video
        image_base64: generatedImageUrl.replace("data:image/jpeg;base64,", ""), // Imagen en base64 sin prefijo
        project_id: projectId, // ID del proyecto
      };

      console.log("Video Generation Payload:", videoPayload);

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
        }
        console.log("Video generated successfully:", responseData);
      } else {
        console.error("Error generating video:", responseData);
      }
    } catch (error) {
      console.error("Error generating scene:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (
      !sceneName.trim() ||
      !sceneDescription.trim() ||
      (!selectedCharacters.length && !selectedSpot) ||
      !generatedVideoUrl ||
      !promptImageUrl
    )
      return;

    try {
      // Crear el payload con los datos requeridos para crear la escena
      const sceneData = {
        name: sceneName,
        description: sceneDescription,
        project_id: projectId,
        character_ids: selectedCharacters,
        spot_id: selectedSpot,
        video_url: generatedVideoUrl,
        prompt_image_url: promptImageUrl,
      };

      console.log("Scene Data to save:", sceneData);

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
          {/* Character Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Select Characters (Optional)
            </label>
            <p className="text-xs text-gray-400 mb-4 montserrat-regular">
              You can select characters only, spot only, or both for keyframe
              generation
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

          {/* Step 1: Image Generation Section */}
          <div className="mb-6 p-4 bg-darkBoxSub rounded-lg border border-gray-600">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-4 h-4 text-[#F2D543]" />
              <h3 className="text-white montserrat-medium text-sm">
                Step 1: Generate Key Frame
              </h3>
            </div>

            {/* Image Style Selection - Solo visible si no hay imagen generada */}
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
                    {imageStyles.find((s) => s.id === selectedImageStyle)?.name}
                  </p>
                )}
              </div>
            )}

            {/* Image Prompt - Solo visible si no hay imagen generada */}
            {!generatedImageUrl && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                    Key Frame Description *
                  </label>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe the main frame/scene you want to generate... (e.g., A knight and sorceress facing each other in a moonlit castle courtyard)"
                    rows={3}
                    className="w-full px-4 py-3 bg-darkBox rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular resize-none"
                    required
                  />
                </div>

                {/* Generate Image Button */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={
                      (!selectedCharacters.length && !selectedSpot) ||
                      !imagePrompt.trim() ||
                      isGeneratingImage
                    }
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 flex items-center justify-center gap-2"
                  >
                    {isGeneratingImage ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating Image...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Key Frame
                      </>
                    )}
                  </button>
                </div>
              </>
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
                    onClick={handleDiscardGeneratedImage}
                    className="text-red-400 hover:text-red-300 text-sm montserrat-regular"
                  >
                    Discard & Generate New
                  </button>
                </div>
                <img
                  src={generatedImageUrl}
                  alt="Generated scene frame"
                  className="w-full max-h-64 object-contain rounded-lg bg-black"
                />
                <div className="mt-4 flex flex-col gap-3">
                  <p className="text-green-400 text-sm montserrat-regular">
                    ✓ Key frame generated successfully!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Video Configuration Section - Only show after key frame is generated and before video is generated */}
          {hasGeneratedImage && !generatedVideoUrl && (
            <div className="mb-6 p-4 bg-darkBoxSub rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-4 h-4 text-[#F2D543]" />
                <h3 className="text-white montserrat-medium text-sm">
                  Step 2: Configure Video Generation
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
                  {aiModels.map((model) => (
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
                <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                  Video Motion/Animation Description *
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the motion/animation for the video... (e.g., The knight slowly draws his sword while the sorceress raises her hands to cast a spell, wind blows through their hair)"
                  rows={4}
                  className="w-full px-4 py-3 bg-darkBox rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular resize-none"
                  required
                />
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

          {/* Scene Summary - Solo mostrar si no hay video generado */}
          {(selectedCharacters.length > 0 || selectedSpot || aiPrompt.trim()) &&
            !generatedVideoUrl && (
              <div className="mb-6 p-4 bg-darkBoxSub rounded-lg border border-gray-600">
                <div className="flex items-center gap-2 mb-3">
                  <Video className="w-4 h-4 text-[#F2D543]" />
                  <h3 className="text-white montserrat-medium text-sm">
                    Scene Summary
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Characters:</p>
                    <p className="text-white font-medium">
                      {selectedCharacterNames || "None selected"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Location:</p>
                    <p className="text-white font-medium">
                      {selectedSpotData?.name || "None selected"}
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
                  (!selectedCharacters.length && !selectedSpot) ||
                  !aiPrompt.trim() ||
                  !hasGeneratedImage ||
                  isGenerating
                }
                className="w-full px-4 py-3 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543] flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primarioDark border-t-transparent rounded-full animate-spin"></div>
                    Generating Video...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Generate Video Scene
                  </>
                )}
              </button>
              {!hasGeneratedImage && (
                <p className="text-orange-400 text-sm mt-2 text-center montserrat-regular">
                  Please generate a key frame first before creating the video
                </p>
              )}
            </div>
          )}

          {/* Video Preview - Mostrar solo si ya hay video generado */}
          {generatedVideoUrl && (
            <div className="mb-6 p-4 bg-darkBoxSub rounded-lg border border-gray-600">
              <h3 className="text-white montserrat-medium text-sm mb-3">
                ✓ Generated Scene Video
              </h3>
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
                (!selectedCharacters.length && !selectedSpot) ||
                !generatedVideoUrl ||
                !promptImageUrl
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
