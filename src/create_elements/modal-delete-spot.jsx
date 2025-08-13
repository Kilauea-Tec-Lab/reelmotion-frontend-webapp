import { X, Trash2, AlertTriangle, MapPin } from "lucide-react";
import { destroySpot } from "../project/functions";

function ModalDeleteSpot({ isOpen, onClose, spot, onConfirm }) {
  async function handleDelete() {
    try {
      destroySpot({
        id: spot.id,
      });

      // Llamar al callback si existe
      if (onConfirm) {
        onConfirm(spot);
      }

      onClose();
    } catch (error) {
      console.error("Error deleting spot:", error);
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
              Delete Spot
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
              Are you sure you want to delete the spot{" "}
              <span className="font-medium text-white">"{spot?.name}"</span>?
            </p>
            <div className="bg-[#DC569D30] bg-opacity-10 border border-primarioLogo border-opacity-30 rounded-lg p-4">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-[#DC569D] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#DC569D] text-sm montserrat-medium mb-1">
                    This action cannot be undone
                  </p>
                  <p className="text-[#DC569D] text-sm montserrat-regular">
                    The spot and all its associated data will be permanently
                    deleted from your project.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Spot Preview */}
          {spot && (
            <div className="mb-6">
              <div className="flex items-center gap-4 p-4 bg-darkBoxSub rounded-lg border border-gray-600">
                <img
                  src={spot.image_url}
                  alt={spot.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-white montserrat-medium text-sm">
                    {spot.name}
                  </h3>
                  <p className="text-gray-400 text-xs montserrat-regular line-clamp-2 mt-1">
                    {spot.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors montserrat-regular"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-primarioLogo text-white rounded-lg hover:bg-[#DC569D50] transition-colors montserrat-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Spot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalDeleteSpot;
