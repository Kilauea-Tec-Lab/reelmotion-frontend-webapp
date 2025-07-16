import { X, Trash2, AlertTriangle, User } from "lucide-react";
import { destroyCharacter } from "../functions";

function ModalDeleteCharacter({ isOpen, onClose, character, onConfirm }) {
  async function handleDelete() {
    destroyCharacter({
      id: character.id,
    });

    // Llamar al callback si existe
    if (onConfirm) {
      onConfirm(character);
    }

    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000091] bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-darkBox rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-900 bg-opacity-20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white montserrat-medium">
              Delete Character
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
              Are you sure you want to delete the character{" "}
              <span className="font-medium text-white">
                "{character?.name}"
              </span>
              ?
            </p>
            <div className="bg-red-900 bg-opacity-10 border border-red-500 border-opacity-30 rounded-lg p-4">
              <div className="flex gap-3">
                <User className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 text-sm montserrat-medium mb-1">
                    This action cannot be undone
                  </p>
                  <p className="text-red-200 text-sm montserrat-regular">
                    The character and all its associated data will be
                    permanently deleted from your project.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Character Preview */}
          {character && (
            <div className="mb-6">
              <div className="flex items-center gap-4 p-4 bg-darkBoxSub rounded-lg border border-gray-600">
                <img
                  src={character.image_url}
                  alt={character.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-white montserrat-medium text-sm">
                    {character.name}
                  </h3>
                  <p className="text-gray-400 text-xs montserrat-regular line-clamp-2 mt-1">
                    {character.description}
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
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors montserrat-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Character
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalDeleteCharacter;
