import { X, Trash2, AlertTriangle, Film } from "lucide-react";
import { destroyProject } from "./functions";
import { useNavigate } from "react-router-dom";

function ModalDeleteProject({ isOpen, onClose, project, onConfirm }) {
  const navigate = useNavigate();

  async function handleDelete() {
    const response = await destroyProject({ id: project.id });

    onConfirm(project);

    navigate("/projects");

    onClose();
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
              Delete Project
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
              Are you sure you want to delete the project{" "}
              <span className="font-medium text-white">"{project?.name}"</span>?
            </p>
            <div className="bg-opacity-10 border border-primarioLogo border-opacity-30 rounded-lg p-4">
              <div className="flex gap-3">
                <Film className="w-5 h-5 text-[#DC569D] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#DC569D] font-medium montserrat-medium text-sm mb-1">
                    This action cannot be undone
                  </p>
                  <p className="text-[#DC569D] text-sm montserrat-regular">
                    All project data, including videos, edits, and settings will
                    be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors montserrat-regular"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete()}
              type="button"
              className="px-6 py-2 bg-primarioLogo text-white rounded-lg hover:bg-[#DC569D50] transition-colors font-medium montserrat-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalDeleteProject;
