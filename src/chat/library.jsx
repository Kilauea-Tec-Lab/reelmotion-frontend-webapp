import { useState, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import {
  Images,
  Loader2,
  Sparkles,
  Video,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import Cookies from "js-cookie";

function Library() {
  const libraryData = useLoaderData();
  const [loadedMedia, setLoadedMedia] = useState(new Set());
  const [galleryFilter, setGalleryFilter] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [attachmentsData, setAttachmentsData] = useState(
    libraryData?.chats || []
  );
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extraer todos los attachments de todos los chats con el nombre del chat
  const allAttachments = attachmentsData.flatMap((chat) =>
    chat.attachments.map((attachment) => ({
      ...attachment,
      chatName: chat.name,
      chatId: chat.id,
    }))
  );

  // Filtrar attachments según el filtro seleccionado y búsqueda
  const filteredAttachments = allAttachments.filter((attachment) => {
    // Filtro por tipo (AI/Uploads/All)
    if (galleryFilter === "ai") {
      const isAI =
        attachment.path?.includes("generated-images") ||
        attachment.path?.includes("ia") ||
        attachment.path?.includes("veo31-videos") ||
        attachment.path?.includes("sora2-videos") ||
        attachment.url?.includes("generated-images");
      if (!isAI) return false;
    }
    if (galleryFilter === "uploads") {
      const isUpload =
        attachment.path?.includes("user") ||
        attachment.path?.includes("chat_attachments");
      if (!isUpload) return false;
    }

    // Filtro por búsqueda de nombre de chat
    if (searchTerm.trim() !== "") {
      return attachment.chatName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    }

    return true;
  });

  // Ordenar por fecha de creación (más nuevo primero)
  const sortedAttachments = filteredAttachments
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Función para eliminar attachment
  const handleDeleteAttachment = async (attachmentId) => {
    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("attachment_id", attachmentId);

      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}chat/destroy-attachment`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Eliminar el attachment del estado
        setAttachmentsData((prevChats) =>
          prevChats.map((chat) => ({
            ...chat,
            attachments: chat.attachments.filter(
              (att) => att.id !== attachmentId
            ),
          }))
        );
        setDeleteConfirm(null);
        // Si estamos en preview y eliminamos el actual, cerrar el preview
        if (
          currentIndex !== null &&
          sortedAttachments[currentIndex]?.id === attachmentId
        ) {
          setCurrentIndex(null);
        }
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Funciones de navegación
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < sortedAttachments.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (currentIndex === null) return;

      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "Escape") {
        setCurrentIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex, sortedAttachments.length]);

  const currentAttachment =
    currentIndex !== null ? sortedAttachments[currentIndex] : null;

  return (
    <div className="flex-1 flex flex-col bg-primarioDark">
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          onClick={() => !isDeleting && setDeleteConfirm(null)}
        >
          <div
            className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#DC569D]/20 rounded-full p-3">
                <Trash2 className="h-6 w-6 text-[#DC569D]" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                Delete Attachment
              </h3>
            </div>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this attachment? This action
              cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#2f2f2f] text-gray-300 rounded-lg hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAttachment(deleteConfirm)}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#DC569D] text-white rounded-lg hover:bg-[#c44a87] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Preview Modal */}
      {currentAttachment && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-2xl z-[100] flex items-center justify-center p-4"
          onClick={() => setCurrentIndex(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setCurrentIndex(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 z-20 transition-colors"
          >
            <X size={24} />
          </button>

          {/* Previous Button */}
          {currentIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-3 z-20 transition-all shadow-lg text-white"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {/* Next Button */}
          {currentIndex < sortedAttachments.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-3 z-20 transition-all shadow-lg text-white"
            >
              <ChevronRight size={32} />
            </button>
          )}

          {/* Media Content */}
          {currentAttachment.file_type === "image" ? (
            <div
              className="relative w-full h-full flex items-center justify-center pointer-events-none select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentAttachment.url}
                alt="Preview"
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl pointer-events-auto"
              />
            </div>
          ) : (
            <div
              className="max-w-7xl w-full max-h-[90vh] overflow-hidden flex items-center justify-center bg-black/50 rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                src={currentAttachment.url}
                className="max-w-full max-h-[85vh] rounded-lg"
                controls
                autoPlay
              />
            </div>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 z-20">
            <p className="text-white text-sm font-medium">
              {currentIndex + 1} / {sortedAttachments.length}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Images className="h-6 w-6 text-[#DC569D]" />
          <h2 className="text-xl font-semibold text-white">Media Library</h2>
          <span className="text-sm text-gray-400">
            ({sortedAttachments.length} items)
          </span>
        </div>
      </div>

      {/* Filter Buttons and Search */}
      <div className="flex flex-col md:flex-row gap-4 p-6 border-b border-gray-800">
        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setGalleryFilter("all")}
            className={`px-4 py-2 rounded-lg transition-all font-medium ${
              galleryFilter === "all"
                ? "bg-[#DC569D] text-white"
                : "bg-[#2f2f2f] text-gray-400 hover:bg-[#3a3a3a] hover:text-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setGalleryFilter("ai")}
            className={`px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2 ${
              galleryFilter === "ai"
                ? "bg-[#DC569D] text-white"
                : "bg-[#2f2f2f] text-gray-400 hover:bg-[#3a3a3a] hover:text-white"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Generated by AI
          </button>
          <button
            onClick={() => setGalleryFilter("uploads")}
            className={`px-4 py-2 rounded-lg transition-all font-medium ${
              galleryFilter === "uploads"
                ? "bg-[#DC569D] text-white"
                : "bg-[#2f2f2f] text-gray-400 hover:bg-[#3a3a3a] hover:text-white"
            }`}
          >
            Uploads
          </button>
        </div>

        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by chat name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#2f2f2f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#DC569D] focus:ring-1 focus:ring-[#DC569D] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {sortedAttachments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Images className="h-16 w-16 mb-4 opacity-50" />
            <p>No media files in this category</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
              {sortedAttachments.map((attachment, idx) => {
                const isAIGenerated =
                  attachment.path?.includes("generated-images") ||
                  attachment.path?.includes("ia") ||
                  attachment.path?.includes("veo31-videos") ||
                  attachment.path?.includes("sora2-videos") ||
                  attachment.url?.includes("generated-images");

                return (
                  <div
                    key={attachment.id || idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative bg-[#2f2f2f] rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#DC569D] transition-all group break-inside-avoid mb-4 ${
                      !loadedMedia.has(attachment.id) ? "min-h-[160px]" : ""
                    }`}
                  >
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(attachment.id);
                      }}
                      className="absolute top-2 left-2 z-10 bg-[#DC569D]/90 hover:bg-[#c44a87] backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>

                    {/* AI Badge */}
                    {isAIGenerated && (
                      <div className="absolute top-2 right-2 z-10 bg-[#DC569D] rounded-full p-1.5">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                    )}

                    {/* Loading State */}
                    {!loadedMedia.has(attachment.id) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#2f2f2f]">
                        <Loader2 className="h-8 w-8 text-[#DC569D] animate-spin" />
                      </div>
                    )}

                    {/* Media Content */}
                    <div>
                      {attachment.file_type === "image" ? (
                        <img
                          src={attachment.url}
                          alt="Gallery item"
                          loading="lazy"
                          className={`w-full h-auto block transition-opacity duration-300 ${
                            loadedMedia.has(attachment.id)
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                          onLoad={() => {
                            setLoadedMedia((prev) =>
                              new Set(prev).add(attachment.id)
                            );
                          }}
                        />
                      ) : attachment.file_type === "video" ? (
                        <video
                          src={attachment.url}
                          loading="lazy"
                          className={`w-full h-auto block transition-opacity duration-300 ${
                            loadedMedia.has(attachment.id)
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                          muted
                          playsInline
                          onLoadedData={() => {
                            setLoadedMedia((prev) =>
                              new Set(prev).add(attachment.id)
                            );
                          }}
                        />
                      ) : null}
                    </div>

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {attachment.file_type === "video" && (
                          <Video className="h-8 w-8 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Library;
