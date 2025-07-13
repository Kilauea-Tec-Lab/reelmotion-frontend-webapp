import { useState, useCallback } from "react";
import { X, Upload, Sparkles, Image, Brain, MapPin } from "lucide-react";

function ModalCreateSpot({ isOpen, onClose, projectId, onSpotCreated }) {
  const [spotName, setSpotName] = useState("");
  const [spotDescription, setSpotDescription] = useState("");
  const [creationType, setCreationType] = useState("upload"); // 'upload' or 'ai'
  const [aiModel, setAiModel] = useState("gpt");
  const [aiPrompt, setAiPrompt] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleClose = () => {
    setSpotName("");
    setSpotDescription("");
    setCreationType("upload");
    setAiModel("gpt");
    setAiPrompt("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsGenerating(false);
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

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      // Aquí iría la lógica para generar la imagen con IA
      // Por ahora simularemos con un delay
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Simular una imagen generada
      setPreviewUrl(
        "https://via.placeholder.com/300x300/333/fff?text=AI+Generated+Spot"
      );
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!spotName.trim() || !spotDescription.trim()) return;

    if (creationType === "upload" && !selectedFile) return;
    if (creationType === "ai" && !aiPrompt.trim()) return;

    try {
      // Aquí iría la lógica para crear el spot
      const spotData = {
        name: spotName,
        description: spotDescription,
        project_id: projectId,
        creation_type: creationType,
        ...(creationType === "upload" && { image: selectedFile }),
        ...(creationType === "ai" && {
          ai_model: aiModel,
          ai_prompt: aiPrompt,
        }),
      };

      console.log("Creating spot:", spotData);

      if (onSpotCreated) {
        onSpotCreated(spotData);
      }

      handleClose();
    } catch (error) {
      console.error("Error creating spot:", error);
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
                  <option value="freepik" className="bg-darkBoxSub text-white">
                    Freepik
                  </option>
                </select>
              </div>

              {/* AI Prompt */}
              <div>
                <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                  Describe your spot *
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
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
                    Generate Spot
                  </>
                )}
              </button>

              {/* AI Generated Preview */}
              {previewUrl && (
                <div className="border border-gray-600 rounded-lg p-4">
                  <p className="text-white text-sm montserrat-medium mb-2">
                    Generated Spot:
                  </p>
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
                (creationType === "ai" && !aiPrompt.trim())
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
