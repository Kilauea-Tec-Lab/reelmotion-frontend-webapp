import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import Cookies from "js-cookie";

function ModalSaveEdit({
  isOpen,
  onClose,
  arrayVideoMake,
  masterVolume,
  currentTime,
  currentEditId,
  currentEditName,
  onSaved,
}) {
  const [editName, setEditName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Pre-populate edit name when editing existing project
  useEffect(() => {
    if (isOpen) {
      setEditName(currentEditName || "");
    }
  }, [isOpen, currentEditName]);

  const handleClose = () => {
    setEditName("");
    onClose();
  };

  const handleSave = async () => {
    if (!editName.trim()) return;

    setIsLoading(true);
    try {
      const editData = {
        name: editName.trim(),
        edition_array: JSON.stringify({
          timeline: arrayVideoMake || [],
          settings: {
            masterVolume: masterVolume || 1,
            currentTime: currentTime || 0,
          },
          metadata: {
            createdAt: new Date().toISOString(),
            version: "1.0",
          },
        }),
      };

      // Add ID if updating existing edit
      if (currentEditId) {
        editData.id = currentEditId;
      }

      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}editor/save-edit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify(editData),
        }
      );

      const responseData = await response.json();
      console.log("Save response:", responseData); // Debug log

      if (response.ok && responseData.code === 200) {
        console.log("Edit saved successfully:", responseData.edition);
        if (onSaved) {
          onSaved({
            ...responseData.edition,
            name: editName.trim(),
            id: responseData.edition?.id || currentEditId,
          });
        }
        handleClose();
      } else {
        console.error("Error saving edit:", responseData);
        alert(
          `Error saving edit: ${responseData.message || "Please try again."}`
        );
      }
    } catch (error) {
      console.error("Error saving edit:", error);
      alert(`Error saving edit: ${error.message || "Please try again."}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-darkBox rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white montserrat-medium">
            Save Edit
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
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2 montserrat-regular">
              Edit Name *
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter a name for your edit..."
              className="w-full px-4 py-3 bg-darkBoxSub rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F2D543] focus:border-transparent montserrat-regular"
              required
              autoFocus
            />
          </div>

          {/* Edit Info */}
          <div className="mb-6 p-4 bg-darkBoxSub rounded-lg">
            <h3 className="text-white montserrat-medium text-sm mb-2">
              Edit Summary
            </h3>
            <div className="text-gray-400 text-sm space-y-1">
              <p>• Elements: {arrayVideoMake?.length || 0}</p>
              <p>
                • Duration:{" "}
                {arrayVideoMake?.length > 0
                  ? Math.max(...arrayVideoMake.map((item) => item.endTime), 0)
                  : 0}
                s
              </p>
              <p>• Master Volume: {Math.round((masterVolume || 1) * 100)}%</p>
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
              onClick={handleSave}
              disabled={!editName.trim() || isLoading}
              className="px-6 py-2 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F2D543] flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primarioDark border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Edit
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalSaveEdit;
