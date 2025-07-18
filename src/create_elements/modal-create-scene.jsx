import { useState } from "react";
import { X, Users, MapPin, Play, Brain, Clock, Video } from "lucide-react";

function ModalCreateScene({
  isOpen,
  onClose,
  projectId,
  onSceneCreated,
  spots,
  characters,
}) {
  const [sceneName, setSceneName] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState("");
  const [aiModel, setAiModel] = useState("gpt");
  const [aiPrompt, setAiPrompt] = useState("");
  const [videoDuration, setVideoDuration] = useState(15);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(0);

  // Mock data - En producción esto vendría de props o API

  const aiModels = [
    {
      id: "deepseek",
      name: "DeepSeek Video",
      description: "High quality AI video generation",
    },
    {
      id: "runway",
      name: "Runway ML",
      description: "Professional video AI model",
    },
    {
      id: "dall-e",
      name: "DALL-E Video",
      description: "DALL-E model for video generation",
    },
    {
      id: "veo-3",
      name: "Veo-3",
      description: "Advanced video generation model",
    },
    {
      id: "veo-2",
      name: "Veo-2",
      description: "Second generation Veo model for video",
    },
  ];

  const durationOptions = [
    { value: 5, label: "5 seconds", estimatedTime: 30 },
    { value: 10, label: "10 seconds", estimatedTime: 45 },
    { value: 15, label: "15 seconds", estimatedTime: 60 },
    { value: 30, label: "30 seconds", estimatedTime: 90 },
    { value: 60, label: "1 minute", estimatedTime: 150 },
  ];

  const handleClose = () => {
    setSceneName("");
    setSceneDescription("");
    setSelectedCharacters([]);
    setSelectedSpot("");
    setAiModel("gpt");
    setAiPrompt("");
    setVideoDuration(15);
    setGeneratedVideoUrl(null);
    setIsGenerating(false);
    setEstimatedTime(0);
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

  const handleGenerateScene = async () => {
    if (!selectedCharacters.length || !selectedSpot || !aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      // Simular generación de video
      await new Promise((resolve) => setTimeout(resolve, estimatedTime * 1000));

      // Simular video generado
      setGeneratedVideoUrl("/public/test/Video_Maya_Cumbias_y_Coca.mp4");
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
      !selectedCharacters.length ||
      !selectedSpot ||
      !aiPrompt.trim()
    )
      return;

    try {
      const sceneData = {
        name: sceneName,
        description: sceneDescription,
        project_id: projectId,
        character_ids: selectedCharacters,
        spot_id: selectedSpot,
        ai_model: aiModel,
        ai_prompt: aiPrompt,
        duration: videoDuration,
        video_url: generatedVideoUrl,
      };

      if (onSceneCreated) {
        onSceneCreated(sceneData);
      }

      handleClose();
    } catch (error) {
      console.error("Error creating scene:", error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
            <label className="block text-sm font-medium text-white mb-4 montserrat-regular">
              Select Characters *
            </label>
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
              Select Spot/Location *
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
              {aiModels.map((model) => (
                <option
                  key={model.id}
                  value={model.id}
                  className="bg-darkBoxSub text-white"
                >
                  {model.name} - {model.description}
                </option>
              ))}
            </select>
          </div>

          {/* Scene Prompt */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Scene Description/Prompt *
            </label>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe the scene you want to generate... (e.g., The knight draws his sword as the sorceress casts a spell in the moonlit castle courtyard)"
              rows={4}
              className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular resize-none"
              required
            />
          </div>

          {/* Video Duration */}
          <div className="mb-6">
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

          {/* Scene Summary */}
          {(selectedCharacters.length > 0 ||
            selectedSpot ||
            aiPrompt.trim()) && (
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
                <div>
                  <p className="text-gray-400">Generation Time:</p>
                  <p className="text-[#F2D543] font-medium">
                    ~{estimatedTime}s
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGenerateScene}
              disabled={
                !selectedCharacters.length ||
                !selectedSpot ||
                !aiPrompt.trim() ||
                isGenerating
              }
              className="w-full px-4 py-3 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543] flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-primarioDark border-t-transparent rounded-full animate-spin"></div>
                  Generating Scene... ({Math.max(0, estimatedTime)}s)
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Generate Scene
                </>
              )}
            </button>
          </div>

          {/* Video Preview */}
          {generatedVideoUrl && (
            <div className="mb-6 p-4 bg-darkBoxSub rounded-lg border border-gray-600">
              <h3 className="text-white montserrat-medium text-sm mb-3">
                Generated Scene
              </h3>
              <video
                src={generatedVideoUrl}
                controls
                className="w-full max-h-80 rounded-lg bg-black"
                poster="/public/test/thumbnail.jpg"
              >
                Your browser does not support the video tag.
              </video>
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
                !selectedCharacters.length ||
                !selectedSpot ||
                !aiPrompt.trim() ||
                !generatedVideoUrl
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
