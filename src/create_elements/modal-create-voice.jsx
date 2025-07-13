import { useState, useRef } from "react";
import { X, Mic, Play, Pause, Volume2, Clock } from "lucide-react";

function ModalCreateVoice({ isOpen, onClose, projectId, onVoiceCreated }) {
  const [voiceName, setVoiceName] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("sarah");
  const [textToSpeak, setTextToSpeak] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  const audioRef = useRef(null);

  // Voces disponibles con sus características
  const availableVoices = [
    {
      id: "sarah",
      name: "Sarah",
      description: "Natural female voice, warm and friendly",
      language: "English",
      gender: "Female",
      previewUrl: "/audio/previews/sarah.mp3",
      speed: 1.2, // palabras por segundo
    },
    {
      id: "john",
      name: "John",
      description: "Professional male voice, clear and authoritative",
      language: "English",
      gender: "Male",
      previewUrl: "/audio/previews/john.mp3",
      speed: 1.1,
    },
    {
      id: "maria",
      name: "María",
      description: "Natural female voice, Spanish native",
      language: "Spanish",
      gender: "Female",
      previewUrl: "/audio/previews/maria.mp3",
      speed: 1.3,
    },
    {
      id: "carlos",
      name: "Carlos",
      description: "Professional male voice, Spanish native",
      language: "Spanish",
      gender: "Male",
      previewUrl: "/audio/previews/carlos.mp3",
      speed: 1.0,
    },
    {
      id: "emily",
      name: "Emily",
      description: "Young female voice, energetic and modern",
      language: "English",
      gender: "Female",
      previewUrl: "/audio/previews/emily.mp3",
      speed: 1.4,
    },
  ];

  const handleClose = () => {
    setVoiceName("");
    setVoiceDescription("");
    setSelectedVoice("sarah");
    setTextToSpeak("");
    setGeneratedAudioUrl(null);
    setIsGenerating(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setEstimatedTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onClose();
  };

  // Calcular tiempo estimado basado en el texto y la velocidad de la voz
  const calculateEstimatedTime = (text, voice) => {
    if (!text.trim()) return 0;

    const words = text.trim().split(/\s+/).length;
    const selectedVoiceData = availableVoices.find((v) => v.id === voice);
    const wordsPerSecond = selectedVoiceData?.speed || 1.2;

    // Agregar tiempo extra para pausas y pronunciación natural
    const baseTime = words / wordsPerSecond;
    const estimatedSeconds = Math.ceil(baseTime * 1.2); // 20% extra

    setEstimatedTime(estimatedSeconds);
    return estimatedSeconds;
  };

  // Actualizar estimación cuando cambia el texto o la voz
  const handleTextChange = (text) => {
    setTextToSpeak(text);
    calculateEstimatedTime(text, selectedVoice);
  };

  const handleVoiceChange = (voiceId) => {
    setSelectedVoice(voiceId);
    calculateEstimatedTime(textToSpeak, voiceId);
  };

  // Reproducir preview de la voz seleccionada
  const playVoicePreview = (voiceId) => {
    const voice = availableVoices.find((v) => v.id === voiceId);
    if (voice?.previewUrl) {
      // Simular reproducción de preview
      console.log(`Playing preview for voice: ${voice.name}`);
      // Aquí iría la lógica real para reproducir el audio de preview
    }
  };

  const handleGenerateVoice = async () => {
    if (!textToSpeak.trim()) return;

    setIsGenerating(true);
    try {
      // Simular generación de voz
      await new Promise((resolve) => setTimeout(resolve, estimatedTime * 1000));

      // Simular audio generado
      setGeneratedAudioUrl(
        "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
      );
      setDuration(estimatedTime);
    } catch (error) {
      console.error("Error generating voice:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Controles del reproductor de audio
  const togglePlayPause = () => {
    if (!audioRef.current || !generatedAudioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    if (!voiceName.trim() || !voiceDescription.trim() || !textToSpeak.trim())
      return;

    try {
      const voiceData = {
        name: voiceName,
        description: voiceDescription,
        project_id: projectId,
        voice_id: selectedVoice,
        text: textToSpeak,
        audio_url: generatedAudioUrl,
        duration: duration,
      };

      console.log("Creating voice:", voiceData);

      if (onVoiceCreated) {
        onVoiceCreated(voiceData);
      }

      handleClose();
    } catch (error) {
      console.error("Error creating voice:", error);
    }
  };

  if (!isOpen) return null;

  const selectedVoiceData = availableVoices.find((v) => v.id === selectedVoice);

  return (
    <div className="fixed inset-0 bg-[#00000091] bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-darkBox rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold text-white montserrat-medium">
            Create Voice
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Voice Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-4 montserrat-regular">
              Select Voice *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableVoices.map((voice) => (
                <div
                  key={voice.id}
                  onClick={() => handleVoiceChange(voice.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedVoice === voice.id
                      ? "border-[#F2D543] bg-[#F2D54315]"
                      : "border-gray-600 hover:border-gray-500 hover:bg-darkBoxSub"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-lg ${
                          selectedVoice === voice.id
                            ? "bg-[#F2D543] text-primarioDark"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                      </div>
                      <h3 className="font-medium text-white montserrat-medium">
                        {voice.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playVoicePreview(voice.id);
                      }}
                      className="p-1 text-[#F2D543] hover:text-[#f2f243] transition-colors"
                      title="Play preview"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 montserrat-regular mb-1">
                    {voice.description}
                  </p>
                  <div className="flex gap-2 text-xs">
                    <span className="text-[#F2D543]">{voice.language}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">{voice.gender}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Text to Speech */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Text to Generate *
            </label>
            <textarea
              value={textToSpeak}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Enter the text you want to convert to speech..."
              rows={4}
              className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular resize-none"
              required
            />
          </div>

          {/* Time Estimation */}
          {textToSpeak.trim() && (
            <div className="mb-6 p-4 bg-darkBoxSub rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-[#F2D543]" />
                <h3 className="text-white montserrat-medium text-sm">
                  Generation Estimate
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Words:</p>
                  <p className="text-white font-medium">
                    {textToSpeak.trim().split(/\s+/).length}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Voice:</p>
                  <p className="text-white font-medium">
                    {selectedVoiceData?.name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Duration:</p>
                  <p className="text-white font-medium">
                    {formatTime(estimatedTime)}
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
              onClick={handleGenerateVoice}
              disabled={!textToSpeak.trim() || isGenerating}
              className="w-full px-4 py-3 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543] flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-primarioDark border-t-transparent rounded-full animate-spin"></div>
                  Generating Voice... (
                  {Math.max(
                    0,
                    estimatedTime -
                      (Math.floor(Date.now() / 1000) % estimatedTime)
                  )}
                  s)
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  Generate Voice
                </>
              )}
            </button>
          </div>

          {/* Audio Player */}
          {generatedAudioUrl && (
            <div className="mb-6 p-4 bg-darkBoxSub rounded-lg border border-gray-600">
              <h3 className="text-white montserrat-medium text-sm mb-3">
                Generated Voice
              </h3>
              <div className="space-y-3">
                {/* Audio Element */}
                <audio
                  ref={audioRef}
                  src={generatedAudioUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />

                {/* Controls */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlayPause}
                    className="p-2 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>

                  {/* Progress Bar */}
                  <div className="flex-1">
                    <div
                      className="h-2 bg-gray-600 rounded-full cursor-pointer"
                      onClick={handleSeek}
                    >
                      <div
                        className="h-full bg-[#F2D543] rounded-full transition-all"
                        style={{
                          width: duration
                            ? `${(currentTime / duration) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>

                  {/* Time Display */}
                  <span className="text-white text-sm montserrat-regular min-w-[80px]">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Voice Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Voice Name *
            </label>
            <input
              type="text"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="Enter voice name..."
              className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular"
              required
            />
          </div>

          {/* Voice Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Voice Description *
            </label>
            <textarea
              value={voiceDescription}
              onChange={(e) => setVoiceDescription(e.target.value)}
              placeholder="Describe how this voice will be used in your project..."
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
                !voiceName.trim() ||
                !voiceDescription.trim() ||
                !textToSpeak.trim() ||
                !generatedAudioUrl
              }
              className="px-6 py-2 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543]"
            >
              Create Voice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalCreateVoice;
