import { useState, useCallback } from "react";
import {
  X,
  Upload,
  Sparkles,
  Image as ImageIcon,
  Brain,
  MapPin,
} from "lucide-react";
import {
  createImageFreepik,
  createSpot,
  createImageOpenAI,
} from "../project/functions";

function ModalCreateSpot({ isOpen, onClose, onSpotCreated, project_id }) {
  const [spotName, setSpotName] = useState("");
  const [spotDescription, setSpotDescription] = useState("");
  const [creationType, setCreationType] = useState("upload"); // 'upload' or 'ai'
  const [aiModel, setAiModel] = useState("gpt");
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedImageStyle, setSelectedImageStyle] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeneratedImage, setHasGeneratedImage] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  // Estilos de imagen disponibles para spots/locations
  const imageStyles = [
    {
      id: "hyper-realism",
      name: "Hyper-realism",
      prompt:
        ", hyper-realistic location, ultra detailed, 8K resolution, photorealistic, professional photography",
    },
    {
      id: "cartoon",
      name: "Cartoon",
      prompt: ", cartoon style location, animated, colorful, whimsical",
    },
    {
      id: "anime",
      name: "Anime",
      prompt: ", anime style location, manga inspired, detailed background",
    },
    {
      id: "oil-painting",
      name: "Oil Painting",
      prompt:
        ", oil painting style location, artistic brushstrokes, classic art",
    },
    {
      id: "watercolor",
      name: "Watercolor",
      prompt: ", watercolor painting location, soft colors, artistic",
    },
    {
      id: "comic-book",
      name: "Comic Book",
      prompt: ", comic book style location, bold colors, dynamic composition",
    },
    {
      id: "fantasy",
      name: "Fantasy Art",
      prompt: ", fantasy art style location, magical, ethereal, detailed",
    },
    {
      id: "cyberpunk",
      name: "Cyberpunk",
      prompt: ", cyberpunk style location, neon lights, futuristic, high-tech",
    },
  ];

  // Función para crear el prompt final con el estilo seleccionado
  const createFinalPrompt = () => {
    const basePrompt = aiPrompt.trim();
    const stylePrompt = selectedImageStyle
      ? imageStyles.find((style) => style.id === selectedImageStyle)?.prompt ||
        ""
      : "";
    return basePrompt + stylePrompt;
  };

  const handleClose = () => {
    setSpotName("");
    setSpotDescription("");
    setCreationType("upload");
    setAiModel("gpt");
    setAiPrompt("");
    setSelectedImageStyle("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsGenerating(false);
    setHasGeneratedImage(false);
    setGenerationError(null);
    onClose();
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  async function handleGenerateAI() {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    setGenerationError(null); // Limpiar errores anteriores

    try {
      // Crear el prompt final con el estilo seleccionado
      const finalPrompt = createFinalPrompt();
      // Agregar contexto al prompt para mejorar la calidad del spot
      const enhancedPrompt = `${finalPrompt}. This location/spot will be used in video production, please without characters, so please ensure the location is clearly visible, well-framed, with good lighting and details. The location should be the main focus of the image, not too small or cut off, with a clear and professional appearance suitable for video content, please only the location.`;

      let response;
      let responseData;

      if (aiModel === "gpt") {
        response = await createImageOpenAI({ prompt: enhancedPrompt });
        responseData = await response.json();
      } else if (aiModel === "freepik") {
        response = await createImageFreepik({ prompt: enhancedPrompt });
        responseData = await response.json();
      }

      // Verificar si la respuesta fue exitosa y tiene la imagen
      if (
        responseData &&
        responseData.success &&
        responseData.data &&
        responseData.data.image_base64
      ) {
        // La imagen viene en base64, crear la URL completa
        const base64Image = `data:image/jpeg;base64,${responseData.data.image_base64}`;
        setPreviewUrl(base64Image);
        setHasGeneratedImage(true);
        setGenerationError(null); // Limpiar errores si la generación fue exitosa
      } else {
        // Manejar errores específicos del backend
        let errorMessage = "Error generating image. Please try again.";

        if (responseData && responseData.message) {
          const message = responseData.message;

          // Detectar error de moderación de OpenAI
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

        setGenerationError(errorMessage);
        console.error("Error generating image:", responseData);
      }
    } catch (error) {
      console.error("Error generating image:", error);
      setGenerationError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  const handleDiscardGeneratedImage = () => {
    setPreviewUrl(null);
    setHasGeneratedImage(false);
    setGenerationError(null); // Limpiar errores al descartar
  };

  // Función para comprimir y convertir archivo a base64
  const fileToBase64 = (
    file,
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.7
  ) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo la proporción
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Configurar canvas
        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen comprimida
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a base64 con compresión
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        const base64 = compressedDataUrl.split(",")[1];
        resolve(base64);
      };

      img.onerror = (error) => reject(error);
      img.src = URL.createObjectURL(file);
    });
  };

  // Función para comprimir imagen generada por AI
  const compressAIImage = (
    dataUrl,
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.7
  ) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo la proporción
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Configurar canvas
        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen comprimida
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a base64 con compresión
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        const base64 = compressedDataUrl.split(",")[1];
        resolve(base64);
      };

      img.onerror = (error) => reject(error);
      img.src = dataUrl;
    });
  };

  const handleSubmit = async () => {
    if (!spotName.trim() || !spotDescription.trim()) return;

    if (creationType === "upload" && !selectedFile) return;
    if (creationType === "ai" && !hasGeneratedImage) return;

    try {
      let base64Image = null;

      // Obtener la imagen en base64 según el tipo de creación
      if (creationType === "upload" && selectedFile) {
        // Convertir archivo subido a base64 con compresión
        base64Image = await fileToBase64(selectedFile);
      } else if (creationType === "ai" && previewUrl) {
        // Comprimir imagen generada por AI
        base64Image = await compressAIImage(previewUrl);
      }

      // Preparar datos para la API
      const spotData = {
        type: creationType === "upload" ? "upload" : "generate",
        ai_model: creationType === "ai" ? aiModel : null,
        prompt: creationType === "ai" ? aiPrompt : null,
        base_64_image: base64Image,
        name: spotName,
        description: spotDescription,
        project_id: project_id, // Asegurarse de enviar el ID del proyecto
      };

      // Llamar a la función createSpot
      const response = await createSpot(spotData);
      const responseData = await response.json();

      if (response.ok && responseData.success) {
        if (onSpotCreated) {
          onSpotCreated(responseData.data);
        }

        handleClose();
      } else {
        console.error("Error creating spot:", responseData);
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    } catch (error) {
      console.error("Error creating spot:", error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000091] bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-darkBox rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold text-white montserrat-medium">
            Create Spot
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Creation Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-4 montserrat-regular">
              How do you want to create your spot? *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload Option */}
              <div
                onClick={() => setCreationType("upload")}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  creationType === "upload"
                    ? "border-[#F2D543] bg-[#F2D54315]"
                    : "border-gray-600 hover:border-gray-500 hover:bg-darkBoxSub"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      creationType === "upload"
                        ? "bg-[#F2D543] text-primarioDark"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                  </div>
                  <h3 className="font-medium text-white montserrat-medium">
                    Upload Image
                  </h3>
                </div>
                <p className="text-sm text-gray-400 montserrat-regular">
                  Upload your own spot image
                </p>
              </div>

              {/* AI Option */}
              <div
                onClick={() => setCreationType("ai")}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  creationType === "ai"
                    ? "border-[#F2D543] bg-[#F2D54315]"
                    : "border-gray-600 hover:border-gray-500 hover:bg-darkBoxSub"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      creationType === "ai"
                        ? "bg-[#F2D543] text-primarioDark"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-medium text-white montserrat-medium">
                    Generate with AI
                  </h3>
                </div>
                <p className="text-sm text-gray-400 montserrat-regular">
                  Create with artificial intelligence
                </p>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          {creationType === "upload" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                Spot Image *
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  dragActive
                    ? "border-[#F2D543] bg-[#F2D54315]"
                    : "border-gray-600 hover:border-gray-500"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Spot preview"
                      className="mx-auto max-h-48 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="text-red-400 hover:text-red-300 text-sm montserrat-regular"
                    >
                      Remove image
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white montserrat-medium mb-1">
                        Drop your spot image here or click to browse
                      </p>
                      <p className="text-gray-400 text-sm montserrat-regular">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="spot-image"
                    />
                    <label
                      htmlFor="spot-image"
                      className="inline-block px-4 py-2 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors cursor-pointer montserrat-medium"
                    >
                      Browse Files
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Generation Section */}
          {creationType === "ai" && (
            <div className="mb-6 space-y-4">
              {/* AI Generation Controls - Solo mostrar si no hay imagen generada y no se está generando */}
              {!hasGeneratedImage && !isGenerating && (
                <>
                  {/* AI Model Selection */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                      AI Model *
                    </label>
                    <select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular"
                    >
                      <option value="gpt" className="bg-darkBoxSub text-white">
                        GPT
                      </option>
                      <option
                        value="freepik"
                        className="bg-darkBoxSub text-white"
                      >
                        Freepik
                      </option>
                    </select>
                  </div>

                  {/* Image Style Selection */}
                  <div>
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

                  {/* AI Prompt */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                      Describe your spot *
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => {
                        setAiPrompt(e.target.value);
                        // Limpiar error cuando el usuario modifica el prompt
                        if (generationError) {
                          setGenerationError(null);
                        }
                      }}
                      placeholder="Describe the location you want to generate... (e.g., A cozy coffee shop interior with warm lighting and wooden furniture)"
                      rows={4}
                      className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular resize-none"
                    />
                  </div>

                  {/* Generate Button */}
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={!aiPrompt.trim() || isGenerating}
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
                          Generating your spot...
                        </span>
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        Generate Spot
                      </>
                    )}
                  </button>

                  {/* Error Message */}
                  {generationError && (
                    <div className="mt-3 p-3 bg-red-900 bg-opacity-20 border border-red-600 rounded-lg">
                      <p className="text-red-400 text-sm montserrat-regular">
                        {generationError}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Generating State - Mostrar mientras se genera la imagen */}
              {isGenerating && !hasGeneratedImage && (
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
                      Creating your spot...
                    </h3>
                    <p className="text-gray-400 text-sm montserrat-regular">
                      Please wait while AI generates your location image
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

              {/* AI Generated Preview - Solo mostrar si hay imagen generada */}
              {hasGeneratedImage && previewUrl && (
                <div className="border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white text-sm montserrat-medium">
                      Generated Spot:
                    </p>
                    <button
                      type="button"
                      onClick={handleDiscardGeneratedImage}
                      className="text-red-400 hover:text-red-300 text-sm montserrat-regular flex items-center gap-1 px-2 py-1 rounded hover:bg-red-400/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Discard
                    </button>
                  </div>
                  <img
                    src={previewUrl}
                    alt="AI Generated spot"
                    className="mx-auto max-h-48 rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {/* Spot Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Spot Name *
            </label>
            <input
              type="text"
              value={spotName}
              onChange={(e) => setSpotName(e.target.value)}
              placeholder="Enter spot name..."
              className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular"
              required
            />
          </div>

          {/* Spot Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Spot Description *
            </label>
            <textarea
              value={spotDescription}
              onChange={(e) => setSpotDescription(e.target.value)}
              placeholder="Describe the location, atmosphere, key features, lighting conditions..."
              rows={4}
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
                !spotName.trim() ||
                !spotDescription.trim() ||
                (creationType === "upload" && !selectedFile) ||
                (creationType === "ai" && !hasGeneratedImage)
              }
              className="px-6 py-2 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543]"
            >
              Create Spot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalCreateSpot;
