import { useState, useEffect } from "react";
import { X, Upload, Folder } from "lucide-react";
import Cookies from "js-cookie";

function ModalExportEdit({
  isOpen,
  onClose,
  arrayVideoMake,
  editName,
  onExported,
}) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}projects/get-pending`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        setProjects(responseData.data || []);
      } else {
        console.error("Error fetching projects:", responseData);
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedProjectId || !arrayVideoMake?.length) return;

    setIsExporting(true);
    try {
      const exportData = {
        project_id: selectedProjectId,
        edit_name: editName || "Exported Edit",
        timeline: arrayVideoMake || [],
        metadata: {
          exportedAt: new Date().toISOString(),
          totalElements: arrayVideoMake?.length || 0,
          duration:
            arrayVideoMake?.length > 0
              ? Math.max(...arrayVideoMake.map((item) => item.endTime || 0), 0)
              : 0,
        },
      };

      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}editor/render-video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify(exportData),
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        if (onExported) {
          onExported(responseData.data);
        }
        onClose();
        alert("Edit exported successfully to project!");
      } else {
        console.error("Error exporting edit:", responseData);
        alert("Error exporting edit. Please try again.");
      }
    } catch (error) {
      console.error("Error exporting edit:", error);
      alert("Error exporting edit. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setSelectedProjectId("");
    onClose();
  };

  if (!isOpen) return null;

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-darkBox rounded-lg w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white montserrat-medium">
            Export Edit to Project
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Edit Summary */}
          <div className="mb-6 p-4 bg-darkBoxSub rounded-lg">
            <h3 className="text-white montserrat-medium text-sm mb-2">
              Export Summary
            </h3>
            <div className="text-gray-400 text-sm space-y-1">
              <p>• Edit Name: {editName || "Untitled Edit"}</p>
              <p>• Total Elements: {arrayVideoMake?.length ?? 0}</p>
              <p>
                • Duration:{" "}
                {arrayVideoMake?.length > 0
                  ? Math.max(
                      ...arrayVideoMake.map((item) => item.endTime || 0),
                      0
                    )
                  : 0}
                s
              </p>
              <p>
                • Videos:{" "}
                {arrayVideoMake?.filter((item) => item.channel === "video")
                  ?.length || 0}
              </p>
              <p>
                • Images:{" "}
                {arrayVideoMake?.filter((item) => item.channel === "image")
                  ?.length || 0}
              </p>
              <p>
                • Audio:{" "}
                {arrayVideoMake?.filter(
                  (item) => item.channel === "music" || item.channel === "voice"
                )?.length || 0}
              </p>
            </div>
          </div>

          {/* Project Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-4 montserrat-regular">
              Select Destination Project *
            </label>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#F2D543] border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-400">Loading projects...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No projects available</p>
                <p className="text-sm mt-1">
                  Create a project first to export your edit
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedProjectId === project.id
                        ? "border-[#F2D543] bg-[#F2D54315]"
                        : "border-gray-600 hover:border-gray-500 hover:bg-darkBoxSub"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          selectedProjectId === project.id
                            ? "bg-[#F2D543] text-primarioDark"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        <Folder className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white montserrat-medium text-sm line-clamp-1">
                          {project.name}
                        </h3>
                        <p className="text-gray-400 text-xs mt-1 line-clamp-1">
                          {project.description || "No description"}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {project.scenes?.length || 0} scenes
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Project Info */}
          {selectedProject && (
            <div className="mb-6 p-4 bg-green-900 bg-opacity-20 border border-green-600 rounded-lg">
              <h4 className="text-green-400 font-medium text-sm mb-1">
                Selected Project:
              </h4>
              <p className="text-white font-medium">{selectedProject.name}</p>
              <p className="text-gray-400 text-sm">
                {selectedProject.description}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {selectedProject.scenes?.length || 0} existing scenes
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors montserrat-regular"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={
                !selectedProjectId || !arrayVideoMake?.length || isExporting
              }
              className="px-6 py-2 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543] flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primarioDark border-t-transparent rounded-full animate-spin"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Export to Project
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalExportEdit;
