import { useState, useEffect } from "react";
import { X, Download, Calendar, Clock } from "lucide-react";
import Cookies from "js-cookie";

function ModalLoadEdit({ isOpen, onClose, onEditLoaded }) {
  const [edits, setEdits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEditId, setSelectedEditId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchEdits();
    }
  }, [isOpen]);

  const fetchEdits = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}editor/get-edits`,
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
        setEdits(responseData.data || []);
      } else {
        console.error("Error fetching edits:", responseData);
        setEdits([]);
      }
    } catch (error) {
      console.error("Error fetching edits:", error);
      setEdits([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadEdit = async (editId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}editor/load-edit/${editId}`,
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
        if (onEditLoaded) {
          onEditLoaded(responseData.data);
        }
        onClose();
      } else {
        console.error("Error loading edit:", responseData);
        alert("Error loading edit. Please try again.");
      }
    } catch (error) {
      console.error("Error loading edit:", error);
      alert("Error loading edit. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (timeline) => {
    if (!timeline || timeline.length === 0) return "0s";
    const maxEndTime = Math.max(...timeline.map(item => item.endTime || 0));
    return `${Math.round(maxEndTime)}s`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-darkBox rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white montserrat-medium">
            Load Edit
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#F2D543] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading your edits...</p>
              </div>
            </div>
          ) : edits.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-gray-400">
                <p className="text-lg">No saved edits found</p>
                <p className="text-sm mt-2">Create and save an edit first to see it here</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
              {edits.map((edit) => (
                <div
                  key={edit.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                    selectedEditId === edit.id
                      ? "border-[#F2D543] bg-[#F2D54315]"
                      : "border-gray-600 hover:border-gray-500 bg-darkBoxSub"
                  }`}
                  onClick={() => setSelectedEditId(edit.id)}
                  onDoubleClick={() => handleLoadEdit(edit.id)}
                >
                  <div className="space-y-3">
                    {/* Edit Name */}
                    <h3 className="text-white font-medium text-lg line-clamp-1" title={edit.name}>
                      {edit.name}
                    </h3>

                    {/* Edit Stats */}
                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Duration: {formatDuration(edit.timeline)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(edit.createdAt)}</span>
                      </div>
                    </div>

                    {/* Element Count */}
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>{edit.timeline?.length || 0} elements</span>
                      <span>{edit.timeline?.filter(item => item.channel === "video").length || 0} videos</span>
                      <span>{edit.timeline?.filter(item => item.channel === "image").length || 0} images</span>
                    </div>

                    {/* Load Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadEdit(edit.id);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedEditId === edit.id
                          ? "bg-[#F2D543] text-primarioDark hover:bg-[#f2f243]"
                          : "bg-gray-600 text-white hover:bg-gray-500"
                      }`}
                    >
                      Load Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-gray-600">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors montserrat-regular"
            >
              Cancel
            </button>
            {selectedEditId && (
              <button
                type="button"
                onClick={() => handleLoadEdit(selectedEditId)}
                className="px-6 py-2 bg-[#F2D543] text-primarioDark rounded-lg hover:bg-[#f2f243] transition-colors font-medium montserrat-medium flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Load Selected
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalLoadEdit;
