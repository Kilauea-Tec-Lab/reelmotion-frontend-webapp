import { useState, useRef, useEffect } from "react";
import { X, Play, Pause, Volume2, VolumeX } from "lucide-react";

function ModalPreview({ isOpen, onClose, type, data }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
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
      mediaElement.muted = !isMuted;
      setIsMuted(!isMuted);
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
  );
}

export default ModalPreview;
