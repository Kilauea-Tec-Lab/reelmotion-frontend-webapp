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
  CreditCard,
} from "lucide-react";
import {
  getElevenLabsVoices,
  generateElevenLabsSpeech,
  createElevenLabsVoice,
} from "./functions";
import Cookies from "js-cookie";

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

  // Token system states
  const [tokens, setTokens] = useState(0);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // Cost per minute of voice (16 tokens per minute)
  const VOICE_COST_PER_MINUTE = 16;

  // Audio preview states
  const [previewAudio, setPreviewAudio] = useState(null);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);

  // ElevenLabs specific states
  const [elevenLabsModel, setElevenLabsModel] = useState(
    "eleven_multilingual_v2"
  );
  const [voiceSettings, setVoiceSettings] = useState({
    stability: 0.5,
    similarity_boost: 0.5,
    style: 0.0,
    use_speaker_boost: true,
  });

  const audioRef = useRef(null);

  // Custom Slider Component
  const CustomSlider = ({
    value,
    min,
    max,
    step,
    onChange,
    className = "",
  }) => {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div className={`custom-slider-container ${className}`}>
        <div className="custom-slider-track"></div>
        <div
          className="custom-slider-progress"
          style={{ width: `${percentage}%` }}
        ></div>
        <div
          className="custom-slider-thumb"
          style={{ left: `${percentage}%` }}
        ></div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          className="custom-slider-input"
        />
      </div>
    );
  };

  // Helper function to get voice ID
  const getVoiceId = (voice) => {
    if (!voice) return null;
    return voice.voice_id;
  };

  // Helper function to get voice audio sample URL
  const getVoiceAudioSample = (voice) => {
    if (!voice) return null;
    return voice.preview_url;
  };

  // Helper function to get voice name
  const getVoiceName = (voice) => {
    if (!voice) return "Unknown Voice";
    return voice.name;
  };

  // Helper function to get voice language
  const getVoiceLanguage = (voice) => {
    if (!voice) return "Unknown";
    return voice.labels?.language || "Multi";
  };

  // Helper function to get voice gender
  const getVoiceGender = (voice) => {
    if (!voice) return "Unknown";
    return voice.labels?.gender || "Unknown";
  };

  // Helper function to get voice age
  const getVoiceAge = (voice) => {
    if (!voice) return "Unknown";
    return voice.labels?.age || "Unknown";
  };

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
        setTokens(data.data || 0);
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

  // Function to reduce tokens after successful voice generation
  const reduceTokens = async (tokensToReduce) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}tokens/reduce-tokens`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify({
            tokens: tokensToReduce,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        console.log(`Successfully reduced ${tokensToReduce} tokens`);
        // Refresh tokens from server
        fetchUserTokens();
      } else {
        console.error("Error reducing tokens:", data.message);
      }
    } catch (error) {
      console.error("Error reducing tokens:", error);
    }
  };

  // Function to calculate tokens required based on estimated duration
  const calculateRequiredTokens = () => {
    if (!estimatedTime) return VOICE_COST_PER_MINUTE;

    // Apply the 2x multiplier for more realistic duration
    const adjustedTime = estimatedTime * 2;
    const minutes = Math.ceil(adjustedTime / 60); // Round up to next minute
    return minutes * VOICE_COST_PER_MINUTE;
  };

  // Load voices when modal opens
  useEffect(() => {
    if (isOpen) {
      loadVoices();
    }
  }, [isOpen]);

  // Load tokens and user info when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUserTokens();
      fetchUserInfo();
    }
  }, [isOpen]);

  // Filter and search logic
  useEffect(() => {
    let filtered = availableVoices.filter((voice) => voice != null);

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((voice) =>
        getVoiceName(voice).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply language filter
    if (languageFilter) {
      filtered = filtered.filter(
        (voice) => getVoiceLanguage(voice) === languageFilter
      );
    }

    // Apply gender filter
    if (genderFilter) {
      filtered = filtered.filter(
        (voice) => getVoiceGender(voice) === genderFilter
      );
    }

    // Apply age filter
    if (ageFilter) {
      filtered = filtered.filter((voice) => getVoiceAge(voice) === ageFilter);
    }

    setFilteredVoices(filtered);
    setCurrentPage(1);
    setDisplayedVoices(filtered.slice(0, VOICES_PER_PAGE));
  }, [availableVoices, searchTerm, languageFilter, genderFilter, ageFilter]);

  const loadVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const result = await getElevenLabsVoices();

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
          value = getVoiceLanguage(voice);
          break;
        case "gender":
          value = getVoiceGender(voice);
          break;
        case "age":
          value = getVoiceAge(voice);
          break;
        default:
          value = voice[key];
      }
      if (value && value !== "Unknown" && !values.includes(value)) {
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

  // Calculate estimated time based on text length (more accurate for voice synthesis)
  const calculateEstimatedTime = (text) => {
    if (!text || text.trim().length === 0) {
      setEstimatedTime(0);
      return 0;
    }

    // More accurate calculation based on character count including spaces
    // Average speaking rate: ~8-12 characters per second including spaces
    // We'll use 10 characters per second as a middle ground
    const charactersPerSecond = 10;
    const totalCharacters = text.length; // Include spaces and all characters
    const estimatedSeconds = totalCharacters / charactersPerSecond;

    // Minimum duration of 2 seconds for any text
    const finalEstimatedSeconds = Math.max(estimatedSeconds, 2);

    setEstimatedTime(finalEstimatedSeconds);
    return finalEstimatedSeconds;
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
      // ElevenLabs preview URLs can be played directly
      const audioUrl = audioSampleUrl;

      const audio = new Audio(audioUrl);
      audio.volume = 0.7;

      audio.onplay = () => {
        setPlayingVoiceId(getVoiceId(voice));
      };

      audio.onended = () => {
        setPlayingVoiceId(null);
        setPreviewAudio(null);
      };

      audio.onerror = () => {
        console.error("Error playing voice preview");
        setPlayingVoiceId(null);
        setPreviewAudio(null);
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

    // Validate sufficient tokens
    const requiredTokens = calculateRequiredTokens();
    if (tokens < requiredTokens) {
      alert(
        `Insufficient tokens. You need ${requiredTokens} tokens but only have ${Math.floor(
          tokens
        ).toLocaleString("en-US")}.`
      );
      return;
    }

    console.log("Starting voice generation with:", {
      text: textToSpeak,
      selectedVoice: selectedVoice,
      voiceId: voiceId,
      requiredTokens: requiredTokens,
    });

    setIsGenerating(true);
    try {
      // Use ElevenLabs API
      const speechResult = await generateElevenLabsSpeech({
        text: textToSpeak,
        voiceId: voiceId,
        model_id: elevenLabsModel,
        ...voiceSettings,
      });

      console.log("Speech result:", speechResult);

      if (!speechResult.success) {
        throw new Error(`Error generating speech: ${speechResult.error}`);
      }

      // Calculate actual tokens to reduce based on actual duration
      const actualDuration = speechResult.data.duration || estimatedTime;
      const actualMinutes = Math.ceil(actualDuration / 60);
      const tokensToReduce = actualMinutes * VOICE_COST_PER_MINUTE;

      // Configure generated audio and switch to player mode
      setGeneratedAudioUrl(speechResult.data.audioUrl);
      setDuration(actualDuration);
      setGeneratedVoiceData({
        audioUrl: speechResult.data.audioUrl,
        audioBlob: speechResult.data.audioBlob,
        playableAudioUrl: speechResult.data.audioUrl,
        duration: actualDuration,
        format: speechResult.data.format || "mp3",
        textUsed: textToSpeak,
        voiceUsed: selectedVoice,
        model_id: speechResult.data.model_id,
        voice_settings: speechResult.data.voice_settings,
      });

      // Hide creator and show player
      setShowVoiceCreator(false);

      // Reduce tokens after successful generation
      console.log(
        `Voice generation successful, reducing ${tokensToReduce} tokens...`
      );
      await reduceTokens(tokensToReduce);

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

    if (!generatedVoiceData) {
      alert("No voice audio generated to save.");
      return;
    }

    setIsSavingVoice(true);
    try {
      // Para ElevenLabs, enviaremos el blob y los parámetros
      const voiceData = {
        name: voiceName.trim(),
        description: voiceDescription.trim(),
        audio_blob: generatedVoiceData.audioBlob,
        duration: generatedVoiceData.duration,
        format: generatedVoiceData.format,
        text_used: generatedVoiceData.textUsed,
        voice_id: getVoiceId(generatedVoiceData.voiceUsed),
        voice_name: getVoiceName(generatedVoiceData.voiceUsed),
        model_id: generatedVoiceData.model_id,
        voice_settings: generatedVoiceData.voice_settings,
        project_id: projectId,
      };

      console.log("Saving ElevenLabs voice with data:", voiceData);
      const result = await createElevenLabsVoice(voiceData);

      if (result.success) {
        if (onVoiceCreated) {
          onVoiceCreated(result.data);
        }
        handleClose();
      } else {
        throw new Error(result.error || "Unknown error saving voice");
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
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white montserrat-medium">
              Create Voice
            </h2>
            {/* Token Display */}
            <div className="flex items-center gap-2 bg-darkBoxSub px-3 py-1 rounded-lg">
              <CreditCard size={16} className="text-[#F2D543]" />
              <span className="text-sm text-gray-300 montserrat-regular">
                {isLoadingTokens
                  ? "..."
                  : Math.floor(tokens).toLocaleString("en-US")}{" "}
                tokens
              </span>
            </div>
          </div>
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
              {/* Voice Configuration */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-3 montserrat-regular">
                  Voice Configuration
                </label>
                <div className="bg-darkBoxSub rounded-lg p-4 space-y-4">
                  {/* Model Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">
                      Model
                    </label>
                    <select
                      value={elevenLabsModel}
                      onChange={(e) => setElevenLabsModel(e.target.value)}
                      className="w-full px-3 py-2 bg-darkBox border border-gray-600 rounded text-white focus:border-[#F2D543] focus:outline-none text-sm"
                    >
                      <option value="eleven_multilingual_v2">
                        Multilingual v2 (High Quality)
                      </option>
                      <option value="eleven_flash_v2_5">
                        Flash v2.5 (Fast, Low Latency)
                      </option>
                      <option value="eleven_turbo_v2_5">
                        Turbo v2.5 (Balanced)
                      </option>
                      <option value="eleven_v3_alpha">
                        v3 Alpha (Most Expressive)
                      </option>
                    </select>
                  </div>

                  {/* Voice Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-2">
                        Stability: {voiceSettings.stability}
                      </label>
                      <CustomSlider
                        min={0}
                        max={1}
                        step={0.1}
                        value={voiceSettings.stability}
                        onChange={(e) =>
                          setVoiceSettings((prev) => ({
                            ...prev,
                            stability: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-2">
                        Similarity Boost: {voiceSettings.similarity_boost}
                      </label>
                      <CustomSlider
                        min={0}
                        max={1}
                        step={0.1}
                        value={voiceSettings.similarity_boost}
                        onChange={(e) =>
                          setVoiceSettings((prev) => ({
                            ...prev,
                            similarity_boost: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-2">
                        Style: {voiceSettings.style}
                      </label>
                      <CustomSlider
                        min={0}
                        max={1}
                        step={0.1}
                        value={voiceSettings.style}
                        onChange={(e) =>
                          setVoiceSettings((prev) => ({
                            ...prev,
                            style: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={voiceSettings.use_speaker_boost}
                        onChange={(e) =>
                          setVoiceSettings((prev) => ({
                            ...prev,
                            use_speaker_boost: e.target.checked,
                          }))
                        }
                        className="mr-2"
                      />
                      <label className="text-xs font-medium text-gray-300">
                        Use Speaker Boost
                      </label>
                    </div>
                  </div>
                </div>
              </div>

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
                                {getVoiceName(voice)}
                              </h4>
                              <p className="text-gray-400 text-xs mt-1">
                                {getVoiceLanguage(voice)} •{" "}
                                {getVoiceGender(voice)} • {getVoiceAge(voice)}
                              </p>
                              {voice.labels?.description && (
                                <p className="text-gray-500 text-xs mt-1">
                                  {voice.labels.description}
                                </p>
                              )}
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
                    Base estimate: {Math.ceil(estimatedTime * 2)}s (
                    {textToSpeak.length} characters)
                  </p>
                )}
              </div>

              {/* Generate Button */}
              <div className="mb-6">
                {/* Token Cost Info */}
                <div className="mb-3 p-3 bg-darkBoxSub rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300 montserrat-regular">
                      Estimated Cost:
                    </span>
                    <span className="text-[#F2D543] font-medium montserrat-medium">
                      {calculateRequiredTokens()} tokens
                    </span>
                  </div>
                  {estimatedTime > 0 && (
                    <div className="text-xs text-gray-400 mt-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>
                          Base estimate: ~{Math.ceil(estimatedTime)}s (
                          {textToSpeak.length} chars)
                        </span>
                        <span>Adjusted: ~{Math.ceil(estimatedTime * 2)}s</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>
                          Billing: {Math.ceil((estimatedTime * 2) / 60)} min
                        </span>
                        <span>{VOICE_COST_PER_MINUTE} tokens/min</span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleGenerateVoice}
                  disabled={
                    isGenerating ||
                    !textToSpeak.trim() ||
                    !selectedVoice ||
                    isLoadingVoices ||
                    tokens < calculateRequiredTokens()
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
                    className="px-4 py-2 bg-primarioLogo text-white rounded-lg transition-colors font-medium montserrat-medium flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Discard
                  </button>
                </div>

                {/* Audio Player */}
                <div className="bg-darkBoxSub rounded-lg p-6">
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
