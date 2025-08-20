import { useState, useEffect } from "react";
import { X, Download, Calendar, Clock, Trash2 } from "lucide-react";
import Cookies from "js-cookie";
import ModalConfirmDelete from "./modal-confirm-delete";

function ModalLoadEdit({ isOpen, onClose, onLoad }) {
  const [edits, setEdits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEditId, setSelectedEditId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editToDelete, setEditToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

      if (responseData.code == 200) {
        setEdits(responseData.edits || []);
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

  const handleLoadEdit = (editId) => {
    const editToLoad = edits.find((edit) => edit.id === editId);
    if (editToLoad && onLoad) {
      onLoad(editToLoad);
    }
  };

  const handleDeleteClick = (e, edit) => {
    e.stopPropagation();
    setEditToDelete(edit);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!editToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}editor/delete-creation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify({ id: editToDelete.id }),
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.code === 200) {
        // Remove deleted edit from list
        setEdits((prevEdits) =>
          prevEdits.filter((edit) => edit.id !== editToDelete.id)
        );
        // Clear selection if deleted edit was selected
        if (selectedEditId === editToDelete.id) {
          setSelectedEditId(null);
        }
        setShowDeleteModal(false);
        setEditToDelete(null);
      } else {
        console.error("Error deleting edit:", responseData);
        alert(
          `Error deleting edit: ${responseData.message || "Please try again."}`
        );
      }
    } catch (error) {
      console.error("Error deleting edit:", error);
      alert(`Error deleting edit: ${error.message || "Please try again."}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setEditToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (editionArray) => {
    if (!editionArray) return "0s";

    try {
      const timeline =
        typeof editionArray === "string"
          ? JSON.parse(editionArray)?.timeline
          : editionArray?.timeline;

      if (!timeline || timeline.length === 0) return "0s";

      const maxEndTime = Math.max(...timeline.map((item) => item.endTime || 0));
      return `${Math.round(maxEndTime)}s`;
    } catch (error) {
      console.error("Error parsing edition_array:", error);
      return "0s";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-darkBox rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
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
                <p className="text-sm mt-2">
                  Create and save an edit first to see it here
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 px-4 py-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
              {edits.map((edit) => (
                <div
                  key={edit.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 relative group ${
                    selectedEditId === edit.id
                      ? "border-[#F2D543] bg-[#F2D54315]"
                      : "border-gray-600 hover:border-gray-500 bg-darkBoxSub"
                  }`}
                  onClick={() => setSelectedEditId(edit.id)}
                  onDoubleClick={() => handleLoadEdit(edit.id)}
                >
                  {/* Delete Button - Only visible on hover */}
                  <button
                    onClick={(e) => handleDeleteClick(e, edit)}
                    className="absolute top-2 right-2 p-2 bg-primarioLogo text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Delete edit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="space-y-3">
                    {/* Edit Name */}
                    <h3
                      className="text-white font-medium text-lg line-clamp-1"
                      title={edit.name}
                    >
                      {edit.name}
                    </h3>

                    {/* Edit Stats */}
                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          Duration: {formatDuration(edit.edition_array)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(edit.created_at)}</span>
                      </div>
                    </div>

                    {/* Element Count */}
                    <div className="flex gap-4 text-xs text-gray-500">
                      {(() => {
                        try {
                          const timeline =
                            typeof edit.edition_array === "string"
                              ? JSON.parse(edit.edition_array)?.timeline
                              : edit.edition_array?.timeline;

                          const timelineLength = timeline?.length || 0;
                          const videoCount =
                            timeline?.filter((item) => item.channel === "video")
                              .length || 0;
                          const imageCount =
                            timeline?.filter((item) => item.channel === "image")
                              .length || 0;

                          return (
                            <>
                              <span>{timelineLength} elements</span>
                              <span>{videoCount} videos</span>
                              <span>{imageCount} images</span>
                            </>
                          );
                        } catch {
                          return <span>0 elements</span>;
                        }
                      })()}
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
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ModalConfirmDelete
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Edit"
        message="Are you sure you want to delete this edit?"
        itemName={editToDelete?.name}
        isLoading={isDeleting}
      />
    </div>
  );
}

export default ModalLoadEdit;
