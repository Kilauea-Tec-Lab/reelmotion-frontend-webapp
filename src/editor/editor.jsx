import { div, span } from "framer-motion/client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  ClapperboardIcon,
  Music,
  Image,
  X,
  Trash2,
  Mic,
  Save,
  FolderOpen,
  Download,
  Upload,
  Plus,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Scissors,
  Undo,
  Headphones,
  ArrowLeft,
  SquarePlusIcon,
  Video,
  ChevronDown as CaretDown,
} from "lucide-react";
import { useLoaderData } from "react-router-dom";
import Cookies from "js-cookie";
import ModalSaveEdit from "./modals/modal-save-edit";
import ModalLoadEdit from "./modals/modal-load-edit";
import ModalExportEdit from "./modals/modal-export-edit";
import ModalConfirmDelete from "./modals/modal-confirm-delete";
import { handleImageDrop, handleAudioDrop } from "./functions";
import CustomSlider from "../components/CustomSlider";

// Editor - Advanced Timeline Video Editor
//
// Features:
// - Drag and drop video, image, music, and voice elements to the timeline
// - Real-time drag and drop with collision resolution
// - Trimming/resizing of timeline elements with handles
// - Master volume control affecting all media
// - Timeline scrubbing and playback controls
// - Visual feedback during drag and resize operations
//
// Trimming Logic:
// - Video/Music/Voice: Respects original media duration, tracks trimStart/trimEnd
// - Images: Can be expanded/contracted freely (duration is flexible)
// - Resize handles appear on hover for all timeline elements

function Editor() {
  const data = useLoaderData();
  const [menuActive, setMenuActive] = useState(1);
  const [draggedItem, setDraggedItem] = useState(null);
  const [arrayVideoMake, setArrayVideoMake] = useState([]);
  const [videoDurations, setVideoDurations] = useState({});
  // Collapsible projects state (collapsed by default)
  const [expandedProjects, setExpandedProjects] = useState({});
  // Collapsible voice groups state (collapsed by default)
  const [expandedVoiceGroups, setExpandedVoiceGroups] = useState({});
  // Sidebar visibility state
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  // Extract projects and scenes from loader data
  const projects = data?.projects || [];
  const allScenes = projects.flatMap(
    (project) =>
      project.scenes?.map((scene) => ({
        ...scene,
        projectName: project.name,
        projectId: project.id,
      })) || []
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const intervalRef = useRef(null);
  const mainVideoRef = useRef(null);
  const secondaryVideoRef = useRef(null); // Video auxiliar para transiciones suaves
  const [activeVideoRef, setActiveVideoRef] = useState("main"); // 'main' o 'secondary'
  const audioRefs = useRef({});
  const [audioDurations, setAudioDurations] = useState({}); // url -> seconds
  const imageRefs = useRef({});
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const timelineRef = useRef(null);
  const timelineContainerRef = useRef(null); // Ref para el contenedor del timeline con los canales
  const hasInitializedTimelineRef = useRef(false); // Track if timeline has been initialized
  const [hoveredElement, setHoveredElement] = useState(null);

  // States for timeline element dragging
  const [draggingElement, setDraggingElement] = useState(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [currentDragX, setCurrentDragX] = useState(0); // To store current mouse position
  const [dragPreviewPosition, setDragPreviewPosition] = useState(0); // To show position during drag
  const [masterVolume, setMasterVolume] = useState(1); // Master volume (100% by default)
  const [isDraggingVolume, setIsDraggingVolume] = useState(false); // To control volume dragging
  const volumeRef = useRef(null);

  // States for element trimming/resizing
  const [isResizing, setIsResizing] = useState(false);
  const [resizingElement, setResizingElement] = useState(null);
  const [resizeType, setResizeType] = useState(null); // 'start' or 'end'
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartTime, setResizeStartTime] = useState(0);

  // State for selected element
  const [selectedElement, setSelectedElement] = useState(null);

  // Timeline zoom and cut functionality
  const [timelineZoom, setTimelineZoom] = useState(1); // Zoom level (1 = normal, 2 = 2x zoom, etc.)
  const [timelineScrollOffset, setTimelineScrollOffset] = useState(0); // Horizontal scroll offset
  const [showCutButton, setShowCutButton] = useState(false); // Show cut button when element is selected and playhead is over it
  const [visibleDuration, setVisibleDuration] = useState(120); // Duration visible in timeline (affected by zoom)
  const [isDraggingZoom, setIsDraggingZoom] = useState(false); // State for zoom slider dragging
  const zoomSliderRef = useRef(null);

  // State for aspect ratio
  const [aspectRatio, setAspectRatio] = useState("16:9"); // Default to 16:9

  // ===== PROPIEDADES DEL PROYECTO PARA FFMPEG =====
  const [projectSettings, setProjectSettings] = useState({
    // Dimensiones de salida
    outputWidth: 1920,
    outputHeight: 1080,
    aspectRatio: "16:9",

    // Información temporal
    framerate: 30,
    sampleRate: 44100,
    audioChannels: 2,

    // Background del canvas
    backgroundColor: "#000000",
    backgroundImage: null,

    // Configuración de render
    renderSettings: {
      quality: "high",
      preset: "medium",
      crf: 23,
      bitrate: "5000k",
      maxBitrate: "8000k",
      bufsize: "10000k",
      profile: "high",
      level: "4.1",
      gopSize: 30,
      bFrames: 3,
    },

    // Efectos globales
    globalFilters: {
      fadeIn: 0.0,
      fadeOut: 0.0,
      stabilization: false,
      denoise: 0.0,
    },

    // Información de encoding
    encodingParams: {
      pixFmt: "yuv420p",
      colorSpace: "bt709",
      colorPrimaries: "bt709",
      transferFunction: "bt709",
      colorMatrix: "bt709",
    },
  });

  // Función para actualizar las dimensiones basadas en el aspect ratio
  const updateProjectDimensions = (ratio) => {
    let width, height;
    if (ratio === "16:9") {
      width = 1920;
      height = 1080;
    } else if (ratio === "9:16") {
      width = 1080;
      height = 1920;
    } else if (ratio === "1:1") {
      width = 1080;
      height = 1080;
    } else {
      // Custom ratio, keep current dimensions
      width = projectSettings.outputWidth;
      height = projectSettings.outputHeight;
    }

    setProjectSettings((prev) => ({
      ...prev,
      outputWidth: width,
      outputHeight: height,
      aspectRatio: ratio,
    }));
  };

  // Actualizar project settings cuando cambia el aspect ratio
  useEffect(() => {
    updateProjectDimensions(aspectRatio);
  }, [aspectRatio]);

  // States for undo functionality
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // States for modals
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentEditName, setCurrentEditName] = useState("");
  const [currentEditId, setCurrentEditId] = useState(null); // Track current edit ID

  // States for library item hover (to hide add buttons when delete buttons are visible)
  const [hoveredImageItem, setHoveredImageItem] = useState(null);
  const [hoveredMusicItem, setHoveredMusicItem] = useState(null);
  const [hoveredSoundItem, setHoveredSoundItem] = useState(null);
  const [hoveredVoiceItem, setHoveredVoiceItem] = useState(null);

  // States for image dragging in preview area
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [draggingImageElement, setDraggingImageElement] = useState(null);
  const [imageDragStart, setImageDragStart] = useState({ x: 0, y: 0 });

  // States for image resizing in preview area
  const [isResizingImage, setIsResizingImage] = useState(false);
  const [resizingImageElement, setResizingImageElement] = useState(null);
  const [resizeImageType, setResizeImageType] = useState(null);
  const [initialImageBounds, setInitialImageBounds] = useState(null);

  // States for image upload
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [images, setImages] = useState(data?.images || []);
  const [showDeleteImageModal, setShowDeleteImageModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  const musicFiles = [
    // Will be filled from API uploads; keep placeholder if empty
  ];

  const voiceFiles = [
    // Will be filled from API uploads; keep placeholder if empty
  ];

  // States for pre-rendering with MediaRecorder
  const [isPreRendering, setIsPreRendering] = useState(false);
  const [preRenderProgress, setPreRenderProgress] = useState(0);
  const [preRenderedVideo, setPreRenderedVideo] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const previewContainerRef = useRef(null);

  // State for music uploads and deletion
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [musicList, setMusicList] = useState([]);
  const [showDeleteMusicModal, setShowDeleteMusicModal] = useState(false);
  const [musicToDelete, setMusicToDelete] = useState(null);
  const [isDeletingMusic, setIsDeletingMusic] = useState(false);

  // State for voice uploads and deletion
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [voiceList, setVoiceList] = useState([]);
  const [showDeleteVoiceModal, setShowDeleteVoiceModal] = useState(false);
  const [voiceToDelete, setVoiceToDelete] = useState(null);

  // State for sound uploads and deletion
  const [isUploadingSound, setIsUploadingSound] = useState(false);
  const [soundList, setSoundList] = useState([]);
  const [showDeleteSoundModal, setShowDeleteSoundModal] = useState(false);
  const [soundToDelete, setSoundToDelete] = useState(null);
  const [isDeletingSound, setIsDeletingSound] = useState(false);

  // State for editor videos uploads and deletion
  const [isUploadingEditorVideo, setIsUploadingEditorVideo] = useState(false);
  const [editorVideosList, setEditorVideosList] = useState(data?.videos || []);
  const [showDeleteEditorVideoModal, setShowDeleteEditorVideoModal] =
    useState(false);
  const [editorVideoToDelete, setEditorVideoToDelete] = useState(null);
  const [isDeletingEditorVideo, setIsDeletingEditorVideo] = useState(false);

  // State for scene video hover
  const [hoveredScene, setHoveredScene] = useState(null);
  const [sceneVideosLoaded, setSceneVideosLoaded] = useState({});
  const [isDeletingVoice, setIsDeletingVoice] = useState(false);

  // Functions to control volume
  const handleVolumeClick = (e) => {
    if (volumeRef.current) {
      const rect = volumeRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(clickX / rect.width, 1));
      setMasterVolume(percentage);
      updateAllVolumes(percentage);
    }
  };

  const handleVolumeMouseDown = (e) => {
    setIsDraggingVolume(true);
    handleVolumeClick(e);
  };

  const updateAllVolumes = (volume) => {
    // Update volume of all audio
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) {
        audio.volume = volume;
      }
    });

    // For main video, it will be updated in syncMediaWithTime
    // considering both master volume and specific video volume
  };

  // Render range input as CustomSlider for better styling
  const renderSlider = (props) => {
    return (
      <CustomSlider
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step}
        onChange={props.onChange}
      />
    );
  };

  // Helper function to check if there are any voices available
  const hasVoices = () => {
    return voiceList.some((group) => group.voices && group.voices.length > 0);
  };

  // Functions for drag and drop
  const handleDragStart = (e, item, type = "video") => {
    // Normalize the item to ensure it has a 'url' property
    const normalizedItem = {
      ...item,
      type,
      url:
        item.url ||
        item.video_url ||
        item.image_url ||
        item.audio_url ||
        item.music_url ||
        item.voice_url, // Ensure url property exists
    };

    setDraggedItem(normalizedItem);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // Function to get the real duration of a video
  const getVideoDuration = (videoUrl) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = function () {
        window.URL.revokeObjectURL(video.src);
        const duration = formatDuration(video.duration);
        resolve(duration);
      };

      video.onerror = function () {
        console.warn(`Could not load video: ${videoUrl}`);
        resolve(10); // default duration if error
      };

      video.src = videoUrl;
    });
  };

  // Function to get the real duration of an audio file
  const getAudioDuration = (audioUrl) => {
    return new Promise((resolve) => {
      if (!audioUrl) return resolve(0);
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.onloadedmetadata = function () {
        const duration = audio.duration || 0;
        resolve(duration); // Return the actual number, not formatted
      };
      audio.onerror = function () {
        console.warn(`Could not load audio: ${audioUrl}`);
        resolve(0);
      };
      audio.src = audioUrl;
    });
  };

  // Function to handle when video metadata is loaded
  const handleVideoMetadata = async (videoUrl, videoElement) => {
    const duration = formatDuration(videoElement.duration);
    setVideoDurations((prev) => ({
      ...prev,
      [videoUrl]: duration,
    }));
  };

  // Calculate total timeline duration (base duration, zoom affects the visual scale)
  const getTimelineDuration = () => {
    if (arrayVideoMake.length === 0) return 120; // default 2 minutes

    const endTimes = arrayVideoMake.map((item) => item.endTime);
    const maxEndTime = endTimes.length > 0 ? Math.max(...endTimes) : 0;
    return Math.max(maxEndTime, 120); // minimum 2 minutes
  };

  // Get the visual timeline duration considering zoom
  const getVisualTimelineDuration = () => {
    return visibleDuration;
  };

  // Initialize visible duration based on content
  useEffect(() => {
    // Solo resetear el zoom cuando es realmente el primer elemento agregado desde cero
    // No resetear cuando queda un elemento después de eliminar otros
    if (arrayVideoMake.length === 1 && !hasInitializedTimelineRef.current) {
      const totalDuration = getTimelineDuration();
      setVisibleDuration(totalDuration);
      setTimelineZoom(1); // También resetear el zoom visual
      hasInitializedTimelineRef.current = true;
      console.log("🎬 Timeline initialized with first element");
    } else if (arrayVideoMake.length === 0) {
      // Resetear la bandera cuando no hay elementos
      hasInitializedTimelineRef.current = false;
      console.log("🗑️ Timeline reset - no elements");
    }
  }, [arrayVideoMake.length]);

  // Calculate the end of actual content (last element end time)
  const getContentEndTime = () => {
    if (arrayVideoMake.length === 0) return 0;
    const endTimes = arrayVideoMake.map((item) => item.endTime);
    return endTimes.length > 0 ? Math.max(...endTimes) : 0;
  };

  // Calculate playhead position considering zoom and scroll
  const getPlayheadPosition = () => {
    const totalDuration = getTimelineDuration();
    const visibleDuration = getVisualTimelineDuration();

    // Time relative to the visible portion of the timeline
    const timeInVisibleArea = currentTime - timelineScrollOffset;

    // If playhead is outside the visible area, hide it
    if (timeInVisibleArea < 0 || timeInVisibleArea > visibleDuration) {
      return -100; // Position it off-screen
    }

    // Calculate percentage within the visible area
    const percentage = (timeInVisibleArea / visibleDuration) * 100;

    // Debug log only when cutting (to avoid spam)
    if (showCutButton && selectedElement) {
      console.log("📍 Playhead Position Debug:");
      console.log("Current Time:", currentTime);
      console.log("Timeline Scroll Offset:", timelineScrollOffset);
      console.log("Time in Visible Area:", timeInVisibleArea);
      console.log("Visible Duration:", visibleDuration);
      console.log("Percentage:", percentage);
    }

    return percentage;
  };

  // Generate time markers for the ruler based on visible duration and scroll
  const getTimeMarkers = () => {
    const visibleDuration = getVisualTimelineDuration();
    const startTime = timelineScrollOffset;
    const endTime = startTime + visibleDuration;

    // Determine the interval based on visible duration
    let interval;
    if (visibleDuration <= 30) {
      interval = 5; // 5 second intervals for very zoomed in
    } else if (visibleDuration <= 60) {
      interval = 10; // 10 second intervals
    } else if (visibleDuration <= 180) {
      interval = 30; // 30 second intervals
    } else if (visibleDuration <= 600) {
      interval = 60; // 1 minute intervals
    } else {
      interval = 120; // 2 minute intervals for zoomed out
    }

    const markers = [];

    // Generate markers from start to end time
    const firstMarker = Math.floor(startTime / interval) * interval;
    for (let time = firstMarker; time <= endTime + interval; time += interval) {
      if (time >= startTime && time <= endTime) {
        const position = ((time - startTime) / visibleDuration) * 100;
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const timeText = `${minutes}:${String(seconds).padStart(2, "0")}`;

        markers.push({
          position,
          time,
          text: timeText,
        });
      }
    }

    return markers;
  };

  // Function to get active element at a given time
  const getActiveElements = (time) => {
    return arrayVideoMake.filter(
      (item) => time >= item.startTime && time < item.endTime
    );
  };

  // Helper function to format durations to 2 decimals
  const formatDuration = (duration) => {
    return Math.round(duration * 100) / 100;
  };

  // Helper function to format timestamp for FFmpeg (HH:MM:SS.mmm)
  const formatTimestamp = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toFixed(3).padStart(6, "0")}`;
  };

  // Helper function to extract filename from URL
  const extractFilename = (url) => {
    if (!url) return "";
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split("/").pop() || "";
    } catch (e) {
      // If URL parsing fails, extract from string
      return url.split("/").pop() || "";
    }
  };

  // Helper function to detect file format from URL
  const detectFormat = (url) => {
    if (!url) return null;
    const extension = url.split(".").pop()?.toLowerCase();

    const videoFormats = ["mp4", "avi", "mov", "mkv", "webm", "flv", "m4v"];
    const audioFormats = ["mp3", "wav", "aac", "ogg", "flac", "m4a"];
    const imageFormats = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"];

    if (videoFormats.includes(extension)) return extension;
    if (audioFormats.includes(extension)) return extension;
    if (imageFormats.includes(extension)) return extension;

    return extension || null;
  };

  // Helper function to detect image format
  const detectImageFormat = (url) => {
    if (!url) return null;
    const extension = url.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"].includes(
      extension
    )
      ? extension
      : "jpeg";
  };

  // Helper function to detect if image has alpha channel
  const detectAlpha = (url) => {
    if (!url) return false;
    const extension = url.split(".").pop()?.toLowerCase();
    return ["png", "gif", "webp"].includes(extension);
  };

  // Centralized function to pause all media
  const pauseAllMedia = () => {
    // Pause videos
    if (mainVideoRef.current) {
      mainVideoRef.current.pause();
    }
    if (secondaryVideoRef.current) {
      secondaryVideoRef.current.pause();
    }

    // Pause ALL audio elements (music and voice)
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) {
        audio.pause();
        // Don't reset to beginning on pause, keep current position for resume
      }
    });
  };

  // Function to play/pause
  const handlePlayPause = () => {
    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Use centralized pause function
      pauseAllMedia();
    } else {
      // Only play if there's content in the timeline
      if (arrayVideoMake.length === 0) {
        alert("Add content to the timeline before playing");
        return;
      }

      // Play
      setIsPlaying(true);

      // Start timeline timer
      intervalRef.current = setInterval(() => {
        // Don't update time if user is dragging timeline
        if (!isDraggingTimeline) {
          setCurrentTime((prevTime) => {
            const newTime = prevTime + 0.2; // update every 200ms for better performance

            // Stop when reaching the end of actual content
            const contentEnd = getContentEndTime();
            if (contentEnd === 0 || newTime >= contentEnd) {
              setIsPlaying(false);
              clearInterval(intervalRef.current);
              intervalRef.current = null;
              // Pause all media when reaching the end
              pauseAllMedia();
              return contentEnd; // stop at end
            }

            return newTime;
          });
        }
      }, 200); // change to 200ms
    }
  };

  // Function to synchronize all media with current time using smooth crossfade
  const syncMediaWithTime = (time) => {
    const activeElements = getActiveElements(time);
    const activeVideo = activeElements.find((el) => el.channel === "video");

    // Handle main video with crossfade technique
    if (mainVideoRef.current && secondaryVideoRef.current) {
      const currentRef =
        activeVideoRef === "main"
          ? mainVideoRef.current
          : secondaryVideoRef.current;
      const nextRef =
        activeVideoRef === "main"
          ? secondaryVideoRef.current
          : mainVideoRef.current;

      if (activeVideo) {
        const elementTime = time - activeVideo.startTime;
        const adjustedTime = elementTime + (activeVideo.trimStart || 0);

        // Check if we need to switch to a new video
        const needsNewVideo = !currentRef.src.includes(activeVideo.url);

        if (needsNewVideo) {
          // Preload the new video in the secondary ref
          nextRef.src = activeVideo.url;
          nextRef.currentTime = adjustedTime;
          nextRef.volume =
            (activeVideo.volume !== undefined ? activeVideo.volume : 1) *
            masterVolume;

          // Apply color correction to next video
          const filters = [];
          if (activeVideo.colorCorrection) {
            const cc = activeVideo.colorCorrection;

            if (cc.brightness !== 0) {
              const cssValue = 1 + cc.brightness * 0.6;
              filters.push(`brightness(${Math.max(0.1, cssValue)})`);
            }

            if (cc.contrast !== 1) {
              let cssContrast;
              if (cc.contrast < 1) {
                cssContrast = 0.3 + cc.contrast * 0.7;
              } else {
                cssContrast = cc.contrast * 0.85 + 0.15;
              }
              filters.push(`contrast(${Math.max(0.1, cssContrast)})`);
            }

            if (cc.saturation !== 1) {
              let cssSaturation;
              if (cc.saturation < 1) {
                cssSaturation = cc.saturation * 0.85 + 0.15;
              } else {
                cssSaturation = 1 + (cc.saturation - 1) * 0.75;
              }
              filters.push(`saturate(${Math.max(0, cssSaturation)})`);
            }

            if (cc.gamma !== 1) {
              const gammaEffect = Math.pow(0.5, 1 / cc.gamma) * 2;
              const adjustedGamma = 1 + (gammaEffect - 1) * 0.7;
              filters.push(`brightness(${Math.max(0.1, adjustedGamma)})`);
            }

            if (cc.hue !== 0) {
              filters.push(`hue-rotate(${cc.hue}deg)`);
            }

            if (cc.vibrance !== 0) {
              const vibranceEffect = 1 + cc.vibrance * 0.2;
              filters.push(`saturate(${Math.max(0, vibranceEffect)})`);
            }
          }

          nextRef.style.filter =
            filters.length > 0 ? filters.join(" ") : "none";
          nextRef.style.display = "block";
          nextRef.style.opacity = "0";
          nextRef.style.transition = "opacity 0.15s ease-in-out";

          // Load the new video
          nextRef.load();

          // When the new video is ready, do crossfade
          const handleCanPlay = () => {
            // Fade out current video and fade in new video simultaneously
            currentRef.style.transition = "opacity 0.15s ease-in-out";
            currentRef.style.opacity = "0";

            nextRef.style.opacity = "1";

            if (isPlaying) {
              nextRef.play().catch(() => {});
            }

            // Switch active video reference after transition
            setTimeout(() => {
              currentRef.style.display = "none";
              currentRef.pause();
              setActiveVideoRef(
                activeVideoRef === "main" ? "secondary" : "main"
              );
            }, 150);

            nextRef.removeEventListener("canplay", handleCanPlay);
          };

          nextRef.addEventListener("canplay", handleCanPlay);

          // Fallback in case canplay doesn't fire
          setTimeout(() => {
            if (nextRef.style.opacity === "0") {
              currentRef.style.transition = "opacity 0.15s ease-in-out";
              currentRef.style.opacity = "0";
              nextRef.style.opacity = "1";

              if (isPlaying) {
                nextRef.play().catch(() => {});
              }

              setTimeout(() => {
                currentRef.style.display = "none";
                currentRef.pause();
                setActiveVideoRef(
                  activeVideoRef === "main" ? "secondary" : "main"
                );
              }, 150);
            }
          }, 200);
        } else {
          // Same video, just sync time and properties
          const timeDiff = Math.abs(currentRef.currentTime - adjustedTime);
          if (timeDiff > 0.5) {
            currentRef.currentTime = adjustedTime;
          }

          currentRef.volume =
            (activeVideo.volume !== undefined ? activeVideo.volume : 1) *
            masterVolume;

          if (currentRef.paused && isPlaying) {
            currentRef.play().catch(() => {});
          }

          // Apply color correction
          const filters = [];
          if (activeVideo.colorCorrection) {
            const cc = activeVideo.colorCorrection;

            if (cc.brightness !== 0) {
              const cssValue = 1 + cc.brightness * 0.6;
              filters.push(`brightness(${Math.max(0.1, cssValue)})`);
            }

            if (cc.contrast !== 1) {
              let cssContrast;
              if (cc.contrast < 1) {
                cssContrast = 0.3 + cc.contrast * 0.7;
              } else {
                cssContrast = cc.contrast * 0.85 + 0.15;
              }
              filters.push(`contrast(${Math.max(0.1, cssContrast)})`);
            }

            if (cc.saturation !== 1) {
              let cssSaturation;
              if (cc.saturation < 1) {
                cssSaturation = cc.saturation * 0.85 + 0.15;
              } else {
                cssSaturation = 1 + (cc.saturation - 1) * 0.75;
              }
              filters.push(`saturate(${Math.max(0, cssSaturation)})`);
            }

            if (cc.gamma !== 1) {
              const gammaEffect = Math.pow(0.5, 1 / cc.gamma) * 2;
              const adjustedGamma = 1 + (gammaEffect - 1) * 0.7;
              filters.push(`brightness(${Math.max(0.1, adjustedGamma)})`);
            }

            if (cc.hue !== 0) {
              filters.push(`hue-rotate(${cc.hue}deg)`);
            }

            if (cc.vibrance !== 0) {
              const vibranceEffect = 1 + cc.vibrance * 0.2;
              filters.push(`saturate(${Math.max(0, vibranceEffect)})`);
            }
          }

          currentRef.style.filter =
            filters.length > 0 ? filters.join(" ") : "none";
          currentRef.style.display = "block";
          currentRef.style.opacity = "1";
        }
      } else {
        // No active video, fade out both
        if (currentRef.style.display !== "none") {
          currentRef.style.transition = "opacity 0.15s ease-in-out";
          currentRef.style.opacity = "0";
          setTimeout(() => {
            if (currentRef) {
              currentRef.style.display = "none";
              currentRef.pause();
            }
          }, 150);
        }

        if (nextRef.style.display !== "none") {
          nextRef.style.transition = "opacity 0.15s ease-in-out";
          nextRef.style.opacity = "0";
          setTimeout(() => {
            if (nextRef) {
              nextRef.style.display = "none";
              nextRef.pause();
            }
          }, 150);
        }
      }
    }

    // Handle audio (music and voice)
    activeElements.forEach((element) => {
      if (
        element.channel === "music" ||
        element.channel === "voice" ||
        element.channel === "sound"
      ) {
        if (!audioRefs.current[element.id]) {
          const audio = new Audio(element.url);
          audio.preload = "auto";
          audio.muted = false;
          // Set initial volume correctly
          const elementVolume =
            element.volume !== undefined ? element.volume : 0.5;
          audio.volume = elementVolume * masterVolume;
          audioRefs.current[element.id] = audio;

          // Debug logging for voice elements
          if (element.channel === "voice") {
            console.log(`Voice audio created:`, {
              id: element.id,
              url: element.url,
              elementVolume,
              masterVolume,
              finalVolume: audio.volume,
              title: element.title,
            });
          }
        }

        const audio = audioRefs.current[element.id];
        const elementTime = time - element.startTime;
        // Adjust for start trim
        const adjustedTime = elementTime + (element.trimStart || 0);

        // Update combined volume continuously
        const elementVolume =
          element.volume !== undefined ? element.volume : 0.5;
        audio.volume = elementVolume * masterVolume;

        // Check if we're within the valid range of the audio
        const maxAudioTime =
          (element.originalDuration || element.duration) -
          (element.trimEnd || 0);
        const minAudioTime = element.trimStart || 0;

        if (adjustedTime >= minAudioTime && adjustedTime <= maxAudioTime) {
          // Seek and play audio with same precision as video
          const seekAndPlay = () => {
            try {
              // Only seek if there's a significant difference (like video does)
              if (Math.abs(audio.currentTime - adjustedTime) > 0.1) {
                audio.currentTime = adjustedTime;
              }
            } catch (e) {
              console.warn("Audio seek failed:", e);
            }

            // Only play if timeline is playing
            if (isPlaying && audio.paused) {
              audio.play().catch((e) => console.warn("Audio play failed:", e));
            }
          };

          if (audio.readyState >= 1) {
            seekAndPlay();
          } else {
            const onLoadedMetadata = () => {
              seekAndPlay();
              audio.removeEventListener("loadedmetadata", onLoadedMetadata);
            };
            audio.addEventListener("loadedmetadata", onLoadedMetadata);
          }
        } else {
          // We're outside the valid range, pause the audio
          if (!audio.paused) {
            audio.pause();
          }
        }
      }
    });

    // Pause inactive elements
    Object.keys(audioRefs.current).forEach((elementId) => {
      const isActive = activeElements.some((el) => el.id === elementId);
      if (!isActive && audioRefs.current[elementId]) {
        audioRefs.current[elementId].pause();
      }
    });
  };

  // Effect to synchronize media when current time changes
  useEffect(() => {
    // Synchronize when playing OR when dragging timeline for real-time preview
    if (isPlaying || isDraggingTimeline) {
      syncMediaWithTime(currentTime);
    }
  }, [currentTime, isPlaying, isDraggingTimeline]);

  // Effect to immediately pause all media when isPlaying becomes false
  useEffect(() => {
    if (!isPlaying) {
      pauseAllMedia();
    }
  }, [isPlaying]);

  // Clean up intervals when component unmounts
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) audio.pause();
      });
    };
  }, []);

  // Auto-pause when timeline becomes empty or when scrubbing past last element
  useEffect(() => {
    if (isPlaying && arrayVideoMake.length === 0) {
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Pause all media when timeline becomes empty
      pauseAllMedia();
      setCurrentTime(0);
    }
  }, [arrayVideoMake.length, isPlaying]);

  useEffect(() => {
    const contentEnd = getContentEndTime();
    if (isPlaying && contentEnd > 0 && currentTime >= contentEnd) {
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Pause all media when reaching the end
      pauseAllMedia();
      setCurrentTime(contentEnd);
    }
  }, [currentTime, isPlaying]);

  // Effect to handle timeline changes or when playback stops
  useEffect(() => {
    if (!isPlaying && currentTime === 0) {
      // Reset - hide video and show placeholder, and pause all media
      pauseAllMedia();
      if (mainVideoRef.current) {
        mainVideoRef.current.style.display = "none";
      }
      if (secondaryVideoRef.current) {
        secondaryVideoRef.current.style.display = "none";
      }
    }
  }, [isPlaying, currentTime]);

  // Effect to show/hide cut button when element is selected and playhead is over it
  useEffect(() => {
    if (
      selectedElement &&
      currentTime > selectedElement.startTime &&
      currentTime < selectedElement.endTime
    ) {
      setShowCutButton(true);
    } else {
      setShowCutButton(false);
    }
  }, [selectedElement, currentTime]);

  // Effect to apply real-time changes when editing selected element
  useEffect(() => {
    if (
      selectedElement &&
      (selectedElement.colorCorrection || selectedElement.volume !== undefined)
    ) {
      // Force re-sync to apply effects immediately
      syncMediaWithTime(currentTime);
    }
  }, [
    selectedElement?.colorCorrection?.brightness,
    selectedElement?.colorCorrection?.contrast,
    selectedElement?.colorCorrection?.saturation,
    selectedElement?.colorCorrection?.hue,
    selectedElement?.colorCorrection?.temperature,
    selectedElement?.colorCorrection?.tint,
    selectedElement?.volume,
    currentTime,
  ]);

  // Auto-save timeline to localStorage when it changes
  useEffect(() => {
    if (arrayVideoMake.length > 0) {
      const timelineData = {
        arrayVideoMake,
        currentEditName,
        currentEditId,
        aspectRatio,
        projectSettings,
        timestamp: Date.now(),
      };
      localStorage.setItem("timeline_autosave", JSON.stringify(timelineData));
      console.log("Timeline auto-saved to localStorage");
    }
  }, [arrayVideoMake, aspectRatio, projectSettings]);

  // Load timeline from localStorage on mount
  useEffect(() => {
    const savedTimeline = localStorage.getItem("timeline_autosave");
    if (savedTimeline && !currentEditId) {
      try {
        const timelineData = JSON.parse(savedTimeline);
        // Only restore if the save is less than 24 hours old
        const hoursSinceSave =
          (Date.now() - timelineData.timestamp) / (1000 * 60 * 60);
        if (hoursSinceSave < 24) {
          setArrayVideoMake(timelineData.arrayVideoMake || []);
          setCurrentEditName(timelineData.currentEditName || "");
          setAspectRatio(timelineData.aspectRatio || "16:9");
          if (timelineData.projectSettings) {
            setProjectSettings(timelineData.projectSettings);
          }
          console.log("Timeline restored from localStorage");
        } else {
          // Clear old save
          localStorage.removeItem("timeline_autosave");
        }
      } catch (error) {
        console.error("Error loading timeline from localStorage:", error);
        localStorage.removeItem("timeline_autosave");
      }
    }
  }, []); // Run only once on mount

  const handleDrop = async (e, channel) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Determine correct channel based ONLY on element type (ignore the channel parameter)
    let targetChannel;

    if (draggedItem.type === "video") {
      targetChannel = "video";
    } else if (draggedItem.type === "image") {
      targetChannel = "image";
    } else if (draggedItem.type === "music") {
      // Music can go to music or sound channel, use the drop target
      targetChannel = channel === "sound" ? "sound" : "music";
    } else if (draggedItem.type === "voice") {
      targetChannel = "voice";
    } else if (draggedItem.type === "sound") {
      targetChannel = "sound";
    } else {
      // Default fallback
      targetChannel = channel;
    }

    // Get real element duration
    let elementDuration = 10; // default duration
    let originalDuration = 10; // original media duration

    if (draggedItem.type === "video") {
      // If we already have duration in cache, use it
      if (videoDurations[draggedItem.url]) {
        elementDuration = videoDurations[draggedItem.url];
        originalDuration = videoDurations[draggedItem.url];
      } else {
        // If not, get it dynamically
        elementDuration = await getVideoDuration(draggedItem.url);
        originalDuration = elementDuration;
        setVideoDurations((prev) => ({
          ...prev,
          [draggedItem.url]: elementDuration,
        }));
      }
    } else if (draggedItem.type === "image") {
      elementDuration = draggedItem.duration || 5; // 5 seconds for images
      originalDuration = null; // Images don't have fixed duration
    } else if (
      draggedItem.type === "music" ||
      draggedItem.type === "voice" ||
      draggedItem.type === "sound"
    ) {
      // For audio, get real duration from loader data or probe it
      const aUrl =
        draggedItem.url ||
        draggedItem.audio_url ||
        draggedItem.music_url ||
        draggedItem.voice_url;

      // First check if we have it in audioDurations cache
      if (
        aUrl &&
        audioDurations[aUrl] &&
        Number.isFinite(audioDurations[aUrl]) &&
        audioDurations[aUrl] > 0
      ) {
        elementDuration = audioDurations[aUrl];
      }
      // Then check if the item itself has a valid duration
      else if (
        draggedItem.duration &&
        Number.isFinite(draggedItem.duration) &&
        draggedItem.duration > 0
      ) {
        elementDuration = draggedItem.duration;
        // Cache it for future use
        if (aUrl) {
          setAudioDurations((prev) => ({ ...prev, [aUrl]: elementDuration }));
        }
      }
      // As last resort, probe the audio file
      else if (aUrl) {
        const dur = await getAudioDuration(aUrl);
        elementDuration =
          dur && Number.isFinite(dur) && dur > 0
            ? dur
            : draggedItem.type === "music" || draggedItem.type === "sound"
            ? 30
            : 15;
        setAudioDurations((prev) => ({ ...prev, [aUrl]: elementDuration }));
      }
      // Final fallback
      else {
        elementDuration =
          draggedItem.type === "music" || draggedItem.type === "sound"
            ? 30
            : 15;
      }

      originalDuration = elementDuration;
    }

    // Find last element in target channel to avoid overlaps
    const elementsInChannel = arrayVideoMake.filter(
      (item) => item.channel === targetChannel
    );
    let startTime = 0;

    if (elementsInChannel.length > 0) {
      // Find largest end time in this channel
      const lastEndTime = Math.max(
        ...elementsInChannel.map((item) => item.endTime)
      );
      startTime = lastEndTime; // Start after last element
    }

    // Create new element for timeline with complete FFmpeg-compatible structure
    const newElement = {
      // === IDENTIFICACIÓN ===
      id: `${targetChannel}_${Date.now()}`,
      originalId: draggedItem.id, // Reference to the library element ID
      channel: targetChannel,
      type: draggedItem.type,

      // === PROPIEDADES TEMPORALES (CRÍTICAS para sincronización) ===
      startTime: formatDuration(startTime),
      endTime: formatDuration(startTime + elementDuration),
      duration: formatDuration(elementDuration), // current duration in timeline

      // Timing absoluto en segundos (para FFmpeg)
      startTimeSeconds: startTime,
      endTimeSeconds: startTime + elementDuration,
      durationSeconds: elementDuration,

      // Trim del archivo original
      trimStart: 0, // trimmed time from start
      trimEnd: 0, // trimmed time from end
      trimDuration: elementDuration, // Duration of used segment

      // Offset específico para audio (CRÍTICO para sincronización)
      audioOffset: 0.0,

      // Información de frames
      startFrame: Math.round(startTime * 30), // Asumiendo 30 FPS
      endFrame: Math.round((startTime + elementDuration) * 30),

      // Timestamps precisos para FFmpeg
      startTimestamp: formatTimestamp(startTime),
      endTimestamp: formatTimestamp(startTime + elementDuration),

      // === ARCHIVO FUENTE Y METADATA ===
      url:
        draggedItem.url ||
        draggedItem.video_url ||
        draggedItem.image_url ||
        draggedItem.audio_url ||
        draggedItem.music_url ||
        draggedItem.voice_url,
      title: draggedItem.title || draggedItem.name,
      filename: extractFilename(
        draggedItem.url ||
          draggedItem.video_url ||
          draggedItem.image_url ||
          draggedItem.audio_url ||
          draggedItem.music_url ||
          draggedItem.voice_url
      ),

      // Metadata del archivo original
      originalDuration: originalDuration,
      originalFramerate: 30, // Default, should be detected from file
      originalBitrate: null, // To be filled when file is analyzed
      codec: null, // To be detected (h264, aac, etc.)
      audioCodec: null, // To be detected

      // Información técnica para FFmpeg
      inputFormat: detectFormat(
        draggedItem.url ||
          draggedItem.image_url ||
          draggedItem.audio_url ||
          draggedItem.music_url ||
          draggedItem.voice_url
      ),
      pixelFormat: "yuv420p",
      colorSpace: "bt709",
      colorRange: "tv",

      // Dimensiones originales del archivo
      originalWidth: draggedItem.width || 1920,
      originalHeight: draggedItem.height || 1080,
      aspectRatio:
        draggedItem.width && draggedItem.height
          ? draggedItem.width / draggedItem.height
          : 16 / 9,

      // === PROPIEDADES VISUALES Y DE POSICIÓN ===
      // Posición en el canvas (normalizada 0-1)
      position: {
        x: 0.5, // center horizontally (0=left, 1=right)
        y: 0.5, // center vertically (0=top, 1=bottom)
      },

      // Posición en píxeles absolutos (calculada en tiempo de render)
      absolutePosition: {
        x: 0, // Will be calculated: position.x * outputWidth
        y: 0, // Will be calculated: position.y * outputHeight
      },

      // Escala y transformaciones
      scale: 1, // Escala general
      scaleX: 1, // Escala horizontal específica
      scaleY: 1, // Escala vertical específica
      keepAspectRatio: true,

      // Dimensiones finales calculadas
      finalWidth: 0, // Will be calculated: originalWidth * scale
      finalHeight: 0, // Will be calculated: originalHeight * scale

      // Transformaciones
      rotation: 0, // Rotación en grados
      anchorX: 0.5, // Punto de anclaje X (0.5 = centro)
      anchorY: 0.5, // Punto de anclaje Y (0.5 = centro)

      // === PROPIEDADES DE CAPAS Y COMPOSICIÓN ===
      zIndex:
        targetChannel === "image" ? 10 : targetChannel === "video" ? 5 : 1,
      opacity: 1,
      blendMode: "normal", // normal, multiply, screen, overlay, etc.

      // Máscara y recorte
      maskEnabled: false,
      maskPath: null,
      cropEnabled: false,
      cropArea: {
        x: 0,
        y: 0,
        width: draggedItem.width || 1920,
        height: draggedItem.height || 1080,
      },

      // === PROPIEDADES DE AUDIO ===
      volume:
        targetChannel === "music" ||
        targetChannel === "voice" ||
        targetChannel === "sound"
          ? 0.5
          : 1,
      muted: false,
      audioVolume:
        targetChannel === "music" ||
        targetChannel === "voice" ||
        targetChannel === "sound"
          ? 0.5
          : 1,
      audioFadeIn: 0, // Fade in en segundos
      audioFadeOut: 0, // Fade out en segundos
      audioPan: 0.0, // Paneo (-1=izquierda, 0=centro, 1=derecha)

      // Procesamiento de audio
      audioFilters: {
        highpass: 0, // Filtro paso alto en Hz
        lowpass: 0, // Filtro paso bajo en Hz
        equalizer: {
          low: 0, // Graves -12 a 12 dB
          mid: 0, // Medios -12 a 12 dB
          high: 0, // Agudos -12 a 12 dB
        },
        compression: {
          enabled: false,
          threshold: -20, // Umbral en dB
          ratio: 4, // Ratio de compresión
          attack: 10, // Ataque en ms
          release: 100, // Release en ms
        },
      },

      // Sample rate del archivo original
      originalSampleRate: 44100,
      originalChannels: 2,

      // === PROPIEDADES DE COLOR Y FILTROS ===
      colorCorrection: {
        brightness: 0, // -1.0 to 1.0 (FFmpeg compatible)
        contrast: 1, // 0.0 to 4.0 (FFmpeg: 1.0 = normal)
        saturation: 1, // 0.0 to 3.0 (FFmpeg: 1.0 = normal)
        gamma: 1, // 0.1 to 10.0 (FFmpeg: 1.0 = normal)
        hue: 0, // -180 to 180 degrees
        vibrance: 0, // -2.0 to 2.0
        exposure: 0, // -2 to 2
        highlights: 0, // -1 to 1
        shadows: 0, // -1 to 1
        temperature: 0, // -100 to 100 (kelvin)
        tint: 0, // -100 to 100 (magenta/verde)
      },

      // Filtros adicionales
      filters: {
        blur: 0.0, // Desenfoque en píxeles
        sharpen: 0.0, // Nitidez -1 a 1
        noise: 0.0, // Ruido 0 a 1
        vignette: 0.0, // Viñeteado 0 a 1
      },

      // === PROPIEDADES ESPECÍFICAS POR TIPO ===
      // Para imágenes
      imageFilters:
        draggedItem.type === "image"
          ? {
              sepia: 0.0, // Efecto sepia 0-1
              blackWhite: 0.0, // Blanco y negro 0-1
              vintage: 0.0, // Efecto vintage 0-1
              polaroid: 0.0, // Efecto polaroid 0-1
            }
          : null,

      imageFormat:
        draggedItem.type === "image"
          ? detectImageFormat(draggedItem.image_url)
          : null,
      hasAlpha:
        draggedItem.type === "image"
          ? detectAlpha(draggedItem.image_url)
          : false,
      colorProfile: "sRGB",

      // Para texto (si se implementa en el futuro)
      textProperties:
        draggedItem.type === "text"
          ? {
              text: draggedItem.text || "",
              fontFamily: "Arial",
              fontSize: 48,
              fontWeight: "normal",
              fontStyle: "normal",
              textColor: "#FFFFFF",
              strokeColor: "#000000",
              strokeWidth: 0,
              backgroundColor: "transparent",
              backgroundOpacity: 0,
              textAlign: "center",
              verticalAlign: "middle",
              shadow: {
                enabled: false,
                color: "#000000",
                offsetX: 0,
                offsetY: 0,
                blur: 0,
              },
              animation: {
                type: "none",
                duration: 0,
                delay: 0,
              },
            }
          : null,

      // === ESTADOS DE PROCESAMIENTO ===
      loaded: false,
      decoded: false,
      thumbnail: null,
      checksum: null,

      // === INFORMACIÓN DE SINCRONIZACIÓN ===
      syncPoints: [],
      gaps: [],
      overlaps: [],

      // === LEGACY PROPERTIES (mantener compatibilidad) ===
      effects: [], // Para compatibilidad con código existente
    };

    updateTimelineWithHistory([...arrayVideoMake, newElement]);
    setDraggedItem(null);
  };

  // Helper: click-to-add item to the next available position in its channel
  const addItemToTimeline = async (rawItem, type = "video") => {
    if (!rawItem) return;
    const item = {
      ...rawItem,
      type,
      url:
        rawItem.url ||
        rawItem.video_url ||
        rawItem.image_url ||
        rawItem.audio_url ||
        rawItem.music_url ||
        rawItem.voice_url,
    };

    // Determine channel
    let targetChannel = item.type;
    if (item.type === "video") targetChannel = "video";
    else if (item.type === "image") targetChannel = "image";
    else if (item.type === "music") targetChannel = "music";
    else if (item.type === "voice") targetChannel = "voice";
    else if (item.type === "sound") targetChannel = "sound";

    // Duration
    let elementDuration = 10;
    let originalDuration = 10;
    if (item.type === "video") {
      if (videoDurations[item.url]) {
        elementDuration = videoDurations[item.url];
        originalDuration = videoDurations[item.url];
      } else {
        elementDuration = await getVideoDuration(item.url);
        originalDuration = elementDuration;
        setVideoDurations((prev) => ({ ...prev, [item.url]: elementDuration }));
      }
    } else if (item.type === "image") {
      elementDuration = item.duration || 5;
      originalDuration = null;
    } else if (
      item.type === "music" ||
      item.type === "voice" ||
      item.type === "sound"
    ) {
      // For audio, prioritize real duration from loader data or cache
      const aUrl = item.url;

      // First check cache
      if (
        aUrl &&
        audioDurations[aUrl] &&
        Number.isFinite(audioDurations[aUrl]) &&
        audioDurations[aUrl] > 0
      ) {
        elementDuration = audioDurations[aUrl];
      }
      // Then check item's own duration property
      else if (
        item.duration &&
        Number.isFinite(item.duration) &&
        item.duration > 0
      ) {
        elementDuration = item.duration;
        // Cache it
        if (aUrl) {
          setAudioDurations((prev) => ({ ...prev, [aUrl]: elementDuration }));
        }
      }
      // Probe the audio file
      else if (aUrl) {
        const dur = await getAudioDuration(aUrl);
        elementDuration =
          dur && Number.isFinite(dur) && dur > 0
            ? dur
            : item.type === "music" || item.type === "sound"
            ? 30
            : 15;
        setAudioDurations((prev) => ({ ...prev, [aUrl]: elementDuration }));
      }
      // Final fallback
      else {
        elementDuration =
          item.type === "music" || item.type === "sound" ? 30 : 15;
      }

      originalDuration = elementDuration;
    }

    // Find start time after last in channel
    const elementsInChannel = arrayVideoMake.filter(
      (it) => it.channel === targetChannel
    );
    let startTime = 0;
    if (elementsInChannel.length > 0) {
      startTime = Math.max(...elementsInChannel.map((it) => it.endTime));
    }

    // Create new element for timeline with complete FFmpeg-compatible structure
    const newElement = {
      // === IDENTIFICACIÓN ===
      id: `${targetChannel}_${Date.now()}`,
      channel: targetChannel,
      type: item.type,

      // === PROPIEDADES TEMPORALES (CRÍTICAS para sincronización) ===
      startTime: formatDuration(startTime),
      endTime: formatDuration(startTime + elementDuration),
      duration: formatDuration(elementDuration),

      // Timing absoluto en segundos (para FFmpeg)
      startTimeSeconds: startTime,
      endTimeSeconds: startTime + elementDuration,
      durationSeconds: elementDuration,

      // Trim del archivo original
      trimStart: 0,
      trimEnd: 0,
      trimDuration: elementDuration,

      // Offset específico para audio (CRÍTICO para sincronización)
      audioOffset: 0.0,

      // Información de frames
      startFrame: Math.round(startTime * 30), // Asumiendo 30 FPS
      endFrame: Math.round((startTime + elementDuration) * 30),

      // Timestamps precisos para FFmpeg
      startTimestamp: formatTimestamp(startTime),
      endTimestamp: formatTimestamp(startTime + elementDuration),

      // === ARCHIVO FUENTE Y METADATA ===
      url: item.url || item.image_url,
      title: item.title || item.name,
      filename: extractFilename(item.url || item.image_url),

      // Metadata del archivo original
      originalDuration,
      originalFramerate: 30, // Default, should be detected from file
      originalBitrate: null,
      codec: null,
      audioCodec: null,

      // Información técnica para FFmpeg
      inputFormat: detectFormat(item.url || item.image_url),
      pixelFormat: "yuv420p",
      colorSpace: "bt709",
      colorRange: "tv",

      // Dimensiones originales del archivo
      originalWidth: item.width || 1920,
      originalHeight: item.height || 1080,
      aspectRatio:
        item.width && item.height ? item.width / item.height : 16 / 9,

      // === PROPIEDADES VISUALES Y DE POSICIÓN ===
      // Posición en el canvas (normalizada 0-1)
      position: { x: 0.5, y: 0.5 },

      // Posición en píxeles absolutos (calculada en tiempo de render)
      absolutePosition: { x: 0, y: 0 },

      // Escala y transformaciones
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      keepAspectRatio: true,

      // Dimensiones finales calculadas
      finalWidth: 0,
      finalHeight: 0,

      // Transformaciones
      rotation: 0,
      anchorX: 0.5,
      anchorY: 0.5,

      // === PROPIEDADES DE CAPAS Y COMPOSICIÓN ===
      zIndex:
        targetChannel === "image" ? 10 : targetChannel === "video" ? 5 : 1,
      opacity: 1,
      blendMode: "normal",

      // Máscara y recorte
      maskEnabled: false,
      maskPath: null,
      cropEnabled: false,
      cropArea: {
        x: 0,
        y: 0,
        width: item.width || 1920,
        height: item.height || 1080,
      },

      // === PROPIEDADES DE AUDIO ===
      volume:
        targetChannel === "music" ||
        targetChannel === "voice" ||
        targetChannel === "sound"
          ? 0.5
          : 1,
      muted: false,
      audioVolume:
        targetChannel === "music" ||
        targetChannel === "voice" ||
        targetChannel === "sound"
          ? 0.5
          : 1,
      audioFadeIn: 0,
      audioFadeOut: 0,
      audioPan: 0.0,

      // Procesamiento de audio
      audioFilters: {
        highpass: 0,
        lowpass: 0,
        equalizer: {
          low: 0,
          mid: 0,
          high: 0,
        },
        compression: {
          enabled: false,
          threshold: -20,
          ratio: 4,
          attack: 10,
          release: 100,
        },
      },

      // Sample rate del archivo original
      originalSampleRate: 44100,
      originalChannels: 2,

      // === PROPIEDADES DE COLOR Y FILTROS ===
      colorCorrection: {
        brightness: 0,
        contrast: 1,
        saturation: 1,
        gamma: 1,
        hue: 0,
        vibrance: 0,
        exposure: 0,
        highlights: 0,
        shadows: 0,
        temperature: 0,
        tint: 0,
      },

      // Filtros adicionales
      filters: {
        blur: 0.0,
        sharpen: 0.0,
        noise: 0.0,
        vignette: 0.0,
      },

      // === PROPIEDADES ESPECÍFICAS POR TIPO ===
      // Para imágenes
      imageFilters:
        item.type === "image"
          ? {
              sepia: 0.0,
              blackWhite: 0.0,
              vintage: 0.0,
              polaroid: 0.0,
            }
          : null,

      imageFormat:
        item.type === "image" ? detectImageFormat(item.image_url) : null,
      hasAlpha: item.type === "image" ? detectAlpha(item.image_url) : false,
      colorProfile: "sRGB",

      // Para texto (si se implementa en el futuro)
      textProperties:
        item.type === "text"
          ? {
              text: item.text || "",
              fontFamily: "Arial",
              fontSize: 48,
              fontWeight: "normal",
              fontStyle: "normal",
              textColor: "#FFFFFF",
              strokeColor: "#000000",
              strokeWidth: 0,
              backgroundColor: "transparent",
              backgroundOpacity: 0,
              textAlign: "center",
              verticalAlign: "middle",
              shadow: {
                enabled: false,
                color: "#000000",
                offsetX: 0,
                offsetY: 0,
                blur: 0,
              },
              animation: {
                type: "none",
                duration: 0,
                delay: 0,
              },
            }
          : null,

      // === ESTADOS DE PROCESAMIENTO ===
      loaded: false,
      decoded: false,
      thumbnail: null,
      checksum: null,

      // === INFORMACIÓN DE SINCRONIZACIÓN ===
      syncPoints: [],
      gaps: [],
      overlaps: [],

      // === LEGACY PROPERTIES (mantener compatibilidad) ===
      effects: [], // Para compatibilidad con código existente
    };

    updateTimelineWithHistory([...arrayVideoMake, newElement]);
  };

  // Collapsible project toggler
  const toggleProject = (projectId) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  // History management functions
  const saveToHistory = (newState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newState)));

    // Keep only last 50 states to prevent memory issues
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex((prev) => prev + 1);
    }

    setHistory(newHistory);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setArrayVideoMake(previousState);
      setHistoryIndex((prev) => prev - 1);
    }
  };

  const canUndo = historyIndex > 0;

  // Function to calculate absolute and final properties for FFmpeg
  const calculateElementProperties = (element) => {
    const outputWidth = projectSettings.outputWidth;
    const outputHeight = projectSettings.outputHeight;

    // Ensure element has position (could be element.x/y or element.position.x/y)
    const positionX = element.position?.x ?? element.x ?? 0;
    const positionY = element.position?.y ?? element.y ?? 0;

    // Calculate absolute position
    const absoluteX = Math.round(positionX * outputWidth);
    const absoluteY = Math.round(positionY * outputHeight);

    // Ensure element has dimensions
    const originalWidth = element.originalWidth ?? element.width ?? 1920;
    const originalHeight = element.originalHeight ?? element.height ?? 1080;
    const scale = element.scale ?? 1;
    const scaleX = element.scaleX ?? 1;
    const scaleY = element.scaleY ?? 1;

    // Calculate final dimensions
    const finalWidth = Math.round(originalWidth * scale * scaleX);
    const finalHeight = Math.round(originalHeight * scale * scaleY);

    // Calculate frame numbers
    const framerate = projectSettings.framerate;
    const startTimeSeconds = element.startTimeSeconds ?? element.startTime ?? 0;
    const endTimeSeconds =
      element.endTimeSeconds ?? element.endTime ?? startTimeSeconds + 1;
    const startFrame = Math.round(startTimeSeconds * framerate);
    const endFrame = Math.round(endTimeSeconds * framerate);

    return {
      ...element,
      // Normalize position format
      position: {
        x: positionX,
        y: positionY,
      },
      // Add normalized properties
      x: positionX,
      y: positionY,
      startTimeSeconds,
      endTimeSeconds,
      durationSeconds: endTimeSeconds - startTimeSeconds,
      originalWidth,
      originalHeight,
      scale,
      scaleX,
      scaleY,
      // Add calculated properties
      absolutePosition: {
        x: absoluteX,
        y: absoluteY,
      },
      finalWidth,
      finalHeight,
      startFrame,
      endFrame,
      // Update timestamps
      startTimestamp: formatTimestamp(startTimeSeconds),
      endTimestamp: formatTimestamp(endTimeSeconds),
    };
  };

  // Function to update timeline and save to history
  const updateTimelineWithHistory = (newArrayVideoMake) => {
    // Save current state to history before making changes
    saveToHistory(arrayVideoMake);

    // Calculate absolute properties for all elements
    const elementsWithCalculatedProps = newArrayVideoMake.map(
      calculateElementProperties
    );

    setArrayVideoMake(elementsWithCalculatedProps);
  };

  // Effect to clean up audio references when timeline changes
  useEffect(() => {
    // Get current element IDs from timeline
    const currentElementIds = new Set(
      arrayVideoMake.map((element) => element.id)
    );

    // Clean up audio references for elements no longer in timeline
    Object.keys(audioRefs.current).forEach((elementId) => {
      if (!currentElementIds.has(elementId)) {
        const audio = audioRefs.current[elementId];
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
          // Remove the reference to prevent memory leaks
          delete audioRefs.current[elementId];
        }
      }
    });
  }, [arrayVideoMake]);

  // Initialize history with current state when component mounts
  useEffect(() => {
    if (history.length === 0) {
      setHistory([JSON.parse(JSON.stringify(arrayVideoMake))]);
      setHistoryIndex(0);
    }
  }, []); // Only run once on mount

  // Initialize library from loader data: music and voices
  useEffect(() => {
    const normalizeAudio = (it, type) => ({
      ...it,
      type,
      url: it?.url || it?.audio_url || it?.music_url || it?.voice_url,
      duration: it?.duration || (type === "music" ? 30 : 15), // Extract duration from backend or use fallback
    });
    const mus = Array.isArray(data?.music)
      ? data.music.map((m) => normalizeAudio(m, "music"))
      : [];

    // Restructure voices by project and general voices
    let structuredVoices = [];

    // Add voices from projects
    if (Array.isArray(data?.projects)) {
      data.projects.forEach((project) => {
        if (Array.isArray(project.voices) && project.voices.length > 0) {
          structuredVoices.push({
            id: `project_${project.id}`,
            name: project.name,
            type: "project",
            voices: project.voices.map((v) => normalizeAudio(v, "voice")),
          });
        }
      });
    }

    // Add general voices (voices that come directly in data.voices without project)
    const generalVoices = Array.isArray(data?.voices)
      ? data.voices.map((v) => normalizeAudio(v, "voice"))
      : [];

    if (generalVoices.length > 0) {
      structuredVoices.push({
        id: "general_voices",
        name: "General",
        type: "general",
        voices: generalVoices,
      });
    }

    if (mus.length) setMusicList(mus);
    if (structuredVoices.length) {
      setVoiceList(structuredVoices);
      // Initialize expanded state for voice groups (collapsed by default)
      const initialExpandedState = {};
      structuredVoices.forEach((group) => {
        initialExpandedState[group.id] = false;
      });
      setExpandedVoiceGroups(initialExpandedState);
    }

    // Initialize sounds list
    const sounds = Array.isArray(data?.sounds)
      ? data.sounds.map((s) => normalizeAudio(s, "sound"))
      : [];
    if (sounds.length) setSoundList(sounds);

    // Preload and cache durations for all audio
    const preload = async (items) => {
      for (const it of items) {
        const u = it.url;
        if (!u || audioDurations[u]) continue;
        const d = await getAudioDuration(u);
        if (d && d > 0) {
          setAudioDurations((prev) => ({ ...prev, [u]: d }));
          // reflect in UI data object
          it.duration = d;

          // Update state so the gallery shows real duration
          if (it.type === "voice") {
            setVoiceList((prev) =>
              Array.isArray(prev)
                ? prev.map((group) => ({
                    ...group,
                    voices: group.voices.map((v) =>
                      v.url === u ? { ...v, duration: d } : v
                    ),
                  }))
                : prev
            );
          } else if (it.type === "music") {
            setMusicList((prev) =>
              Array.isArray(prev)
                ? prev.map((m) => (m.url === u ? { ...m, duration: d } : m))
                : prev
            );
          } else if (it.type === "sound") {
            setSoundList((prev) =>
              Array.isArray(prev)
                ? prev.map((s) => (s.url === u ? { ...s, duration: d } : s))
                : prev
            );
          }
        }
      }
    };

    preload(mus);
    preload(sounds); // Also preload sound durations
    // Preload voices from all groups
    structuredVoices.forEach((group) => {
      preload(group.voices);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.music, data?.voices, data?.projects]);

  // Function to handle timeline click
  const handleTimelineClick = (e) => {
    // Don't process if we're dragging an element
    if (draggingElement) return;

    if (timelineContainerRef.current) {
      const rect = timelineContainerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;

      // Calculate time considering zoom and scroll offset
      const visibleDuration = getVisualTimelineDuration();
      const timeInVisibleArea = percentage * visibleDuration;
      const newTime = Math.max(
        0,
        Math.min(
          timeInVisibleArea + timelineScrollOffset,
          getTimelineDuration()
        )
      );

      console.log("⏰ Timeline Click Debug:");
      console.log("Click X:", clickX);
      console.log("Timeline Width:", rect.width);
      console.log("Percentage:", percentage);
      console.log("Visible Duration:", visibleDuration);
      console.log("Time in Visible Area:", timeInVisibleArea);
      console.log("Timeline Scroll Offset:", timelineScrollOffset);
      console.log("New Time:", newTime);
      console.log("Timeline Zoom:", timelineZoom);

      setCurrentTime(newTime);
      // Immediately sync media positions on seek (won't auto-play when paused)
      syncMediaWithTime(newTime);
    }
  };

  // Function to start timeline dragging
  const handleTimelineMouseDown = (e) => {
    // Don't process if we're dragging an element
    if (draggingElement) return;

    setIsDraggingTimeline(true);
    handleTimelineClick(e);
  };

  // Function to handle image drag start in preview area
  const handleImageDragStart = (e, element) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
    setDraggingImageElement(element);
    // For normalized coordinates, we don't need to store drag start offset
    setImageDragStart({ x: 0, y: 0 });
    document.body.style.cursor = "grabbing";
  };

  // Function to handle image resize start in preview area
  const handleImageResizeStart = (e, element, resizeType) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingImage(true);
    setResizingImageElement(element);
    setResizeImageType(resizeType);

    // Store initial bounds for proportional scaling
    const previewContainer = document.querySelector(".w-2\\/4.rounded-4xl");
    if (previewContainer) {
      const rect = previewContainer.getBoundingClientRect();
      setInitialImageBounds({
        containerWidth: rect.width,
        containerHeight: rect.height,
        initialScale: element.scale || 1,
        startX: e.clientX,
        startY: e.clientY,
        centerX: element.position?.x || 0.5,
        centerY: element.position?.y || 0.5,
      });
    }

    document.body.style.cursor = getResizeCursor(resizeType);
  };

  // Helper function to get appropriate cursor for resize type
  const getResizeCursor = (resizeType) => {
    switch (resizeType) {
      case "top-left":
      case "bottom-right":
        return "nw-resize";
      case "top-right":
      case "bottom-left":
        return "ne-resize";
      case "top":
      case "bottom":
        return "n-resize";
      case "left":
      case "right":
        return "e-resize";
      default:
        return "grab";
    }
  };

  // Effect to handle global mouse events
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingTimeline && timelineContainerRef.current) {
        const rect = timelineContainerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(clickX / rect.width, 1));

        // Calculate time considering zoom and scroll offset (like in handleTimelineClick)
        const visibleDuration = getVisualTimelineDuration();
        const timeInVisibleArea = percentage * visibleDuration;
        const newTime = Math.max(
          0,
          Math.min(
            timeInVisibleArea + timelineScrollOffset,
            getTimelineDuration()
          )
        );

        setCurrentTime(newTime);
      }

      // Handle volume drag
      if (isDraggingVolume && volumeRef.current) {
        const rect = volumeRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(clickX / rect.width, 1));
        setMasterVolume(percentage);
        updateAllVolumes(percentage);
      }

      // Handle zoom drag
      if (isDraggingZoom && zoomSliderRef.current) {
        const rect = zoomSliderRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(clickX / rect.width, 1));

        // Map percentage to zoom range (1 to 3.37)
        const newZoom = 1 + percentage * (3.37 - 1);
        applyZoom(newZoom);
      }

      // Handle timeline element drag
      if (draggingElement && timelineContainerRef.current) {
        setCurrentDragX(e.clientX); // Save current mouse position
        const rect = timelineContainerRef.current.getBoundingClientRect();
        const newStartTime = calculateNewPosition(e.clientX, rect);

        // Update preview position in real time
        setDragPreviewPosition(newStartTime);
      }

      // Handle image drag in preview area
      if (isDraggingImage && draggingImageElement) {
        e.preventDefault();

        // Get preview container dimensions
        const previewContainer = document.querySelector(".w-2\\/4.rounded-4xl");
        if (previewContainer) {
          const rect = previewContainer.getBoundingClientRect();
          const scale = draggingImageElement.scale || 1;

          // Calculate raw normalized position (0-1)
          // FFmpeg coordinates: (0,0) = top-left, (1,1) = bottom-right
          const rawX = Math.max(
            0,
            Math.min(1, (e.clientX - rect.left) / rect.width)
          );
          const rawY = Math.max(
            0,
            Math.min(1, (e.clientY - rect.top) / rect.height)
          );

          // Apply scale constraints to prevent image from going outside container
          // For scaled images, limit positioning range
          const halfScale = scale / 2;
          const minBound = halfScale;
          const maxBound = 1 - halfScale;

          const newPosition = {
            x: Math.max(minBound, Math.min(maxBound, rawX)),
            y: Math.max(minBound, Math.min(maxBound, rawY)), // Direct Y mapping for FFmpeg compatibility
          };

          // Update position in real time using callback to avoid stale closure
          setArrayVideoMake((prevArray) =>
            prevArray.map((item) =>
              item.id === draggingImageElement.id
                ? { ...item, position: newPosition }
                : item
            )
          );

          // Update selected element if it's the one being dragged
          setSelectedElement((prevSelected) => {
            if (prevSelected && prevSelected.id === draggingImageElement.id) {
              return { ...prevSelected, position: newPosition };
            }
            return prevSelected;
          });
        }
      }

      // Handle image resizing in preview area
      if (isResizingImage && resizingImageElement && initialImageBounds) {
        e.preventDefault();

        const deltaX = e.clientX - initialImageBounds.startX;
        const deltaY = e.clientY - initialImageBounds.startY;

        // Calculate new scale based on resize type
        let newScale = initialImageBounds.initialScale;
        const sensitivity = 0.005; // Adjust sensitivity as needed

        switch (resizeImageType) {
          case "top-left":
            // Scale up when dragging away from center, down when dragging towards center
            newScale =
              initialImageBounds.initialScale +
              (-deltaX - deltaY) * sensitivity;
            break;
          case "top-right":
            newScale =
              initialImageBounds.initialScale + (deltaX - deltaY) * sensitivity;
            break;
          case "bottom-left":
            newScale =
              initialImageBounds.initialScale +
              (-deltaX + deltaY) * sensitivity;
            break;
          case "bottom-right":
            newScale =
              initialImageBounds.initialScale + (deltaX + deltaY) * sensitivity;
            break;
          case "top":
          case "bottom":
            newScale =
              initialImageBounds.initialScale +
              Math.abs(deltaY) * sensitivity * (deltaY < 0 ? -1 : 1);
            break;
          case "left":
          case "right":
            newScale =
              initialImageBounds.initialScale +
              Math.abs(deltaX) * sensitivity * (deltaX < 0 ? -1 : 1);
            break;
        }

        // Clamp scale between reasonable bounds
        newScale = Math.max(0.1, Math.min(3.0, newScale));

        // Update scale in real time
        setArrayVideoMake((prevArray) =>
          prevArray.map((item) =>
            item.id === resizingImageElement.id
              ? { ...item, scale: newScale }
              : item
          )
        );

        // Update selected element if it's the one being resized
        setSelectedElement((prevSelected) => {
          if (prevSelected && prevSelected.id === resizingImageElement.id) {
            return { ...prevSelected, scale: newScale };
          }
          return prevSelected;
        });
      }

      // Handle element resizing
      if (isResizing && timelineContainerRef.current) {
        const rect = timelineContainerRef.current.getBoundingClientRect();
        const newTime = calculateResizePosition(e.clientX, rect);

        // Apply resizing in real time
        const updatedElement = applyResize(
          resizingElement,
          newTime,
          resizeType
        );
        setArrayVideoMake((prev) =>
          prev.map((item) =>
            item.id === updatedElement.id ? updatedElement : item
          )
        );
      }
    };

    const handleMouseUp = (e) => {
      if (isDraggingTimeline) {
        setIsDraggingTimeline(false);
        // Immediately sync media when dragging ends
        syncMediaWithTime(currentTime);
      }

      // Handle end of volume drag
      if (isDraggingVolume) {
        setIsDraggingVolume(false);
      }

      // Handle end of zoom drag
      if (isDraggingZoom) {
        setIsDraggingZoom(false);
      }

      // Handle end of image drag
      if (isDraggingImage) {
        // Save to history when drag ends
        saveToHistory(arrayVideoMake);

        setIsDraggingImage(false);
        setDraggingImageElement(null);
        setImageDragStart({ x: 0, y: 0 });
        document.body.style.cursor = "default";
      }

      // Handle end of image resize
      if (isResizingImage) {
        // Save to history when resize ends
        saveToHistory(arrayVideoMake);

        setIsResizingImage(false);
        setResizingImageElement(null);
        setResizeImageType(null);
        setInitialImageBounds(null);
        document.body.style.cursor = "default";
      }

      // Handle end of element drag
      if (draggingElement && timelineContainerRef.current) {
        const rect = timelineContainerRef.current.getBoundingClientRect();
        // Use currentDragX if available, otherwise use e.clientX
        const dragEndX = currentDragX || e.clientX;
        const newStartTime = calculateNewPosition(dragEndX, rect);

        // Resolve collisions and update array with history
        const updatedElements = resolveCollisions(
          draggingElement,
          newStartTime
        );
        updateTimelineWithHistory(updatedElements);

        // Clean drag state
        setDraggingElement(null);
        setDragStartX(0);
        setDragStartTime(0);
        setCurrentDragX(0);
        setDragPreviewPosition(0);
        document.body.style.cursor = "default";
      }

      // Handle end of resizing
      if (isResizing && resizingElement) {
        // Get the updated element from the current array
        const updatedElement = arrayVideoMake.find(
          (item) => item.id === resizingElement.id
        );
        if (updatedElement) {
          // For resize, don't call resolveCollisions as it's designed for dragging
          // Just save to history with the updated elements
          saveToHistory(arrayVideoMake);
        }

        setIsResizing(false);
        setResizingElement(null);
        setResizeType(null);
        setResizeStartX(0);
        setResizeStartTime(0);
        document.body.style.cursor = "default";
      }
    };

    if (
      isDraggingTimeline ||
      draggingElement ||
      isDraggingVolume ||
      isDraggingZoom ||
      isDraggingImage ||
      isResizingImage ||
      isResizing
    ) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDraggingTimeline,
    currentTime,
    draggingElement,
    dragStartX,
    dragStartTime,
    currentDragX,
    dragPreviewPosition,
    isDraggingVolume,
    masterVolume,
    isDraggingZoom,
    timelineZoom,
    isDraggingImage,
    draggingImageElement,
    imageDragStart,
    isResizingImage,
    resizingImageElement,
    resizeImageType,
    initialImageBounds,
    isResizing,
    resizingElement,
    resizeType,
  ]);

  // Keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if user is typing in an input field
      const isInInputField =
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.tagName === "SELECT";

      // Check if Ctrl (Windows/Linux) or Cmd (Mac) is pressed
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Allow Ctrl+Z, Ctrl+S, + and - even in input fields for undo/save/zoom functionality
      if (isInInputField) {
        // Only allow Ctrl+Z, Ctrl+S, + and - in input fields, block other shortcuts
        if (
          !(
            (isCtrlOrCmd && (e.key === "z" || e.key === "s")) ||
            e.key === "+" ||
            e.key === "=" ||
            e.key === "-"
          )
        ) {
          return;
        }
      }

      // Delete selected element with Backspace or Delete
      if ((e.key === "Backspace" || e.key === "Delete") && selectedElement) {
        e.preventDefault();
        // Use the proper delete function to ensure audio cleanup
        handleDeleteElement(selectedElement.id);
      }

      // Undo with Ctrl+Z or Cmd+Z
      if (isCtrlOrCmd && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Save with Ctrl+S or Cmd+S
      if (isCtrlOrCmd && e.key === "s") {
        e.preventDefault();
        setShowSaveModal(true);
      }

      // Zoom in with + or =
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      }

      // Zoom out with -
      if (e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    selectedElement,
    arrayVideoMake,
    canUndo,
    timelineScrollOffset,
    visibleDuration,
    timelineZoom,
  ]);

  // Function to get unique color for each element
  const getElementColor = (elementId, index, channel) => {
    // Fixed colors per channel
    const channelColors = {
      music: "#9B59B6", // Purple for Music
      voice: "#3498DB", // Blue for Voice
      sound: "#F39C12", // Orange for Sound
    };

    // Return fixed color if channel is provided
    if (channel && channelColors[channel]) {
      return channelColors[channel];
    }

    // Fallback to varied colors for video/image channels
    const colors = [
      "#4A90E2", // Blue
      "#FF6B6B", // Coral red
      "#50C878", // Emerald green
      "#9B59B6", // Purple
      "#F39C12", // Orange
      "#E74C3C", // Red
      "#3498DB", // Light blue
      "#2ECC71", // Green
      "#9B2ECC", // Purple
      "#E67E22", // Dark orange
      "#1ABC9C", // Turquoise
      "#F1C40F", // Yellow
      "#E91E63", // Pink
      "#FF5722", // Red orange
      "#607D8B", // Blue gray
    ];

    // Use ID hash to get consistent index
    const hashCode = elementId.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hashCode) % colors.length];
  };

  // Zoom functions
  const handleZoomIn = () => {
    const totalDuration = getTimelineDuration();
    const currentVisibleDuration = getVisualTimelineDuration();
    const newVisibleDuration = Math.max(currentVisibleDuration / 1.5, 30); // Min 30 seconds visible

    // For zoom in, we want to keep the current view centered
    // Calculate a safe center point that considers current scroll position
    const viewportCenter = timelineScrollOffset + currentVisibleDuration / 2;

    // Calculate new scroll offset, but ensure we don't go negative or beyond bounds
    let newScrollOffset = viewportCenter - newVisibleDuration / 2;

    // Ensure the new scroll offset is within valid bounds
    const maxScrollOffset = Math.max(0, totalDuration - newVisibleDuration);
    newScrollOffset = Math.max(0, Math.min(newScrollOffset, maxScrollOffset));

    // If we're at the beginning of the timeline, keep it there
    if (timelineScrollOffset <= 0) {
      newScrollOffset = 0;
    }

    setVisibleDuration(newVisibleDuration);
    setTimelineScrollOffset(newScrollOffset);
    setTimelineZoom((prev) => Math.min(prev * 1.5, 3.37)); // Max zoom 3.37x (337%)
  };

  const handleZoomOut = () => {
    const totalDuration = getTimelineDuration();
    const currentVisibleDuration = getVisualTimelineDuration();
    const newVisibleDuration = Math.min(
      currentVisibleDuration * 1.5,
      totalDuration
    ); // Max = total duration

    // Calculate the center point of current view to maintain focus
    const currentCenter = timelineScrollOffset + currentVisibleDuration / 2;

    // Adjust scroll offset to keep the center point in view
    const newScrollOffset = Math.max(
      0,
      Math.min(
        currentCenter - newVisibleDuration / 2,
        totalDuration - newVisibleDuration
      )
    );

    setVisibleDuration(newVisibleDuration);
    setTimelineScrollOffset(newScrollOffset);
    setTimelineZoom((prev) => Math.max(prev / 1.5, 1)); // Min zoom 1x (100%)
  };

  // Handle zoom slider interaction
  const handleZoomSliderClick = (e) => {
    if (zoomSliderRef.current) {
      const rect = zoomSliderRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(clickX / rect.width, 1));

      // Map percentage to zoom range (1 to 3.37)
      const newZoom = 1 + percentage * (3.37 - 1);
      applyZoom(newZoom);
    }
  };

  const handleZoomSliderMouseDown = (e) => {
    setIsDraggingZoom(true);
    handleZoomSliderClick(e);
  };

  const applyZoom = (newZoom) => {
    const totalDuration = getTimelineDuration();

    // Calculate new visible duration based on zoom level
    const baseVisibleDuration = Math.max(totalDuration, 120);
    const newVisibleDuration = Math.max(baseVisibleDuration / newZoom, 30);

    // Keep the current center point of the view
    const currentVisibleDuration = getVisualTimelineDuration();
    const currentCenter = timelineScrollOffset + currentVisibleDuration / 2;

    // Calculate new scroll offset to keep center point
    let newScrollOffset = currentCenter - newVisibleDuration / 2;

    // Ensure the new scroll offset is within valid bounds
    const maxScrollOffset = Math.max(0, totalDuration - newVisibleDuration);
    newScrollOffset = Math.max(0, Math.min(newScrollOffset, maxScrollOffset));

    // If we're at the beginning, keep it there
    if (timelineScrollOffset <= 0) {
      newScrollOffset = 0;
    }

    setVisibleDuration(newVisibleDuration);
    setTimelineScrollOffset(newScrollOffset);
    setTimelineZoom(newZoom);
  };

  // Cut function - splits an element at the current time
  const handleCutElement = () => {
    if (!selectedElement || !showCutButton) return;

    // Use currentTime directly as the cut point
    const cutTime = currentTime;

    const element = selectedElement;

    // Validate cut is within element bounds
    if (cutTime <= element.startTime || cutTime >= element.endTime) {
      console.warn("Cut time is outside element bounds");
      return;
    }

    console.log("🔪 Cut Element:");
    console.log("Cut Time:", cutTime);
    console.log("Element Start:", element.startTime);
    console.log("Element End:", element.endTime);

    // Calculate trim for the second part based on original duration
    const timeIntoElement = cutTime - element.startTime;
    const trimStartForSecondPart = (element.trimStart || 0) + timeIntoElement;

    // Create two new elements from the cut
    const firstPart = {
      ...element,
      id: `${element.id}_cut1_${Date.now()}`,
      endTime: cutTime,
      endTimeSeconds: cutTime,
      duration: cutTime - element.startTime,
      durationSeconds: cutTime - element.startTime,
      trimEnd: (element.originalDuration || element.duration) - timeIntoElement,
      endTimestamp: formatTimestamp(cutTime),
    };

    const secondPart = {
      ...element,
      id: `${element.id}_cut2_${Date.now()}`,
      startTime: cutTime,
      startTimeSeconds: cutTime,
      trimStart: trimStartForSecondPart,
      duration: element.endTime - cutTime,
      durationSeconds: element.endTime - cutTime,
      startTimestamp: formatTimestamp(cutTime),
    };

    // Replace the original element with the two new parts
    const filtered = arrayVideoMake.filter((item) => item.id !== element.id);
    const newElements = [...filtered, firstPart, secondPart];
    updateTimelineWithHistory(newElements);

    // Select the first part after cutting
    setSelectedElement(firstPart);
  };

  // Function to get thumbnail/frame for video elements
  const getElementThumbnail = (element) => {
    if (element.channel === "video") {
      return (
        element.video_url ||
        element.url ||
        element.image_url ||
        element.prompt_image_url
      );
    }
    if (element.channel === "image") {
      return element.image_url || element.url;
    }
    return null;
  };

  // Function to create multiple thumbnails for wide elements
  const createThumbnailBackground = (element, elementWidth) => {
    const thumbnailUrl = getElementThumbnail(element);
    if (!thumbnailUrl) {
      return getElementColor(element.id, 0);
    }

    // Calculate how many thumbnails we need based on element width
    const thumbnailSize = 80; // Base thumbnail width in pixels
    const numThumbnails = Math.max(1, Math.ceil(elementWidth / thumbnailSize));

    if (numThumbnails === 1) {
      return `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${thumbnailUrl})`;
    }

    // Create repeating pattern for multiple thumbnails
    const gradientOverlay = "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3))";
    const thumbnailRepeats = Array(numThumbnails)
      .fill(`url(${thumbnailUrl})`)
      .join(", ");

    return `${gradientOverlay}, ${thumbnailRepeats}`;
  };

  // Function to select/deselect an element
  const handleSelectElement = (element, e) => {
    e.stopPropagation();
    if (selectedElement && selectedElement.id === element.id) {
      // If already selected, deselect
      setSelectedElement(null);
    } else {
      // Select element
      setSelectedElement(element);
    }
  };

  // Function to update selected element properties
  const updateSelectedElement = (
    property,
    value,
    shouldSaveHistory = false
  ) => {
    if (!selectedElement) return;

    const updatedArray = arrayVideoMake.map((item) => {
      if (item.id === selectedElement.id) {
        // Handle nested properties like colorCorrection
        if (property.includes(".")) {
          const [parentProp, childProp] = property.split(".");
          return {
            ...item,
            [parentProp]: {
              ...(item[parentProp] || {}),
              [childProp]: value,
            },
          };
        } else {
          return { ...item, [property]: value };
        }
      }
      return item;
    });

    setArrayVideoMake(updatedArray);

    // Save to history if requested
    if (shouldSaveHistory) {
      saveToHistory(updatedArray);
    }

    // Also update selected element state
    setSelectedElement((prev) => {
      if (property.includes(".")) {
        const [parentProp, childProp] = property.split(".");
        return {
          ...prev,
          [parentProp]: {
            ...(prev[parentProp] || {}),
            [childProp]: value,
          },
        };
      } else {
        return { ...prev, [property]: value };
      }
    });
  };

  // Helper function for slider change with history
  const handleSliderChange = (property, parseFunction = parseFloat) => ({
    onChange: (e) =>
      updateSelectedElement(property, parseFunction(e.target.value), false),
    onChangeEnd: (e) =>
      updateSelectedElement(property, parseFunction(e.target.value), true),
  });

  // Function to delete element from timeline
  const handleDeleteElement = (elementId) => {
    // Find the element to delete
    const elementToDelete = arrayVideoMake.find(
      (item) => item.id === elementId
    );

    // Clean up audio references for music and voice elements
    if (
      elementToDelete &&
      (elementToDelete.channel === "music" ||
        elementToDelete.channel === "voice" ||
        elementToDelete.channel === "sound")
    ) {
      const audio = audioRefs.current[elementId];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        // Remove the reference to prevent memory leaks
        delete audioRefs.current[elementId];
      }
    }

    const newElements = arrayVideoMake.filter((item) => item.id !== elementId);
    updateTimelineWithHistory(newElements);

    // If deleted element was selected, deselect
    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement(null);
    }
  };

  // Functions for element resizing/trimming
  const handleResizeStart = (e, element, type) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizingElement(element);
    setResizeType(type);
    setResizeStartX(e.clientX);
    setResizeStartTime(type === "start" ? element.startTime : element.endTime);
    document.body.style.cursor = "ew-resize";
  };

  const calculateResizePosition = (clientX, timelineRect) => {
    const deltaX = clientX - resizeStartX;
    const timelineWidth = timelineRect.width;
    const timelineDuration = getTimelineDuration();
    const deltaTime = (deltaX / timelineWidth) * timelineDuration;

    return resizeStartTime + deltaTime;
  };

  const applyResize = (element, newTime, type) => {
    const updatedElement = { ...element };
    const originalDuration = element.originalDuration || element.duration;
    const isMediaWithFixedDuration =
      element.type === "video" ||
      element.type === "music" ||
      element.type === "voice" ||
      element.channel === "video" ||
      element.channel === "music" ||
      element.channel === "voice" ||
      element.channel === "sound";

    if (type === "start") {
      // Resize from start
      const newStartTime = Math.max(
        0,
        Math.min(newTime, element.endTime - 0.1)
      );
      const newDuration = element.endTime - newStartTime;

      if (isMediaWithFixedDuration && element.originalDuration) {
        // For media with fixed duration, check limits
        const currentTrimEnd = element.trimEnd || 0;
        const maxTrimStart = Math.max(
          0,
          originalDuration - currentTrimEnd - 0.1
        );
        const deltaTime = newStartTime - element.startTime;
        const newTrimStart = Math.max(
          0,
          Math.min((element.trimStart || 0) + deltaTime, maxTrimStart)
        );

        updatedElement.startTime = formatDuration(newStartTime);
        updatedElement.duration = formatDuration(newDuration);
        updatedElement.endTime = formatDuration(newStartTime + newDuration);
        updatedElement.trimStart = formatDuration(newTrimStart);
      } else {
        // For images, allow free resizing
        updatedElement.startTime = formatDuration(newStartTime);
        updatedElement.duration = formatDuration(newDuration);
        updatedElement.endTime = formatDuration(newStartTime + newDuration);
      }
    } else {
      // Resize from end
      if (isMediaWithFixedDuration && element.originalDuration) {
        // For media with fixed duration, DON'T ALLOW EXPANDING beyond original duration
        const currentTrimStart = element.trimStart || 0;
        const maxAllowedDuration = originalDuration - currentTrimStart;
        const maxAllowedEndTime = element.startTime + maxAllowedDuration;

        const newEndTime = Math.max(
          element.startTime + 0.1,
          Math.min(newTime, maxAllowedEndTime)
        );
        const newDuration = newEndTime - element.startTime;
        const deltaTime = element.endTime - newEndTime;
        const newTrimEnd = Math.max(0, (element.trimEnd || 0) + deltaTime);

        updatedElement.endTime = formatDuration(newEndTime);
        updatedElement.duration = formatDuration(newDuration);
        updatedElement.trimEnd = formatDuration(newTrimEnd);
      } else {
        // For images, allow free resizing
        const newEndTime = Math.max(element.startTime + 0.1, newTime);
        const newDuration = newEndTime - element.startTime;

        updatedElement.endTime = formatDuration(newEndTime);
        updatedElement.duration = formatDuration(newDuration);
      }
    }

    return updatedElement;
  };

  // Helper function to get element render position
  const getElementRenderPosition = (element) => {
    // If this element is being dragged, use preview position
    if (draggingElement?.id === element.id && dragPreviewPosition !== null) {
      return dragPreviewPosition;
    }
    // Otherwise, use normal position
    return element.startTime;
  };

  // Helper function to calculate element position percentage considering zoom and scroll
  const getElementPositionPercentage = (element) => {
    const elementStartTime = getElementRenderPosition(element);
    const visibleDuration = getVisualTimelineDuration();

    // Time relative to the visible portion of the timeline
    const timeInVisibleArea = elementStartTime - timelineScrollOffset;

    // If element is outside the visible area, it will still be positioned correctly
    // but might be clipped by the container
    const percentage = (timeInVisibleArea / visibleDuration) * 100;

    return percentage;
  };

  // Helper function to calculate element width percentage considering zoom
  const getElementWidthPercentage = (element) => {
    const elementDuration = element.endTime - element.startTime;
    const visibleDuration = getVisualTimelineDuration();

    const percentage = (elementDuration / visibleDuration) * 100;

    return percentage;
  };

  // Function to start timeline element drag
  const handleElementDragStart = (e, element) => {
    e.stopPropagation(); // Prevent timeline drag activation
    setDraggingElement(element);
    setDragStartX(e.clientX);
    setCurrentDragX(e.clientX); // Initialize current position
    setDragStartTime(element.startTime);
    setDragPreviewPosition(element.startTime); // Initialize preview position

    // Change cursor
    document.body.style.cursor = "grabbing";
  };

  // Function to calculate new position based on drag
  const calculateNewPosition = (clientX, timelineRect) => {
    const deltaX = clientX - dragStartX;
    const timelineWidth = timelineRect.width;
    const timelineDuration = getTimelineDuration();

    // Convert pixel delta to time
    const deltaTime = (deltaX / timelineWidth) * timelineDuration;
    const newStartTime = Math.max(0, dragStartTime + deltaTime);

    return newStartTime;
  };

  // Función para resolver colisiones entre elementos
  const resolveCollisions = (movedElement, newStartTime) => {
    const duration = movedElement.endTime - movedElement.startTime;
    const newEndTime = formatDuration(newStartTime + duration);
    const formattedNewStartTime = formatDuration(newStartTime);

    // Crear una copia del array actual sin el elemento que se está moviendo
    const otherElements = arrayVideoMake.filter(
      (item) => item.id !== movedElement.id
    );

    // Buscar colisiones en el mismo canal
    const sameChannelElements = otherElements.filter(
      (item) => item.channel === movedElement.channel
    );

    // Verificar si hay colisión
    const hasCollision = sameChannelElements.some(
      (item) =>
        formattedNewStartTime < item.endTime && newEndTime > item.startTime
    );

    if (!hasCollision) {
      // No hay colisión, aplicar el movimiento directamente
      return otherElements.concat([
        {
          ...movedElement,
          startTime: formattedNewStartTime,
          endTime: newEndTime,
        },
      ]);
    }

    // There's collision, find best position
    const sortedElements = sameChannelElements.sort(
      (a, b) => a.startTime - b.startTime
    );

    // Try to place element before first colliding element
    for (let i = 0; i < sortedElements.length; i++) {
      const element = sortedElements[i];

      // Check if it fits before this element
      if (
        formattedNewStartTime < element.startTime &&
        newEndTime <= element.startTime
      ) {
        // Fits here
        return otherElements.concat([
          {
            ...movedElement,
            startTime: formattedNewStartTime,
            endTime: newEndTime,
          },
        ]);
      }

      // Try to place after this element
      const afterPosition = formatDuration(element.endTime);
      const afterEndTime = formatDuration(afterPosition + duration);

      // Check if it fits after this element and before next one (if exists)
      const nextElement = sortedElements[i + 1];
      if (!nextElement || afterEndTime <= nextElement.startTime) {
        return otherElements.concat([
          {
            ...movedElement,
            startTime: afterPosition,
            endTime: afterEndTime,
          },
        ]);
      }
    }

    // If no place found, place at end
    const lastElement = sortedElements[sortedElements.length - 1];
    const finalPosition = formatDuration(lastElement ? lastElement.endTime : 0);

    return otherElements.concat([
      {
        ...movedElement,
        startTime: finalPosition,
        endTime: formatDuration(finalPosition + duration),
      },
    ]);
  };

  // Functions to save and export project
  const handleSaveProject = () => {
    setShowSaveModal(true);
  };

  const handleLoadProject = () => {
    setShowLoadModal(true);
  };

  const handleExportVideo = () => {
    setShowExportModal(true);
  };

  // ===== FUNCIÓN PARA GENERAR ESTRUCTURA COMPLETA PARA FFMPEG =====
  const generateFFmpegTimeline = () => {
    // Calcular duración total del contenido
    const contentEndTime = getContentEndTime();
    const totalDuration = Math.max(contentEndTime, 1); // Mínimo 1 segundo

    // Calcular total de frames
    const totalFrames = Math.ceil(totalDuration * projectSettings.framerate);

    // Detectar gaps y overlaps
    const gaps = detectTimelineGaps();
    const overlaps = detectTimelineOverlaps();

    // Información de sincronización global
    const syncPoints = generateSyncPoints();

    // Estructura completa del timeline para FFmpeg
    const ffmpegTimeline = {
      // === INFORMACIÓN DEL PROYECTO ===
      projectInfo: {
        name: currentEditName || "Untitled Project",
        id: currentEditId,
        created: new Date().toISOString(),
        version: "1.0.0",
      },

      // === CONFIGURACIÓN DEL CANVAS ===
      canvas: {
        outputWidth: projectSettings.outputWidth,
        outputHeight: projectSettings.outputHeight,
        aspectRatio: projectSettings.aspectRatio,
        backgroundColor: projectSettings.backgroundColor,
        backgroundImage: projectSettings.backgroundImage,
      },

      // === CONFIGURACIÓN TEMPORAL ===
      timing: {
        duration: totalDuration,
        framerate: projectSettings.framerate,
        totalFrames: totalFrames,
        timebase: `1/${projectSettings.framerate}`,
        sampleRate: projectSettings.sampleRate,
        audioChannels: projectSettings.audioChannels,
      },

      // === CONFIGURACIÓN DE RENDER ===
      renderSettings: projectSettings.renderSettings,

      // === CONFIGURACIÓN DE ENCODING ===
      encoding: projectSettings.encodingParams,

      // === EFECTOS GLOBALES ===
      globalFilters: projectSettings.globalFilters,

      // === ELEMENTOS DEL TIMELINE ===
      elements: arrayVideoMake.map((element) => {
        // Primero calculamos las propiedades absolutas del elemento
        const calculatedElement = calculateElementProperties(element);

        return {
          // Información básica
          id: calculatedElement.id,
          type: calculatedElement.type,
          channel: calculatedElement.channel,

          // Timing crítico para FFmpeg
          timing: {
            startTime: calculatedElement.startTimeSeconds,
            endTime: calculatedElement.endTimeSeconds,
            duration: calculatedElement.durationSeconds,
            startFrame: calculatedElement.startFrame,
            endFrame: calculatedElement.endFrame,
            startTimestamp: calculatedElement.startTimestamp,
            endTimestamp: calculatedElement.endTimestamp,

            // Trim específico
            trimStart: calculatedElement.trimStart || 0,
            trimEnd: calculatedElement.trimEnd || 0,
            trimDuration:
              calculatedElement.trimDuration ||
              calculatedElement.durationSeconds,

            // Offset de audio crítico
            audioOffset: calculatedElement.audioOffset || 0,
          },

          // Archivo fuente
          source: {
            url: calculatedElement.url,
            filename: calculatedElement.filename,
            originalDuration: calculatedElement.originalDuration,
            originalFramerate:
              calculatedElement.originalFramerate || projectSettings.framerate,
            originalWidth: calculatedElement.originalWidth,
            originalHeight: calculatedElement.originalHeight,
            aspectRatio: calculatedElement.aspectRatio,
            inputFormat: calculatedElement.inputFormat,
            codec: calculatedElement.codec,
            audioCodec: calculatedElement.audioCodec,
            pixelFormat: calculatedElement.pixelFormat || "yuv420p",
            colorSpace: calculatedElement.colorSpace || "bt709",
            colorRange: calculatedElement.colorRange || "tv",
            originalSampleRate:
              calculatedElement.originalSampleRate ||
              projectSettings.sampleRate,
            originalChannels: calculatedElement.originalChannels || 2,
          },

          // Transformaciones visuales
          transform: {
            position: {
              x: calculatedElement.position.x,
              y: calculatedElement.position.y,
              absoluteX: calculatedElement.absolutePosition.x,
              absoluteY: calculatedElement.absolutePosition.y,
            },
            scale: {
              uniform: calculatedElement.scale,
              x: calculatedElement.scaleX || calculatedElement.scale,
              y: calculatedElement.scaleY || calculatedElement.scale,
              keepAspectRatio: calculatedElement.keepAspectRatio,
            },
            dimensions: {
              finalWidth: calculatedElement.finalWidth,
              finalHeight: calculatedElement.finalHeight,
            },
            rotation: calculatedElement.rotation || 0,
            anchor: {
              x: calculatedElement.anchorX || 0.5,
              y: calculatedElement.anchorY || 0.5,
            },
          },

          // Composición
          composition: {
            zIndex: calculatedElement.zIndex,
            opacity: calculatedElement.opacity,
            blendMode: calculatedElement.blendMode || "normal",
          },

          // Máscara y recorte
          mask: {
            enabled: calculatedElement.maskEnabled || false,
            path: calculatedElement.maskPath,
            crop: {
              enabled: calculatedElement.cropEnabled || false,
              area: calculatedElement.cropArea,
            },
          },

          // Audio
          audio: {
            volume: calculatedElement.audioVolume || calculatedElement.volume,
            muted: calculatedElement.muted || false,
            fadeIn: calculatedElement.audioFadeIn || 0,
            fadeOut: calculatedElement.audioFadeOut || 0,
            pan: calculatedElement.audioPan || 0,
            filters: calculatedElement.audioFilters,
          },

          // Corrección de color
          colorCorrection: calculatedElement.colorCorrection,

          // Filtros adicionales
          filters: calculatedElement.filters,

          // Propiedades específicas por tipo
          typeSpecific: {
            // Para imágenes
            ...(calculatedElement.type === "image" && {
              imageFilters: calculatedElement.imageFilters,
              imageFormat: calculatedElement.imageFormat,
              hasAlpha: calculatedElement.hasAlpha,
              colorProfile: calculatedElement.colorProfile,
            }),

            // Para texto
            ...(calculatedElement.type === "text" && {
              textProperties: calculatedElement.textProperties,
            }),
          },
        };
      }),

      // === INFORMACIÓN DE SINCRONIZACIÓN ===
      synchronization: {
        gaps: gaps,
        overlaps: overlaps,
        syncPoints: syncPoints,
        timelineIntegrity: { isValid: true, issues: [] },
      },

      // === METADATA ADICIONAL ===
      metadata: {
        totalElements: arrayVideoMake.length,
        elementsByType: {
          video: arrayVideoMake.filter((e) => e.type === "video").length,
          image: arrayVideoMake.filter((e) => e.type === "image").length,
          music: arrayVideoMake.filter((e) => e.type === "music").length,
          voice: arrayVideoMake.filter((e) => e.type === "voice").length,
        },
        exportTimestamp: new Date().toISOString(),
        checksum: "checksum-placeholder",
      },
    };

    return ffmpegTimeline;
  };

  // === FUNCIONES AUXILIARES PARA ANÁLISIS DEL TIMELINE ===

  // Detectar gaps en el timeline
  const detectTimelineGaps = () => {
    const gaps = [];
    // Implementar lógica para detectar gaps entre elementos
    // Por ahora retorna array vacío
    return gaps;
  };

  // Detectar overlaps en el timeline
  const detectTimelineOverlaps = () => {
    const overlaps = [];
    // Implementar lógica para detectar overlaps entre elementos
    // Por ahora retorna array vacío
    return overlaps;
  };

  // Generar puntos de sincronización críticos
  const generateSyncPoints = () => {
    const syncPoints = [];
    // Agregar puntos críticos como inicios de elementos, cortes, etc.
    arrayVideoMake.forEach((element) => {
      syncPoints.push({
        timestamp: element.startTimeSeconds,
        frame: element.startFrame,
        type: "element_start",
        elementId: element.id,
      });
      syncPoints.push({
        timestamp: element.endTimeSeconds,
        frame: element.endFrame,
        type: "element_end",
        elementId: element.id,
      });
    });
    return syncPoints.sort((a, b) => a.timestamp - b.timestamp);
  };

  // Validar integridad del timeline
  const validateTimelineIntegrity = () => {
    const issues = [];

    // Verificar elementos sin duración
    arrayVideoMake.forEach((element) => {
      if (element.durationSeconds <= 0) {
        issues.push({
          type: "zero_duration",
          elementId: element.id,
          message: "Element has zero or negative duration",
        });
      }

      if (element.startTimeSeconds >= element.endTimeSeconds) {
        issues.push({
          type: "invalid_timing",
          elementId: element.id,
          message: "Start time is greater than or equal to end time",
        });
      }
    });

    return {
      isValid: issues.length === 0,
      issues: issues,
    };
  };

  // Generar checksum del timeline
  const generateTimelineChecksum = (timeline) => {
    // Crear un hash simple basado en el contenido del timeline
    const timelineString = JSON.stringify(timeline);
    let hash = 0;
    for (let i = 0; i < timelineString.length; i++) {
      const char = timelineString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  };

  // Pre-rendering function with Screen Capture API (much simpler and faster)
  const handlePreRender = async () => {
    if (arrayVideoMake.length === 0) {
      alert("No hay elementos en el timeline para pre-renderizar");
      return;
    }

    try {
      setIsPreRendering(true);
      setPreRenderProgress(0);
      setPreRenderedVideo(null);

      // Reset timeline to start and start playing
      const originalTime = currentTime;
      const originalPlaying = isPlaying;
      setCurrentTime(0);

      // Wait a moment for UI to update
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Start playback
      setIsPlaying(true);

      // Wait another moment for playback to start
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Request screen capture
      const displayMediaOptions = {
        video: {
          displaySurface: "browser",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: false, // We'll handle audio separately if needed
      };

      const screenStream = await navigator.mediaDevices.getDisplayMedia(
        displayMediaOptions
      );

      // Try different codec options
      const codecOptions = [
        { mimeType: "video/webm;codecs=vp8", videoBitsPerSecond: 5000000 },
        { mimeType: "video/webm", videoBitsPerSecond: 5000000 },
        { mimeType: "video/mp4", videoBitsPerSecond: 5000000 },
        { videoBitsPerSecond: 5000000 },
      ];

      let recorder = null;
      let selectedMimeType = "video/webm";

      for (const options of codecOptions) {
        try {
          if (MediaRecorder.isTypeSupported(options.mimeType || "")) {
            recorder = new MediaRecorder(screenStream, options);
            selectedMimeType = options.mimeType || "video/webm";
            console.log("Using codec for screen capture:", selectedMimeType);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!recorder) {
        recorder = new MediaRecorder(screenStream);
        selectedMimeType = "video/webm";
      }

      const chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: selectedMimeType });
        const url = URL.createObjectURL(blob);
        setPreRenderedVideo({ url, blob, mimeType: selectedMimeType });
        setIsPreRendering(false);

        // Stop screen sharing
        screenStream.getTracks().forEach((track) => track.stop());

        // Restore original state
        setCurrentTime(originalTime);
        setIsPlaying(originalPlaying);
      };

      // Start recording
      recorder.start();
      setMediaRecorder(recorder);

      // Calculate total duration and set up progress tracking
      const totalDuration = getTimelineDuration();
      const startTime = Date.now();

      // Update progress based on playback time
      const progressInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min((elapsed / totalDuration) * 100, 100);
        setPreRenderProgress(progress);

        // Stop recording when timeline ends
        if (elapsed >= totalDuration || !isPlaying) {
          clearInterval(progressInterval);
          if (recorder.state === "recording") {
            recorder.stop();
          }
        }
      }, 100);

      // Also stop if user manually stops playback
      const checkPlaybackStop = setInterval(() => {
        if (!isPlaying) {
          clearInterval(checkPlaybackStop);
          clearInterval(progressInterval);
          if (recorder.state === "recording") {
            recorder.stop();
          }
        }
      }, 200);
    } catch (error) {
      console.error("Error during screen capture:", error);
      setIsPreRendering(false);

      if (error.name === "NotAllowedError") {
        alert(
          "Debes permitir el acceso a la captura de pantalla para pre-renderizar"
        );
      } else {
        alert("Error durante el pre-renderizado: " + error.message);
      }
    }
  };

  // Function to download pre-rendered video
  const downloadPreRenderedVideo = () => {
    if (preRenderedVideo) {
      // Determine file extension based on MIME type
      const mimeType = preRenderedVideo.mimeType || "video/webm";
      let extension = "webm";
      if (mimeType.includes("mp4")) {
        extension = "mp4";
      } else if (mimeType.includes("webm")) {
        extension = "webm";
      }

      const link = document.createElement("a");
      link.href = preRenderedVideo.url;
      link.download = `${currentEditName || "video"}_prerender.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Function to stop pre-rendering
  const stopPreRendering = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    setIsPreRendering(false);
    setPreRenderProgress(0);
    setIsPlaying(false); // Stop playback
    // Pause all media when stopping pre-render
    pauseAllMedia();
  };

  const handleNewProject = () => {
    // Stop playback first
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Clean up all audio references
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    audioRefs.current = {};

    // Clear current project state with history
    updateTimelineWithHistory([]);
    setCurrentTime(0);
    setSelectedElement(null);
    setCurrentEditName("");
    setCurrentEditId(null);
    setMasterVolume(1);
  };

  // Modal handlers
  const handleSaveEdit = (editData) => {
    // This will be called from the save modal
    setCurrentEditName(editData.name);
    if (editData.id) {
      setCurrentEditId(editData.id);
    }
    setShowSaveModal(false);
  };

  const handleLoadEdit = (editData) => {
    // This will be called from the load modal

    // Load the timeline from edition_array
    if (editData.edition_array) {
      try {
        const timelineData =
          typeof editData.edition_array === "string"
            ? JSON.parse(editData.edition_array)
            : editData.edition_array;

        if (timelineData.timeline) {
          setArrayVideoMake(timelineData.timeline);
          // Reset history after loading
          setHistory([JSON.parse(JSON.stringify(timelineData.timeline))]);
          setHistoryIndex(0);
        }

        // Load settings if available
        if (timelineData.settings) {
          if (timelineData.settings.masterVolume !== undefined) {
            setMasterVolume(timelineData.settings.masterVolume);
          }
          if (timelineData.settings.currentTime !== undefined) {
            setCurrentTime(timelineData.settings.currentTime);
          }
        }
      } catch (error) {
        console.error("Error parsing edition_array:", error);
      }
    }

    setCurrentEditName(editData.name);
    setCurrentEditId(editData.id);
    setShowLoadModal(false);
  };

  const handleExportEdit = (projectId) => {
    setShowExportModal(false);
  };

  // Sync selected element with changes in the array
  useEffect(() => {
    if (selectedElement) {
      const updatedElement = arrayVideoMake.find(
        (item) => item.id === selectedElement.id
      );
      if (updatedElement) {
        setSelectedElement(updatedElement);
      } else {
        // El elemento fue eliminado
        setSelectedElement(null);
      }
    }
  }, [arrayVideoMake]);

  // Forzar actualización de efectos cuando se cambia un elemento seleccionado
  useEffect(() => {
    if (selectedElement && selectedElement.type === "video" && isPlaying) {
      // Forzar re-sincronización para aplicar efectos inmediatamente
      syncMediaWithTime(currentTime);
    }
  }, [selectedElement?.colorCorrection, selectedElement?.volume]);

  // Functions for image drag and drop upload
  const handleImageContainerDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleImageContainerDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      alert("Por favor, solo suelta archivos de imagen");
      return;
    }

    setIsUploadingImages(true);
    try {
      const newImages = await handleImageDrop(imageFiles);
      setImages((prevImages) => [...prevImages, ...newImages]);
    } catch (error) {
      alert("Error al subir las imágenes. Por favor, intenta nuevamente.");
    } finally {
      setIsUploadingImages(false);
    }
  };

  // Music drag-over and drop handlers (reuse image drag-over to show copy cursor)
  const handleMusicContainerDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleMusicContainerDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter((file) => file.type.startsWith("audio/"));

    if (audioFiles.length === 0) {
      alert("Por favor, suelta archivos de audio válidos");
      return;
    }

    setIsUploadingMusic(true);
    try {
      const newMusic = await handleAudioDrop(audioFiles, "music");
      setMusicList((prev) => [...prev, ...newMusic]);
    } catch (error) {
      alert("Error al subir música. Intenta nuevamente.");
    } finally {
      setIsUploadingMusic(false);
    }
  };

  const handleMusicInputChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploadingMusic(true);
    try {
      const newMusic = await handleAudioDrop(files, "music");
      setMusicList((prev) => [...prev, ...newMusic]);
    } catch (error) {
      alert("Error al subir música. Intenta nuevamente.");
    } finally {
      setIsUploadingMusic(false);
      e.target.value = "";
    }
  };

  // Sound drag-over and drop handlers
  const handleSoundContainerDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleSoundContainerDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter((file) => file.type.startsWith("audio/"));

    if (audioFiles.length === 0) {
      alert("Por favor, suelta archivos de audio válidos");
      return;
    }

    setIsUploadingSound(true);
    try {
      const newSound = await handleAudioDrop(audioFiles, "sound");
      setSoundList((prev) => [...prev, ...newSound]);
    } catch (error) {
      alert("Error al subir sounds. Intenta nuevamente.");
    } finally {
      setIsUploadingSound(false);
    }
  };

  // Delete music
  const handleDeleteMusicClick = (e, music) => {
    e.stopPropagation();
    e.preventDefault();
    setMusicToDelete(music);
    setShowDeleteMusicModal(true);
  };

  // Helper function to remove elements from timeline when library item is deleted
  const removeElementsFromTimeline = (deletedElement) => {
    const {
      id,
      url,
      video_url,
      audio_url,
      music_url,
      voice_url,
      image_url,
      name,
      title,
    } = deletedElement;

    // Create a list of possible URLs that could match this element
    const possibleUrls = [
      url,
      video_url,
      audio_url,
      music_url,
      voice_url,
      image_url,
    ].filter(Boolean);

    // Also create possible names for additional matching
    const possibleNames = [name, title].filter(Boolean);

    setArrayVideoMake((prevTimeline) => {
      const filteredTimeline = prevTimeline.filter((timelineElement) => {
        // Remove by originalId match (most reliable, for new elements)
        if (timelineElement.originalId && timelineElement.originalId === id) {
          console.log(`🗑️ Removing timeline element with originalId: ${id}`);
          return false;
        }

        // Fallback: Remove by URL match (for all elements)
        const timelineUrl = timelineElement.url;
        if (timelineUrl && possibleUrls.includes(timelineUrl)) {
          console.log(
            `🗑️ Removing timeline element with matching URL: ${timelineUrl}`
          );
          return false;
        }

        // Additional fallback: Remove by title/name match (for older elements)
        const timelineTitle = timelineElement.title;
        if (timelineTitle && possibleNames.includes(timelineTitle)) {
          console.log(
            `🗑️ Removing timeline element with matching title: ${timelineTitle}`
          );
          return false;
        }

        return true;
      });

      const removedCount = prevTimeline.length - filteredTimeline.length;
      if (removedCount > 0) {
        console.log(
          `🗑️ Removed ${removedCount} timeline element(s) after deleting library item: ${id}`
        );
      }
      return filteredTimeline;
    });
  };

  const handleConfirmDeleteMusic = async () => {
    if (!musicToDelete) return;
    setIsDeletingMusic(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}editor/destroy-music`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify({ id: musicToDelete.id }),
        }
      );
      const data = await response.json();
      if (response.ok && data.code === 200) {
        // Remove from library
        setMusicList((prev) => prev.filter((m) => m.id !== musicToDelete.id));
        // Remove from timeline
        removeElementsFromTimeline(musicToDelete);
        setShowDeleteMusicModal(false);
        setMusicToDelete(null);
      } else {
        alert(data.message || "No se pudo eliminar la música");
      }
    } catch (err) {
      alert("Error al eliminar música");
    } finally {
      setIsDeletingMusic(false);
    }
  };

  const handleCloseDeleteMusicModal = () => {
    if (!isDeletingMusic) {
      setShowDeleteMusicModal(false);
      setMusicToDelete(null);
    }
  };

  // Voice drag-over and drop handlers
  const handleVoiceContainerDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleVoiceContainerDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter((file) => file.type.startsWith("audio/"));

    if (audioFiles.length === 0) {
      alert("Por favor, suelta archivos de audio válidos");
      return;
    }

    setIsUploadingVoice(true);
    try {
      const newVoice = await handleAudioDrop(audioFiles, "voice");
      setVoiceList((prev) => {
        // Find or create General group
        const existingGroups = Array.isArray(prev) ? prev : [];
        const generalGroupIndex = existingGroups.findIndex(
          (group) => group.type === "general"
        );

        if (generalGroupIndex !== -1) {
          // Update existing General group
          const updatedGroups = [...existingGroups];
          updatedGroups[generalGroupIndex] = {
            ...updatedGroups[generalGroupIndex],
            voices: [...updatedGroups[generalGroupIndex].voices, ...newVoice],
          };
          return updatedGroups;
        } else {
          // Create new General group
          return [
            ...existingGroups,
            {
              id: "general_voices",
              name: "General",
              type: "general",
              voices: newVoice,
            },
          ];
        }
      });
    } catch (error) {
      alert("Error al subir voz. Intenta nuevamente.");
    } finally {
      setIsUploadingVoice(false);
    }
  };

  const handleVoiceInputChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploadingVoice(true);
    try {
      const newVoice = await handleAudioDrop(files, "voice");
      setVoiceList((prev) => {
        // Find or create General group
        const existingGroups = Array.isArray(prev) ? prev : [];
        const generalGroupIndex = existingGroups.findIndex(
          (group) => group.type === "general"
        );

        if (generalGroupIndex !== -1) {
          // Update existing General group
          const updatedGroups = [...existingGroups];
          updatedGroups[generalGroupIndex] = {
            ...updatedGroups[generalGroupIndex],
            voices: [...updatedGroups[generalGroupIndex].voices, ...newVoice],
          };
          return updatedGroups;
        } else {
          // Create new General group
          return [
            ...existingGroups,
            {
              id: "general_voices",
              name: "General",
              type: "general",
              voices: newVoice,
            },
          ];
        }
      });
    } catch (error) {
      alert("Error al subir voz. Intenta nuevamente.");
    } finally {
      setIsUploadingVoice(false);
      e.target.value = "";
    }
  };

  // Delete voice
  const handleDeleteVoiceClick = (e, voice) => {
    e.stopPropagation();
    e.preventDefault();
    setVoiceToDelete(voice);
    setShowDeleteVoiceModal(true);
  };

  const handleConfirmDeleteVoice = async () => {
    if (!voiceToDelete) return;
    setIsDeletingVoice(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}editor/destroy-voice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify({ id: voiceToDelete.id }),
        }
      );
      const data = await response.json();
      if (response.ok && data.code === 200) {
        // Remove from library
        setVoiceList((prev) => {
          return prev
            .map((group) => ({
              ...group,
              voices: group.voices.filter(
                (voice) => voice.id !== voiceToDelete.id
              ),
            }))
            .filter((group) => group.voices.length > 0); // Remove empty groups
        });
        // Remove from timeline
        removeElementsFromTimeline(voiceToDelete);
        setShowDeleteVoiceModal(false);
        setVoiceToDelete(null);
      } else {
        alert(data.message || "No se pudo eliminar la voz");
      }
    } catch (err) {
      alert("Error al eliminar voz");
    } finally {
      setIsDeletingVoice(false);
    }
  };

  const handleCloseDeleteVoiceModal = () => {
    if (!isDeletingVoice) {
      setShowDeleteVoiceModal(false);
      setVoiceToDelete(null);
    }
  };

  // Sound upload and deletion functions
  const handleSoundInputChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploadingSound(true);
    try {
      const audioFiles = files.filter(
        (file) =>
          file.type.startsWith("audio/") ||
          file.name.toLowerCase().match(/\.(mp3|wav|ogg|m4a|aac)$/)
      );

      const newSound = await handleAudioDrop(audioFiles, "sound");
      setSoundList((prev) => [...prev, ...newSound]);
    } catch (error) {
      console.error("Error uploading sound:", error);
      alert("Error uploading sound files");
    } finally {
      setIsUploadingSound(false);
    }
  };

  const handleSoundDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setIsUploadingSound(true);
    try {
      const newSound = await handleAudioDrop(files, "sound");
      setSoundList((prev) => [...prev, ...newSound]);
    } catch (error) {
      console.error("Error uploading sound:", error);
      alert("Error uploading sound files");
    } finally {
      setIsUploadingSound(false);
    }
  };

  const handleDeleteSoundClick = (e, sound) => {
    e.stopPropagation();
    setSoundToDelete(sound);
    setShowDeleteSoundModal(true);
  };

  const handleConfirmDeleteSound = async () => {
    if (!soundToDelete) return;
    setIsDeletingSound(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}editor/destroy-sound`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify({ id: soundToDelete.id }),
        }
      );
      const data = await response.json();
      if (response.ok && data.code === 200) {
        // Remove from library
        setSoundList((prev) => prev.filter((s) => s.id !== soundToDelete.id));
        // Remove from timeline
        removeElementsFromTimeline(soundToDelete);
        setShowDeleteSoundModal(false);
        setSoundToDelete(null);
      } else {
        alert(data.message || "No se pudo eliminar el sound");
      }
    } catch (err) {
      alert("Error al eliminar sound");
    } finally {
      setIsDeletingSound(false);
    }
  };

  const handleCloseDeleteSoundModal = () => {
    if (!isDeletingSound) {
      setShowDeleteSoundModal(false);
      setSoundToDelete(null);
    }
  };

  const handleImageInputChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploadingImages(true);
    try {
      const newImages = await handleImageDrop(files);
      setImages((prevImages) => [...prevImages, ...newImages]);
    } catch (error) {
      alert("Error al subir las imágenes. Por favor, intenta nuevamente.");
    } finally {
      setIsUploadingImages(false);
      // Reset input
      e.target.value = "";
    }
  };

  // Functions for image deletion
  const handleDeleteImageClick = (e, image) => {
    e.stopPropagation();
    e.preventDefault();
    setImageToDelete(image);
    setShowDeleteImageModal(true);
  };

  const handleConfirmDeleteImage = async () => {
    if (!imageToDelete) return;

    setIsDeletingImage(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}editor/delete-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify({ id: imageToDelete.id }),
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.code === 200) {
        // Remove from library
        setImages((prevImages) =>
          prevImages.filter((img) => img.id !== imageToDelete.id)
        );
        // Remove from timeline
        removeElementsFromTimeline(imageToDelete);
        setShowDeleteImageModal(false);
        setImageToDelete(null);
      } else {
        console.error("Error deleting image:", responseData);
        alert(
          `Error deleting image: ${responseData.message || "Please try again."}`
        );
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      alert(`Error deleting image: ${error.message || "Please try again."}`);
    } finally {
      setIsDeletingImage(false);
    }
  };

  const handleCloseDeleteImageModal = () => {
    if (!isDeletingImage) {
      setShowDeleteImageModal(false);
      setImageToDelete(null);
    }
  };

  // Functions for editor videos upload and deletion
  const handleEditorVideoInputChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const file = files[0]; // Solo uno por ahora
    if (!file.type.startsWith("video/")) {
      console.error("Invalid file type. Please select a video file.");
      return;
    }

    setIsUploadingEditorVideo(true);
    try {
      // Convert video to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      await new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64Video = reader.result;

            // Get video title (without extension)
            const title = file.name.replace(/\.[^/.]+$/, "");

            // Upload to backend
            const response = await fetch(
              `${import.meta.env.VITE_APP_BACKEND_URL}editor/create-videos`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + Cookies.get("token"),
                },
                body: JSON.stringify({
                  title: title,
                  category_id: "general",
                  base_64_video: base64Video,
                }),
              }
            );

            const data = await response.json();

            if (response.ok && data.code === 200) {
              // Add to list
              setEditorVideosList((prev) => [...prev, data.video]);
              console.log("Video uploaded successfully:", data.video);
              resolve();
            } else {
              console.error("Error uploading video:", data.message);
              reject(new Error(data.message));
            }
          } catch (error) {
            console.error("Error uploading video:", error);
            reject(error);
          }
        };

        reader.onerror = () => {
          console.error("Error reading file");
          reject(new Error("Error reading file"));
        };
      });
    } catch (error) {
      console.error("Error in video upload:", error);
    } finally {
      setIsUploadingEditorVideo(false);
      e.target.value = "";
    }
  };

  const handleDeleteEditorVideoClick = (e, video) => {
    e.stopPropagation();
    e.preventDefault();
    setEditorVideoToDelete(video);
    setShowDeleteEditorVideoModal(true);
  };

  const handleConfirmDeleteEditorVideo = async () => {
    if (!editorVideoToDelete) return;

    setIsDeletingEditorVideo(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}editor/delete-videos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: JSON.stringify({ id: editorVideoToDelete.id }),
        }
      );

      const data = await response.json();

      if (response.ok && data.code === 200) {
        // Remove from library
        setEditorVideosList((prev) =>
          prev.filter((v) => v.id !== editorVideoToDelete.id)
        );
        // Remove from timeline
        removeElementsFromTimeline(editorVideoToDelete);
        setShowDeleteEditorVideoModal(false);
        setEditorVideoToDelete(null);
        console.log("Video deleted successfully");
      } else {
        console.error("Error deleting video:", data.message);
      }
    } catch (error) {
      console.error("Error deleting video:", error);
    } finally {
      setIsDeletingEditorVideo(false);
    }
  };

  const handleCloseDeleteEditorVideoModal = () => {
    if (!isDeletingEditorVideo) {
      setShowDeleteEditorVideoModal(false);
      setEditorVideoToDelete(null);
    }
  };

  // Helper function to get preview container styles based on aspect ratio
  const getPreviewStyles = () => {
    if (aspectRatio === "9:16") {
      // Portrait mode - medidas fijas para 9:16
      const videoWidth = 215; // píxeles fijos
      const videoHeight = 325; // píxeles fijos (ratio 9:16)

      return {
        container: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: `${videoHeight}px`,
        },
        video: {
          width: `${videoWidth}px`,
          height: `${videoHeight}px`,
          aspectRatio: "9/16",
        },
      };
    } else if (aspectRatio === "1:1") {
      // Square mode - medidas fijas para 1:1
      const videoSize = 325; // píxeles fijos (cuadrado)

      return {
        container: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: `${videoSize}px`,
        },
        video: {
          width: `${videoSize}px`,
          height: `${videoSize}px`,
          aspectRatio: "1/1",
        },
      };
    } else {
      // Default 16:9 landscape mode - medidas fijas
      const videoWidth = 635; // píxeles fijos
      const videoHeight = 325; // píxeles fijos (ratio 16:9)

      return {
        container: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: `${videoHeight}px`,
        },
        video: {
          width: `${videoWidth}px`,
          height: `${videoHeight}px`,
          aspectRatio: "16/9",
        },
      };
    }
  };

  const previewStyles = getPreviewStyles();

  // ===== FUNCIÓN PARA EXPORTAR TIMELINE COMPLETO PARA BACKEND =====
  const exportTimelineForFFmpeg = () => {
    const ffmpegData = generateFFmpegTimeline();

    // Agregar información adicional que el backend necesita
    const exportData = {
      ...ffmpegData,
      // Información para compatibilidad con modal de exportación existente
      arrayVideoMake: arrayVideoMake, // Timeline original para compatibilidad
      aspectRatio: aspectRatio,
      duration: getContentEndTime(),
      totalElements: arrayVideoMake.length,
      editName: currentEditName,
      project_id: currentEditId,

      // Timestamp de exportación
      exportedAt: new Date().toISOString(),
    };

    console.log("Complete Timeline for FFmpeg:", exportData);
    return exportData;
  };

  // Hacer la función disponible globalmente para el modal de exportación
  useEffect(() => {
    window.exportTimelineForFFmpeg = exportTimelineForFFmpeg;
    return () => {
      delete window.exportTimelineForFFmpeg;
    };
  }, [arrayVideoMake, projectSettings, currentEditName, currentEditId]);

  return (
    <div className="bg-primarioDark w-full h-[100vh] overflow-scroll scroll-auto">
      {/* Sidebar */}
      <div className="flex">
        {/* Toggle Button - Fixed at sidebar edge */}
        <button
          onClick={() => setIsSidebarVisible(!isSidebarVisible)}
          className={`fixed top-1/2 -translate-y-1/2 z-50 bg-primarioLogo hover:bg-primarioLogo/90 text-white p-1 rounded-r-md transition-all duration-300 shadow-md ${
            isSidebarVisible ? "left-[20%]" : "left-[64px]"
          }`}
          title={isSidebarVisible ? "Ocultar panel" : "Mostrar panel"}
        >
          <ChevronRight
            className={`w-3 h-3 transition-transform duration-300 ${
              isSidebarVisible ? "rotate-180" : ""
            }`}
          />
        </button>

        <div
          className={`overflow-auto scroll-auto h-[100vh] bg-darkboxSub transition-all duration-300 ${
            isSidebarVisible ? "w-1/5" : "w-[64px]"
          }`}
        >
          <div className="bg-darkBox w-full h-full flex">
            {/* Menu Icons - Always Visible */}
            <div className="w-[64px] min-w-[64px]">
              <div
                onClick={() => {
                  setMenuActive(1);
                  setIsSidebarVisible(true);
                }}
                className={
                  menuActive == 1
                    ? "bg-darkBoxSub text-primarioLogo text-center flex items-center justify-center h-16 cursor-pointer"
                    : "text-white text-center flex items-center justify-center h-16 cursor-pointer"
                }
              >
                <ClapperboardIcon />
              </div>
              <div
                onClick={() => {
                  setMenuActive(6);
                  setIsSidebarVisible(true);
                }}
                className={
                  menuActive == 6
                    ? "bg-darkBoxSub text-primarioLogo text-center flex items-center justify-center h-16 cursor-pointer"
                    : "text-white text-center flex items-center justify-center h-16 cursor-pointer"
                }
              >
                <Video />
              </div>
              <div
                onClick={() => {
                  setMenuActive(2);
                  setIsSidebarVisible(true);
                }}
                className={
                  menuActive == 2
                    ? "bg-darkBoxSub text-primarioLogo text-center flex items-center justify-center h-16 cursor-pointer"
                    : "text-white text-center flex items-center justify-center h-16 cursor-pointer"
                }
              >
                <Music />
              </div>
              <div
                onClick={() => {
                  setMenuActive(3);
                  setIsSidebarVisible(true);
                }}
                className={
                  menuActive == 3
                    ? "bg-darkBoxSub text-primarioLogo text-center flex items-center justify-center h-16 cursor-pointer"
                    : "text-white text-center flex items-center justify-center h-16 cursor-pointer"
                }
              >
                <Mic />
              </div>
              <div
                onClick={() => {
                  setMenuActive(4);
                  setIsSidebarVisible(true);
                }}
                className={
                  menuActive == 4
                    ? "bg-darkBoxSub text-primarioLogo text-center flex items-center justify-center h-16 cursor-pointer"
                    : "text-white text-center flex items-center justify-center h-16 cursor-pointer"
                }
              >
                <Headphones />
              </div>
              <div
                onClick={() => {
                  setMenuActive(5);
                  setIsSidebarVisible(true);
                }}
                className={
                  menuActive == 5
                    ? "bg-darkBoxSub text-primarioLogo text-center flex items-center justify-center h-16 cursor-pointer"
                    : "text-white text-center flex items-center justify-center h-16 cursor-pointer"
                }
              >
                <Image />
              </div>
            </div>

            {/* Content Panel - Collapsible */}
            <div
              className={`overflow-none bg-darkBoxSub transition-all duration-300 ${
                isSidebarVisible
                  ? "w-[calc(100%-64px)] opacity-100"
                  : "w-0 opacity-0 overflow-hidden"
              }`}
            >
              {menuActive == 1 ? (
                <div className="p-4 w-full h-full overflow-auto">
                  {projects.length > 0 ? (
                    <div className="space-y-6">
                      {projects.map((project) => (
                        <div key={project.id} className="space-y-3">
                          {/* Project Header - collapsible */}
                          <button
                            type="button"
                            onClick={() => toggleProject(project.id)}
                            className="w-full flex items-center justify-between border-b border-gray-600 pb-2 hover:bg-darkBox rounded-md px-2 py-1"
                            title="Toggle project"
                          >
                            <div className="flex items-center gap-2">
                              {expandedProjects[project.id] ? (
                                <ChevronDown
                                  size={16}
                                  className="text-gray-300"
                                />
                              ) : (
                                <ChevronRight
                                  size={16}
                                  className="text-gray-300"
                                />
                              )}
                              <h3 className="text-white font-medium text-base line-clamp-1 text-left">
                                {project.name}
                              </h3>
                            </div>
                            <p className="text-gray-400 text-xs">
                              {project.scenes?.length || 0}
                            </p>
                          </button>

                          {/* Project Videos Grid */}
                          {expandedProjects[project.id] &&
                          project.scenes &&
                          project.scenes.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                              {project.scenes.map((scene) => (
                                <div
                                  key={scene.id}
                                  draggable
                                  onDragStart={(e) =>
                                    handleDragStart(
                                      e,
                                      {
                                        id: scene.id,
                                        url: scene.video_url,
                                        title: scene.name,
                                        projectName: project.name,
                                      },
                                      "video"
                                    )
                                  }
                                  onClick={() =>
                                    addItemToTimeline(
                                      {
                                        id: scene.id,
                                        url: scene.video_url,
                                        title: scene.name,
                                        projectName: project.name,
                                      },
                                      "video"
                                    )
                                  }
                                  className="bg-darkBox cursor-pointer hover:bg-opacity-80 rounded-2xl transition-all duration-200 hover:scale-105"
                                  onMouseEnter={() => setHoveredScene(scene.id)}
                                  onMouseLeave={() => setHoveredScene(null)}
                                >
                                  <div className="relative">
                                    {/* Video element for hover preview */}
                                    {scene.video_url && (
                                      <video
                                        key={`scene-video-${scene.id}`}
                                        src={scene.video_url}
                                        className={`rounded-t-2xl w-full h-16 object-cover transition-opacity duration-300 ${
                                          sceneVideosLoaded[scene.id]
                                            ? "opacity-100"
                                            : "opacity-0"
                                        }`}
                                        onLoadedMetadata={() =>
                                          setSceneVideosLoaded((prev) => ({
                                            ...prev,
                                            [scene.id]: true,
                                          }))
                                        }
                                        muted
                                        loop
                                        playsInline
                                        preload="metadata"
                                        style={{
                                          display: sceneVideosLoaded[scene.id]
                                            ? "block"
                                            : "none",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.play().catch(() => {});
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.pause();
                                          e.target.currentTime = 0;
                                        }}
                                      />
                                    )}

                                    {/* Fallback image while video loads or if no video */}
                                    {(!sceneVideosLoaded[scene.id] ||
                                      !scene.video_url) && (
                                      <img
                                        src={
                                          scene.image_url ||
                                          scene.prompt_image_url
                                        }
                                        alt={scene.name}
                                        className="rounded-t-2xl w-full h-16 object-cover"
                                      />
                                    )}

                                    {/* Loading indicator */}
                                    {scene.video_url &&
                                      !sceneVideosLoaded[scene.id] && (
                                        <div className="absolute inset-0 bg-darkBoxSub animate-pulse flex items-center justify-center rounded-t-2xl">
                                          <div className="w-4 h-4 border-2 border-gray-600 border-t-primarioLogo rounded-full animate-spin"></div>
                                        </div>
                                      )}
                                  </div>
                                  <div className="pb-4 pt-1 px-3 relative">
                                    <span
                                      className="text-[#E7E7E7] text-xs line-clamp-2 mt-2"
                                      title={scene.name}
                                    >
                                      {scene.name}
                                    </span>
                                    <span className="text-gray-500 text-xs block mt-1">
                                      {project.name}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : expandedProjects[project.id] ? (
                            <div className="text-gray-400 text-sm italic">
                              No scenes available in this project
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-400">
                        <p className="text-lg">No projects available</p>
                        <p className="text-sm mt-2">
                          Create some projects with scenes to start editing
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : menuActive == 2 ? (
                <div
                  className="bg-darkBoxSub p-4 w-full rounded-tr-4xl rounded-br-4xl h-full relative overflow-hidden"
                  onDragOver={handleMusicContainerDragOver}
                  onDrop={handleMusicContainerDrop}
                >
                  {/* Add Music Button - always visible */}
                  <button
                    onClick={() =>
                      (musicList.length > 0
                        ? document.getElementById("music-upload-hidden")
                        : document.getElementById("music-upload")
                      )?.click()
                    }
                    className="absolute top-4 right-4 z-10 p-2 bg-primarioLogo hover:bg-primarioLogo/80 text-white rounded-lg transition-all duration-200 hover:scale-105"
                    title="Add Music"
                    disabled={isUploadingMusic}
                  >
                    <Plus size={20} />
                  </button>

                  {/* Upload area when empty */}
                  {musicList.length === 0 && (
                    <div className="mb-4 border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-primarioLogo transition-colors duration-200">
                      <input
                        type="file"
                        multiple
                        accept="audio/*"
                        onChange={handleMusicInputChange}
                        className="hidden"
                        id="music-upload"
                        disabled={isUploadingMusic}
                      />
                      <label
                        htmlFor="music-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload size={32} className="text-gray-400" />
                        <span className="text-gray-400 text-sm">
                          {isUploadingMusic
                            ? "Uploading music..."
                            : "Drag audio files here or click to select"}
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Hidden input when list exists */}
                  {musicList.length > 0 && (
                    <input
                      type="file"
                      multiple
                      accept="audio/*"
                      onChange={handleMusicInputChange}
                      className="hidden"
                      id="music-upload-hidden"
                      disabled={isUploadingMusic}
                    />
                  )}

                  {/* Music list */}
                  <div className="overflow-y-auto h-full space-y-3 pb-14 mt-11">
                    {musicList.map((music, index) => (
                      <div
                        key={music.id || index}
                        draggable={!isUploadingMusic}
                        onDragStart={(e) => handleDragStart(e, music, "music")}
                        onClick={() => addItemToTimeline(music, "music")}
                        onMouseEnter={() =>
                          setHoveredMusicItem(music.id || index)
                        }
                        onMouseLeave={() => setHoveredMusicItem(null)}
                        className="bg-darkBox h-20 cursor-pointer hover:bg-opacity-80 rounded-2xl p-4 transition-all duration-200 hover:bg-darkBoxSub relative group"
                      >
                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDeleteMusicClick(e, music)}
                          className="absolute top-2 right-2 p-1.5 bg-primarioLogo text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          title="Eliminar música"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>

                        <div className="flex items-center gap-3">
                          <Music size={24} className="text-primarioLogo" />
                          <div className="w-3/4">
                            <div className="w-full line-clamp-1">
                              <span className="text-[#E7E7E7] text-sm font-medium line-clamp-1">
                                {music.name}
                              </span>
                            </div>
                            <span className="text-gray-400 text-xs">
                              {music.duration || 30}s
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {musicList.length === 0 && !isUploadingMusic && (
                      <div className="text-center py-8">
                        <Music
                          size={48}
                          className="text-gray-400 mx-auto mb-2"
                        />
                        <span className="text-gray-400">
                          No music files available
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : menuActive == 3 ? (
                <div
                  className="bg-darkBoxSub p-4 w-full rounded-tr-4xl pb-14 rounded-br-4xl h-full relative overflow-hidden"
                  onDragOver={handleVoiceContainerDragOver}
                  onDrop={handleVoiceContainerDrop}
                >
                  {/* Voice list organized by groups */}
                  <div className="space-y-3 overflow-y-auto h-full">
                    {voiceList.map((group, groupIndex) => (
                      <div key={group.id || groupIndex} className="space-y-2">
                        {/* Group header */}
                        <div
                          className="flex items-center gap-2 cursor-pointer py-2"
                          onClick={() =>
                            setExpandedVoiceGroups((prev) => ({
                              ...prev,
                              [group.id]: !prev[group.id],
                            }))
                          }
                        >
                          {expandedVoiceGroups[group.id] ? (
                            <ChevronDown size={16} className="text-gray-400" />
                          ) : (
                            <ChevronRight size={16} className="text-gray-400" />
                          )}
                          <span className="text-sm font-medium text-white">
                            {group.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({group.voices.length})
                          </span>
                        </div>

                        {/* Group voices */}
                        {expandedVoiceGroups[group.id] && (
                          <div className="ml-6 space-y-2">
                            {group.voices.map((voice, voiceIndex) => (
                              <div
                                key={voice.id || voiceIndex}
                                draggable={!isUploadingVoice}
                                onDragStart={(e) =>
                                  handleDragStart(e, voice, "voice")
                                }
                                onClick={() =>
                                  addItemToTimeline(voice, "voice")
                                }
                                onMouseEnter={() =>
                                  setHoveredVoiceItem(voice.id || voiceIndex)
                                }
                                onMouseLeave={() => setHoveredVoiceItem(null)}
                                className="bg-darkBox h-20 cursor-pointer hover:bg-opacity-80 rounded-2xl p-4 transition-all duration-200 hover:bg-darkBoxSub relative group"
                              >
                                <div className="flex items-center gap-3">
                                  <Mic
                                    size={24}
                                    className="text-primarioLogo"
                                  />
                                  <div className="w-3/4">
                                    <div className="w-full line-clamp-1">
                                      <span className="text-[#E7E7E7] text-sm font-medium block">
                                        {voice.name}
                                      </span>
                                    </div>
                                    <span className="text-gray-400 text-xs">
                                      {voice.duration ||
                                        (audioDurations[voice.url] ?? null) ||
                                        15}
                                      s
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {!hasVoices() && !isUploadingVoice && (
                      <div className="text-center py-8">
                        <Mic size={48} className="text-gray-400 mx-auto mb-2" />
                        <span className="text-gray-400">
                          No voice files available
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : menuActive == 4 ? (
                <div
                  className="bg-darkBoxSub p-4 w-full rounded-tr-4xl rounded-br-4xl h-full relative overflow-hidden"
                  onDragOver={handleSoundContainerDragOver}
                  onDrop={handleSoundContainerDrop}
                >
                  {/* Add Sound Button - always visible */}
                  <button
                    onClick={() => {
                      const input =
                        soundList.length > 0
                          ? document.getElementById("sound-upload-hidden")
                          : document.getElementById("sound-upload");
                      input?.click();
                    }}
                    className="absolute top-4 right-4 z-10 p-2 bg-primarioLogo hover:bg-primarioLogo/80 text-white rounded-lg transition-all duration-200 hover:scale-105"
                    title="Add sound"
                    disabled={isUploadingSound}
                  >
                    <Plus size={20} />
                  </button>

                  {/* Upload area - only show when no sounds */}
                  {soundList.length === 0 && (
                    <div className="mb-4 border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-primarioLogo transition-colors duration-200">
                      <input
                        type="file"
                        multiple
                        accept="audio/*"
                        onChange={handleSoundInputChange}
                        className="hidden"
                        id="sound-upload"
                        disabled={isUploadingSound}
                      />
                      <label
                        htmlFor="sound-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload size={32} className="text-gray-400" />
                        <span className="text-gray-400 text-sm">
                          {isUploadingSound
                            ? "Uploading sounds..."
                            : "Drag sound files here or click to select"}
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Hidden input for drag & drop when sounds exist */}
                  {soundList.length > 0 && (
                    <input
                      type="file"
                      multiple
                      accept="audio/*"
                      onChange={handleSoundInputChange}
                      className="hidden"
                      id="sound-upload-hidden"
                      disabled={isUploadingSound}
                    />
                  )}

                  {/* Sound list */}
                  <div
                    className={`grid mt-11 grid-cols-1 pb-14 gap-4 overflow-y-auto ${
                      soundList.length === 0
                        ? "max-h-[calc(100%-140px)]"
                        : "h-full"
                    }`}
                  >
                    {soundList.map((sound, index) => (
                      <div
                        key={index}
                        draggable={!isUploadingSound}
                        onDragStart={(e) => handleDragStart(e, sound, "sound")}
                        onClick={() => addItemToTimeline(sound, "sound")}
                        onMouseEnter={() =>
                          setHoveredSoundItem(sound.id || index)
                        }
                        onMouseLeave={() => setHoveredSoundItem(null)}
                        className="bg-darkBox h-20 cursor-pointer hover:bg-opacity-80 rounded-2xl p-4 transition-all duration-200 hover:bg-darkBoxSub relative group"
                      >
                        {/* Delete Button - Only visible on hover */}
                        <button
                          onClick={(e) => handleDeleteSoundClick(e, sound)}
                          className="absolute top-2 right-2 p-1.5 bg-primarioLogo text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          title="Delete sound"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>

                        <div className="flex items-center gap-3">
                          <Headphones size={24} className="text-primarioLogo" />
                          <div className="w-3/4">
                            <div className="w-full line-clamp-1">
                              <span className="text-[#E7E7E7] text-sm font-medium block">
                                {sound.name}
                              </span>
                            </div>
                            <span className="text-gray-400 text-xs">
                              {formatDuration(sound.duration || 30)}s
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {soundList.length === 0 && !isUploadingSound && (
                      <div className="text-center py-8">
                        <Headphones
                          size={48}
                          className="text-gray-400 mx-auto mb-2"
                        />
                        <span className="text-gray-400">
                          No sound files available
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : menuActive == 5 ? (
                <div
                  className="bg-darkBoxSub p-4 w-full rounded-tr-4xl rounded-br-4xl h-full relative overflow-hidden"
                  onDragOver={handleImageContainerDragOver}
                  onDrop={handleImageContainerDrop}
                >
                  {/* Add Image Button - always visible */}
                  <button
                    onClick={() => {
                      const input =
                        images.length > 0
                          ? document.getElementById("image-upload-hidden")
                          : document.getElementById("image-upload");
                      input?.click();
                    }}
                    className="absolute top-4 right-4 z-10 p-2 bg-primarioLogo hover:bg-primarioLogo/80 text-white rounded-lg transition-all duration-200 hover:scale-105"
                    title="Add images"
                    disabled={isUploadingImages}
                  >
                    <Plus size={20} />
                  </button>

                  {/* Upload area - only show when no images */}
                  {images.length === 0 && (
                    <div className="mb-4 border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-primarioLogo transition-colors duration-200">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageInputChange}
                        className="hidden"
                        id="image-upload"
                        disabled={isUploadingImages}
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload size={32} className="text-gray-400" />
                        <span className="text-gray-400 text-sm">
                          {isUploadingImages
                            ? "Uploading images..."
                            : "Drag images here or click to select"}
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Hidden input for drag & drop when images exist */}
                  {images.length > 0 && (
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageInputChange}
                      className="hidden"
                      id="image-upload-hidden"
                      disabled={isUploadingImages}
                    />
                  )}

                  {/* Images grid */}
                  <div
                    className={`grid mt-11 grid-cols-1 gap-4 pb-14 overflow-y-auto ${
                      images.length === 0
                        ? "max-h-[calc(100%-140px)]"
                        : "h-full"
                    }`}
                  >
                    {images.map((image, index) => (
                      <div
                        key={index}
                        draggable={!isUploadingImages}
                        onDragStart={(e) => handleDragStart(e, image, "image")}
                        onClick={() => addItemToTimeline(image, "image")}
                        onMouseEnter={() =>
                          setHoveredImageItem(image.id || index)
                        }
                        onMouseLeave={() => setHoveredImageItem(null)}
                        className="bg-darkBox cursor-pointer overflow-x-hidden h-32 hover:bg-opacity-80 rounded-2xl transition-all duration-200 hover:scale-105 relative group"
                      >
                        {/* Delete Button - Only visible on hover */}
                        <button
                          onClick={(e) => handleDeleteImageClick(e, image)}
                          className="absolute top-2 right-2 p-1.5 bg-primarioLogo text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          title="Delete image"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>

                        <img
                          src={image.image_url}
                          className="rounded-t-2xl w-full max-h-18 object-cover"
                          alt={image.name}
                        />
                        <div className="pb-4 pt-1 px-1">
                          <span
                            className="text-[#E7E7E7] text-xs line-clamp-1 mt-2"
                            title={image.name}
                          >
                            {image.name}
                          </span>
                        </div>
                      </div>
                    ))}

                    {images.length === 0 && !isUploadingImages && (
                      <div className="col-span-2 text-center py-8">
                        <span className="text-gray-400">
                          No images available
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : menuActive == 6 ? (
                <div className="bg-darkBoxSub p-4 w-full rounded-tr-4xl rounded-br-4xl h-full relative overflow-hidden">
                  {/* Add Video Button - always visible, top right */}
                  <button
                    onClick={() => {
                      document.getElementById("editor-video-upload")?.click();
                    }}
                    className="absolute top-4 right-4 z-10 p-2 bg-primarioLogo hover:bg-primarioLogo/80 text-white rounded-lg transition-all duration-200 hover:scale-105"
                    title="Add video"
                    disabled={isUploadingEditorVideo}
                  >
                    <Plus size={20} />
                  </button>

                  {/* Hidden input for video upload */}
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleEditorVideoInputChange}
                    className="hidden"
                    id="editor-video-upload"
                    disabled={isUploadingEditorVideo}
                  />

                  {/* Videos grid */}
                  <div className="grid mt-11 grid-cols-1 gap-4 pb-14 overflow-y-auto h-full">
                    {editorVideosList.map((video) => (
                      <div
                        key={video.id}
                        draggable={!isUploadingEditorVideo}
                        onDragStart={(e) => handleDragStart(e, video, "video")}
                        onClick={() => addItemToTimeline(video, "video")}
                        className="bg-darkBox cursor-pointer overflow-hidden h-32 hover:bg-opacity-80 rounded-2xl transition-all duration-200 hover:scale-105 relative group"
                      >
                        {/* Delete Button - Only visible on hover */}
                        <button
                          onClick={(e) =>
                            handleDeleteEditorVideoClick(e, video)
                          }
                          className="absolute top-2 right-2 p-1.5 bg-primarioLogo text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          title="Delete video"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>

                        <video
                          src={video.video_url}
                          className="rounded-t-2xl w-full h-20 object-cover"
                          muted
                          preload="metadata"
                        />
                        <div className="pb-4 pt-1 px-2">
                          <span
                            className="text-[#E7E7E7] text-xs line-clamp-1"
                            title={video.title}
                          >
                            {video.title}
                          </span>
                        </div>
                      </div>
                    ))}

                    {editorVideosList.length === 0 &&
                      !isUploadingEditorVideo && (
                        <div className="text-center py-8">
                          <span className="text-gray-400">
                            No videos available
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              ) : (
                <span>Otros</span>
              )}
            </div>
          </div>
        </div>
        <div
          className={`pl-6 transition-all duration-300 ${
            isSidebarVisible ? "w-4/5" : "w-[calc(100%-64px)]"
          }`}
        >
          <div className="flex justify-between items-center gap-3 mb-2 h-12">
            <img
              src="/logos/logo_reelmotion.webp"
              alt="Reelmotion AI"
              className="h-7 w-auto"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 px-4 py-2 bg-darkBoxSub hover:bg-darkBoxSub text-white rounded-lg transition-all duration-200 montserrat-medium text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Return
              </button>
              {currentEditName && (
                <button
                  onClick={handleNewProject}
                  className="flex items-center gap-2 px-4 py-2 bg-darkBoxSub hover:bg-darkBoxSub text-white rounded-lg transition-all duration-200 montserrat-medium text-sm"
                >
                  <SquarePlusIcon className="w-4 h-4" />
                  New
                </button>
              )}

              <button
                onClick={handleSaveProject}
                className="flex items-center gap-2 px-4 py-2 bg-darkBoxSub hover:bg-darkBoxSub text-white rounded-lg transition-all duration-200 montserrat-medium text-sm"
              >
                <Save className="w-4 h-4" />
                Save
              </button>

              <button
                onClick={handleLoadProject}
                className="flex items-center gap-2 px-4 py-2 bg-darkBoxSub hover:bg-darkBoxSub text-white rounded-lg transition-all duration-200 montserrat-medium text-sm"
              >
                <FolderOpen className="w-4 h-4" />
                Load
              </button>

              <button
                onClick={handleExportVideo}
                className="flex items-center gap-2 px-4 py-2 bg-darkBoxSub hover:bg-darkBoxSub text-white rounded-lg transition-all duration-200 montserrat-medium text-sm"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
          {/* ACTION BAR */}

          <div className="flex gap-1 mt-0 h-[45vh]">
            <div
              ref={previewContainerRef}
              className="w-2/4 rounded-4xl relative overflow-hidden"
              style={previewStyles.container}
            >
              <div
                className="relative rounded-4xl bg-gray-900"
                style={previewStyles.video}
              >
                {/* Video principal - siempre en el DOM */}
                <video
                  ref={mainVideoRef}
                  data-element-id={
                    getActiveElements(currentTime).find(
                      (el) => el.channel === "video"
                    )?.id || "main-video"
                  }
                  className="rounded-4xl bg-gray-900 w-full h-full object-cover absolute inset-0"
                  muted={false}
                  style={{
                    transition: "opacity 0.15s ease-in-out",
                    opacity: 1,
                    zIndex: 2,
                  }}
                />

                {/* Video secundario para transiciones suaves */}
                <video
                  ref={secondaryVideoRef}
                  className="rounded-4xl bg-gray-900 w-full h-full object-cover absolute inset-0"
                  muted={false}
                  style={{
                    transition: "opacity 0.15s ease-in-out",
                    opacity: 0,
                    zIndex: 1,
                    display: "none",
                  }}
                />

                {/* Placeholder cuando no hay videos o cuando no está reproduciendo */}

                <div
                  className="rounded-4xl w-full h-full bg-darkBox flex items-center justify-center absolute inset-0"
                  style={{
                    display:
                      arrayVideoMake.some((item) => item.channel === "video") &&
                      getActiveElements(currentTime).some(
                        (el) => el.channel === "video"
                      )
                        ? "none"
                        : "flex",
                    zIndex: 0,
                  }}
                >
                  <div className="text-center">
                    <ClapperboardIcon
                      size={64}
                      className="text-gray-400 mx-auto mb-4"
                    />
                    <p className="text-gray-500 text-sm mt-2">
                      Your video will appear in this area
                    </p>
                  </div>
                </div>
                {/* Overlay for images and text */}
                {arrayVideoMake
                  .filter(
                    (item) =>
                      item.channel === "image" &&
                      currentTime >= item.startTime &&
                      currentTime < item.endTime
                  )
                  .sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1))
                  .map((item) => {
                    const scale = item.scale || 1;

                    // Convert normalized position (0-1) to CSS positioning
                    // FFmpeg coordinates: (0,0) = top-left, (1,1) = bottom-right
                    const posX = item.position?.x || 0.5;
                    const posY = item.position?.y || 0.5;

                    // Calculate actual position as percentage
                    const leftPercent = posX * 100;
                    const topPercent = posY * 100; // Direct mapping - no inversion needed for FFmpeg compatibility

                    // Apply color correction using FFmpeg-accurate formulas
                    const filters = [];
                    if (item.colorCorrection) {
                      const cc = item.colorCorrection;

                      // Brightness: FFmpeg -1.0 to 1.0 -> CSS brightness()
                      // FFmpeg eq filter uses additive brightness, CSS uses multiplicative
                      if (cc.brightness !== 0) {
                        // Convert FFmpeg additive brightness to CSS multiplicative brightness
                        const cssValue = 1 + cc.brightness * 0.6; // Reduced factor for better match
                        filters.push(`brightness(${Math.max(0.1, cssValue)})`);
                      }

                      // Contrast: FFmpeg 0.0 to 4.0 -> CSS contrast()
                      // FFmpeg eq filter: (input - 0.5) * contrast + 0.5
                      // CSS contrast: input * contrast
                      if (cc.contrast !== 1) {
                        // Convert FFmpeg contrast to CSS contrast
                        let cssContrast;
                        if (cc.contrast < 1) {
                          // For reduced contrast, the difference is more pronounced
                          cssContrast = 0.3 + cc.contrast * 0.7; // Maps 0->0.3, 1->1.0
                        } else {
                          // For increased contrast, closer mapping
                          cssContrast = cc.contrast * 0.85 + 0.15; // Slightly reduce high contrast
                        }
                        filters.push(`contrast(${Math.max(0.1, cssContrast)})`);
                      }

                      // Saturation: FFmpeg 0.0 to 3.0 -> CSS saturate()
                      if (cc.saturation !== 1) {
                        // FFmpeg saturation tends to be more intense than CSS
                        let cssSaturation;
                        if (cc.saturation < 1) {
                          cssSaturation = cc.saturation * 0.85 + 0.15; // Less desaturation
                        } else {
                          cssSaturation = 1 + (cc.saturation - 1) * 0.75; // Reduce oversaturation
                        }
                        filters.push(`saturate(${Math.max(0, cssSaturation)})`);
                      }

                      // Gamma: No direct CSS equivalent, approximate with brightness
                      if (cc.gamma !== 1) {
                        // Improved gamma approximation
                        const gammaEffect = Math.pow(0.5, 1 / cc.gamma) * 2;
                        const adjustedGamma = 1 + (gammaEffect - 1) * 0.7; // Reduce intensity
                        filters.push(
                          `brightness(${Math.max(0.1, adjustedGamma)})`
                        );
                      }

                      // Hue: FFmpeg -180 to 180 -> CSS hue-rotate()
                      if (cc.hue !== 0) {
                        filters.push(`hue-rotate(${cc.hue}deg)`);
                      }

                      // Vibrance: More conservative approximation
                      if (cc.vibrance !== 0) {
                        // Even more conservative vibrance to avoid over-saturation
                        const vibranceEffect = 1 + cc.vibrance * 0.2;
                        filters.push(
                          `saturate(${Math.max(0, vibranceEffect)})`
                        );
                      }
                    }

                    return (
                      <div
                        key={item.id}
                        className={`absolute rounded-0 overflow-visible pointer-events-none group ${
                          selectedElement?.id === item.id && !isPlaying
                            ? "ring-2 ring-primarioLogo ring-opacity-80"
                            : ""
                        }`}
                        style={{
                          zIndex: (item.zIndex || 1) + 10,
                          left: `${leftPercent}%`,
                          top: `${topPercent}%`,
                          width: `${scale * 100}%`,
                          height: `${scale * 100}%`,
                          transform: `translate(-50%, -50%)`, // Center the image on the position
                        }}
                      >
                        <img
                          data-element-id={item.id}
                          src={item.url}
                          alt={item.title}
                          className="cursor-move rounded-0"
                          style={{
                            opacity: item.opacity || 1,
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            pointerEvents: "auto",
                            filter:
                              filters.length > 0 ? filters.join(" ") : "none",
                            backgroundColor: "transparent", // Ensure transparent background for PNGs
                          }}
                          onMouseDown={(e) => handleImageDragStart(e, item)}
                          onClick={(e) => handleSelectElement(item, e)}
                        />

                        {/* Resize handles - only show when selected and not playing */}
                        {selectedElement?.id === item.id && !isPlaying && (
                          <>
                            {/* Top-left corner */}
                            <div
                              className="absolute w-3 h-3 bg-primarioLogo border border-white rounded-full cursor-nw-resize pointer-events-auto"
                              style={{ top: "-6px", left: "-6px" }}
                              onMouseDown={(e) =>
                                handleImageResizeStart(e, item, "top-left")
                              }
                            />
                            {/* Top-right corner */}
                            <div
                              className="absolute w-3 h-3 bg-primarioLogo border border-white rounded-full cursor-ne-resize pointer-events-auto"
                              style={{ top: "-6px", right: "-6px" }}
                              onMouseDown={(e) =>
                                handleImageResizeStart(e, item, "top-right")
                              }
                            />
                            {/* Bottom-left corner */}
                            <div
                              className="absolute w-3 h-3 bg-primarioLogo border border-white rounded-full cursor-sw-resize pointer-events-auto"
                              style={{ bottom: "-6px", left: "-6px" }}
                              onMouseDown={(e) =>
                                handleImageResizeStart(e, item, "bottom-left")
                              }
                            />
                            {/* Bottom-right corner */}
                            <div
                              className="absolute w-3 h-3 bg-primarioLogo border border-white rounded-full cursor-se-resize pointer-events-auto"
                              style={{ bottom: "-6px", right: "-6px" }}
                              onMouseDown={(e) =>
                                handleImageResizeStart(e, item, "bottom-right")
                              }
                            />
                            {/* Top side */}
                            <div
                              className="absolute w-3 h-3 bg-primarioLogo border border-white rounded-full cursor-n-resize pointer-events-auto"
                              style={{
                                top: "-6px",
                                left: "50%",
                                transform: "translateX(-50%)",
                              }}
                              onMouseDown={(e) =>
                                handleImageResizeStart(e, item, "top")
                              }
                            />
                            {/* Bottom side */}
                            <div
                              className="absolute w-3 h-3 bg-primarioLogo border border-white rounded-full cursor-s-resize pointer-events-auto"
                              style={{
                                bottom: "-6px",
                                left: "50%",
                                transform: "translateX(-50%)",
                              }}
                              onMouseDown={(e) =>
                                handleImageResizeStart(e, item, "bottom")
                              }
                            />
                            {/* Left side */}
                            <div
                              className="absolute w-3 h-3 bg-primarioLogo border border-white rounded-full cursor-w-resize pointer-events-auto"
                              style={{
                                left: "-6px",
                                top: "50%",
                                transform: "translateY(-50%)",
                              }}
                              onMouseDown={(e) =>
                                handleImageResizeStart(e, item, "left")
                              }
                            />
                            {/* Right side */}
                            <div
                              className="absolute w-3 h-3 bg-primarioLogo border border-white rounded-full cursor-e-resize pointer-events-auto"
                              style={{
                                right: "-6px",
                                top: "50%",
                                transform: "translateY(-50%)",
                              }}
                              onMouseDown={(e) =>
                                handleImageResizeStart(e, item, "right")
                              }
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
            <div className="w-1/4 bg-darkBox rounded-4xl p-6 overflow-y-scroll">
              <div className="text-white mb-4">
                <h3
                  className="text-lg font-medium mb-2 line-clamp-1"
                  title={
                    selectedElement && selectedElement.type === "image"
                      ? `Edit Image: ${selectedElement.title}`
                      : selectedElement && selectedElement.type === "video"
                      ? `Edit Video: ${selectedElement.title}`
                      : selectedElement && selectedElement.type === "music"
                      ? `Edit Music: ${selectedElement.title}`
                      : selectedElement && selectedElement.type === "voice"
                      ? `Edit Voice: ${selectedElement.title}`
                      : "Editor Controls"
                  }
                >
                  {selectedElement && selectedElement.type === "image"
                    ? `Edit Image: ${selectedElement.title}`
                    : selectedElement && selectedElement.type === "video"
                    ? `Edit Video: ${selectedElement.title}`
                    : selectedElement && selectedElement.type === "music"
                    ? `Edit Music: ${selectedElement.title}`
                    : selectedElement && selectedElement.type === "voice"
                    ? `Edit Voice: ${selectedElement.title}`
                    : "Editor Controls"}
                </h3>

                {selectedElement && selectedElement.type === "video" ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-300 mb-4">
                      <p>
                        Duration: {formatDuration(selectedElement.duration)}s
                      </p>
                      <p className="text-xs mt-1">Click again to deselect</p>
                    </div>

                    {/* Volume Control for Videos */}
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-2">
                        Volume:{" "}
                        {Math.round(
                          (selectedElement.volume !== undefined
                            ? selectedElement.volume
                            : 1) * 100
                        )}
                        %
                      </label>
                      <CustomSlider
                        value={Math.round(
                          (selectedElement.volume !== undefined
                            ? selectedElement.volume
                            : 1) * 100
                        )}
                        min={0}
                        max={100}
                        step={1}
                        onChange={(e) =>
                          updateSelectedElement(
                            "volume",
                            parseInt(e.target.value) / 100
                          )
                        }
                      />
                    </div>

                    {/* FFmpeg Compatible Color Correction */}
                    <div className="border-t border-gray-600 pt-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">
                        Color Correction (FFmpeg Compatible)
                      </h4>

                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-2">
                          Brightness:{" "}
                          {(
                            selectedElement.colorCorrection?.brightness || 0
                          ).toFixed(2)}
                        </label>
                        <CustomSlider
                          value={
                            selectedElement.colorCorrection?.brightness || 0
                          }
                          min={-1}
                          max={1}
                          step={0.01}
                          {...handleSliderChange("colorCorrection.brightness")}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-2">
                          Contrast:{" "}
                          {(
                            selectedElement.colorCorrection?.contrast || 1
                          ).toFixed(2)}
                        </label>
                        <CustomSlider
                          value={selectedElement.colorCorrection?.contrast || 1}
                          min={0}
                          max={4}
                          step={0.01}
                          {...handleSliderChange("colorCorrection.contrast")}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-2">
                          Saturation:{" "}
                          {(
                            selectedElement.colorCorrection?.saturation || 1
                          ).toFixed(2)}
                        </label>
                        <CustomSlider
                          value={
                            selectedElement.colorCorrection?.saturation || 1
                          }
                          min={0}
                          max={3}
                          step={0.01}
                          {...handleSliderChange("colorCorrection.saturation")}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-2">
                          Gamma:{" "}
                          {(
                            selectedElement.colorCorrection?.gamma || 1
                          ).toFixed(2)}
                        </label>
                        <CustomSlider
                          value={selectedElement.colorCorrection?.gamma || 1}
                          min={0.1}
                          max={10}
                          step={0.01}
                          {...handleSliderChange("colorCorrection.gamma")}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-2">
                          Hue: {selectedElement.colorCorrection?.hue || 0}°
                        </label>
                        <CustomSlider
                          value={selectedElement.colorCorrection?.hue || 0}
                          min={-180}
                          max={180}
                          step={1}
                          {...handleSliderChange(
                            "colorCorrection.hue",
                            parseInt
                          )}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-2">
                          Vibrance:{" "}
                          {(
                            selectedElement.colorCorrection?.vibrance || 0
                          ).toFixed(2)}
                        </label>
                        <CustomSlider
                          value={selectedElement.colorCorrection?.vibrance || 0}
                          min={-2}
                          max={2}
                          step={0.01}
                          {...handleSliderChange("colorCorrection.vibrance")}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={() => {
                          updateSelectedElement("volume", 1);
                          updateSelectedElement("zIndex", 1);
                          updateSelectedElement(
                            "colorCorrection.brightness",
                            0
                          );
                          updateSelectedElement("colorCorrection.contrast", 1);
                          updateSelectedElement(
                            "colorCorrection.saturation",
                            1
                          );
                          updateSelectedElement("colorCorrection.gamma", 1);
                          updateSelectedElement("colorCorrection.hue", 0);
                          updateSelectedElement("colorCorrection.vibrance", 0);
                        }}
                        className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-500 transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setSelectedElement(null)}
                        className="flex-1 bg-primarioLogo text-black px-3 py-2 rounded-lg text-sm hover:bg-opacity-80 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : selectedElement && selectedElement.type === "image" ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-300 mb-4">
                      <p>
                        Duration: {formatDuration(selectedElement.duration)}s
                      </p>
                      <p className="text-xs mt-1">
                        Click again to deselect. Drag image to reposition.
                      </p>
                    </div>

                    {/* Position Controls - FFmpeg compatible (0-1 normalized) */}
                    <div className="border-b border-gray-600 pb-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">
                        Position
                      </h4>

                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-2">
                          X Position:{" "}
                          {((selectedElement.position?.x || 0.5) * 100).toFixed(
                            1
                          )}
                          %
                        </label>
                        <CustomSlider
                          value={selectedElement.position?.x || 0.5}
                          min={0}
                          max={1}
                          step={0.01}
                          onChange={(e) =>
                            updateSelectedElement("position", {
                              ...selectedElement.position,
                              x: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-2">
                          Y Position:{" "}
                          {((selectedElement.position?.y || 0.5) * 100).toFixed(
                            1
                          )}
                          %
                        </label>
                        <CustomSlider
                          value={selectedElement.position?.y || 0.5}
                          min={0}
                          max={1}
                          step={0.01}
                          onChange={(e) =>
                            updateSelectedElement("position", {
                              ...selectedElement.position,
                              y: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Opacity Control */}
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-2">
                        Opacity:{" "}
                        {Math.round((selectedElement.opacity || 1) * 100)}%
                      </label>
                      <CustomSlider
                        value={selectedElement.opacity || 1}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(e) =>
                          updateSelectedElement(
                            "opacity",
                            parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>

                    {/* Size Control */}
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-2">
                        Scale: {((selectedElement.scale || 1) * 100).toFixed(0)}
                        %
                      </label>
                      <CustomSlider
                        value={selectedElement.scale || 1}
                        min={0.1}
                        max={3.0}
                        step={0.1}
                        onChange={(e) =>
                          updateSelectedElement(
                            "scale",
                            parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>

                    {/* FFmpeg Compatible Color Correction */}
                    <div className="border-t border-gray-600 pt-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">
                        Color Correction (FFmpeg Compatible)
                      </h4>

                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-2">
                          Brightness:{" "}
                          {(
                            selectedElement.colorCorrection?.brightness || 0
                          ).toFixed(2)}
                        </label>
                        <CustomSlider
                          value={
                            selectedElement.colorCorrection?.brightness || 0
                          }
                          min={-1}
                          max={1}
                          step={0.01}
                          {...handleSliderChange("colorCorrection.brightness")}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-2">
                          Contrast:{" "}
                          {(
                            selectedElement.colorCorrection?.contrast || 1
                          ).toFixed(2)}
                        </label>
                        <CustomSlider
                          value={selectedElement.colorCorrection?.contrast || 1}
                          min={0}
                          max={4}
                          step={0.01}
                          {...handleSliderChange("colorCorrection.contrast")}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-2">
                          Saturation:{" "}
                          {(
                            selectedElement.colorCorrection?.saturation || 1
                          ).toFixed(2)}
                        </label>
                        <CustomSlider
                          value={
                            selectedElement.colorCorrection?.saturation || 1
                          }
                          min={0}
                          max={3}
                          step={0.01}
                          {...handleSliderChange("colorCorrection.saturation")}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-2">
                          Gamma:{" "}
                          {(
                            selectedElement.colorCorrection?.gamma || 1
                          ).toFixed(2)}
                        </label>
                        <CustomSlider
                          value={selectedElement.colorCorrection?.gamma || 1}
                          min={0.1}
                          max={10}
                          step={0.01}
                          {...handleSliderChange("colorCorrection.gamma")}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-2">
                          Hue: {selectedElement.colorCorrection?.hue || 0}°
                        </label>
                        <CustomSlider
                          value={selectedElement.colorCorrection?.hue || 0}
                          min={-180}
                          max={180}
                          step={1}
                          {...handleSliderChange(
                            "colorCorrection.hue",
                            parseInt
                          )}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-2">
                          Vibrance:{" "}
                          {(
                            selectedElement.colorCorrection?.vibrance || 0
                          ).toFixed(2)}
                        </label>
                        <CustomSlider
                          value={selectedElement.colorCorrection?.vibrance || 0}
                          min={-2}
                          max={2}
                          step={0.01}
                          {...handleSliderChange("colorCorrection.vibrance")}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={() => {
                          updateSelectedElement("opacity", 1);
                          updateSelectedElement("scale", 1);
                          updateSelectedElement("position", { x: 0.5, y: 0.5 });
                          updateSelectedElement("zIndex", 1);
                          updateSelectedElement(
                            "colorCorrection.brightness",
                            0
                          );
                          updateSelectedElement("colorCorrection.contrast", 1);
                          updateSelectedElement(
                            "colorCorrection.saturation",
                            1
                          );
                          updateSelectedElement("colorCorrection.gamma", 1);
                          updateSelectedElement("colorCorrection.hue", 0);
                          updateSelectedElement("colorCorrection.vibrance", 0);
                        }}
                        className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-500 transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setSelectedElement(null)}
                        className="flex-1 bg-primarioLogo text-black px-3 py-2 rounded-lg text-sm hover:bg-opacity-80 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : selectedElement && selectedElement.type === "music" ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-300 mb-4">
                      <p>
                        Duration: {formatDuration(selectedElement.duration)}s
                      </p>
                      {selectedElement.originalDuration && (
                        <p>
                          Original:{" "}
                          {formatDuration(selectedElement.originalDuration)}s
                        </p>
                      )}
                      <p className="text-xs mt-1">Click again to deselect</p>
                    </div>

                    {/* Volume Control for Music */}
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-2">
                        Volume:{" "}
                        {Math.round(
                          (selectedElement.volume !== undefined
                            ? selectedElement.volume
                            : 0.5) * 100
                        )}
                        %
                      </label>
                      <CustomSlider
                        value={Math.round(
                          (selectedElement.volume !== undefined
                            ? selectedElement.volume
                            : 0.5) * 100
                        )}
                        min={0}
                        max={100}
                        step={1}
                        onChange={(e) =>
                          updateSelectedElement(
                            "volume",
                            parseInt(e.target.value) / 100
                          )
                        }
                      />
                    </div>

                    {/* Trim Controls for Music */}
                    <div className="border-t border-gray-600 pt-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">
                        Trim Controls
                      </h4>
                      <div className="text-xs text-gray-400 mb-2">
                        Trim Start:{" "}
                        {(selectedElement.trimStart || 0).toFixed(2)}s
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        Trim End: {(selectedElement.trimEnd || 0).toFixed(2)}s
                      </div>
                      <div className="text-xs text-gray-400">
                        Use the handles on the timeline element to trim
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={() => {
                          updateSelectedElement("volume", 0.5);
                        }}
                        className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-500 transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setSelectedElement(null)}
                        className="flex-1 bg-primarioLogo text-black px-3 py-2 rounded-lg text-sm hover:bg-opacity-80 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : selectedElement && selectedElement.type === "voice" ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-300 mb-4">
                      <p>
                        Duration: {formatDuration(selectedElement.duration)}s
                      </p>
                      {selectedElement.originalDuration && (
                        <p>
                          Original:{" "}
                          {formatDuration(selectedElement.originalDuration)}s
                        </p>
                      )}
                      <p className="text-xs mt-1">Click again to deselect</p>
                    </div>

                    {/* Volume Control for Voice */}
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-2">
                        Volume:{" "}
                        {Math.round(
                          (selectedElement.volume !== undefined
                            ? selectedElement.volume
                            : 0.5) * 100
                        )}
                        %
                      </label>
                      <CustomSlider
                        value={Math.round(
                          (selectedElement.volume !== undefined
                            ? selectedElement.volume
                            : 0.5) * 100
                        )}
                        min={0}
                        max={100}
                        step={1}
                        onChange={(e) =>
                          updateSelectedElement(
                            "volume",
                            parseInt(e.target.value) / 100
                          )
                        }
                      />
                    </div>

                    {/* Trim Controls for Voice */}
                    <div className="border-t border-gray-600 pt-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">
                        Trim Controls
                      </h4>
                      <div className="text-xs text-gray-400 mb-2">
                        Trim Start:{" "}
                        {(selectedElement.trimStart || 0).toFixed(2)}s
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        Trim End: {(selectedElement.trimEnd || 0).toFixed(2)}s
                      </div>
                      <div className="text-xs text-gray-400">
                        Use the handles on the timeline element to trim
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={() => {
                          updateSelectedElement("volume", 0.5);
                        }}
                        className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-500 transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setSelectedElement(null)}
                        className="flex-1 bg-primarioLogo text-black px-3 py-2 rounded-lg text-sm hover:bg-opacity-80 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : selectedElement && selectedElement.type === "sound" ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-300 mb-4">
                      <p>
                        Duration: {formatDuration(selectedElement.duration)}s
                      </p>
                      {selectedElement.originalDuration && (
                        <p>
                          Original:{" "}
                          {formatDuration(selectedElement.originalDuration)}s
                        </p>
                      )}
                      <p className="text-xs mt-1">Click again to deselect</p>
                    </div>

                    {/* Volume Control for Sound */}
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-2">
                        Volume:{" "}
                        {Math.round(
                          (selectedElement.volume !== undefined
                            ? selectedElement.volume
                            : 0.5) * 100
                        )}
                        %
                      </label>
                      <CustomSlider
                        value={Math.round(
                          (selectedElement.volume !== undefined
                            ? selectedElement.volume
                            : 0.5) * 100
                        )}
                        min={0}
                        max={100}
                        step={1}
                        onChange={(e) =>
                          updateSelectedElement(
                            "volume",
                            parseInt(e.target.value) / 100
                          )
                        }
                      />
                    </div>

                    {/* Trim Controls for Sound */}
                    <div className="border-t border-gray-600 pt-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">
                        Trim Controls
                      </h4>
                      <div className="text-xs text-gray-400 mb-2">
                        Trim Start:{" "}
                        {(selectedElement.trimStart || 0).toFixed(2)}s
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        Trim End: {(selectedElement.trimEnd || 0).toFixed(2)}s
                      </div>
                      <div className="text-xs text-gray-400">
                        Use the handles on the timeline element to trim
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={() => {
                          updateSelectedElement("volume", 0.5);
                        }}
                        className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-500 transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setSelectedElement(null)}
                        className="flex-1 bg-primarioLogo text-black px-3 py-2 rounded-lg text-sm hover:bg-opacity-80 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : arrayVideoMake.length === 0 ? (
                  <div className="text-sm text-gray-300 space-y-2">
                    <p>• Drag videos, images, music or voice to the timeline</p>
                    <p>• Use the tabs on the left to navigate</p>
                    <p>• Elements are automatically placed</p>
                  </div>
                ) : (
                  <div className="text-sm text-gray-300 space-y-2">
                    <p>• Drag elements to move them</p>
                    <p>• Drag the edges to trim</p>
                    <p>• Click on the timeline to navigate</p>
                    <p>• Use the master volume control</p>
                    <p>• Click on videos/images to edit them</p>
                    {(isResizing || draggingElement) && (
                      <div className="mt-3 p-2 bg-yellow-500 bg-opacity-20 rounded text-yellow-200">
                        {isResizing && "✂️ Trimming element"}
                        {draggingElement && "📦 Moving element"}
                      </div>
                    )}
                    {selectedElement && (
                      <div className="mt-3 p-2 bg-primarioLogo bg-opacity-20 rounded text-yellow-200">
                        {selectedElement.type === "video" &&
                          `🎬 Video selected: ${
                            selectedElement.title
                          } (Vol: ${Math.round(
                            (selectedElement.volume !== undefined
                              ? selectedElement.volume
                              : 1) * 100
                          )}%)`}
                        {selectedElement.type === "image" &&
                          `🎨 Image selected: ${selectedElement.title}`}
                        {selectedElement.type === "music" &&
                          `🎵 Music selected: ${
                            selectedElement.title
                          } (Vol: ${Math.round(
                            (selectedElement.volume !== undefined
                              ? selectedElement.volume
                              : 0.5) * 100
                          )}%)`}
                        {selectedElement.type === "voice" &&
                          `🎤 Voice selected: ${
                            selectedElement.title
                          } (Vol: ${Math.round(
                            (selectedElement.volume !== undefined
                              ? selectedElement.volume
                              : 0.5) * 100
                          )}%)`}
                        {selectedElement.type === "sound" &&
                          `🔊 Sound selected: ${
                            selectedElement.title
                          } (Vol: ${Math.round(
                            (selectedElement.volume !== undefined
                              ? selectedElement.volume
                              : 0.5) * 100
                          )}%)`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* OPTIONS BAR */}
          <div className="flex justify-between mt-1">
            {/* Timeline Header */}
            <div
              className={
                arrayVideoMake.length > 0
                  ? "flex justify-between items-center gap-8 my-2"
                  : "hidden"
              }
            >
              <div className="flex items-center gap-6">
                {/* Indicador de tiempo actual - más grande y a la izquierda del play */}
                <div className="text-lg text-primarioLogo font-bold min-w-[60px]">
                  {Math.floor(currentTime / 60)}:
                  {String(Math.floor(currentTime) % 60).padStart(2, "0")}
                </div>

                {isPlaying ? (
                  <button
                    className="bg-darkBoxSub p-2 rounded-lg text-white hover:bg-opacity-80"
                    onClick={handlePlayPause}
                  >
                    <Pause size={20} />
                  </button>
                ) : (
                  <button
                    className="bg-darkBoxSub p-2 rounded-lg text-primarioLogo hover:bg-opacity-80"
                    onClick={handlePlayPause}
                  >
                    <Play size={20} />
                  </button>
                )}

                {/* Zoom Controls */}
                <div className="flex items-center gap-3">
                  <button
                    className="bg-darkBoxSub p-2 rounded-lg text-white hover:bg-opacity-80 hover:text-primarioLogo"
                    onClick={handleZoomOut}
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>

                  {/* Zoom Slider */}
                  <div className="flex items-center gap-2">
                    <div
                      ref={zoomSliderRef}
                      className="w-24 h-1 bg-darkBoxSub rounded-full cursor-pointer relative group"
                      onMouseDown={handleZoomSliderMouseDown}
                      onClick={handleZoomSliderClick}
                      title="Adjust zoom level"
                    >
                      {/* Zoom progress bar */}
                      <div
                        className="h-full bg-primarioLogo rounded-full transition-all duration-100"
                        style={{
                          width: `${((timelineZoom - 1) / (3.37 - 1)) * 100}%`,
                        }}
                      ></div>

                      {/* Zoom indicator */}
                      <div
                        className={`absolute top-2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-primarioLogo cursor-grab transition-all duration-100 shadow-lg ${
                          isDraggingZoom
                            ? "scale-125 cursor-grabbing"
                            : "hover:scale-110"
                        }`}
                        style={{
                          left: `${((timelineZoom - 1) / (3.37 - 1)) * 100}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      ></div>

                      {/* Visual indicator on hover */}
                      <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-2 opacity-0 group-hover:opacity-20 bg-primarioLogo rounded-full transition-opacity duration-200"></div>
                    </div>

                    <span className="text-white text-xs min-w-[45px] text-center font-medium">
                      {(timelineZoom * 100).toFixed(0)}%
                    </span>
                  </div>

                  <button
                    className="bg-darkBoxSub p-2 rounded-lg text-white hover:bg-opacity-80 hover:text-primarioLogo"
                    onClick={handleZoomIn}
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>

                {/* Cut Button - Only show when element is selected and playhead is over it */}
                {showCutButton && (
                  <button
                    className="bg-primarioLogo p-2 rounded-lg text-primarioDark hover:bg-opacity-80 animate-pulse"
                    onClick={handleCutElement}
                    title="Cut selected element"
                  >
                    <Scissors size={16} />
                  </button>
                )}
              </div>{" "}
              <div className="flex items-center gap-2 line-clamp-1">
                <Volume2 size={20} className="text-white" />
                <div
                  ref={volumeRef}
                  className="w-20 h-1 bg-darkBoxSub rounded-full cursor-pointer relative group"
                  onMouseDown={handleVolumeMouseDown}
                  onClick={handleVolumeClick}
                >
                  {/* Volume progress bar */}
                  <div
                    className="h-full bg-primarioLogo rounded-full transition-all duration-100"
                    style={{ width: `${masterVolume * 100}%` }}
                  ></div>

                  {/* Volume indicator */}
                  <div
                    className={`absolute top-2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-primarioLogo cursor-grab transition-all duration-100 shadow-lg ${
                      isDraggingVolume
                        ? "scale-125 cursor-grabbing"
                        : "hover:scale-110"
                    }`}
                    style={{
                      left: `${masterVolume * 100}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  ></div>

                  {/* Visual indicator on hover */}
                  <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-2 opacity-0 group-hover:opacity-20 bg-primarioLogo rounded-full transition-opacity duration-200"></div>
                </div>

                {/* Show volume percentage */}
                <span className="text-xs text-gray-400 w-8">
                  {Math.round(masterVolume * 100)}%
                </span>

                {/* Debug: Show number of elements in timeline */}
                <span className="text-xs text-gray-400 ml-4">
                  Elements: {arrayVideoMake.length}
                  {arrayVideoMake.length > 0 && (
                    <span>
                      {" "}
                      | Duration:{" "}
                      {Math.max(
                        ...arrayVideoMake.map((item) => item.endTime),
                        0
                      )}
                      s
                    </span>
                  )}
                  {isResizing && resizingElement && (
                    <span className="text-yellow-400">
                      {" "}
                      | Trimming: {resizingElement.title}
                    </span>
                  )}
                  {draggingElement && (
                    <span className="text-blue-400 line-clamp-1">
                      {" "}
                      | Moving: {draggingElement.title}
                    </span>
                  )}
                </span>
              </div>
            </div>
            <div className="gap-4 flex pb-2 items-center">
              {/* Undo Button */}
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                  canUndo
                    ? "bg-gray-600 text-white hover:bg-gray-500 cursor-pointer"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }`}
                title="Undo (Ctrl+Z)"
              >
                <Undo size={16} />
              </button>

              {/* Aspect Ratio Selector */}
              <div className="flex items-center gap-2">
                <label className="text-white text-sm font-medium">
                  Aspect:
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="bg-darkBox text-white border border-gray-600 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-primarioLogo"
                >
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="1:1">1:1</option>
                </select>
              </div>
            </div>
          </div>
          {/* TIMELINE */}
          <div className="mt-0 relative pb-0">
            {/* Timeline Tracks Container with Scroll */}
            <div
              className="overflow-x-auto overflow-y-hidden pb-1"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#DC569D #2a2a2a",
              }}
              onScroll={(e) => {
                const scrollLeft = e.target.scrollLeft;
                const scrollWidth = e.target.scrollWidth;
                const clientWidth = e.target.clientWidth;
                const maxScroll = scrollWidth - clientWidth;

                if (maxScroll > 0) {
                  const scrollPercentage = scrollLeft / maxScroll;
                  const totalDuration = getTimelineDuration();
                  const visibleDuration = getVisualTimelineDuration();
                  const hiddenDuration = totalDuration - visibleDuration;
                  setTimelineScrollOffset(scrollPercentage * hiddenDuration);
                } else {
                  setTimelineScrollOffset(0);
                }
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  height: 8px;
                }
                div::-webkit-scrollbar-track {
                  background: #2a2a2a;
                  border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb {
                  background: #dc569d;
                  border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background: #b84a85;
                }
              `}</style>
              <div
                ref={timelineContainerRef}
                className="space-y-3 relative mt-6"
                style={{
                  minWidth:
                    visibleDuration < getTimelineDuration()
                      ? `${(getTimelineDuration() / visibleDuration) * 100}%`
                      : "100%",
                }}
                onMouseDown={(e) => {
                  // Si hacemos click en el timeline (pero no en un elemento), permitir drag
                  if (
                    e.target === e.currentTarget ||
                    e.target.closest(".playhead-line")
                  ) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percentage = Math.max(
                      0,
                      Math.min(clickX / rect.width, 1)
                    );

                    // Calculate time considering zoom and scroll offset
                    const visibleDuration = getVisualTimelineDuration();
                    const timeInVisibleArea = percentage * visibleDuration;
                    const newTime = Math.max(
                      0,
                      Math.min(
                        timeInVisibleArea + timelineScrollOffset,
                        getTimelineDuration()
                      )
                    );

                    setCurrentTime(newTime);
                    setIsDraggingTimeline(true);
                  }
                }}
              >
                {/* Línea vertical del playhead sobre todo el timeline */}
                <div
                  className="playhead-line absolute top-0 bottom-0 w-1 bg-primarioLogo cursor-grab z-50"
                  style={{
                    left: `${(() => {
                      const visibleDuration = getVisualTimelineDuration();
                      const timeInVisibleArea =
                        currentTime - timelineScrollOffset;

                      // Si está fuera del área visible, esconder
                      if (
                        timeInVisibleArea < 0 ||
                        timeInVisibleArea > visibleDuration
                      ) {
                        return "-100px";
                      }

                      // Calcular porcentaje exacto (igual que los elementos)
                      const percentage =
                        (timeInVisibleArea / visibleDuration) * 100;
                      return `${percentage}%`;
                    })()}`,
                    transform: "translateX(-50%)",
                    display: getPlayheadPosition() < 0 ? "none" : "block",
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingTimeline(true);
                  }}
                >
                  {/* Icono CaretDown en la parte superior de la línea - DRAGGABLE */}
                  <div
                    className={`absolute -top-1 left-1/2 transform -translate-x-1/2 -translate-y-full cursor-grab transition-all duration-100 ${
                      isDraggingTimeline
                        ? "scale-125 cursor-grabbing"
                        : "hover:scale-110"
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingTimeline(true);
                    }}
                  >
                    <CaretDown
                      size={24}
                      className="text-primarioLogo drop-shadow-lg"
                      strokeWidth={3}
                    />
                  </div>
                </div>

                {/* Video Track */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 bg-darkBoxSub rounded-lg h-12 relative transition-all duration-200 hover:bg-opacity-80"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, "video")}
                  >
                    {/* Icono del canal - solo visible cuando está vacío */}
                    {arrayVideoMake.filter((item) => item.channel === "video")
                      .length === 0 && (
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
                        <Video size={20} className="text-gray-400" />
                      </div>
                    )}

                    {/* Render timeline elements for video channel */}
                    {arrayVideoMake
                      .filter((item) => item.channel === "video")
                      .map((item, index) => {
                        return (
                          <div
                            key={item.id}
                            className={`absolute rounded-md h-10 cursor-move group hover:scale-105 hover:z-10 overflow-hidden ${
                              draggingElement?.id === item.id
                                ? "opacity-50 scale-105 transition-none"
                                : "transition-all duration-200"
                            } ${
                              selectedElement?.id === item.id
                                ? "ring-2 ring-[#DC569D] ring-opacity-80"
                                : ""
                            }`}
                            style={{
                              left: `${getElementPositionPercentage(item)}%`,
                              width: `${getElementWidthPercentage(item)}%`,
                              top: "4px",
                            }}
                            onMouseEnter={() => setHoveredElement(item.id)}
                            onMouseLeave={() => setHoveredElement(null)}
                            onClick={(e) => handleSelectElement(item, e)}
                            onMouseDown={(e) => {
                              // Only start drag if not delete button or handles
                              if (
                                !e.target.closest("button") &&
                                !e.target.classList.contains("resize-handle")
                              ) {
                                handleElementDragStart(e, item);
                              }
                            }}
                          >
                            {/* Video thumbnail */}
                            {item.url ? (
                              <video
                                src={item.url}
                                className="w-full h-full object-cover rounded-md pointer-events-none"
                                muted
                                preload="metadata"
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                className="w-full h-full rounded-md flex items-center justify-center"
                                style={{
                                  backgroundColor: getElementColor(
                                    item.id,
                                    index
                                  ),
                                }}
                              >
                                <span className="text-white text-xs">
                                  Video
                                </span>
                              </div>
                            )}

                            {/* Overlay with text */}
                            <div className="absolute inset-0 bg-black bg-opacity-20 rounded-md flex items-center justify-center pointer-events-none">
                              <span className="text-white text-xs truncate px-2 select-none drop-shadow-lg font-medium">
                                {item.title} ({item.duration}s)
                                {item.channel === "video" && (
                                  <span className="opacity-80">
                                    {" "}
                                    Vol:{" "}
                                    {Math.round(
                                      (item.volume !== undefined
                                        ? item.volume
                                        : 1) * 100
                                    )}
                                    %
                                  </span>
                                )}
                                {item.originalDuration &&
                                  item.originalDuration !== item.duration && (
                                    <span className="opacity-70">
                                      {" "}
                                      - Orig: {item.originalDuration}s
                                    </span>
                                  )}
                              </span>
                            </div>

                            {/* Left resize handle */}
                            <div
                              className="resize-handle absolute left-0 top-0 w-2 h-full bg-white opacity-30 hover:opacity-100 cursor-ew-resize z-30 border-r border-gray-400"
                              onMouseDown={(e) =>
                                handleResizeStart(e, item, "start")
                              }
                              title="Trim start"
                            ></div>

                            {/* Right resize handle */}
                            <div
                              className="resize-handle absolute right-0 top-0 w-2 h-full bg-white opacity-30 hover:opacity-100 cursor-ew-resize z-30 border-l border-gray-400"
                              onMouseDown={(e) =>
                                handleResizeStart(e, item, "end")
                              }
                              title="Trim end"
                            ></div>

                            <span className="text-white text-xs truncate px-2 select-none pointer-events-none">
                              {item.title} ({item.duration}s)
                              {item.channel === "video" && (
                                <span className="opacity-80">
                                  {" "}
                                  Vol:{" "}
                                  {Math.round(
                                    (item.volume !== undefined
                                      ? item.volume
                                      : 1) * 100
                                  )}
                                  %
                                </span>
                              )}
                              {item.originalDuration &&
                                item.originalDuration !== item.duration && (
                                  <span className="opacity-70">
                                    {" "}
                                    - Orig: {item.originalDuration}s
                                  </span>
                                )}
                            </span>

                            {/* Opciones de hover */}
                            {hoveredElement === item.id && !draggingElement && (
                              <div className="absolute -top-2 right-0 flex gap-1 z-10">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteElement(item.id);
                                    setHoveredElement(null);
                                  }}
                                  className="bg-primarioLogo text-white p-1 rounded-md transition-all duration-200 shadow-lg"
                                  title="Eliminar escena"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 bg-darkBoxSub rounded-lg h-8 relative transition-all duration-200 hover:bg-opacity-80"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, "image")}
                  >
                    {/* Icono del canal - solo visible cuando está vacío */}
                    {arrayVideoMake.filter((item) => item.channel === "image")
                      .length === 0 && (
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
                        <Image size={16} className="text-gray-400" />
                      </div>
                    )}

                    {/* Render timeline elements for image/text channel */}
                    {arrayVideoMake
                      .filter((item) => item.channel === "image")
                      .map((item, index) => {
                        return (
                          <div
                            key={item.id}
                            className={`absolute rounded-md h-6 cursor-move group hover:scale-105 hover:z-10 overflow-hidden ${
                              draggingElement?.id === item.id
                                ? "opacity-50 scale-105 transition-none"
                                : "transition-all duration-200"
                            } ${
                              selectedElement?.id === item.id
                                ? "ring-2 ring-[#DC569D] ring-opacity-80"
                                : ""
                            }`}
                            style={{
                              left: `${getElementPositionPercentage(item)}%`,
                              width: `${getElementWidthPercentage(item)}%`,
                              top: "4px",
                            }}
                            onMouseEnter={() => setHoveredElement(item.id)}
                            onMouseLeave={() => setHoveredElement(null)}
                            onClick={(e) => handleSelectElement(item, e)}
                            onMouseDown={(e) => {
                              if (
                                !e.target.closest("button") &&
                                !e.target.classList.contains("resize-handle")
                              ) {
                                handleElementDragStart(e, item);
                              }
                            }}
                          >
                            {/* Image thumbnail */}
                            {item.url ? (
                              <img
                                src={item.url}
                                className="w-full h-full object-cover rounded-md pointer-events-none"
                                alt={item.title}
                              />
                            ) : (
                              <div
                                className="w-full h-full rounded-md flex items-center justify-center"
                                style={{
                                  backgroundColor: getElementColor(
                                    item.id,
                                    index
                                  ),
                                }}
                              >
                                <span className="text-white text-xs">
                                  Image
                                </span>
                              </div>
                            )}

                            {/* Overlay with text */}
                            <div className="absolute inset-0 bg-black bg-opacity-20 rounded-md flex items-center justify-center pointer-events-none">
                              <span className="text-white text-xs truncate px-2 select-none drop-shadow-lg font-medium">
                                {item.title} ({item.duration}s)
                              </span>
                            </div>

                            {/* Manija de redimensionamiento izquierda */}
                            <div
                              className="resize-handle absolute left-0 top-0 w-2 h-full bg-white opacity-30 hover:opacity-100 cursor-ew-resize z-30 border-r border-gray-400"
                              onMouseDown={(e) =>
                                handleResizeStart(e, item, "start")
                              }
                              title="Cambiar inicio"
                            ></div>

                            {/* Manija de redimensionamiento derecha */}
                            <div
                              className="resize-handle absolute right-0 top-0 w-2 h-full bg-white opacity-30 hover:opacity-100 cursor-ew-resize z-30 border-l border-gray-400"
                              onMouseDown={(e) =>
                                handleResizeStart(e, item, "end")
                              }
                              title="Cambiar duración"
                            ></div>

                            {/* Opciones de hover */}
                            {hoveredElement === item.id && !draggingElement && (
                              <div className="absolute -top-2 right-0 flex gap-1 z-20">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteElement(item.id);
                                    setHoveredElement(null);
                                  }}
                                  className="bg-primarioLogo text-white p-1 rounded-md transition-all duration-200 shadow-lg"
                                  title="Eliminar elemento"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Music Track */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 bg-darkBoxSub rounded-lg h-8 relative transition-all duration-200 hover:bg-opacity-80"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, "music")}
                  >
                    {/* Icono del canal - solo visible cuando está vacío */}
                    {arrayVideoMake.filter((item) => item.channel === "music")
                      .length === 0 && (
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
                        <Music size={16} className="text-gray-400" />
                      </div>
                    )}

                    {/* Renderizar elementos del timeline para el canal de música */}
                    {arrayVideoMake
                      .filter((item) => item.channel === "music")
                      .map((item, index) => (
                        <div
                          key={item.id}
                          className={`absolute rounded-md h-6 flex items-center justify-center cursor-move group hover:scale-105 hover:z-10 ${
                            draggingElement?.id === item.id
                              ? "opacity-50 scale-105 transition-none"
                              : "transition-all duration-200"
                          } ${
                            selectedElement?.id === item.id
                              ? "ring-2 ring-[#DC569D] ring-opacity-80"
                              : ""
                          }`}
                          style={{
                            left: `${getElementPositionPercentage(item)}%`,
                            width: `${getElementWidthPercentage(item)}%`,
                            top: "4px",
                            backgroundColor: getElementColor(
                              item.id,
                              index,
                              "music"
                            ),
                          }}
                          onMouseEnter={() => setHoveredElement(item.id)}
                          onMouseLeave={() => setHoveredElement(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectElement(item, e);
                          }}
                          onMouseDown={(e) => {
                            // Only start drag if not clicking on resize handles or buttons
                            if (
                              !e.target.closest("button") &&
                              !e.target.classList.contains("resize-handle")
                            ) {
                              // Don't start drag immediately, wait for mouse move
                              const startDrag = () => {
                                handleElementDragStart(e, item);
                              };
                              // Add a small delay to allow click selection first
                              setTimeout(startDrag, 50);
                            }
                          }}
                        >
                          {/* Manija de redimensionamiento izquierda */}
                          <div
                            className="resize-handle absolute left-0 top-0 w-2 h-full bg-white opacity-30 hover:opacity-100 cursor-ew-resize z-30 border-r border-gray-400"
                            onMouseDown={(e) =>
                              handleResizeStart(e, item, "start")
                            }
                            title="Recortar inicio"
                          ></div>

                          {/* Manija de redimensionamiento derecha */}
                          <div
                            className="resize-handle absolute right-0 top-0 w-2 h-full bg-white opacity-30 hover:opacity-100 cursor-ew-resize z-30 border-l border-gray-400"
                            onMouseDown={(e) =>
                              handleResizeStart(e, item, "end")
                            }
                            title="Recortar final"
                          ></div>

                          <span className="text-white text-xs truncate px-2 select-none pointer-events-none">
                            {item.title} ({item.duration}s)
                          </span>

                          {/* Opciones de hover */}
                          {hoveredElement === item.id && !draggingElement && (
                            <div className="absolute -top-2 right-0 flex gap-1 z-20">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteElement(item.id);
                                  setHoveredElement(null);
                                }}
                                className="bg-primarioLogo text-white p-1 rounded-md transition-all duration-200 shadow-lg"
                                title="Eliminar música"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Voice Track */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 bg-darkBoxSub rounded-lg h-8 relative transition-all duration-200 hover:bg-opacity-80"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, "voice")}
                  >
                    {/* Icono del canal - solo visible cuando está vacío */}
                    {arrayVideoMake.filter((item) => item.channel === "voice")
                      .length === 0 && (
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
                        <Mic size={16} className="text-gray-400" />
                      </div>
                    )}

                    {/* Renderizar elementos del timeline para el canal de voz */}
                    {arrayVideoMake
                      .filter((item) => item.channel === "voice")
                      .map((item, index) => (
                        <div
                          key={item.id}
                          className={`absolute rounded-md h-6 flex items-center justify-center cursor-move group hover:scale-105 hover:z-10 ${
                            draggingElement?.id === item.id
                              ? "opacity-50 scale-105 transition-none"
                              : "transition-all duration-200"
                          } ${
                            selectedElement?.id === item.id
                              ? "ring-2 ring-[#DC569D] ring-opacity-80"
                              : ""
                          }`}
                          style={{
                            left: `${getElementPositionPercentage(item)}%`,
                            width: `${getElementWidthPercentage(item)}%`,
                            top: "4px",
                            backgroundColor: getElementColor(
                              item.id,
                              index,
                              "voice"
                            ),
                          }}
                          onMouseEnter={() => setHoveredElement(item.id)}
                          onMouseLeave={() => setHoveredElement(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectElement(item, e);
                          }}
                          onMouseDown={(e) => {
                            // Only start drag if not clicking on resize handles or buttons
                            if (
                              !e.target.closest("button") &&
                              !e.target.classList.contains("resize-handle")
                            ) {
                              // Don't start drag immediately, wait for mouse move
                              const startDrag = () => {
                                handleElementDragStart(e, item);
                              };
                              // Add a small delay to allow click selection first
                              setTimeout(startDrag, 50);
                            }
                          }}
                        >
                          {/* Manija de redimensionamiento izquierda */}
                          <div
                            className="resize-handle absolute left-0 top-0 w-2 h-full bg-white opacity-30 hover:opacity-100 cursor-ew-resize z-30 border-r border-gray-400"
                            onMouseDown={(e) =>
                              handleResizeStart(e, item, "start")
                            }
                            title="Recortar inicio"
                          ></div>

                          {/* Manija de redimensionamiento derecha */}
                          <div
                            className="resize-handle absolute right-0 top-0 w-2 h-full bg-white opacity-30 hover:opacity-100 cursor-ew-resize z-30 border-l border-gray-400"
                            onMouseDown={(e) =>
                              handleResizeStart(e, item, "end")
                            }
                            title="Recortar final"
                          ></div>

                          <span className="text-white text-xs truncate px-2 select-none pointer-events-none">
                            {item.title} ({item.duration}s)
                          </span>

                          {/* Opciones de hover */}
                          {hoveredElement === item.id && !draggingElement && (
                            <div className="absolute -top-2 right-0 flex gap-1 z-20">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteElement(item.id);
                                  setHoveredElement(null);
                                }}
                                className="bg-primarioLogo text-white p-1 rounded-md transition-all duration-200 shadow-lg"
                                title="Eliminar voz"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Sound Track */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 bg-darkBoxSub rounded-lg h-8 relative transition-all duration-200 hover:bg-opacity-80"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, "sound")}
                  >
                    {/* Icono del canal - solo visible cuando está vacío */}
                    {arrayVideoMake.filter((item) => item.channel === "sound")
                      .length === 0 && (
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
                        <Headphones size={16} className="text-gray-400" />
                      </div>
                    )}

                    {/* Renderizar elementos del timeline para el canal de sonido */}
                    {arrayVideoMake
                      .filter((item) => item.channel === "sound")
                      .map((item, index) => (
                        <div
                          key={item.id}
                          className={`absolute rounded-md h-6 flex items-center justify-center cursor-move group hover:scale-105 hover:z-10 ${
                            draggingElement?.id === item.id
                              ? "opacity-50 scale-105 transition-none"
                              : "transition-all duration-200"
                          } ${
                            selectedElement?.id === item.id
                              ? "ring-2 ring-[#DC569D] ring-opacity-80"
                              : ""
                          }`}
                          style={{
                            left: `${getElementPositionPercentage(item)}%`,
                            width: `${getElementWidthPercentage(item)}%`,
                            top: "4px",
                            backgroundColor: getElementColor(
                              item.id,
                              index,
                              "sound"
                            ),
                          }}
                          onMouseEnter={() => setHoveredElement(item.id)}
                          onMouseLeave={() => setHoveredElement(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectElement(item, e);
                          }}
                          onMouseDown={(e) => {
                            // Only start drag if not clicking on resize handles or buttons
                            if (
                              !e.target.closest("button") &&
                              !e.target.classList.contains("resize-handle")
                            ) {
                              // Don't start drag immediately, wait for mouse move
                              const startDrag = () => {
                                handleElementDragStart(e, item);
                              };
                              // Add a small delay to allow click selection first
                              setTimeout(startDrag, 50);
                            }
                          }}
                        >
                          {/* Manija de redimensionamiento izquierda */}
                          <div
                            className="resize-handle absolute left-0 top-0 w-2 h-full bg-white opacity-30 hover:opacity-100 cursor-ew-resize z-30 border-r border-gray-400"
                            onMouseDown={(e) =>
                              handleResizeStart(e, item, "start")
                            }
                            title="Recortar inicio"
                          ></div>

                          {/* Manija de redimensionamiento derecha */}
                          <div
                            className="resize-handle absolute right-0 top-0 w-2 h-full bg-white opacity-30 hover:opacity-100 cursor-ew-resize z-30 border-l border-gray-400"
                            onMouseDown={(e) =>
                              handleResizeStart(e, item, "end")
                            }
                            title="Recortar final"
                          ></div>

                          <span className="text-white text-xs truncate px-2 select-none pointer-events-none">
                            {item.title} ({item.duration}s)
                          </span>

                          {/* Opciones de hover */}
                          {hoveredElement === item.id && !draggingElement && (
                            <div className="absolute -top-2 right-0 flex gap-1 z-20">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteElement(item.id);
                                  setHoveredElement(null);
                                }}
                                className="bg-primarioLogo text-white p-1 rounded-md transition-all duration-200 shadow-lg"
                                title="Eliminar sonido"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Timeline Ruler */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    {/* Time markers ARRIBA del timeline */}
                    <div
                      className="relative text-xs text-gray-400 mb-2"
                      style={{ height: "16px" }}
                    >
                      {getTimeMarkers().map((marker, index) => (
                        <span
                          key={index}
                          className="absolute whitespace-nowrap"
                          style={{
                            left: `${marker.position}%`,
                            transform: "translateX(-50%)",
                          }}
                        >
                          {marker.text}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSaveModal && (
        <ModalSaveEdit
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSaved={handleSaveEdit}
          arrayVideoMake={arrayVideoMake}
          masterVolume={masterVolume}
          currentTime={currentTime}
          currentEditId={currentEditId}
          currentEditName={currentEditName}
        />
      )}

      {showLoadModal && (
        <ModalLoadEdit
          isOpen={showLoadModal}
          onClose={() => setShowLoadModal(false)}
          onLoad={handleLoadEdit}
        />
      )}

      {showExportModal && (
        <ModalExportEdit
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExportEdit}
          arrayVideoMake={arrayVideoMake}
          timelineFFmpeg={exportTimelineForFFmpeg()}
          editName={currentEditName}
          editId={currentEditId}
          // Pre-rendering props
          isPreRendering={isPreRendering}
          preRenderProgress={preRenderProgress}
          preRenderedVideo={preRenderedVideo}
          onPreRender={handlePreRender}
          onStopPreRender={stopPreRendering}
          onDownloadPreRender={downloadPreRenderedVideo}
        />
      )}

      {/* Delete Image Confirmation Modal */}
      <ModalConfirmDelete
        isOpen={showDeleteImageModal}
        onClose={handleCloseDeleteImageModal}
        onConfirm={handleConfirmDeleteImage}
        title="Delete Image"
        message="Are you sure you want to delete this image?"
        itemName={imageToDelete?.name}
        isLoading={isDeletingImage}
      />

      {/* Delete Music Confirmation Modal */}
      <ModalConfirmDelete
        isOpen={showDeleteMusicModal}
        onClose={handleCloseDeleteMusicModal}
        onConfirm={handleConfirmDeleteMusic}
        title="Delete Music"
        message="Are you sure you want to delete this music file?"
        itemName={musicToDelete?.name}
        isLoading={isDeletingMusic}
      />

      {/* Delete Voice Confirmation Modal */}
      <ModalConfirmDelete
        isOpen={showDeleteVoiceModal}
        onClose={handleCloseDeleteVoiceModal}
        onConfirm={handleConfirmDeleteVoice}
        title="Delete Voice"
        message="Are you sure you want to delete this voice file?"
        itemName={voiceToDelete?.name}
        isLoading={isDeletingVoice}
      />

      {/* Delete Sound Confirmation Modal */}
      <ModalConfirmDelete
        isOpen={showDeleteSoundModal}
        onClose={handleCloseDeleteSoundModal}
        onConfirm={handleConfirmDeleteSound}
        title="Delete Sound"
        message="Are you sure you want to delete this sound file?"
        itemName={soundToDelete?.name}
        isLoading={isDeletingSound}
      />

      {/* Delete Editor Video Confirmation Modal */}
      <ModalConfirmDelete
        isOpen={showDeleteEditorVideoModal}
        onClose={handleCloseDeleteEditorVideoModal}
        onConfirm={handleConfirmDeleteEditorVideo}
        title="Delete Video"
        message="Are you sure you want to delete this video?"
        itemName={editorVideoToDelete?.title}
        isLoading={isDeletingEditorVideo}
      />
    </div>
  );
}

export default Editor;
