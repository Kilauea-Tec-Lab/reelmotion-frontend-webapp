import { useState, useEffect } from "react";
import { X, User, Upload, Image } from "lucide-react";
import { editCharacter } from "../functions";

function ModalEditCharacter({ isOpen, onClose, character }) {
  const [characterName, setCharacterName] = useState("");
  const [characterDescription, setCharacterDescription] = useState("");

  // Llenar el formulario con los datos del personaje cuando se abre el modal

  useEffect(() => {
    if (character && isOpen) {
      setCharacterName(character.name || "");
      setCharacterDescription(character.description || "");
    }
  }, [character, isOpen]);

  async function handleSubmit() {
    if (!characterName.trim() || !characterDescription.trim()) return;

    try {
      // Aquí iría la lógica para actualizar el personaje
      const updatedCharacterData = {
        id: character.id,
        name: characterName,
        description: characterDescription,
      };

      editCharacter(updatedCharacterData);

      handleClose();
    } catch (error) {
      console.error("Error updating character:", error);
    }
  }

  const handleClose = () => {
    setCharacterName("");
    setCharacterDescription("");
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
              <User className="w-5 h-5 text-[#F2D543]" />
            </div>
            <h2 className="text-xl font-semibold text-white montserrat-medium">
              Edit Character
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
          {/* Character Preview */}
          {character && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
                Current Character Image
              </label>
              <div className="flex items-center gap-4 p-4 bg-darkBoxSub rounded-lg">
                <img
                  src={character.image_url}
                  alt={character.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div>
                  <p className="text-white montserrat-medium">
                    {character.name}
                  </p>
                  <p className="text-gray-400 text-sm montserrat-regular line-clamp-2">
                    {character.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Character Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Character Name *
            </label>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Enter character name..."
              className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular"
              required
            />
          </div>

          {/* Character Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Character Description *
            </label>
            <textarea
              value={characterDescription}
              onChange={(e) => setCharacterDescription(e.target.value)}
              placeholder="Describe the character's personality, background, role in your story..."
              rows={4}
              className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular resize-none"
              required
            />
          </div>

          {/* Note about image */}
          <div className="mb-6 p-4 bg-blue-900 bg-opacity-20 border border-blue-500 border-opacity-30 rounded-lg">
            <div className="flex gap-3">
              <Image className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-300 text-sm montserrat-medium mb-1">
                  Note about character image
                </p>
                <p className="text-blue-200 text-sm montserrat-regular">
                  Character image cannot be changed in edit mode. To change the
                  image, please create a new character.
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
              disabled={!characterName.trim() || !characterDescription.trim()}
              className="px-6 py-2 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543]"
            >
              Update Character
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalEditCharacter;
