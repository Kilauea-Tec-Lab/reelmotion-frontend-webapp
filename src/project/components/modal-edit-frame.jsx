import { useState, useEffect } from "react";
import { X, Image, Upload } from "lucide-react";
import { editFrame } from "../functions";

function ModalEditFrame({ isOpen, onClose, frame, onFrameUpdated }) {
  const [frameName, setFrameName] = useState("");
  const [frameDescription, setFrameDescription] = useState("");

  // Llenar el formulario con los datos del frame cuando se abre el modal
  useEffect(() => {
    if (frame && isOpen) {
      setFrameName(frame.name || "");
      setFrameDescription(frame.description || "");
    }
  }, [frame, isOpen]);

  async function handleSubmit() {
    if (!frameName.trim()) return;

    try {
      const updatedFrameData = {
        id: frame.id,
        name: frameName,
        description: frameDescription,
      };

      const response = await editFrame(updatedFrameData);

      if (response.ok) {
        const updatedFrame = {
          ...frame,
          name: frameName,
          description: frameDescription,
        };

        // Llamar al callback si existe
        if (onFrameUpdated) {
          onFrameUpdated(updatedFrame);
        }

        handleClose();
      } else {
        console.error("Error updating frame");
      }
    } catch (error) {
      console.error("Error updating frame:", error);
    }
  }

  const handleClose = () => {
    setFrameName("");
    setFrameDescription("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000091] bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-darkBox rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 bg-opacity-20 rounded-lg flex items-center justify-center">
              <Image className="w-5 h-5 text-[#f2f243]" />
            </div>
            <h2 className="text-xl font-semibold text-white montserrat-medium">
              Edit Frame
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Current Frame Preview */}
          {frame && (
            <div className="mb-6">
              <label className="block text-white montserrat-medium text-sm mb-2">
                Current Frame
              </label>
              <div className="w-32 h-32 mx-auto mb-4">
                {frame?.media_type === "video" || frame?.type === "video" ? (
                  <video
                    src={frame?.media_url}
                    className="w-full h-full object-cover rounded-lg"
                    muted
                    loop
                    controls
                  />
                ) : (
                  <img
                    src={frame?.media_url}
                    alt={frame?.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                )}
              </div>
            </div>
          )}

          {/* Frame Name */}
          <div className="mb-4">
            <label className="block text-white montserrat-medium text-sm mb-2">
              Frame Name *
            </label>
            <input
              type="text"
              value={frameName}
              onChange={(e) => setFrameName(e.target.value)}
              className="w-full px-3 py-2 bg-darkBoxSub border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#f2f243] focus:outline-none montserrat-regular"
              placeholder="Enter frame name"
              required
            />
          </div>

          {/* Frame Description */}
          <div className="mb-6">
            <label className="block text-white montserrat-medium text-sm mb-2">
              Description
            </label>
            <textarea
              value={frameDescription}
              onChange={(e) => setFrameDescription(e.target.value)}
              className="w-full px-3 py-2 bg-darkBoxSub border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#f2f243] focus:outline-none montserrat-regular h-20 resize-none"
              placeholder="Enter frame description (optional)"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors montserrat-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!frameName.trim()}
              className="px-4 py-2 bg-[#f2f243] text-primarioDark rounded-lg hover:bg-yellow-400 transition-colors montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Update Frame
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalEditFrame;
