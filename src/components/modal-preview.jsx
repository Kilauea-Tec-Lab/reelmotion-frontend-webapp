import { useState, useRef, useEffect } from "react";
import { X, Play, Pause, Volume2, VolumeX } from "lucide-react";

function ModalPreview({ isOpen, onClose, type, data }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [previousVolume, setPreviousVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const mediaElement = type === "video" ? videoRef.current : audioRef.current;
    if (mediaElement) {
      mediaElement.volume = volume;
    }
  }, [volume, type]);

  const handlePlayPause = () => {
    const mediaElement = type === "video" ? videoRef.current : audioRef.current;

    if (mediaElement) {
      if (isPlaying) {
        mediaElement.pause();
      } else {
        mediaElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    const mediaElement = type === "video" ? videoRef.current : audioRef.current;

    if (mediaElement) {
      if (isMuted) {
        // Unmute and restore previous volume
        mediaElement.muted = false;
        setVolume(previousVolume);
        setIsMuted(false);
      } else {
        // Mute and remember current volume
        setPreviousVolume(volume);
        mediaElement.muted = true;
        setIsMuted(true);
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    const mediaElement = type === "video" ? videoRef.current : audioRef.current;
    if (mediaElement) {
      mediaElement.volume = newVolume;

      // Auto-unmute if volume is increased from 0
      if (newVolume > 0 && isMuted) {
        mediaElement.muted = false;
        setIsMuted(false);
      }

      // Auto-mute if volume is set to 0
      if (newVolume === 0 && !isMuted) {
        mediaElement.muted = true;
        setIsMuted(true);
      }
    }
  };

  const handleTimeUpdate = () => {
    const mediaElement = type === "video" ? videoRef.current : audioRef.current;

    if (mediaElement) {
      setCurrentTime(mediaElement.currentTime);
      setDuration(mediaElement.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const mediaElement = type === "video" ? videoRef.current : audioRef.current;
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;

    if (mediaElement) {
      mediaElement.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleClose = () => {
    // Pausar cualquier reproducción al cerrar
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    onClose();
  };

  if (!isOpen || !data) return null;

  // Estilos para el slider de volumen
  const sliderStyles = `
    .volume-slider::-webkit-slider-thumb {
      appearance: none;
      height: 16px;
      width: 16px;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 0 2px 0 #555;
      transition: background 0.15s ease-in-out;
    }


    .volume-slider::-moz-range-thumb {
      height: 16px;
      width: 16px;
      border-radius: 50%;
      cursor: pointer;
      border: none;
      box-shadow: 0 0 2px 0 #555;
    }
  `;

  const renderContent = () => {
    switch (type) {
      case "image":
        return (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={data.image_url || data.media_url}
              alt={data.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        );

      case "video":
        return (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                src={data.video_url || data.media_url}
                className="max-w-full max-h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                muted={isMuted}
              />
            </div>

            {/* Video Controls */}
            <div className="mt-4 space-y-2">
              {/* Progress Bar */}
              <div
                className="w-full h-2 bg-gray-600 rounded-full cursor-pointer"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-[#f2f243] rounded-full transition-all"
                  style={{
                    width: `${
                      duration > 0 ? (currentTime / duration) * 100 : 0
                    }%`,
                  }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayPause}
                    className="p-2 bg-[#f2f243] text-primarioDark rounded-full hover:bg-yellow-300 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </button>

                  <button
                    onClick={handleMute}
                    className="p-2 bg-gray-600 text-white rounded-full hover:bg-gray-500 transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="volume-slider w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-white text-xs min-w-[30px]">
                      {Math.round((isMuted ? 0 : volume) * 100)}%
                    </span>
                  </div>

                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case "audio":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
            {/* Audio Visualization */}
            <div className="w-48 h-48 bg-gradient-to-br from-[#f2f243] to-yellow-500 rounded-full flex items-center justify-center shadow-xl">
              <div className="w-32 h-32 bg-primarioDark rounded-full flex items-center justify-center">
                <Volume2 className="w-16 h-16 text-[#f2f243]" />
              </div>
            </div>

            {/* Audio Element */}
            <audio
              ref={audioRef}
              src={data.audio_url || data.voice_url}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              muted={isMuted}
            />

            {/* Audio Title */}
            <h3 className="text-white text-xl font-medium text-center">
              {data.name}
            </h3>

            {/* Audio Controls */}
            <div className="w-full max-w-md space-y-4">
              {/* Progress Bar */}
              <div
                className="w-full h-2 bg-gray-600 rounded-full cursor-pointer"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-[#f2f243] rounded-full transition-all"
                  style={{
                    width: `${
                      duration > 0 ? (currentTime / duration) * 100 : 0
                    }%`,
                  }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handlePlayPause}
                  className="p-3 bg-[#f2f243] text-primarioDark rounded-full hover:bg-yellow-300 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </button>

                <button
                  onClick={handleMute}
                  className="p-3 bg-gray-600 text-white rounded-full hover:bg-gray-500 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-6 h-6" />
                  ) : (
                    <Volume2 className="w-6 h-6" />
                  )}
                </button>

                {/* Volume Slider */}
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="volume-slider w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #f2f243 0%, #f2f243 ${
                        (isMuted ? 0 : volume) * 100
                      }%, #4b5563 ${
                        (isMuted ? 0 : volume) * 100
                      }%, #4b5563 100%)`,
                    }}
                  />
                  <span className="text-white text-sm min-w-[35px]">
                    {Math.round((isMuted ? 0 : volume) * 100)}%
                  </span>
                </div>

                <span className="text-white text-sm min-w-[80px] text-center">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-white">Unsupported content type</p>
          </div>
        );
    }
  };

  return (
    <>
      <style>{sliderStyles}</style>
      <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-darkBox rounded-lg w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3">
            <div>
              <h2 className="text-xl font-semibold text-white montserrat-medium">
                {data.name}
              </h2>
              {data.description && (
                <p className="text-gray-400 text-sm mt-1">{data.description}</p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-2 overflow-hidden">{renderContent()}</div>
        </div>
      </div>
    </>
  );
}

export default ModalPreview;
