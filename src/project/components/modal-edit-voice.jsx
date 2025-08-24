import { useState, useEffect } from "react";
import { X, Mic, Volume2 } from "lucide-react";
import Cookies from "js-cookie";

function ModalEditVoice({ isOpen, onClose, voice, onVoiceUpdated }) {
  const [voiceName, setVoiceName] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Llenar el formulario con los datos de la voz cuando se abre el modal
  useEffect(() => {
    if (voice && isOpen) {
      setVoiceName(voice.name || "");
      setVoiceDescription(voice.description || "");
    }
  }, [voice, isOpen]);

  async function handleSubmit() {
    if (!voiceName.trim() || !voiceDescription.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}projects/edit-voice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify({
            id: voice.id,
            name: voiceName.trim(),
            description: voiceDescription.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const updatedVoiceData = {
          ...voice,
          name: voiceName,
          description: voiceDescription,
        };

        // Llamar al callback si existe
        if (onVoiceUpdated) {
          onVoiceUpdated(updatedVoiceData);
        }

        handleClose();
      } else {
        console.error("Error updating voice");
      }
    } catch (error) {
      console.error("Error updating voice:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleClose = () => {
    setVoiceName("");
    setVoiceDescription("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000091] bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-darkBox rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F2D543] bg-opacity-20 rounded-lg flex items-center justify-center">
              <Mic className="w-5 h-5 text-primarioDark" />
            </div>
            <h2 className="text-xl font-semibold text-white montserrat-medium">
              Edit Voice
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Voice Preview */}
          {voice && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                Current Voice
              </label>
              <div className="flex items-center gap-4 p-4 bg-darkBoxSub rounded-lg">
                <div className="w-20 h-20 bg-[#F2D543] bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Volume2 className="w-8 h-8 text-primarioDark" />
                </div>
                <div>
                  <p className="text-white montserrat-medium">{voice.name}</p>
                  <p className="text-gray-400 text-sm montserrat-regular line-clamp-2">
                    {voice.description}
                  </p>
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
              placeholder="Describe the voice characteristics, tone, accent, speaking style..."
              rows={4}
              className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular resize-none"
              required
            />
          </div>

          {/* Note about voice audio */}
          <div className="mb-6 p-4 bg-blue-900 bg-opacity-20 border border-blue-500 border-opacity-30 rounded-lg">
            <div className="flex gap-3">
              <Volume2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-300 text-sm montserrat-medium mb-1">
                  Note about voice audio
                </p>
                <p className="text-blue-200 text-sm montserrat-regular">
                  Voice audio file cannot be changed in edit mode. To change the
                  audio, please create a new voice.
                </p>
              </div>
            </div>
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
                !voiceName.trim() || !voiceDescription.trim() || isLoading
              }
              className="px-6 py-2 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543]"
            >
              {isLoading ? "Updating..." : "Update Voice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalEditVoice;
