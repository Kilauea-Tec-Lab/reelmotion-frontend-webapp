import { useState, useEffect } from "react";
import { X, Film, Video, Sparkles, Briefcase, Lock, Globe } from "lucide-react";
import { editProject } from "./functions";

function ModalEditProject({
  isOpen,
  onClose,
  project,
  folders,
  onProjectUpdated,
}) {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [folderId, setFolderId] = useState("");
  const [projectVisibility, setProjectVisibility] = useState("private");

  // Llenar el formulario con los datos del proyecto cuando se abre el modal
  useEffect(() => {
    if (project && isOpen) {
      setProjectName(project.name || "");
      setProjectDescription(project.description || "");
      setFolderId(project.folder_id || "");
      setProjectVisibility(project.visibility || "private");
    }
  }, [project, isOpen]);

  async function handleSubmit() {
    if (!projectName || !folderId) return;

    const response = await editProject({
      id: project.id,
      name: projectName,
      description: projectDescription,
      folder_id: folderId,
      visibility: projectVisibility,
    });

    // Llamar al callback si existe
    if (onProjectUpdated) {
      onProjectUpdated();
    }

    handleClose();
  }

  const handleClose = () => {
    setProjectName("");
    setProjectDescription("");
    setFolderId("");
    setProjectVisibility("private");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000091] bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-darkBox rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold text-white montserrat-medium">
            Edit Project
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
          {/* Project Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Project Name *
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter your project name..."
              className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular"
              required
            />
          </div>

          {/* Folder Select */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Folder *
            </label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular"
              required
            >
              <option value="" disabled className="text-gray-400">
                Select a folder...
              </option>
              {folders?.map((folder) => (
                <option
                  key={folder.id}
                  value={folder.id}
                  className="bg-darkBoxSub text-white"
                >
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Description (Optional)
            </label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Describe your project..."
              rows={3}
              className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular resize-none"
            />
          </div>

          {/* Project Visibility */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-4 montserrat-regular">
              Project Visibility *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Private Option */}
              <div
                onClick={() => setProjectVisibility("private")}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  projectVisibility === "private"
                    ? "border-[#F2D543] bg-[#F2D54315]"
                    : "border-gray-600 hover:border-gray-500 hover:bg-darkBoxSub"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      projectVisibility === "private"
                        ? "bg-[#F2D543] text-primarioDark"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                  </div>
                  <h3 className="font-medium text-white montserrat-medium">
                    Private
                  </h3>
                </div>
                <p className="text-sm text-gray-400 montserrat-regular">
                  Only you can access this project
                </p>
              </div>

              {/* Public Option */}
              <div
                onClick={() => setProjectVisibility("public")}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  projectVisibility === "public"
                    ? "border-[#F2D543] bg-[#F2D54315]"
                    : "border-gray-600 hover:border-gray-500 hover:bg-darkBoxSub"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      projectVisibility === "public"
                        ? "bg-[#F2D543] text-primarioDark"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                  </div>
                  <h3 className="font-medium text-white montserrat-medium">
                    Public
                  </h3>
                </div>
                <p className="text-sm text-gray-400 montserrat-regular">
                  Anyone can view and collaborate
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
              onClick={() => handleSubmit()}
              disabled={!projectName || !folderId}
              className="px-6 py-2 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543]"
            >
              Update Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalEditProject;
