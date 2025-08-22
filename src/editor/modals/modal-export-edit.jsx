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
  const navigate = useNavigate();

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

  const downloadVideo = async (videoUrl, fileName) => {
    setIsDownloading(true);
    try {
      // Add a small delay to show the animation
      await new Promise((resolve) => setTimeout(resolve, 500));

      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = fileName || "exported-video.mp4";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading video:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedProjectId || !arrayVideoMake?.length) return;

    setIsExporting(true);
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

  const handleDownload = async () => {
    if (!renderResult) return;

    const fileName = `${editName || "exported-edit"}-${new Date()
      .toISOString()
      .slice(0, 10)}.mp4`;
    await downloadVideo(renderResult.video_url, fileName);
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
        console.error("Error saving export:", responseData);
        alert("Error saving export. Please try again.");
      }
    } catch (error) {
      console.error("Error saving export:", error);
      alert("Error saving export. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedProjectId("");
    setRenderResult(null);
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
