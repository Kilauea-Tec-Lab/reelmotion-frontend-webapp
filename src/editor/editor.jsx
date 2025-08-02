import { div, span } from "framer-motion/client";
import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { useLoaderData } from "react-router-dom";
import Cookies from "js-cookie";
import ModalSaveEdit from "./components/modal-save-edit";
import ModalLoadEdit from "./components/modal-load-edit";
import ModalExportEdit from "./components/modal-export-edit";
import ModalConfirmDelete from "./components/modal-confirm-delete";
import { handleImageDrop } from "./functions";

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
  const audioRefs = useRef({});
  const imageRefs = useRef({});
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const timelineRef = useRef(null);
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

  // States for modals
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentEditName, setCurrentEditName] = useState("");
  const [currentEditId, setCurrentEditId] = useState(null); // Track current edit ID

  // States for image dragging in preview area
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [draggingImageElement, setDraggingImageElement] = useState(null);
  const [imageDragStart, setImageDragStart] = useState({ x: 0, y: 0 });

  // States for image upload
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [images, setImages] = useState(data?.images || []);
  const [showDeleteImageModal, setShowDeleteImageModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  const musicFiles = [
    {
      url: "/test/sample_music.mp3", // Placeholder - replace with actual music files
      name: "Sample Music Track",
      duration: 120, // default duration for music
    },
  ];

  const voiceFiles = [
    {
      url: "/test/sample_voice.wav", // Placeholder - replace with actual voice files
      name: "Sample Voice Track",
      duration: 60, // default duration for voice
    },
  ];

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

  // Functions for drag and drop
  const handleDragStart = (e, item, type = "video") => {
    // Debug: log the item to see its structure
    console.log("Dragging item:", item, "Type:", type);

    // Normalize the item to ensure it has a 'url' property
    const normalizedItem = {
      ...item,
      type,
      url: item.url || item.image_url, // Ensure url property exists
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

  // Function to handle when video metadata is loaded
  const handleVideoMetadata = async (videoUrl, videoElement) => {
    const duration = formatDuration(videoElement.duration);
    setVideoDurations((prev) => ({
      ...prev,
      [videoUrl]: duration,
    }));
  };

  // Calculate total timeline duration
  const getTimelineDuration = () => {
    if (arrayVideoMake.length === 0) return 120; // default 2 minutes

    const endTimes = arrayVideoMake.map((item) => item.endTime);
    const maxEndTime = endTimes.length > 0 ? Math.max(...endTimes) : 0;
    return Math.max(maxEndTime, 120); // minimum 2 minutes
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

  // Function to play/pause
  const handlePlayPause = () => {
    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Pause all media
      if (mainVideoRef.current) {
        mainVideoRef.current.pause();
      }

      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) audio.pause();
      });
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

            // If we reach the end, stop
            if (newTime >= getTimelineDuration()) {
              setIsPlaying(false);
              clearInterval(intervalRef.current);
              intervalRef.current = null;
              return 0; // reset
            }

            return newTime;
          });
        }
      }, 200); // change to 200ms
    }
  };

  // Function to synchronize all media with current time
  const syncMediaWithTime = (time) => {
    const activeElements = getActiveElements(time);
    const activeVideo = activeElements.find((el) => el.channel === "video");

    // Handle main video
    if (mainVideoRef.current) {
      if (activeVideo) {
        const elementTime = time - activeVideo.startTime;
        // Adjust for start trim
        const adjustedTime = elementTime + (activeVideo.trimStart || 0);

        // Only change src if different to avoid flickering
        if (!mainVideoRef.current.src.includes(activeVideo.url)) {
          mainVideoRef.current.src = activeVideo.url;
          mainVideoRef.current.currentTime = adjustedTime;
          // Apply specific video volume and master volume
          mainVideoRef.current.volume =
            (activeVideo.volume !== undefined ? activeVideo.volume : 1) *
            masterVolume;
          if (isPlaying) {
            mainVideoRef.current.play().catch(() => {});
          }
        } else {
          // Only adjust time if very out of sync
          const timeDiff = Math.abs(
            mainVideoRef.current.currentTime - adjustedTime
          );
          if (timeDiff > 0.5) {
            mainVideoRef.current.currentTime = adjustedTime;
          }
          // Always update volume
          mainVideoRef.current.volume =
            (activeVideo.volume !== undefined ? activeVideo.volume : 1) *
            masterVolume;
          if (mainVideoRef.current.paused && isPlaying) {
            mainVideoRef.current.play().catch(() => {});
          }
        }

        // Apply color correction (FFmpeg-accurate CSS mapping)
        const filters = [];
        if (activeVideo.colorCorrection) {
          const cc = activeVideo.colorCorrection;

          // Brightness: FFmpeg -1.0 to 1.0 -> CSS brightness()
          // FFmpeg eq filter uses additive brightness, CSS uses multiplicative
          if (cc.brightness !== 0) {
            // Convert FFmpeg additive brightness to CSS multiplicative brightness
            // FFmpeg: output = input + brightness
            // CSS: output = input * brightness
            // Approximation: CSS_value = 1 + (ffmpeg_value * intensity_factor)
            const cssValue = 1 + cc.brightness * 0.6; // Reduced factor for better match
            filters.push(`brightness(${Math.max(0.1, cssValue)})`);
          }

          // Contrast: FFmpeg 0.0 to 4.0 -> CSS contrast()
          // FFmpeg eq filter: (input - 0.5) * contrast + 0.5
          // CSS contrast: input * contrast
          // They work differently, need conversion
          if (cc.contrast !== 1) {
            // Convert FFmpeg contrast to CSS contrast
            // FFmpeg contrast of 0.91 should look like CSS contrast of ~0.55-0.65
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
          // These are closer but still need adjustment
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
            filters.push(`brightness(${Math.max(0.1, adjustedGamma)})`);
          }

          // Hue: FFmpeg -180 to 180 -> CSS hue-rotate()
          // This one should be accurate
          if (cc.hue !== 0) {
            filters.push(`hue-rotate(${cc.hue}deg)`);
          }

          // Vibrance: No direct CSS equivalent, approximate with saturation
          if (cc.vibrance !== 0) {
            // Even more conservative vibrance to avoid over-saturation
            const vibranceEffect = 1 + cc.vibrance * 0.2;
            filters.push(`saturate(${Math.max(0, vibranceEffect)})`);
          }
        }

        // Apply filters always, even if empty
        mainVideoRef.current.style.filter =
          filters.length > 0 ? filters.join(" ") : "none";

        // Show video
        mainVideoRef.current.style.display = "block";
      } else {
        // No active video, pause and hide
        if (!mainVideoRef.current.paused) {
          mainVideoRef.current.pause();
        }
        // Clear effects when no video
        mainVideoRef.current.style.filter = "none";
        mainVideoRef.current.style.display = "none";
      }
    }

    // Handle audio (simplified)
    activeElements.forEach((element) => {
      if (element.channel === "music" || element.channel === "voice") {
        if (!audioRefs.current[element.id]) {
          const audio = new Audio(element.url);
          audio.volume = masterVolume; // Apply master volume
          audioRefs.current[element.id] = audio;
        }

        const audio = audioRefs.current[element.id];
        const elementTime = time - element.startTime;
        // Adjust for start trim
        const adjustedTime = elementTime + (element.trimStart || 0);

        if (Math.abs(audio.currentTime - adjustedTime) > 0.3) {
          audio.currentTime = adjustedTime;
        }
        if (audio.paused) {
          audio.play().catch(() => {});
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
    if (isPlaying) {
      syncMediaWithTime(currentTime);
    }
  }, [currentTime, isPlaying]);

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

  // Effect to handle timeline changes or when playback stops
  useEffect(() => {
    if (!isPlaying && currentTime === 0) {
      // Reset - hide video and show placeholder
      if (mainVideoRef.current) {
        mainVideoRef.current.style.display = "none";
        mainVideoRef.current.pause();
      }
    }
  }, [isPlaying, currentTime]);

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

  const handleDrop = async (e, channel) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Determine correct channel based on element type
    let targetChannel = channel;
    if (draggedItem.type === "video") {
      targetChannel = "video";
    } else if (draggedItem.type === "image") {
      targetChannel = "image";
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
    } else if (draggedItem.type === "music" || draggedItem.type === "voice") {
      // For audio, assume default duration (this should be improved with real loading)
      elementDuration = 30; // 30 seconds default for audio
      originalDuration = 30;
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

    // Create new element for timeline
    const newElement = {
      id: `${targetChannel}_${Date.now()}`,
      channel: targetChannel,
      startTime: formatDuration(startTime),
      endTime: formatDuration(startTime + elementDuration), // use real duration
      type: draggedItem.type,
      url: draggedItem.url || draggedItem.image_url, // Handle both url and image_url properties
      title: draggedItem.title || draggedItem.name,
      duration: formatDuration(elementDuration), // current duration in timeline
      originalDuration: originalDuration, // original media duration (null for images)
      trimStart: 0, // trimmed time from start
      trimEnd: 0, // trimmed time from end
      effects: [],
      volume: targetChannel === "music" || targetChannel === "voice" ? 0.5 : 1,
      opacity: 1,
      // FFmpeg compatible position (normalized coordinates 0-1)
      position: {
        x: 0.5, // center horizontally (0=left, 1=right)
        y: 0.5, // center vertically (0=top, 1=bottom)
      },
      scale: 1,
      zIndex: targetChannel === "image" ? 10 : 1, // Imágenes tienen z-index más alto por defecto
      // FFmpeg compatible color correction
      colorCorrection: {
        brightness: 0, // -1.0 to 1.0 (FFmpeg: -1.0 to 1.0)
        contrast: 1, // 0.0 to 4.0 (FFmpeg: 0.0 to 4.0, 1.0 = normal)
        saturation: 1, // 0.0 to 3.0 (FFmpeg: 0.0 to 3.0, 1.0 = normal)
        gamma: 1, // 0.1 to 10.0 (FFmpeg: 0.1 to 10.0, 1.0 = normal)
        hue: 0, // -180 to 180 degrees (FFmpeg: -180 to 180)
        vibrance: 0, // -2.0 to 2.0 (FFmpeg: -2.0 to 2.0)
      },
    };

    setArrayVideoMake((prev) => [...prev, newElement]);
    setDraggedItem(null);
  };

  // Function to handle timeline click
  const handleTimelineClick = (e) => {
    // Don't process if we're dragging an element
    if (draggingElement) return;

    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = Math.max(
        0,
        Math.min(percentage * getTimelineDuration(), getTimelineDuration())
      );
      setCurrentTime(newTime);
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
    console.log("Starting image drag for element:", element.id); // Debug log
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
    setDraggingImageElement(element);
    // For normalized coordinates, we don't need to store drag start offset
    setImageDragStart({ x: 0, y: 0 });
    document.body.style.cursor = "grabbing";
  };

  // Effect to handle global mouse events
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingTimeline && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(clickX / rect.width, 1));
        const newTime = percentage * getTimelineDuration();
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

      // Handle timeline element drag
      if (draggingElement && timelineRef.current) {
        setCurrentDragX(e.clientX); // Save current mouse position
        const rect = timelineRef.current.getBoundingClientRect();
        const newStartTime = calculateNewPosition(e.clientX, rect);

        // Update preview position in real time
        setDragPreviewPosition(newStartTime);
      }

      // Handle image drag in preview area
      if (isDraggingImage && draggingImageElement) {
        console.log("Moving image during drag"); // Debug log
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

      // Handle element resizing
      if (isResizing && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
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

      // Handle end of image drag
      if (isDraggingImage) {
        console.log("Stopping image drag"); // Debug log
        setIsDraggingImage(false);
        setDraggingImageElement(null);
        setImageDragStart({ x: 0, y: 0 });
        document.body.style.cursor = "default";
      }

      // Handle end of element drag
      if (draggingElement && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        // Use currentDragX if available, otherwise use e.clientX
        const dragEndX = currentDragX || e.clientX;
        const newStartTime = calculateNewPosition(dragEndX, rect);

        // Resolve collisions and update array
        const updatedElements = resolveCollisions(
          draggingElement,
          newStartTime
        );
        setArrayVideoMake(updatedElements);

        // Clean drag state
        setDraggingElement(null);
        setDragStartX(0);
        setDragStartTime(0);
        setCurrentDragX(0);
        setDragPreviewPosition(0);
        document.body.style.cursor = "default";
      }

      // Handle end of resizing
      if (isResizing) {
        setIsResizing(false);
        setResizingElement(null);
        setResizeType(null);
        setResizeStartX(0);
        setResizeStartTime(0);
      }
    };

    if (
      isDraggingTimeline ||
      draggingElement ||
      isDraggingVolume ||
      isDraggingImage ||
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
    isDraggingImage,
    draggingImageElement,
    imageDragStart,
    isResizing,
    resizingElement,
    resizeType,
  ]);

  // Function to get unique color for each element
  const getElementColor = (elementId, index) => {
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
  const updateSelectedElement = (property, value) => {
    if (!selectedElement) return;

    setArrayVideoMake((prev) =>
      prev.map((item) => {
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
      })
    );

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

  // Function to delete element from timeline
  const handleDeleteElement = (elementId) => {
    setArrayVideoMake((prev) => {
      // Simply filter element without rearranging others
      return prev.filter((item) => item.id !== elementId);
    });

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
      element.type === "voice";

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
        updatedElement.trimStart = formatDuration(newTrimStart);
      } else {
        // For images, allow free resizing
        updatedElement.startTime = formatDuration(newStartTime);
        updatedElement.duration = formatDuration(newDuration);
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

  const handleNewProject = () => {
    // Clear current project state
    setArrayVideoMake([]);
    setCurrentTime(0);
    setSelectedElement(null);
    setCurrentEditName("");
    setCurrentEditId(null);
    setMasterVolume(1);

    // Stop playback
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Modal handlers
  const handleSaveEdit = (editData) => {
    // This will be called from the save modal
    console.log("Saving edit:", editData);
    setCurrentEditName(editData.name);
    if (editData.id) {
      setCurrentEditId(editData.id);
    }
    setShowSaveModal(false);
  };

  const handleLoadEdit = (editData) => {
    // This will be called from the load modal
    console.log("Loading edit:", editData);

    // Load the timeline from edition_array
    if (editData.edition_array) {
      try {
        const timelineData =
          typeof editData.edition_array === "string"
            ? JSON.parse(editData.edition_array)
            : editData.edition_array;

        if (timelineData.timeline) {
          setArrayVideoMake(timelineData.timeline);
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
    // This will be called from the export modal
    console.log("Exporting edit to project:", projectId);
    setShowExportModal(false);
  };

  // Automatically load project when component mounts
  useEffect(() => {
    // Removed automatic project loading alert
    // Users can manually load projects using the Load button
    console.log("Editor component mounted");
  }, []);

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
      console.log("Imágenes subidas exitosamente:", newImages);
    } catch (error) {
      console.error("Error subiendo imágenes:", error);
      alert("Error al subir las imágenes. Por favor, intenta nuevamente.");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleImageInputChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploadingImages(true);
    try {
      const newImages = await handleImageDrop(files);
      setImages((prevImages) => [...prevImages, ...newImages]);
      console.log("Imágenes subidas exitosamente:", newImages);
    } catch (error) {
      console.error("Error subiendo imágenes:", error);
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
        // Remove deleted image from list
        setImages((prevImages) =>
          prevImages.filter((img) => img.id !== imageToDelete.id)
        );
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

  return (
    <div className="bg-primarioDark w-full h-[91.8vh] pr-4">
      {/* Header */}
      <div className="flex justify-between">
        <div className="flex flex-col">
          <span className="text-white text-3xl font-leagueGothic font-medium">
            Video Editor
          </span>
          {currentEditName && (
            <span className="text-gray-400 text-sm font-montserrat">
              {currentEditName}
            </span>
          )}
        </div>
        {/* Timeline Header */}
        <div
          className={
            arrayVideoMake.length > 0
              ? "flex justify-between items-center gap-8 my-2"
              : "hidden"
          }
        >
          <div className="flex items-center gap-6">
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
          </div>{" "}
          <div className="flex items-center gap-2">
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
                  {Math.max(...arrayVideoMake.map((item) => item.endTime), 0)}s
                </span>
              )}
              {isResizing && resizingElement && (
                <span className="text-yellow-400">
                  {" "}
                  | Trimming: {resizingElement.title}
                </span>
              )}
              {draggingElement && (
                <span className="text-blue-400">
                  {" "}
                  | Moving: {draggingElement.title}
                </span>
              )}
            </span>
          </div>
        </div>
        <div className="gap-4 flex">
          {currentEditName && (
            <button
              type="button"
              onClick={handleNewProject}
              className="bg-gray-600 text-white px-6 py-2 rounded-3xl font-medium hover:bg-gray-500 flex items-center gap-2"
            >
              <Plus size={18} />
              New
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveProject}
            className="bg-[#F2D543] text-primarioDark px-6 py-2 rounded-3xl font-medium hover:bg-[#f2f243] flex items-center gap-2"
          >
            <Save size={18} />
            Save
          </button>
          <button
            type="button"
            onClick={handleLoadProject}
            className="bg-[#F2D54310] text-[#F2D543] border-[#F2D543] border px-6 py-2 rounded-3xl font-medium hover:bg-[#F2D543] hover:text-black flex items-center gap-2"
          >
            <FolderOpen size={18} />
            Load
          </button>
          <button
            type="button"
            onClick={handleExportVideo}
            className="bg-[#F2D54310] text-[#F2D543] border-[#F2D543] border px-6 py-2 rounded-3xl font-medium hover:bg-[#F2D543] hover:text-black flex items-center gap-2"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>
      {/* ACTION BAR */}
      <div className="flex gap-6 mt-2 h-[45vh]">
        <div className="bg-darkBox w-1/4 rounded-4xl flex">
          <div className="w-1/5">
            <div
              onClick={() => setMenuActive(1)}
              className={
                menuActive == 1
                  ? "bg-darkBoxSub text-primarioLogo text-center flex items-center justify-center h-16 cursor-pointer rounded-tl-4xl"
                  : "text-white text-center flex items-center justify-center h-16 cursor-pointer rounded-tl-4xl"
              }
            >
              <ClapperboardIcon />
            </div>
            <div
              onClick={() => setMenuActive(2)}
              className={
                menuActive == 2
                  ? "bg-darkBoxSub text-primarioLogo text-center flex items-center justify-center h-16 cursor-pointer"
                  : "text-white text-center flex items-center justify-center h-16 cursor-pointer"
              }
            >
              <Music />
            </div>
            <div
              onClick={() => setMenuActive(3)}
              className={
                menuActive == 3
                  ? "bg-darkBoxSub text-primarioLogo text-center flex items-center justify-center h-16 cursor-pointer"
                  : "text-white text-center flex items-center justify-center h-16 cursor-pointer"
              }
            >
              <Image />
            </div>
            <div
              onClick={() => setMenuActive(4)}
              className={
                menuActive == 4
                  ? "bg-darkBoxSub text-primarioLogo text-center flex items-center justify-center h-16 cursor-pointer"
                  : "text-white text-center flex items-center justify-center h-16 cursor-pointer"
              }
            >
              <Mic />
            </div>
          </div>
          <div className="w-4/5 overflow-scroll bg-darkBoxSub rounded-tr-4xl rounded-br-4xl">
            {menuActive == 1 ? (
              <div className="p-4 w-full h-full">
                {projects.length > 0 ? (
                  <div className="space-y-6">
                    {projects.map((project) => (
                      <div key={project.id} className="space-y-3">
                        {/* Project Header */}
                        <div className="border-b border-gray-600 pb-2">
                          <h3 className="text-white font-medium text-lg">
                            {project.name}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {project.scenes?.length || 0} scenes available
                          </p>
                        </div>

                        {/* Project Videos Grid */}
                        {project.scenes && project.scenes.length > 0 ? (
                          <div className="grid grid-cols-2 gap-4">
                            {project.scenes.map((scene, index) => (
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
                                className="bg-darkBox cursor-pointer hover:bg-opacity-80 rounded-2xl transition-all duration-200 hover:scale-105"
                              >
                                <img
                                  src={
                                    scene.image_url || scene.prompt_image_url
                                  }
                                  alt={scene.name}
                                  className="rounded-t-2xl w-full h-16 object-cover aspect-square"
                                />
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
                        ) : (
                          <div className="text-gray-400 text-sm italic">
                            No scenes available in this project
                          </div>
                        )}
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
              <div className="bg-darkBoxSub p-4 w-full rounded-tr-4xl rounded-br-4xl h-full">
                <div className="grid grid-cols-1 gap-4">
                  {musicFiles.map((music, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => handleDragStart(e, music, "music")}
                      className="bg-darkBox cursor-pointer hover:bg-opacity-80 rounded-2xl p-4 transition-all duration-200 hover:scale-105"
                    >
                      <div className="flex items-center gap-3">
                        <Music size={24} className="text-primarioLogo" />
                        <div>
                          <span className="text-[#E7E7E7] text-sm font-medium block">
                            {music.name}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {music.duration}s
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {musicFiles.length === 0 && (
                    <div className="text-center py-8">
                      <Music size={48} className="text-gray-400 mx-auto mb-2" />
                      <span className="text-gray-400">
                        No hay archivos de música disponibles
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : menuActive == 3 ? (
              <div
                className="bg-darkBoxSub p-4 w-full rounded-tr-4xl rounded-br-4xl h-full"
                onDragOver={handleImageContainerDragOver}
                onDrop={handleImageContainerDrop}
              >
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
                  className={`grid grid-cols-2 gap-4 overflow-y-auto ${
                    images.length === 0 ? "max-h-[calc(100%-140px)]" : "h-full"
                  }`}
                >
                  {images.map((image, index) => (
                    <div
                      key={index}
                      draggable={!isUploadingImages}
                      onDragStart={(e) => handleDragStart(e, image, "image")}
                      className="bg-darkBox cursor-pointer overflow-x-hidden h-32 hover:bg-opacity-80 rounded-2xl transition-all duration-200 hover:scale-105 relative group"
                    >
                      {/* Delete Button - Only visible on hover */}
                      <button
                        onClick={(e) => handleDeleteImageClick(e, image)}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
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
                      <span className="text-gray-400">No images available</span>
                    </div>
                  )}
                </div>
              </div>
            ) : menuActive == 4 ? (
              <div className="bg-darkBoxSub p-4 w-full rounded-tr-4xl rounded-br-4xl h-full">
                <div className="grid grid-cols-1 gap-4">
                  {voiceFiles.map((voice, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => handleDragStart(e, voice, "voice")}
                      className="bg-darkBox cursor-pointer hover:bg-opacity-80 rounded-2xl p-4 transition-all duration-200 hover:scale-105"
                    >
                      <div className="flex items-center gap-3">
                        <Mic size={24} className="text-primarioLogo" />
                        <div>
                          <span className="text-[#E7E7E7] text-sm font-medium block">
                            {voice.name}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {voice.duration}s
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {voiceFiles.length === 0 && (
                    <div className="text-center py-8">
                      <Mic size={48} className="text-gray-400 mx-auto mb-2" />
                      <span className="text-gray-400">
                        No hay archivos de voz disponibles
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
        <div className="w-2/4 rounded-4xl relative overflow-hidden">
          {/* Video principal - siempre en el DOM */}
          <video
            ref={mainVideoRef}
            className="rounded-4xl bg-black h-full max-w-full mx-auto block object-contain"
            muted={false}
          />
          {/* Placeholder cuando no hay videos o cuando no está reproduciendo */}

          <div
            className="rounded-4xl w-full bg-darkBox flex items-center justify-center absolute inset-0"
            style={{
              display:
                arrayVideoMake.some((item) => item.channel === "video") &&
                getActiveElements(currentTime).some(
                  (el) => el.channel === "video"
                )
                  ? "none"
                  : "flex",
            }}
          >
            <div className="text-center">
              <ClapperboardIcon
                size={64}
                className="text-gray-400 mx-auto mb-4"
              />
              <p className="text-gray-400 text-lg">
                {arrayVideoMake.some((item) => item.channel === "video")
                  ? "Press play to preview your video"
                  : "Drag videos here to get started"}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Your final video will appear in this area
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
                  filters.push(`brightness(${Math.max(0.1, adjustedGamma)})`);
                }

                // Hue: FFmpeg -180 to 180 -> CSS hue-rotate()
                if (cc.hue !== 0) {
                  filters.push(`hue-rotate(${cc.hue}deg)`);
                }

                // Vibrance: More conservative approximation
                if (cc.vibrance !== 0) {
                  // Even more conservative vibrance to avoid over-saturation
                  const vibranceEffect = 1 + cc.vibrance * 0.2;
                  filters.push(`saturate(${Math.max(0, vibranceEffect)})`);
                }
              }

              return (
                <div
                  key={item.id}
                  className="absolute rounded-4xl overflow-hidden pointer-events-none"
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
                    src={item.url}
                    alt={item.title}
                    className="cursor-move"
                    style={{
                      opacity: item.opacity || 1,
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      pointerEvents: "auto",
                      filter: filters.length > 0 ? filters.join(" ") : "none",
                    }}
                    onMouseDown={(e) => handleImageDragStart(e, item)}
                    onClick={(e) => handleSelectElement(item, e)}
                  />
                </div>
              );
            })}
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
                  : "Editor Controls"
              }
            >
              {selectedElement && selectedElement.type === "image"
                ? `Edit Image: ${selectedElement.title}`
                : selectedElement && selectedElement.type === "video"
                ? `Edit Video: ${selectedElement.title}`
                : "Editor Controls"}
            </h3>

            {selectedElement && selectedElement.type === "video" ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-300 mb-4">
                  <p>Duration: {selectedElement.duration}s</p>
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
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(
                      (selectedElement.volume !== undefined
                        ? selectedElement.volume
                        : 1) * 100
                    )}
                    onChange={(e) =>
                      updateSelectedElement(
                        "volume",
                        parseInt(e.target.value) / 100
                      )
                    }
                    className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                  />
                </div>

                {/* Z-Index Control for Videos */}
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">
                    Layer (Z-Index): {selectedElement.zIndex || 1}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={selectedElement.zIndex || 1}
                    onChange={(e) =>
                      updateSelectedElement("zIndex", parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
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
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.01"
                      value={selectedElement.colorCorrection?.brightness || 0}
                      onChange={(e) =>
                        updateSelectedElement(
                          "colorCorrection.brightness",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Contrast:{" "}
                      {(selectedElement.colorCorrection?.contrast || 1).toFixed(
                        2
                      )}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      step="0.01"
                      value={selectedElement.colorCorrection?.contrast || 1}
                      onChange={(e) =>
                        updateSelectedElement(
                          "colorCorrection.contrast",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Saturation:{" "}
                      {(
                        selectedElement.colorCorrection?.saturation || 1
                      ).toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      step="0.01"
                      value={selectedElement.colorCorrection?.saturation || 1}
                      onChange={(e) =>
                        updateSelectedElement(
                          "colorCorrection.saturation",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Gamma:{" "}
                      {(selectedElement.colorCorrection?.gamma || 1).toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.01"
                      value={selectedElement.colorCorrection?.gamma || 1}
                      onChange={(e) =>
                        updateSelectedElement(
                          "colorCorrection.gamma",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Hue: {selectedElement.colorCorrection?.hue || 0}°
                    </label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={selectedElement.colorCorrection?.hue || 0}
                      onChange={(e) =>
                        updateSelectedElement(
                          "colorCorrection.hue",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Vibrance:{" "}
                      {(selectedElement.colorCorrection?.vibrance || 0).toFixed(
                        2
                      )}
                    </label>
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.01"
                      value={selectedElement.colorCorrection?.vibrance || 0}
                      onChange={(e) =>
                        updateSelectedElement(
                          "colorCorrection.vibrance",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => {
                      updateSelectedElement("volume", 1);
                      updateSelectedElement("zIndex", 1);
                      updateSelectedElement("colorCorrection.brightness", 0);
                      updateSelectedElement("colorCorrection.contrast", 1);
                      updateSelectedElement("colorCorrection.saturation", 1);
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
                  <p>Duration: {selectedElement.duration}s</p>
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
                      {((selectedElement.position?.x || 0.5) * 100).toFixed(1)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={selectedElement.position?.x || 0.5}
                      onChange={(e) =>
                        updateSelectedElement("position", {
                          ...selectedElement.position,
                          x: parseFloat(e.target.value),
                        })
                      }
                      className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Y Position:{" "}
                      {((selectedElement.position?.y || 0.5) * 100).toFixed(1)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={selectedElement.position?.y || 0.5}
                      onChange={(e) =>
                        updateSelectedElement("position", {
                          ...selectedElement.position,
                          y: parseFloat(e.target.value),
                        })
                      }
                      className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                    />
                  </div>
                </div>

                {/* Opacity Control */}
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">
                    Opacity: {Math.round((selectedElement.opacity || 1) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedElement.opacity || 1}
                    onChange={(e) =>
                      updateSelectedElement(
                        "opacity",
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                  />
                </div>

                {/* Size Control */}
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">
                    Scale: {((selectedElement.scale || 1) * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={selectedElement.scale || 1}
                    onChange={(e) =>
                      updateSelectedElement("scale", parseFloat(e.target.value))
                    }
                    className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">
                    Layer (Z-Index): {selectedElement.zIndex || 1}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={selectedElement.zIndex || 1}
                    onChange={(e) =>
                      updateSelectedElement("zIndex", parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
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
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.01"
                      value={selectedElement.colorCorrection?.brightness || 0}
                      onChange={(e) =>
                        updateSelectedElement(
                          "colorCorrection.brightness",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Contrast:{" "}
                      {(selectedElement.colorCorrection?.contrast || 1).toFixed(
                        2
                      )}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      step="0.01"
                      value={selectedElement.colorCorrection?.contrast || 1}
                      onChange={(e) =>
                        updateSelectedElement(
                          "colorCorrection.contrast",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Saturation:{" "}
                      {(
                        selectedElement.colorCorrection?.saturation || 1
                      ).toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      step="0.01"
                      value={selectedElement.colorCorrection?.saturation || 1}
                      onChange={(e) =>
                        updateSelectedElement(
                          "colorCorrection.saturation",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Gamma:{" "}
                      {(selectedElement.colorCorrection?.gamma || 1).toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.01"
                      value={selectedElement.colorCorrection?.gamma || 1}
                      onChange={(e) =>
                        updateSelectedElement(
                          "colorCorrection.gamma",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Hue: {selectedElement.colorCorrection?.hue || 0}°
                    </label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={selectedElement.colorCorrection?.hue || 0}
                      onChange={(e) =>
                        updateSelectedElement(
                          "colorCorrection.hue",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Vibrance:{" "}
                      {(selectedElement.colorCorrection?.vibrance || 0).toFixed(
                        2
                      )}
                    </label>
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.01"
                      value={selectedElement.colorCorrection?.vibrance || 0}
                      onChange={(e) =>
                        updateSelectedElement(
                          "colorCorrection.vibrance",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
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
                      updateSelectedElement("colorCorrection.brightness", 0);
                      updateSelectedElement("colorCorrection.contrast", 1);
                      updateSelectedElement("colorCorrection.saturation", 1);
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
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* TIMELINE */}
      <div className="mt-3 p-6 relative pb-0">
        {/* Timeline Tracks */}
        <div className="space-y-3">
          {/* Video Track */}
          <div className="flex items-center gap-3">
            <div className="w-16 text-white text-sm font-medium">Video</div>
            <div
              className="flex-1 bg-darkBoxSub rounded-lg h-12 relative transition-all duration-200 hover:bg-opacity-80"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "video")}
            >
              {/* Render timeline elements for video channel */}
              {arrayVideoMake
                .filter((item) => item.channel === "video")
                .map((item, index) => (
                  <div
                    key={item.id}
                    className={`absolute rounded-md h-10 flex items-center justify-center cursor-move group hover:scale-105 hover:z-10 ${
                      draggingElement?.id === item.id
                        ? "opacity-50 scale-105 transition-none"
                        : "transition-all duration-200"
                    } ${
                      selectedElement?.id === item.id
                        ? "ring-2 ring-[#DC569D] ring-opacity-80"
                        : ""
                    }`}
                    style={{
                      left: `${
                        (getElementRenderPosition(item) /
                          getTimelineDuration()) *
                        100
                      }%`,
                      width: `${
                        ((item.endTime - item.startTime) /
                          getTimelineDuration()) *
                        100
                      }%`,
                      top: "4px",
                      backgroundColor: getElementColor(item.id, index),
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
                    {/* Left resize handle */}
                    <div
                      className="resize-handle absolute left-0 top-0 w-1 h-full bg-white opacity-0 hover:opacity-100 cursor-ew-resize z-30"
                      onMouseDown={(e) => handleResizeStart(e, item, "start")}
                      title="Trim start"
                    ></div>

                    {/* Right resize handle */}
                    <div
                      className="resize-handle absolute right-0 top-0 w-1 h-full bg-white opacity-0 hover:opacity-100 cursor-ew-resize z-30"
                      onMouseDown={(e) => handleResizeStart(e, item, "end")}
                      title="Trim end"
                    ></div>

                    <span className="text-white text-xs truncate px-2 select-none pointer-events-none">
                      {item.title} ({item.duration}s)
                      {item.channel === "video" && (
                        <span className="opacity-80">
                          {" "}
                          Vol:{" "}
                          {Math.round(
                            (item.volume !== undefined ? item.volume : 1) * 100
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
                      <div className="absolute -top-2 right-0 flex gap-1 z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteElement(item.id);
                            setHoveredElement(null);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-md transition-all duration-200 shadow-lg"
                          title="Eliminar escena"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 text-white text-sm font-medium">Image</div>
            <div
              className="flex-1 bg-darkBoxSub rounded-lg h-8 relative transition-all duration-200 hover:bg-opacity-80"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "image")}
            >
              {/* Render timeline elements for image/text channel */}
              {arrayVideoMake
                .filter((item) => item.channel === "image")
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
                      left: `${
                        (getElementRenderPosition(item) /
                          getTimelineDuration()) *
                        100
                      }%`,
                      width: `${
                        ((item.endTime - item.startTime) /
                          getTimelineDuration()) *
                        100
                      }%`,
                      top: "4px",
                      backgroundColor: getElementColor(item.id, index),
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
                    {/* Manija de redimensionamiento izquierda */}
                    <div
                      className="resize-handle absolute left-0 top-0 w-1 h-full bg-white opacity-0 hover:opacity-100 cursor-ew-resize z-30"
                      onMouseDown={(e) => handleResizeStart(e, item, "start")}
                      title="Cambiar inicio"
                    ></div>

                    {/* Manija de redimensionamiento derecha */}
                    <div
                      className="resize-handle absolute right-0 top-0 w-1 h-full bg-white opacity-0 hover:opacity-100 cursor-ew-resize z-30"
                      onMouseDown={(e) => handleResizeStart(e, item, "end")}
                      title="Cambiar duración"
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
                          className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-md transition-all duration-200 shadow-lg"
                          title="Eliminar elemento"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Music Track */}
          <div className="flex items-center gap-3">
            <div className="w-16 text-white text-sm font-medium">Music</div>
            <div
              className="flex-1 bg-darkBoxSub rounded-lg h-8 relative transition-all duration-200 hover:bg-opacity-80"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "music")}
            >
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
                    }`}
                    style={{
                      left: `${
                        (getElementRenderPosition(item) /
                          getTimelineDuration()) *
                        100
                      }%`,
                      width: `${
                        ((item.endTime - item.startTime) /
                          getTimelineDuration()) *
                        100
                      }%`,
                      top: "4px",
                      backgroundColor: getElementColor(item.id, index),
                    }}
                    onMouseEnter={() => setHoveredElement(item.id)}
                    onMouseLeave={() => setHoveredElement(null)}
                    onMouseDown={(e) => {
                      if (
                        !e.target.closest("button") &&
                        !e.target.classList.contains("resize-handle")
                      ) {
                        handleElementDragStart(e, item);
                      }
                    }}
                  >
                    {/* Manija de redimensionamiento izquierda */}
                    <div
                      className="resize-handle absolute left-0 top-0 w-1 h-full bg-white opacity-0 hover:opacity-100 cursor-ew-resize z-30"
                      onMouseDown={(e) => handleResizeStart(e, item, "start")}
                      title="Recortar inicio"
                    ></div>

                    {/* Manija de redimensionamiento derecha */}
                    <div
                      className="resize-handle absolute right-0 top-0 w-1 h-full bg-white opacity-0 hover:opacity-100 cursor-ew-resize z-30"
                      onMouseDown={(e) => handleResizeStart(e, item, "end")}
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
                          className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-md transition-all duration-200 shadow-lg"
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
            <div className="w-16 text-white text-sm font-medium">Voice</div>
            <div
              className="flex-1 bg-darkBoxSub rounded-lg h-8 relative transition-all duration-200 hover:bg-opacity-80"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "voice")}
            >
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
                    }`}
                    style={{
                      left: `${
                        (getElementRenderPosition(item) /
                          getTimelineDuration()) *
                        100
                      }%`,
                      width: `${
                        ((item.endTime - item.startTime) /
                          getTimelineDuration()) *
                        100
                      }%`,
                      top: "4px",
                      backgroundColor: getElementColor(item.id, index),
                    }}
                    onMouseEnter={() => setHoveredElement(item.id)}
                    onMouseLeave={() => setHoveredElement(null)}
                    onMouseDown={(e) => {
                      if (
                        !e.target.closest("button") &&
                        !e.target.classList.contains("resize-handle")
                      ) {
                        handleElementDragStart(e, item);
                      }
                    }}
                  >
                    {/* Manija de redimensionamiento izquierda */}
                    <div
                      className="resize-handle absolute left-0 top-0 w-1 h-full bg-white opacity-0 hover:opacity-100 cursor-ew-resize z-30"
                      onMouseDown={(e) => handleResizeStart(e, item, "start")}
                      title="Recortar inicio"
                    ></div>

                    {/* Manija de redimensionamiento derecha */}
                    <div
                      className="resize-handle absolute right-0 top-0 w-1 h-full bg-white opacity-0 hover:opacity-100 cursor-ew-resize z-30"
                      onMouseDown={(e) => handleResizeStart(e, item, "end")}
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
                          className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-md transition-all duration-200 shadow-lg"
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
        </div>

        {/* Timeline Ruler */}
        <div className="mt-4 flex items-center gap-3">
          <div className="w-16">
            {/* Indicador de tiempo currente */}
            <div className="text-xs text-primarioLogo font-medium">
              {Math.floor(currentTime / 60)}:
              {String(Math.floor(currentTime) % 60).padStart(2, "0")}
            </div>
          </div>
          <div className="flex-1 relative">
            <div
              ref={timelineRef}
              className="w-full h-4 bg-darkBoxSub rounded-full cursor-pointer relative group"
              onMouseDown={handleTimelineMouseDown}
              onClick={handleTimelineClick}
            >
              {/* Barra de fondo más alta para mejor interacción */}
              <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-1 bg-darkBoxSub rounded-full"></div>

              {/* Barra de progreso */}
              <div
                className="absolute top-1/2 transform -translate-y-1/2 h-1 bg-primarioLogo rounded-full transition-all duration-100"
                style={{
                  width: `${(currentTime / getTimelineDuration()) * 100}%`,
                }}
              ></div>

              {/* Indicador (bolita) - más grande y con mejor hover */}
              <div
                className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-primarioLogo cursor-grab transition-all duration-100 shadow-lg ${
                  isDraggingTimeline
                    ? "scale-125 cursor-grabbing"
                    : "hover:scale-110"
                }`}
                style={{
                  left: `${(currentTime / getTimelineDuration()) * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDraggingTimeline(true);
                }}
              ></div>
              {/* Indicador visual cuando se hace hover */}
              <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-3 opacity-0 group-hover:opacity-20 bg-primarioLogo rounded-full transition-opacity duration-200"></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0:00</span>
              <span>
                {Math.floor(getTimelineDuration() / 4 / 60)}:
                {String(Math.floor(getTimelineDuration() / 4) % 60).padStart(
                  2,
                  "0"
                )}
              </span>
              <span>
                {Math.floor(getTimelineDuration() / 2 / 60)}:
                {String(Math.floor(getTimelineDuration() / 2) % 60).padStart(
                  2,
                  "0"
                )}
              </span>
              <span>
                {Math.floor((getTimelineDuration() * 3) / 4 / 60)}:
                {String(
                  Math.floor((getTimelineDuration() * 3) / 4) % 60
                ).padStart(2, "0")}
              </span>
              <span>
                {Math.floor(getTimelineDuration() / 60)}:
                {String(Math.floor(getTimelineDuration()) % 60).padStart(
                  2,
                  "0"
                )}
              </span>
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
          editName={currentEditName}
          editId={currentEditId}
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
    </div>
  );
}

export default Editor;
