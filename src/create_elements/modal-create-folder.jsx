import { useState } from "react";
import { X, Folder, FolderOpen, Star, Lock, Users } from "lucide-react";

function ModalCreateFolder({ isOpen, onClose }) {
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [folderColor, setFolderColor] = useState("#F2D543");

  const folderTypes = [
    {
      id: "regular",
      name: "Regular Folder",
      icon: Folder,
      description: "Standard folder for organizing projects",
    },
    {
      id: "shared",
      name: "Shared Folder",
      icon: Users,
      description: "Collaborate with team members",
    },
    {
      id: "starred",
      name: "Starred Folder",
      icon: Star,
      description: "Mark as important for quick access",
    },
    {
      id: "private",
      name: "Private Folder",
      icon: Lock,
      description: "Personal folder with restricted access",
    },
  ];

  const colorOptions = [
    "#F2D543",
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FECA57",
    "#FF9FF3",
    "#54A0FF",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!folderName || !selectedType) return;

    console.log("Creating folder:", {
      name: folderName,
      description: folderDescription,
      type: selectedType,
      color: folderColor,
    });

    // Aquí puedes agregar la lógica para crear el folder
    // Por ejemplo, hacer una llamada a la API

    // Limpiar formulario y cerrar modal
    setFolderName("");
    setFolderDescription("");
    setSelectedType("");
    setFolderColor("#F2D543");
    onClose();
  };

  const handleClose = () => {
    setFolderName("");
    setFolderDescription("");
    setSelectedType("");
    setFolderColor("#F2D543");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000091] bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-darkBox rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 ">
          <h2 className="text-xl font-semibold text-white montserrat-medium">
            Create New Folder
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Folder Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Folder Name *
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name..."
              className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular"
              required
            />
          </div>

          {/* Folder Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Description (Optional)
            </label>
            <textarea
              value={folderDescription}
              onChange={(e) => setFolderDescription(e.target.value)}
              placeholder="Describe this folder..."
              rows={3}
              className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular resize-none"
            />
          </div>

          {/* Folder Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-4 montserrat-regular">
              Folder Type *
            </label>
            <div className="grid grid-cols-1 gap-3">
              {folderTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedType === type.id
                      ? "border-[#F2D543] bg-[#F2D54315]"
                      : "border-gray-600 hover:border-gray-500 hover:bg-darkBoxSub"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        selectedType === type.id
                          ? "bg-[#F2D543] text-primarioDark"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      <type.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white montserrat-medium text-sm">
                        {type.name}
                      </h3>
                      <p className="text-xs text-gray-400 montserrat-regular mt-1">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Folder Color */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-white mb-4 montserrat-regular">
              Folder Color
            </label>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg border-2 border-gray-600 flex items-center justify-center"
                style={{ backgroundColor: folderColor }}
              >
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFolderColor(color)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                      folderColor === color
                        ? "border-white shadow-lg"
                        : "border-gray-600 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 ">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors montserrat-regular"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!folderName || !selectedType}
              className="px-6 py-2 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543]"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalCreateFolder;
