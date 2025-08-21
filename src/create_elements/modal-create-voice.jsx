import { useState, useRef, useEffect } from "react";
import {
  X,
  Mic,
  Play,
  Pause,
  Volume2,
  Clock,
  Search,
  Filter,
  Square,
} from "lucide-react";
import {
  getAudioStackVoices,
  createAudioStackScript,
  generateAudioStackSpeech,
  createVoice,
  getAudioStackPreview,
  getAudioStackGeneratedAudio,
} from "./functions";

function ModalCreateVoice({ isOpen, onClose, projectId, onVoiceCreated }) {
  const [voiceName, setVoiceName] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [textToSpeak, setTextToSpeak] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  // New states for the generated voice flow
  const [showVoiceCreator, setShowVoiceCreator] = useState(true);
  const [generatedVoiceData, setGeneratedVoiceData] = useState(null);
  const [isSavingVoice, setIsSavingVoice] = useState(false);

  // Voice library states
  const [availableVoices, setAvailableVoices] = useState([]);
  const [filteredVoices, setFilteredVoices] = useState([]);
  const [displayedVoices, setDisplayedVoices] = useState([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");

  // Lazy loading states
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const VOICES_PER_PAGE = 50;

  // Audio preview states
  const [previewAudio, setPreviewAudio] = useState(null);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);

  const audioRef = useRef(null);

  // Helper function to get voice ID
  const getVoiceId = (voice) => {
    if (!voice) return null;
    return voice.voiceId || voice.id || voice.voice_id || voice.identifier;
  };

  // Helper function to get voice audio sample URL
  const getVoiceAudioSample = (voice) => {
    if (!voice) return null;
    return (
      voice.audioSample || voice.previewUrl || voice.sample_url || voice.preview
    );
  };

  // Load voices when modal opens
  useEffect(() => {
    if (isOpen) {
      loadVoices();
    }
  }, [isOpen]);

  // Filter and search logic
  useEffect(() => {
    let filtered = availableVoices.filter((voice) => voice != null);

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((voice) =>
        (voice.name || voice.voiceName || voice.displayName || voice.id || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    // Apply language filter
    if (languageFilter) {
      filtered = filtered.filter(
        (voice) => (voice.language || voice.lang) === languageFilter
      );
    }

    // Apply gender filter
    if (genderFilter) {
      filtered = filtered.filter(
        (voice) => (voice.gender || voice.sex) === genderFilter
      );
    }

    // Apply age filter
    if (ageFilter) {
      filtered = filtered.filter(
        (voice) => (voice.age || voice.ageGroup) === ageFilter
      );
    }

    setFilteredVoices(filtered);
    setCurrentPage(1);
    setDisplayedVoices(filtered.slice(0, VOICES_PER_PAGE));
  }, [availableVoices, searchTerm, languageFilter, genderFilter, ageFilter]);

  const loadVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const result = await getAudioStackVoices();
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

  const loadMoreVoices = () => {
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const startIndex = nextPage * VOICES_PER_PAGE;
    const endIndex = startIndex + VOICES_PER_PAGE;
    const newVoices = filteredVoices.slice(startIndex, endIndex);

    setTimeout(() => {
      setDisplayedVoices((prev) => [...prev, ...newVoices]);
      setCurrentPage(nextPage);
      setIsLoadingMore(false);
    }, 500);
  };

  const getUniqueValues = (key) => {
    let values = [];
    availableVoices.forEach((voice) => {
      if (!voice) return; // Skip null/undefined voices

      let value = null;
      switch (key) {
        case "language":
          value = voice.language || voice.lang;
          break;
        case "gender":
          value = voice.gender || voice.sex;
          break;
        case "age":
          value = voice.age || voice.ageGroup;
          break;
        default:
          value = voice[key];
      }
      if (value && !values.includes(value)) {
        values.push(value);
      }
    });
    return values.sort();
  };

  const handleClose = () => {
    // Clean up blob URLs
    if (generatedAudioUrl && generatedAudioUrl.startsWith("blob:")) {
      URL.revokeObjectURL(generatedAudioUrl);
    }

    setVoiceName("");
    setVoiceDescription("");
    setSelectedVoice(null);
    setTextToSpeak("");
    setGeneratedAudioUrl(null);
    setIsGenerating(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setEstimatedTime(0);
    setSearchTerm("");
    setLanguageFilter("");
    setGenderFilter("");
    setAgeFilter("");
    setCurrentPage(1);
    setDisplayedVoices([]);

    // Reset new states
    setShowVoiceCreator(true);
    setGeneratedVoiceData(null);
    setIsSavingVoice(false);

    // Detener audio de preview
    stopVoicePreview();

    if (audioRef.current) {
      audioRef.current.pause();
    }

    onClose();
  };

  // Calcular tiempo estimado basado en el texto
  const calculateEstimatedTime = (text) => {
    if (!text || text.trim().length === 0) {
      setEstimatedTime(0);
      return 0;
    }

    // Promedio de 150 palabras por minuto de habla
    const wordsPerMinute = 150;
    const words = text.trim().split(/\s+/).length;
    const estimatedSeconds = (words / wordsPerMinute) * 60;

    setEstimatedTime(estimatedSeconds);
    return estimatedSeconds;
  };

  // Actualizar estimación cuando cambia el texto
  const handleTextChange = (text) => {
    setTextToSpeak(text);
    calculateEstimatedTime(text);
  };

  const handleVoiceChange = (voice) => {
    console.log("Selected voice:", voice);
    setSelectedVoice(voice);
  };

  // Reproducir preview de la voz seleccionada
  const playVoicePreview = async (voice) => {
    const audioSampleUrl = getVoiceAudioSample(voice);
    if (!audioSampleUrl) return;

    // Si ya hay un audio reproduciéndose, detenerlo
    if (previewAudio) {
      previewAudio.pause();
      setPreviewAudio(null);
      setPlayingVoiceId(null);
    }

    try {
      // Use authenticated preview function for AudioStack URLs
      const previewResult = await getAudioStackPreview(audioSampleUrl);

      if (!previewResult.success) {
        console.error("Error getting audio preview:", previewResult.error);
        return;
      }

      const audio = new Audio(previewResult.audioUrl);
      audio.volume = 0.7;

      audio.onplay = () => {
        setPlayingVoiceId(getVoiceId(voice));
      };

      audio.onended = () => {
        setPlayingVoiceId(null);
        setPreviewAudio(null);
        // Clean up blob URL
        URL.revokeObjectURL(previewResult.audioUrl);
      };

      audio.onerror = () => {
        console.error("Error playing voice preview");
        setPlayingVoiceId(null);
        setPreviewAudio(null);
        // Clean up blob URL
        URL.revokeObjectURL(previewResult.audioUrl);
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
      alert("Please select a voice and enter the text to generate.");
      return;
    }

    const voiceId = getVoiceId(selectedVoice);
    if (!voiceId) {
      alert("Selected voice does not have a valid ID.");
      return;
    }

    console.log("Starting voice generation with:", {
      text: textToSpeak,
      selectedVoice: selectedVoice,
      voiceId: voiceId,
    });

    setIsGenerating(true);
    try {
      // Paso 1: Crear script en AudioStack
      console.log("Creating script...");
      const scriptResult = await createAudioStackScript({
        text: textToSpeak,
        projectName: "reelmotion",
        moduleName: "voice_generation",
        scriptName: `voice_${Date.now()}`,
      });

      console.log("Script result:", scriptResult);

      if (!scriptResult.success) {
        throw new Error(`Error creando script: ${scriptResult.error}`);
      }

      if (!scriptResult.data || !scriptResult.data.scriptId) {
        throw new Error(
          `Script creado pero sin scriptId: ${JSON.stringify(
            scriptResult.data
          )}`
        );
      }

      // Paso 2: Generar speech con AudioStack
      console.log("Generating speech...");
      const speechResult = await generateAudioStackSpeech({
        scriptId: scriptResult.data.scriptId,
        voiceId: getVoiceId(selectedVoice),
      });

      console.log("Speech result:", speechResult);

      if (!speechResult.success) {
        throw new Error(`Error generating speech: ${speechResult.error}`);
      }

      // Get authenticated audio URL for playback
      console.log("Getting authenticated audio URL...");

      // Check if this is a generated audio URL (which has CORS restrictions)
      const isGeneratedAudio =
        speechResult.data.audioUrl.includes("v2.api.audio/file/");

      let playableAudioUrl = null;

      if (isGeneratedAudio) {
        console.log("Generated audio detected - CORS restrictions apply");
        // For generated audio, we can't play it directly due to CORS
        // We'll show a download option instead
      } else {
        // For preview audio, try to get authenticated version
        const authenticatedAudioResult = await getAudioStackGeneratedAudio(
          speechResult.data.audioUrl
        );

        if (authenticatedAudioResult.success) {
          playableAudioUrl = authenticatedAudioResult.audioUrl;
        } else {
          console.error(
            "Error getting authenticated audio:",
            authenticatedAudioResult.error
          );
        }
      }

      // Configurar el audio generado y cambiar al modo de reproductor
      setGeneratedAudioUrl(playableAudioUrl);
      setDuration(speechResult.data.duration || estimatedTime);
      setGeneratedVoiceData({
        audioUrl: speechResult.data.audioUrl, // Keep original for backend
        playableAudioUrl: playableAudioUrl, // Use authenticated for playback (null if CORS restricted)
        isGeneratedAudio: isGeneratedAudio, // Flag to show different UI
        duration: speechResult.data.duration || estimatedTime,
        format: speechResult.data.format || "mp3",
        textUsed: textToSpeak,
        voiceUsed: selectedVoice,
      });

      // Ocultar el creador y mostrar el reproductor
      setShowVoiceCreator(false);

      console.log("Voice generated successfully:", speechResult.data);
    } catch (error) {
      console.error("Error generating voice:", error);
      alert(`Error generating voice: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Función para descartar la voz generada y volver al creador
  const handleDiscardVoice = () => {
    // Clean up blob URLs
    if (generatedAudioUrl && generatedAudioUrl.startsWith("blob:")) {
      URL.revokeObjectURL(generatedAudioUrl);
    }

    setShowVoiceCreator(true);
    setGeneratedVoiceData(null);
    setGeneratedAudioUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    // Mantener el texto y la voz seleccionada para facilitar re-generación
  };

  // Función para guardar la voz en el backend
  const handleSaveVoice = async () => {
    if (!voiceName.trim()) {
      alert("Please enter a name for the voice.");
      return;
    }

    if (!generatedVoiceData?.audioUrl) {
      alert("No hay audio generado para guardar.");
      return;
    }

    setIsSavingVoice(true);
    try {
      const voiceData = {
        name: voiceName.trim(),
        description: voiceDescription.trim(),
        audio_url: generatedVoiceData.audioUrl,
        duration: generatedVoiceData.duration,
        format: generatedVoiceData.format,
        text_used: generatedVoiceData.textUsed,
        audiostack_voice_id: getVoiceId(generatedVoiceData.voiceUsed),
        audiostack_voice_name: generatedVoiceData.voiceUsed?.name,
        project_id: projectId,
      };

      console.log("Saving voice with data:", voiceData);

      const result = await createVoice(voiceData);

      if (result.success) {
        alert("Voice saved successfully!");
        if (onVoiceCreated) {
          onVoiceCreated(result.data);
        }
        onClose();
      } else {
        throw new Error(result.error || "Error desconocido al guardar la voz");
      }
    } catch (error) {
      console.error("Error saving voice:", error);
      alert(`Error saving voice: ${error.message}`);
    } finally {
      setIsSavingVoice(false);
    }
  };

  // Controles del reproductor de audio
  const togglePlayPause = () => {
    if (
      !audioRef.current ||
      !generatedAudioUrl ||
      generatedVoiceData?.isGeneratedAudio
    )
      return;

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
    if (!audioRef.current || generatedVoiceData?.isGeneratedAudio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

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
          {showVoiceCreator ? (
            /* Voice Creator View */
            <>
              {/* Voice Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-4 montserrat-regular">
                  Select Voice *{" "}
                  {isLoadingVoices && (
                    <span className="text-[#F2D543]">(Loading voices...)</span>
                  )}
                </label>

                {/* Search and Filter Controls */}
                <div className="mb-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search Voices..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-darkBoxSub border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#F2D543] focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-4">
                    <select
                      value={languageFilter}
                      onChange={(e) => setLanguageFilter(e.target.value)}
                      className="px-4 py-2 bg-darkBoxSub border border-gray-600 rounded-lg text-white focus:border-[#F2D543] focus:outline-none"
                    >
                      <option value="">All Languages</option>
                      {getUniqueValues("language").map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>

                    <select
                      value={genderFilter}
                      onChange={(e) => setGenderFilter(e.target.value)}
                      className="px-4 py-2 bg-darkBoxSub border border-gray-600 rounded-lg text-white focus:border-[#F2D543] focus:outline-none"
                    >
                      <option value="">All Genders</option>
                      {getUniqueValues("gender").map((gender) => (
                        <option key={gender} value={gender}>
                          {gender}
                        </option>
                      ))}
                    </select>

                    <select
                      value={ageFilter}
                      onChange={(e) => setAgeFilter(e.target.value)}
                      className="px-4 py-2 bg-darkBoxSub border border-gray-600 rounded-lg text-white focus:border-[#F2D543] focus:outline-none"
                    >
                      <option value="">All Ages</option>
                      {getUniqueValues("age").map((age) => (
                        <option key={age} value={age}>
                          {age}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Voice Library Grid */}
                <div className="bg-darkBoxSub rounded-lg p-4 max-h-80 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayedVoices
                      .filter((voice) => voice && getVoiceId(voice))
                      .map((voice) => (
                        <div
                          key={getVoiceId(voice)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                            getVoiceId(selectedVoice) === getVoiceId(voice)
                              ? "border-[#F2D543] bg-[#F2D543]/10"
                              : "border-gray-600 hover:border-gray-500"
                          }`}
                          onClick={() => handleVoiceChange(voice)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="text-white font-medium text-sm">
                                {voice.name ||
                                  voice.voiceName ||
                                  voice.displayName ||
                                  voice.id ||
                                  "Unknown Voice"}
                              </h4>
                              <p className="text-gray-400 text-xs mt-1">
                                {voice.language || voice.lang || "Unknown"} •{" "}
                                {voice.gender || voice.sex || "Unknown"} •{" "}
                                {voice.age || voice.ageGroup || "Unknown"}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (playingVoiceId === getVoiceId(voice)) {
                                  stopVoicePreview();
                                } else {
                                  playVoicePreview(voice);
                                }
                              }}
                              className={`ml-2 p-2 rounded-full transition-colors ${
                                playingVoiceId === getVoiceId(voice)
                                  ? "bg-[#F2D543] text-primarioDark"
                                  : "bg-gray-600 text-white hover:bg-gray-500"
                              }`}
                            >
                              {playingVoiceId === getVoiceId(voice) ? (
                                <Square className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Load More Button */}
                  {filteredVoices.length > displayedVoices.length && (
                    <div className="text-center mt-4">
                      <button
                        onClick={loadMoreVoices}
                        disabled={isLoadingMore}
                        className="px-4 py-2 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium disabled:opacity-50"
                      >
                        {isLoadingMore ? "Loading..." : "Load more voices"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Text Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                  Text to Generate *
                </label>
                <textarea
                  placeholder="Enter the text you want to convert to speech..."
                  value={textToSpeak}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="w-full h-32 p-3 bg-darkBoxSub border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#F2D543] focus:outline-none resize-none montserrat-regular"
                />
                {estimatedTime > 0 && (
                  <p className="text-[#F2D543] text-sm mt-2 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Estimated duration: {Math.ceil(estimatedTime)}s
                  </p>
                )}
              </div>

              {/* Generate Button */}
              <div className="mb-6">
                <button
                  onClick={handleGenerateVoice}
                  disabled={
                    isGenerating ||
                    !textToSpeak.trim() ||
                    !selectedVoice ||
                    isLoadingVoices
                  }
                  className="w-full px-6 py-3 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543] flex items-center justify-center"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primarioDark mr-2"></div>
                      Generating Voice...
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Generate Voice
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Generated Voice Player View */
            <>
              {/* Voice Player Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white montserrat-medium">
                    Voice Generated Successfully
                  </h3>
                  <button
                    onClick={handleDiscardVoice}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium montserrat-medium flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Discard
                  </button>
                </div>

                {/* Audio Player */}
                <div className="bg-darkBoxSub rounded-lg p-6">
                  {generatedVoiceData?.isGeneratedAudio ? (
                    /* Generated audio with CORS restrictions - show info only */
                    <div className="text-center py-8">
                      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
                        <div className="flex items-center justify-center mb-2">
                          <Mic className="w-6 h-6 mr-2" />
                          <p className="font-medium">
                            Voice Generated Successfully!
                          </p>
                        </div>
                        <p className="text-sm">
                          Your voice has been generated and is ready to save.
                        </p>
                      </div>

                      <div className="text-white space-y-2">
                        <p className="font-medium">Generated Voice Details:</p>
                        <p className="text-sm text-gray-400">
                          Duration: ~{formatTime(duration)}
                        </p>
                        <p className="text-sm text-gray-400">
                          Format: {generatedVoiceData?.format || "MP3"}
                        </p>
                        <p className="text-sm text-gray-400">
                          Voice:{" "}
                          {generatedVoiceData?.voiceUsed?.name ||
                            "Selected Voice"}
                        </p>
                      </div>

                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800 text-sm">
                          <strong>Note:</strong> Generated audio cannot be
                          previewed due to security restrictions, but it will be
                          properly saved and accessible in your project.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Regular audio player for preview audio */
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={togglePlayPause}
                            disabled={!generatedAudioUrl}
                            className={`p-3 rounded-full transition-colors ${
                              generatedAudioUrl
                                ? "bg-[#F2D543] text-primarioDark hover:bg-[#f2f243]"
                                : "bg-gray-600 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {isPlaying ? (
                              <Pause className="w-6 h-6" />
                            ) : (
                              <Play className="w-6 h-6" />
                            )}
                          </button>
                          <div className="text-white">
                            <p className="font-medium">Generated Voice</p>
                            <p className="text-sm text-gray-400">
                              {formatTime(currentTime)} / {formatTime(duration)}
                            </p>
                          </div>
                        </div>
                        <Volume2 className="w-5 h-5 text-gray-400" />
                      </div>

                      {/* Progress Bar */}
                      <div className="relative">
                        <div
                          className="w-full h-2 bg-gray-600 rounded-full cursor-pointer"
                          onClick={handleSeek}
                        >
                          <div
                            className="h-full bg-[#F2D543] rounded-full transition-all duration-150"
                            style={{
                              width:
                                duration > 0
                                  ? `${(currentTime / duration) * 100}%`
                                  : "0%",
                            }}
                          />
                        </div>
                      </div>

                      {/* Audio Element */}
                      {generatedAudioUrl && (
                        <audio
                          ref={audioRef}
                          src={generatedAudioUrl}
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={handleLoadedMetadata}
                          onEnded={() => setIsPlaying(false)}
                          className="hidden"
                        />
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Voice Details Form */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                    Voice Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter voice name..."
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    className="w-full p-3 bg-darkBoxSub border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#F2D543] focus:outline-none montserrat-regular"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                    Voice Description
                  </label>
                  <textarea
                    placeholder="Enter voice description..."
                    value={voiceDescription}
                    onChange={(e) => setVoiceDescription(e.target.value)}
                    className="w-full h-24 p-3 bg-darkBoxSub border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#F2D543] focus:outline-none resize-none montserrat-regular"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div>
                <button
                  onClick={handleSaveVoice}
                  disabled={isSavingVoice || !voiceName.trim()}
                  className="w-full px-6 py-3 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543] flex items-center justify-center"
                >
                  {isSavingVoice ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primarioDark mr-2"></div>
                      Saving Voice...
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Save Voice
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalCreateVoice;
