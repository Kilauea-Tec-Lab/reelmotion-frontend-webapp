import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
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
  Clapperboard,
  Music,
  Download,
  Check,
  Pencil,
  Globe,
  Lock,
} from "lucide-react";
import Cookies from "js-cookie";

const GalleryItem = memo(
  ({ attachment, idx, onClick, onDelete, isLoaded, onLoad }) => {
    const [retryCount, setRetryCount] = useState(0);
    const [mediaKey, setMediaKey] = useState(0);
    const [hasError, setHasError] = useState(false);
    const videoRef = useRef(null);
    const timeoutRef = useRef(null);

    const isAIGenerated =
      attachment.path?.includes("generated-images") ||
      attachment.path?.includes("ia") ||
      attachment.path?.includes("veo31-videos") ||
      attachment.path?.includes("sora2-videos") ||
      attachment.url?.includes("generated-images");

    const handleMediaError = () => {
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          setMediaKey((prev) => prev + 1);
          setHasError(false);
        }, 2000);
      } else {
        setHasError(true);
        onLoad(attachment.id);
      }
    };

    const handleVideoLoad = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Seek to first frame so the video canvas is not black
      if (videoRef.current) {
        videoRef.current.currentTime = 0.1;
      }
      onLoad(attachment.id);
    };

    // Safety timeout for videos that never fire load events
    useEffect(() => {
      if (attachment.file_type === "video" && !isLoaded) {
        timeoutRef.current = setTimeout(() => {
          // Force first-frame seek even on timeout
          if (videoRef.current) {
            videoRef.current.currentTime = 0.1;
          }
          onLoad(attachment.id);
        }, 8000);

        return () => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        };
      }
    }, [attachment.file_type, attachment.id, isLoaded, mediaKey]);

    // Force reload when mediaKey changes
    useEffect(() => {
      if (videoRef.current && attachment.file_type === "video") {
        videoRef.current.load();
      }
    }, [mediaKey, attachment.file_type]);

    return (
      <div
        onClick={() => onClick(idx)}
        className={`relative bg-[#2f2f2f] rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#DC569D] transition-all group break-inside-avoid mb-4 ${!isLoaded && attachment.file_type !== "audio" ? "min-h-[160px]" : ""}`}
      >
        {/* Delete Button (hover, grid) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete({
              id: attachment.id,
              sourceType: attachment.sourceType,
              id_project: attachment.id_project,
            });
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

        {/* Project Badge */}
        {attachment.sourceType === "project" && (
          <div className="absolute top-2 right-2 z-10 bg-[#8E24AA] rounded-full p-1.5">
            <Clapperboard className="h-3 w-3 text-white" />
          </div>
        )}

        {/* Loading State */}
        {!isLoaded && attachment.file_type !== "audio" && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#2f2f2f] min-h-[160px]">
            <Loader2 className="h-8 w-8 text-[#DC569D] animate-spin" />
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#2f2f2f] min-h-[160px] gap-2">
            <Video className="h-8 w-8 text-gray-500" />
            <span className="text-xs text-gray-500">Failed to load</span>
          </div>
        )}

        {/* Media Content */}
        <div>
          {attachment.file_type === "image" ? (
            <img
              key={mediaKey}
              src={attachment.url}
              alt="Gallery item"
              loading="lazy"
              className={`w-full h-auto block transition-opacity duration-300 ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => onLoad(attachment.id)}
              onError={handleMediaError}
            />
          ) : attachment.file_type === "video" ? (
            <video
              ref={videoRef}
              key={mediaKey}
              src={attachment.url}
              preload="metadata"
              className={`w-full h-auto block transition-opacity duration-300 ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
              muted
              playsInline
              onLoadedMetadata={handleVideoLoad}
              onLoadedData={handleVideoLoad}
              onCanPlay={handleVideoLoad}
              onSeeked={() => {
                // Ensure frame is painted after seek
                onLoad(attachment.id);
              }}
              onError={handleMediaError}
            />
          ) : attachment.file_type === "audio" ? (
            <div className="w-full h-40 flex flex-col items-center justify-center bg-[#1a1a1a] p-4 text-center group-hover:bg-[#252525] transition-colors">
              <div className="w-12 h-12 bg-[#2f2f2f] rounded-full flex items-center justify-center mb-3">
                <Music className="h-6 w-6 text-[#DC569D]" />
              </div>
              <span className="text-sm text-gray-400 font-medium truncate w-full px-2">
                {attachment.chatName || "Audio File"}
              </span>
            </div>
          ) : null}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center pointer-events-none">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            {attachment.file_type === "video" && (
              <Video className="h-8 w-8 text-white" />
            )}
            {attachment.file_type === "audio" && (
              <Music className="h-8 w-8 text-white" />
            )}
          </div>
        </div>
      </div>
    );
  },
);

GalleryItem.displayName = "GalleryItem";

function Library() {
  const libraryData = useLoaderData();
  const [loadedMedia, setLoadedMedia] = useState(new Set());
  const [galleryFilter, setGalleryFilter] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [attachmentsData, setAttachmentsData] = useState(
    libraryData?.chats || [],
  );
  const [videoProjects, setVideoProjects] = useState(
    libraryData?.video_projects || [],
  );
  const [unassignedAttachments, setUnassignedAttachments] = useState(
    libraryData?.unassigned_attachments || [],
  );
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(40);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef(null);
  const [editingName, setEditingName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

  // Stable callback for media load events (avoids re-creating inline functions)
  const handleMediaLoad = useCallback((id) => {
    setLoadedMedia((prev) => {
      if (prev.has(id)) return prev; // No-op if already loaded
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  // Memoize: flatten all attachments from all sources, filter blob URLs, and deduplicate by URL
  const allAttachments = useMemo(() => {
    const chatAtts = attachmentsData.flatMap((chat) =>
      chat.attachments.map((attachment) => ({
        ...attachment,
        chatName: chat.name,
        chatId: chat.id,
        sourceType: "chat",
      })),
    );

    const unassignedAtts = unassignedAttachments.map((attachment) => ({
      ...attachment,
      chatName: "Unassigned",
      sourceType: "unassigned",
    }));

    const projectAtts = videoProjects.map((project) => ({
      id: project.id,
      file_type: "video",
      url: project.video_url,
      created_at: project.created_at,
      chatName: project.name,
      sourceType: "project",
      id_project: project.id_project,
      project_type: project.project_type,
    }));

    const combined = [...unassignedAtts, ...chatAtts, ...projectAtts];

    // Filter out blob URLs (they are ephemeral and will never load)
    const withoutBlobs = combined.filter(
      (att) => !att.url?.startsWith("blob:"),
    );

    // Deduplicate by URL to avoid rendering the same media multiple times
    const seen = new Set();
    return withoutBlobs.filter((att) => {
      if (!att.url || seen.has(att.url)) return false;
      seen.add(att.url);
      return true;
    });
  }, [attachmentsData, unassignedAttachments, videoProjects]);

  // Memoize: filter + sort
  const sortedAttachments = useMemo(() => {
    const filtered = allAttachments.filter((attachment) => {
      // Filtro por tipo (AI/Uploads/All/Projects)
      if (galleryFilter === "projects") {
        return attachment.sourceType === "project";
      }

      if (galleryFilter === "ai") {
        if (attachment.sourceType === "project") return false;
        const isAI =
          attachment.path?.includes("generated-images") ||
          attachment.path?.includes("ia") ||
          attachment.path?.includes("veo31-videos") ||
          attachment.path?.includes("sora2-videos") ||
          attachment.url?.includes("generated-images");
        if (!isAI) return false;
      }
      if (galleryFilter === "uploads") {
        if (attachment.sourceType === "project") return false;
        if (attachment.sourceType === "unassigned") return true;

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
    return filtered.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
  }, [allAttachments, galleryFilter, searchTerm]);

  // Attachments visibles (lazy loading)
  const visibleAttachments = sortedAttachments.slice(0, visibleCount);
  const hasMore = visibleCount < sortedAttachments.length;

  // Reset visible count cuando cambia el filtro o búsqueda
  useEffect(() => {
    setVisibleCount(30);
  }, [galleryFilter, searchTerm]);

  // Cargar más elementos
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 30, sortedAttachments.length));
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, hasMore, sortedAttachments.length]);

  // IntersectionObserver para detectar scroll al final
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  // Función para eliminar attachment o proyecto
  const handleDeleteAttachment = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      let response;
      if (deleteConfirm.sourceType === "project") {
        response = await fetch(
          `${import.meta.env.VITE_APP_BACKEND_URL}projects/delete`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: "Bearer " + Cookies.get("token"),
            },
            body: JSON.stringify({ id: deleteConfirm.id_project }),
          },
        );
      } else {
        response = await fetch(
          `${import.meta.env.VITE_APP_BACKEND_URL}editor/delete-upload`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: "Bearer " + Cookies.get("token"),
            },
            body: JSON.stringify({ id: deleteConfirm.id }),
          },
        );
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (
        data.success ||
        data.message === "Project deleted successfully" ||
        response.ok
      ) {
        if (deleteConfirm.sourceType === "project") {
          setVideoProjects((prev) =>
            prev.filter((p) => p.id !== deleteConfirm.id),
          );
        } else if (deleteConfirm.sourceType === "unassigned") {
          setUnassignedAttachments((prev) =>
            prev.filter((att) => att.id !== deleteConfirm.id),
          );
        } else {
          setAttachmentsData((prevChats) =>
            prevChats.map((chat) => ({
              ...chat,
              attachments: chat.attachments.filter(
                (att) => att.id !== deleteConfirm.id,
              ),
            })),
          );
        }
        setDeleteConfirm(null);
        // Si estamos en preview y eliminamos el actual, cerrar el preview
        if (
          currentIndex !== null &&
          sortedAttachments[currentIndex]?.id === deleteConfirm.id
        ) {
          setCurrentIndex(null);
        }
      }
    } catch (error) {
      console.error("Error deleting:", error);
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

  // Reset editing state when changing attachment
  useEffect(() => {
    setIsEditingName(false);
    setEditingName("");
  }, [currentIndex]);

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

  const handleDownload = async (e, url) => {
    e.stopPropagation();
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const mimeType = blob.type;
      const extension = mimeType.split("/")[1] || "bin";
      link.download = `media-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, "_blank");
    }
  };

  const handleSaveAttachmentName = async () => {
    if (!currentAttachment || !editingName.trim()) return;
    setIsSavingName(true);
    try {
      if (
        currentAttachment.sourceType === "project" &&
        currentAttachment.id_project
      ) {
        // For projects, send to projects/edit
        const info = {
          id: currentAttachment.id_project,
          name: editingName.trim(),
        };

        const response = await fetch(
          `${import.meta.env.VITE_APP_BACKEND_URL}projects/edit`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: "Bearer " + Cookies.get("token"),
            },
            body: JSON.stringify(info),
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setVideoProjects((prev) =>
            prev.map((p) =>
              p.id === currentAttachment.id
                ? { ...p, name: editingName.trim() }
                : p,
            ),
          );
          setIsEditingName(false);
        }
      } else {
        // For chat/unassigned attachments
        const formData = new FormData();
        formData.append("attachment_id", currentAttachment.id);
        formData.append("name", editingName.trim());

        const response = await fetch(
          `${import.meta.env.VITE_APP_BACKEND_URL}chat/update-attachment-name`,
          {
            method: "POST",
            headers: {
              Authorization: "Bearer " + Cookies.get("token"),
            },
            body: formData,
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          if (currentAttachment.sourceType === "unassigned") {
            setUnassignedAttachments((prev) =>
              prev.map((att) =>
                att.id === currentAttachment.id
                  ? { ...att, name: editingName.trim() }
                  : att,
              ),
            );
          } else {
            setAttachmentsData((prevChats) =>
              prevChats.map((chat) => ({
                ...chat,
                attachments: chat.attachments.map((att) =>
                  att.id === currentAttachment.id
                    ? { ...att, name: editingName.trim() }
                    : att,
                ),
              })),
            );
          }
          setIsEditingName(false);
        }
      }
    } catch (error) {
      console.error("Error saving attachment name:", error);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleStartEditingName = () => {
    setEditingName(
      currentAttachment?.sourceType === "project"
        ? currentAttachment?.chatName || ""
        : currentAttachment?.name || "",
    );
    setIsEditingName(true);
  };

  const handleCancelEditingName = () => {
    setIsEditingName(false);
    setEditingName("");
  };

  const handleToggleProjectType = async () => {
    if (
      !currentAttachment ||
      currentAttachment.sourceType !== "project" ||
      !currentAttachment.id_project
    )
      return;
    const newType =
      currentAttachment.project_type === "public" ? "private" : "public";
    setIsTogglingVisibility(true);
    try {
      const info = {
        id: currentAttachment.id_project,
        project_type: newType,
      };

      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}projects/edit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify(info),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setVideoProjects((prev) =>
          prev.map((p) =>
            p.id === currentAttachment.id ? { ...p, project_type: newType } : p,
          ),
        );
      }
    } catch (error) {
      console.error("Error toggling project visibility:", error);
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-primarioDark">
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
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
                {deleteConfirm.sourceType === "project"
                  ? "Delete Project"
                  : "Delete File"}
              </h3>
            </div>
            <p className="text-gray-400 mb-6">
              {deleteConfirm.sourceType === "project"
                ? "Are you sure you want to delete this project? This action cannot be undone."
                : "Are you sure you want to delete this file? This action cannot be undone."}
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
                onClick={handleDeleteAttachment}
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
          {/* Delete Button (preview) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirm({
                id: currentAttachment.id,
                sourceType: currentAttachment.sourceType,
                id_project: currentAttachment.id_project,
              });
            }}
            className="absolute top-4 right-28 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-2 z-20 transition-colors"
            title="Delete"
          >
            <Trash2 size={24} />
          </button>

          {/* Download Button */}
          <button
            onClick={(e) => handleDownload(e, currentAttachment.url)}
            className="absolute top-4 right-16 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 z-20 transition-colors"
            title="Download"
          >
            <Download size={24} />
          </button>

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
          ) : currentAttachment.file_type === "audio" ? (
            <div
              className="max-w-xl w-full bg-[#1a1a1a] p-8 rounded-xl flex flex-col items-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-24 h-24 bg-[#2f2f2f] rounded-full flex items-center justify-center">
                <Music className="h-12 w-12 text-[#DC569D]" />
              </div>
              <h3 className="text-xl font-medium text-white text-center">
                {currentAttachment.chatName || "Audio File"}
              </h3>
              <audio
                src={currentAttachment.url}
                className="w-full"
                controls
                autoPlay
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

          {/* Name Editor & Project Controls */}
          <div
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
              {/* Visibility toggle for projects */}
              {currentAttachment.sourceType === "project" &&
                currentAttachment.id_project && (
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      {currentAttachment.project_type === "public" ? (
                        <Globe className="h-4 w-4 text-green-400" />
                      ) : (
                        <Lock className="h-4 w-4 text-yellow-400" />
                      )}
                      <span className="text-sm text-gray-300">
                        {currentAttachment.project_type === "public"
                          ? "Public"
                          : "Private"}
                      </span>
                    </div>
                    <button
                      onClick={handleToggleProjectType}
                      disabled={isTogglingVisibility}
                      className="px-3 py-1.5 bg-[#2f2f2f] text-gray-300 rounded-lg hover:bg-[#3a3a3a] transition-colors text-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isTogglingVisibility ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : currentAttachment.project_type === "public" ? (
                        <>
                          <Lock className="h-3 w-3" />
                          Make Private
                        </>
                      ) : (
                        <>
                          <Globe className="h-3 w-3" />
                          Make Public
                        </>
                      )}
                    </button>
                  </div>
                )}

              {/* Name editor */}
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#2f2f2f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#DC569D] focus:ring-1 focus:ring-[#DC569D] transition-all text-sm"
                    placeholder={
                      currentAttachment.sourceType === "project"
                        ? "Enter project name..."
                        : "Enter file name..."
                    }
                    maxLength={255}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveAttachmentName}
                    disabled={isSavingName || !editingName.trim()}
                    className="px-3 py-2 bg-[#DC569D] text-white rounded-lg hover:bg-[#c44a87] transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {isSavingName ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={handleCancelEditingName}
                    disabled={isSavingName}
                    className="px-3 py-2 bg-[#2f2f2f] text-gray-300 rounded-lg hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-white text-sm font-medium truncate">
                    {currentAttachment.sourceType === "project"
                      ? currentAttachment.chatName || "Unnamed project"
                      : currentAttachment.name || "Unnamed file"}
                  </p>
                  {(currentAttachment.sourceType !== "project" ||
                    currentAttachment.id_project) && (
                    <button
                      onClick={handleStartEditingName}
                      className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                      title="Edit name"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
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
          <button
            onClick={() => setGalleryFilter("projects")}
            className={`px-4 py-2 rounded-lg transition-all font-medium ${
              galleryFilter === "projects"
                ? "bg-[#DC569D] text-white"
                : "bg-[#2f2f2f] text-gray-400 hover:bg-[#3a3a3a] hover:text-white"
            }`}
          >
            Projects
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
              {visibleAttachments.map((attachment, idx) => (
                <GalleryItem
                  key={attachment.id || idx}
                  attachment={attachment}
                  idx={idx}
                  onClick={setCurrentIndex}
                  onDelete={setDeleteConfirm}
                  isLoaded={loadedMedia.has(attachment.id)}
                  onLoad={handleMediaLoad}
                />
              ))}
            </div>

            {/* Load More Trigger */}
            {hasMore && (
              <div
                ref={loadMoreRef}
                className="flex justify-center items-center py-8"
              >
                {isLoadingMore ? (
                  <div className="flex items-center gap-3 text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin text-[#DC569D]" />
                    <span>Loading more...</span>
                  </div>
                ) : (
                  <button
                    onClick={loadMore}
                    className="px-6 py-2 bg-[#2f2f2f] text-gray-300 rounded-lg hover:bg-[#3a3a3a] transition-colors"
                  >
                    Load more ({sortedAttachments.length - visibleCount}{" "}
                    remaining)
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Library;
