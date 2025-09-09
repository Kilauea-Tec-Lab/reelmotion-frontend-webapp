import { useState, useEffect } from "react";
import { X, Upload, Folder } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

function ModalExportEdit({
  isOpen,
  onClose,
  arrayVideoMake,
  timelineFFmpeg,
  editName,
  editId,
  onExported,
}) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [renderResult, setRenderResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setError(null); // Clear any previous errors when opening modal
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
        setError(null); // Clear any previous errors when successful
      } else {
        const errorMessage =
          responseData.message ||
          responseData.error ||
          "Failed to load projects";
        setError(`Error loading projects: ${errorMessage}`);
        setProjects([]);
      }
    } catch (error) {
      setError(
        `Error loading projects: ${error.message || "Network error occurred"}`
      );
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedProjectId || !arrayVideoMake?.length) return;

    setIsExporting(true);
    setError(null); // Clear any previous errors
    try {
      const exportData = {
        project_id: selectedProjectId,
        edit_name: editName || "Exported Edit",

        // Nueva estructura FFmpeg completa para render perfecto
        timelineFFmpeg: timelineFFmpeg || null,

        // Estructura legacy para compatibilidad hacia atrás
        timeline: arrayVideoMake || [],

        metadata: {
          exportedAt: new Date().toISOString(),
          totalElements: arrayVideoMake?.length || 0,
          hasFFmpegStructure: !!timelineFFmpeg,
          version: timelineFFmpeg ? "2.0" : "1.0",
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
        // Store the render result to show the video
        setRenderResult({
          video_url: responseData.video_url,
          project_id: responseData.project_id,
          render_time_seconds: responseData.render_time_seconds,
          message: responseData.message,
        });

        // Don't auto-download anymore - let user choose
      } else {
        const errorMessage =
          responseData.message ||
          responseData.error ||
          "Unknown error occurred";
        setError(`Error with the edit: ${errorMessage}`);
      }
    } catch (error) {
      setError(
        `Error with the edit: ${error.message || "Network error occurred"}`
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async () => {
    if (!renderResult?.video_url) {
      alert("No video available to download.");
      return;
    }

    setIsDownloading(true);
    try {
      // Show loading message
      console.log("Downloading video... Please wait.");

      // Call your backend endpoint
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}editor/download-video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            // Add authorization header if needed
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
          body: JSON.stringify({
            video_url: renderResult.video_url,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      if (result.code !== 200 || !result.video_data) {
        throw new Error(result.message || "Failed to download video");
      }

      // Convert base64 to blob
      const base64Data = result.video_data;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "video/mp4" });

      // Create download link
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${editName || "exported-edit"}-${new Date()
        .toISOString()
        .slice(0, 10)}.mp4`;
      a.style.display = "none";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up blob URL
      window.URL.revokeObjectURL(blobUrl);

      console.log("Video downloaded successfully via backend");
    } catch (error) {
      console.error("Error downloading video:", error);

      // Show user-friendly error message
      let errorMessage = "Failed to download video. ";

      if (error.message.includes("Server error: 500")) {
        errorMessage += "Server error occurred. Please try again later.";
      } else if (error.message.includes("Network")) {
        errorMessage += "Network error. Please check your connection.";
      } else {
        errorMessage += "Please try again or contact support.";
      }

      alert(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveExport = async () => {
    if (!renderResult) return;

    setIsSaving(true);
    try {
      const saveData = {
        video_url: renderResult.video_url,
        project_id: renderResult.project_id,
        edit_id: editId,
        edit_name: editName || "Exported Edit",
        render_time_seconds: renderResult.render_time_seconds,
      };

      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}editor/save-export`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify(saveData),
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        if (onExported) {
          onExported(responseData.data);
        }
        onClose();
        // Redirigir a la página de inicio después de la exportación exitosa
        navigate("/");
      } else {
        const errorMessage =
          responseData.message ||
          responseData.error ||
          "Unknown error occurred";
        setError(`Error saving export: ${errorMessage}`);
      }
    } catch (error) {
      setError(
        `Error saving export: ${error.message || "Network error occurred"}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedProjectId("");
    setRenderResult(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="fixed inset-0 overflow-auto max-h-screen bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-900 bg-opacity-20 border border-red-600 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-red-400 font-medium text-sm mb-1">
                    Export Error
                  </h3>
                  <p className="text-gray-300 text-sm">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300 transition-colors p-1 rounded-lg hover:bg-red-800 hover:bg-opacity-20 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {renderResult ? (
            /* Video Result Section */
            <div className="space-y-6">
              {/* Success Message */}
              <div className="p-4 bg-green-900 bg-opacity-20 border border-green-600 rounded-lg">
                <h3 className="text-green-400 font-medium text-sm mb-1">
                  Video Rendered Successfully!
                </h3>
                <p className="text-gray-400 text-sm">
                  Render time: {renderResult.render_time_seconds}s
                </p>
              </div>

              {/* Video Preview */}
              <div className="bg-darkBoxSub rounded-lg p-4">
                <h4 className="text-white montserrat-medium text-sm mb-3">
                  Preview Rendered Video
                </h4>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={renderResult.video_url}
                    controls
                    className="w-full h-full object-contain"
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>

              {/* Actions for rendered video */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setRenderResult(null)}
                  className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors montserrat-regular"
                >
                  Render Again
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="px-6 py-2 border border-blue-600 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-colors montserrat-regular disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDownloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSaveExport}
                  disabled={isSaving}
                  className="px-6 py-2 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543] flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primarioDark border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Save to Project
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Export Configuration Section */
            <div>
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
                      (item) =>
                        item.channel === "music" || item.channel === "voice"
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
                    <span className="ml-2 text-gray-400">
                      Loading projects...
                    </span>
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
                  <p className="text-white font-medium">
                    {selectedProject.name}
                  </p>
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
                      Rendering Video...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Render Video
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalExportEdit;
