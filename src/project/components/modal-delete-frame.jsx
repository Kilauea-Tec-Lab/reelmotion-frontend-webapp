import { X, Trash2, AlertTriangle, Image } from "lucide-react";
import { destroyFrame } from "../functions";

function ModalDeleteFrame({ isOpen, onClose, frame, onConfirm }) {
  async function handleDelete() {
    try {
      const response = await destroyFrame({
        id: frame.id,
      });

      if (response.ok) {
        // Llamar al callback si existe
        if (onConfirm) {
          onConfirm(frame);
        }
        onClose();
      } else {
        console.error("Error deleting frame");
      }
    } catch (error) {
      console.error("Error deleting frame:", error);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000091] bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-darkBox rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#DC569D30] bg-opacity-20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-primarioLogo" />
            </div>
            <h2 className="text-xl font-semibold text-white montserrat-medium">
              Delete Frame
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="mb-6">
            <p className="text-gray-300 montserrat-regular mb-4">
              Are you sure you want to delete the frame{" "}
              <span className="font-medium text-white">"{frame?.name}"</span>?
            </p>
            <p className="text-gray-400 text-sm montserrat-regular">
              This action cannot be undone. The frame will be permanently
              removed from your storyboard.
            </p>
          </div>

          {/* Frame Preview */}
          {frame && (
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto">
                {frame?.media_type === "video" || frame?.type === "video" ? (
                  <video
                    src={frame?.media_url}
                    className="w-full h-full object-cover rounded-lg"
                    muted
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

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors montserrat-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-primarioLogo text-white rounded-lg hover:bg-red-600 transition-colors montserrat-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Frame
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalDeleteFrame;
