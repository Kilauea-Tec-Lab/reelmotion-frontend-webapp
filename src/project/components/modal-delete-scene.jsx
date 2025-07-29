import { useState } from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";
import Cookies from "js-cookie";

function ModalDeleteScene({ isOpen, onClose, scene, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!scene) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}scenes/${scene.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + Cookies.get("token"),
          },
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        onConfirm(scene);
        onClose();
      } else {
        console.error("Error deleting scene:", responseData);
      }
    } catch (error) {
      console.error("Error deleting scene:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !scene) return null;

  return (
    <div className="fixed inset-0 bg-[#00000091] bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-darkBox rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-900 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white montserrat-medium">
              Delete Scene
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6">
          {/* Scene Preview */}
          <div className="mb-6 p-4 bg-darkBoxSub rounded-lg">
            <div className="flex items-center gap-4">
              <img
                src={scene.image_url || scene.prompt_image_url}
                alt={scene.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div>
                <h3 className="text-white font-medium montserrat-medium">
                  {scene.name}
                </h3>
                <p className="text-gray-400 text-sm line-clamp-2">
                  {scene.description}
                </p>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="mb-6 p-4 bg-red-900 bg-opacity-20 border border-red-800 rounded-lg">
            <p className="text-red-300 text-sm montserrat-regular">
              <strong>Warning:</strong> This action cannot be undone. Deleting
              this scene will permanently remove it and all associated data
              including the generated video.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors montserrat-regular disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Scene
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalDeleteScene;
