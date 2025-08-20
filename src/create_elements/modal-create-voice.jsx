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

  // Fetch available voices from AudioStack
  const fetchVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const result = await getAudioStackVoices();

      if (result.success) {
        // Asegurar que siempre sea un array
        const voices = Array.isArray(result.voices)
          ? result.voices
          : Array.isArray(result.voices?.voices)
          ? result.voices.voices
          : [];

        console.log("Fetched voices:", voices); // Debug log
        setAvailableVoices(voices);
        setFilteredVoices(voices);
      } else {
        console.error("Error fetching voices:", result.error);
        setAvailableVoices([]);
        setFilteredVoices([]);
      }
    } catch (error) {
      console.error("Error fetching voices:", error);
      setAvailableVoices([]);
      setFilteredVoices([]);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  // Load voices when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchVoices();
    }
  }, [isOpen]);

  // Filter voices based on search and filters
  useEffect(() => {
    if (!Array.isArray(availableVoices)) {
      setFilteredVoices([]);
      return;
    }

    let filtered = availableVoices;

    if (searchTerm) {
      filtered = filtered.filter(
        (voice) =>
          voice.alias?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          voice.tags?.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          voice.purpose?.some((purpose) =>
            purpose.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (languageFilter) {
      filtered = filtered.filter((voice) => voice.language === languageFilter);
    }

    if (genderFilter) {
      filtered = filtered.filter((voice) => voice.gender === genderFilter);
    }

    if (ageFilter) {
      filtered = filtered.filter((voice) => voice.ageBracket === ageFilter);
    }

    setFilteredVoices(filtered);
    setCurrentPage(1); // Reset page when filters change
  }, [availableVoices, searchTerm, languageFilter, genderFilter, ageFilter]);

  // Lazy loading effect - update displayed voices when filtered voices or page changes
  useEffect(() => {
    const startIndex = 0;
    const endIndex = currentPage * VOICES_PER_PAGE;
    setDisplayedVoices(filteredVoices.slice(startIndex, endIndex));
  }, [filteredVoices, currentPage]);

  // Get unique filter values
  const getUniqueValues = (key) => {
    if (!Array.isArray(availableVoices)) return [];
    const keyMap = {
      age: "ageBracket",
      language: "language",
      gender: "gender",
    };
    const actualKey = keyMap[key] || key;
    return [
      ...new Set(
        availableVoices.map((voice) => voice[actualKey]).filter(Boolean)
      ),
    ];
  };

  const handleClose = () => {
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

    // Detener audio de preview
    stopVoicePreview();

    if (audioRef.current) {
      audioRef.current.pause();
    }
    onClose();
  };

  // Calcular tiempo estimado basado en el texto
  const calculateEstimatedTime = (text) => {
    if (!text.trim()) return 0;

    const words = text.trim().split(/\s+/).length;
    const wordsPerSecond = 1.2; // Velocidad promedio

    // Agregar tiempo extra para pausas y pronunciación natural
    const baseTime = words / wordsPerSecond;
    const estimatedSeconds = Math.ceil(baseTime * 1.2); // 20% extra

    setEstimatedTime(estimatedSeconds);
    return estimatedSeconds;
  };

  // Actualizar estimación cuando cambia el texto
  const handleTextChange = (text) => {
    setTextToSpeak(text);
    calculateEstimatedTime(text);
  };

  const handleVoiceChange = (voice) => {
    setSelectedVoice(voice);
  };

  // Reproducir preview de la voz seleccionada
  const playVoicePreview = (voice) => {
    if (!voice?.audioSample) return;

    // Si ya hay un audio reproduciéndose, detenerlo
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      setPreviewAudio(null);
      setPlayingVoiceId(null);
    }

    // Si es la misma voz que estaba reproduciéndose, solo detener
    if (playingVoiceId === voice.voiceId) {
      return;
    }

    console.log(`Playing preview for voice: ${voice.alias}`);

    // Crear un nuevo elemento de audio y reproducir
    const audio = new Audio(voice.audioSample);

    audio.addEventListener("ended", () => {
      setPreviewAudio(null);
      setPlayingVoiceId(null);
    });

    audio.addEventListener("error", (error) => {
      console.error("Error playing audio preview:", error);
      setPreviewAudio(null);
      setPlayingVoiceId(null);
    });

    audio
      .play()
      .then(() => {
        setPreviewAudio(audio);
        setPlayingVoiceId(voice.voiceId);
      })
      .catch((error) => {
        console.error("Error playing audio preview:", error);
        setPreviewAudio(null);
        setPlayingVoiceId(null);
      });
  };

  // Detener preview de audio
  const stopVoicePreview = () => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      setPreviewAudio(null);
      setPlayingVoiceId(null);
    }
  };

  // Load more voices
  const loadMoreVoices = () => {
    if (isLoadingMore) return;

    const maxPage = Math.ceil(filteredVoices.length / VOICES_PER_PAGE);
    if (currentPage >= maxPage) return;

    setIsLoadingMore(true);
    // Simulate loading time for better UX
    setTimeout(() => {
      setCurrentPage((prev) => prev + 1);
      setIsLoadingMore(false);
    }, 300);
  };

  const handleGenerateVoice = async () => {
    if (!textToSpeak.trim() || !selectedVoice) {
      alert("Por favor, selecciona una voz y escribe el texto a generar.");
      return;
    }

    setIsGenerating(true);
    try {
      // Paso 1: Crear script en AudioStack
      console.log("Creando script...");
      const scriptResult = await createAudioStackScript({
        text: textToSpeak,
        projectName: "reelmotion",
        moduleName: "voice_generation",
        scriptName: `voice_${Date.now()}`,
      });

      if (!scriptResult.success) {
        throw new Error(`Error creando script: ${scriptResult.error}`);
      }

      // Paso 2: Generar speech con AudioStack
      console.log("Generando speech...");
      const speechResult = await generateAudioStackSpeech({
        scriptId: scriptResult.data.scriptId,
        voiceId: selectedVoice.voiceId,
      });

      if (!speechResult.success) {
        throw new Error(`Error generando speech: ${speechResult.error}`);
      }

      // Configurar el audio generado
      setGeneratedAudioUrl(speechResult.data.audioUrl);
      setDuration(speechResult.data.duration || estimatedTime);

      console.log("Voz generada exitosamente:", speechResult.data);
    } catch (error) {
      console.error("Error generating voice:", error);
      alert(`Error generando la voz: ${error.message}`);
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
    if (
      !voiceName.trim() ||
      !voiceDescription.trim() ||
      !textToSpeak.trim() ||
      !generatedAudioUrl
    ) {
      alert(
        "Por favor, completa todos los campos y genera la voz antes de guardar."
      );
      return;
    }

    try {
      const voiceData = {
        name: voiceName,
        description: voiceDescription,
        project_id: projectId,
        voice_id: selectedVoice?.voiceId,
        voice_name: selectedVoice?.alias,
        text: textToSpeak,
        audio_url: generatedAudioUrl,
        duration: duration,
      };

      console.log("Creating voice in backend:", voiceData);

      // Usar la función createVoice que va al backend
      const result = await createVoice(voiceData);

      if (result.success) {
        console.log("Voice created successfully:", result.data);

        if (onVoiceCreated) {
          onVoiceCreated(result.data);
        }

        handleClose();
        alert("Voz creada exitosamente!");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error creating voice:", error);
      alert(`Error creando la voz: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  const selectedVoiceData = availableVoices.find(
    (v) => v.voiceId === selectedVoice?.voiceId
  );

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
              Select Voice *{" "}
              {isLoadingVoices && (
                <span className="text-[#F2D543]">(Cargando voces...)</span>
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
                  className="bg-darkBoxSub border border-gray-600 rounded-lg text-white px-3 py-2 focus:border-[#F2D543] focus:outline-none"
                >
                  <option value="">All lenguages</option>
                  {getUniqueValues("language").map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>

                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="bg-darkBoxSub border border-gray-600 rounded-lg text-white px-3 py-2 focus:border-[#F2D543] focus:outline-none"
                >
                  <option value="">All genders</option>
                  {getUniqueValues("gender").map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>

                <select
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)}
                  className="bg-darkBoxSub border border-gray-600 rounded-lg text-white px-3 py-2 focus:border-[#F2D543] focus:outline-none"
                >
                  <option value="">All ages</option>
                  {getUniqueValues("age").map((age) => (
                    <option key={age} value={age}>
                      {age}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {displayedVoices.length === 0 && !isLoadingVoices ? (
                  <div className="col-span-full text-center text-gray-400 py-8">
                    {availableVoices.length === 0
                      ? "No se pudieron cargar las voces. Verifica tu conexión."
                      : "No se encontraron voces con los filtros aplicados."}
                  </div>
                ) : (
                  displayedVoices.map((voice) => (
                    <div
                      key={voice.voiceId}
                      onClick={() => handleVoiceChange(voice)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedVoice?.voiceId === voice.voiceId
                          ? "border-[#F2D543] bg-[#F2D54315]"
                          : "border-gray-600 hover:border-gray-500 hover:bg-darkBoxSub"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-2 rounded-lg ${
                              selectedVoice?.voiceId === voice.voiceId
                                ? "bg-[#F2D543] text-primarioDark"
                                : "bg-gray-700 text-gray-300"
                            }`}
                          >
                            <Mic className="w-4 h-4" />
                          </div>
                          <h3 className="font-medium text-white montserrat-medium">
                            {voice.alias}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (playingVoiceId === voice.voiceId) {
                              stopVoicePreview();
                            } else {
                              playVoicePreview(voice);
                            }
                          }}
                          className="p-1 text-[#F2D543] hover:text-[#f2f243] transition-colors"
                          title={
                            playingVoiceId === voice.voiceId
                              ? "Stop preview"
                              : "Play preview"
                          }
                        >
                          {playingVoiceId === voice.voiceId ? (
                            <Square className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 montserrat-regular mb-1">
                        {voice.tags?.slice(0, 3).join(", ")}
                      </p>
                      <div className="flex gap-2 text-xs">
                        <span className="text-[#F2D543]">{voice.language}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">{voice.gender}</span>
                        {voice.ageBracket && (
                          <>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-400">
                              {voice.ageBracket}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Load More Button */}
              {displayedVoices.length < filteredVoices.length && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={loadMoreVoices}
                    disabled={isLoadingMore}
                    className={`px-6 py-2 rounded-lg transition-all duration-300 font-medium montserrat-medium flex items-center justify-center gap-2 ${
                      isLoadingMore
                        ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                        : "bg-[#F2D543] text-primarioDark hover:bg-[#f2f243]"
                    }`}
                  >
                    {isLoadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primarioDark border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <span>Load more voices</span>
                        <span className="text-xs">
                          ({displayedVoices.length} / {filteredVoices.length})
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
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
