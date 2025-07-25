import { useState, useCallback } from "react";
import { X, Upload, Sparkles, Image as ImageIcon, Brain } from "lucide-react";
import {
  createImageFreepik,
  createCharacter,
  createImageOpenAI,
} from "../project/functions";

function ModalCreateCharacter({
  isOpen,
  onClose,
  projectId,
  onCharacterCreated,
  project_id,
}) {
  const [characterName, setCharacterName] = useState("");
  const [characterDescription, setCharacterDescription] = useState("");
  const [creationType, setCreationType] = useState("upload"); // 'upload' or 'ai'
  const [aiModel, setAiModel] = useState("gpt");
  const [aiPrompt, setAiPrompt] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeneratedImage, setHasGeneratedImage] = useState(false);

  const handleClose = () => {
    setCharacterName("");
    setCharacterDescription("");
    setCreationType("upload");
    setAiModel("gpt");
    setAiPrompt("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsGenerating(false);
    setHasGeneratedImage(false);
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
    try {
      // Agregar contexto al prompt para mejorar la calidad del personaje
      const enhancedPrompt = `${aiPrompt}. This character will be used in video production, so please ensure the character is clearly visible, well-framed, centered in the image, with good proportions and details. The character should be the main focus of the image, not too small or cut off, with a clear and professional appearance suitable for video content.`;

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
        responseData.data.image_url
      ) {
        // La imagen viene en base64, crear la URL completa
        const base64Image = `data:image/jpeg;base64,${responseData.data.image_url}`;
        setPreviewUrl(base64Image);
        setHasGeneratedImage(true);
      } else {
        console.error("Error: No se pudo generar la imagen");
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setIsGenerating(false);
    }
  }

  const handleDiscardGeneratedImage = () => {
    setPreviewUrl(null);
    setHasGeneratedImage(false);
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
    if (!characterName.trim() || !characterDescription.trim()) return;

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
      const characterData = {
        type: creationType === "upload" ? "upload" : "generate",
        ai_model: creationType === "ai" ? aiModel : null,
        prompt: creationType === "ai" ? aiPrompt : null,
        base_64_image: base64Image,
        name: characterName,
        description: characterDescription,
        project_id: project_id, // Asegurarse de enviar el ID del proyecto
      };

      // Llamar a la función createCharacter
      const response = await createCharacter(characterData);
      const responseData = await response.json();

      if (response.ok && responseData.success) {
        console.log("Character created successfully:", responseData);

        if (onCharacterCreated) {
          onCharacterCreated(responseData.data);
        }

        handleClose();
      } else {
        console.error("Error creating character:", responseData);
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    } catch (error) {
      console.error("Error creating character:", error);
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
            Create Character
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
              How do you want to create your character? *
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
                  Upload your own character image
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
                Character Image *
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
                      alt="Character preview"
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
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white montserrat-medium mb-1">
                        Drop your image here or click to browse
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
                      id="character-image"
                    />
                    <label
                      htmlFor="character-image"
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
              {/* AI Generation Controls - Solo mostrar si no hay imagen generada */}
              {!hasGeneratedImage && (
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
                        GPT - DALL·E 3
                      </option>
                      <option
                        value="freepik"
                        className="bg-darkBoxSub text-white"
                      >
                        Freepik
                      </option>
                    </select>
                  </div>

                  {/* AI Prompt */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                      Describe your character *
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Describe the character you want to generate... (e.g., A medieval knight with silver armor and blue eyes)"
                      rows={4}
                      className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular resize-none"
                    />
                  </div>

                  {/* Generate Button */}
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={!aiPrompt.trim() || isGenerating}
                    className="w-full px-4 py-3 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543] flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primarioDark border-t-transparent rounded-full animate-spin"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        Generate Character
                      </>
                    )}
                  </button>
                </>
              )}

              {/* AI Generated Preview - Solo mostrar si hay imagen generada */}
              {hasGeneratedImage && previewUrl && (
                <div className="border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white text-sm montserrat-medium">
                      Generated Character:
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
                    alt="AI Generated character"
                    className="mx-auto max-h-48 rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {/* Character Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Character Name *
            </label>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Enter character name..."
              className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular"
              required
            />
          </div>

          {/* Character Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Character Description *
            </label>
            <textarea
              value={characterDescription}
              onChange={(e) => setCharacterDescription(e.target.value)}
              placeholder="Describe the character's personality, background, role in your story..."
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
                !characterName.trim() ||
                !characterDescription.trim() ||
                (creationType === "upload" && !selectedFile) ||
                (creationType === "ai" && !hasGeneratedImage)
              }
              className="px-6 py-2 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543]"
            >
              Create Character
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalCreateCharacter;
