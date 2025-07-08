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
} from "lucide-react";

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
  const [menuActive, setMenuActive] = useState(1);
  const [draggedItem, setDraggedItem] = useState(null);
  const [arrayVideoMake, setArrayVideoMake] = useState([]);
  const [videoDurations, setVideoDurations] = useState({});

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

  // States for image dragging in preview area
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [draggingImageElement, setDraggingImageElement] = useState(null);
  const [imageDragStart, setImageDragStart] = useState({ x: 0, y: 0 });

  const videos = [
    {
      url: "/test/Astronauta_Anuncio_Instagram_Listo.mp4",
      title: "Astronauta Anuncio Instagram Listo",
    },
    {
      url: "/test/Astronauta_Noir_en_la_Luna.mp4",
      title: "Astronauta Noir en la Luna",
    },
    {
      url: "/test/Astronauta_Publicita_Yacamba_en_Instagram.mp4",
      title: "Astronauta Publicita Yacamba en Instagram",
    },
    {
      url: "/test/Marciano_Promociona_Usa_Yacamba_.mp4",
      title: "Marciano Promociona Usa Yacamba",
    },
    {
      url: "/test/Marciano_Recomienda_Yacamba_.mp4",
      title: "Marciano Recomienda Yacamba",
    },
    {
      url: "/test/Odoo_Boxeador_Noqueado_Yacamba.mp4",
      title: "Odoo Boxeador Noqueado Yacamba",
    },
    {
      url: "/test/Video_Alemania_en_Ucrania.mp4",
      title: "Video Alemania en Ucrania",
    },
    {
      url: "/test/Video_de_Noticia_Fronteriza.mp4",
      title: "Video de Noticia Fronteriza",
    },
    {
      url: "/test/Video_de_Odoo_y_Boxeo.mp4",
      title: "Video de Odoo y Boxeo",
    },
    {
      url: "/test/Video_de_Reportero_Fronterizo.mp4",
      title: "Video de Reportero Fronterizo",
    },
    {
      url: "/test/Video_Listo_Guerrero_Maya_Sonríe.mp4",
      title: "Video Listo Guerrero Maya Sonríe",
    },
    {
      url: "/test/Video_Maya_Cumbias_y_Coca.mp4",
      title: "Video Maya Cumbias y Coca",
    },
    {
      url: "/test/Video_Noticia_Frontera_México.mp4",
      title: "Video Noticia Frontera México",
    },
    {
      url: "/test/Video_Noticia_Frontera_México_EEUU.mp4",
      title: "Video Noticia Frontera México EEUU",
    },
  ];

  const images = [
    {
      url: "/logos/logo_reelmotion.webp",
      name: "Logo ReelMotion",
      duration: 5, // default duration for images
    },
  ];

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
  const handleDragStart = (e, video, type = "video") => {
    setDraggedItem({ ...video, type });
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

        // Apply color correction
        const filters = [];
        if (activeVideo.colorCorrection) {
          const cc = activeVideo.colorCorrection;

          if (cc.brightness !== 0) {
            filters.push(`brightness(${1 + cc.brightness / 100})`);
          }
          if (cc.contrast !== 0) {
            filters.push(`contrast(${1 + cc.contrast / 100})`);
          }
          if (cc.saturation !== 0) {
            filters.push(`saturate(${1 + cc.saturation / 100})`);
          }
          if (cc.hue !== 0) {
            filters.push(`hue-rotate(${cc.hue}deg)`);
          }
          // Simulate temperature using sepia and hue-rotate
          if (cc.temperature !== 0) {
            const tempIntensity = Math.abs(cc.temperature) / 100;
            if (cc.temperature > 0) {
              // Warm (sepia + hue towards yellow)
              filters.push(`sepia(${tempIntensity * 0.3})`);
              filters.push(`hue-rotate(${cc.temperature * 0.3}deg)`);
            } else {
              // Cool (hue towards blue)
              filters.push(`hue-rotate(${cc.temperature * 1.5}deg)`);
            }
          }
          // Simulate tint using hue-rotate
          if (cc.tint !== 0) {
            filters.push(`hue-rotate(${cc.tint * 1.8}deg)`);
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
      url: draggedItem.url,
      title: draggedItem.title || draggedItem.name,
      duration: formatDuration(elementDuration), // current duration in timeline
      originalDuration: originalDuration, // original media duration (null for images)
      trimStart: 0, // trimmed time from start
      trimEnd: 0, // trimmed time from end
      effects: [],
      volume: targetChannel === "music" || targetChannel === "voice" ? 0.5 : 1,
      opacity: 1,
      position: { x: 0, y: 0 },
      scale: 1,
      zIndex: 1,
      // Specific properties for videos
      colorCorrection: {
        brightness: 0, // -100 to 100
        contrast: 0, // -100 to 100
        saturation: 0, // -100 to 100
        hue: 0, // -180 to 180
        temperature: 0, // -100 to 100 (warm/cool)
        tint: 0, // -100 to 100 (magenta/green)
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
    setImageDragStart({
      x: e.clientX - (element.position?.x || 0),
      y: e.clientY - (element.position?.y || 0),
    });
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
        const newPosition = {
          x: e.clientX - imageDragStart.x,
          y: e.clientY - imageDragStart.y,
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
    const projectData = {
      timeline: arrayVideoMake,
      settings: {
        masterVolume: masterVolume,
        duration: getTimelineDuration(),
        currentTime: currentTime,
      },
      metadata: {
        name: "My Project",
        createdAt: new Date().toISOString(),
        version: "1.0",
      },
    };

    // Save in localStorage (for local persistence)
    localStorage.setItem("reelmotion_project", JSON.stringify(projectData));

    // Also create downloadable file
    const dataStr = JSON.stringify(projectData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `reelmotion_project_${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    alert("Project saved successfully!");
  };

  const handleLoadProject = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const projectData = JSON.parse(e.target.result);

          if (projectData.timeline) {
            setArrayVideoMake(projectData.timeline);
          }
          if (projectData.settings) {
            setMasterVolume(projectData.settings.masterVolume || 1);
            setCurrentTime(projectData.settings.currentTime || 0);
          }

          // Deselect any element
          setSelectedElement(null);

          alert("Project loaded successfully!");
        } catch (error) {
          alert("Error loading project: " + error.message);
        }
      };
      reader.readAsText(file);
    };

    input.click();
  };

  const handleExportVideo = () => {
    // Video export simulation
    if (arrayVideoMake.length === 0) {
      alert("No content in timeline to export");
      return;
    }

    const exportData = {
      timeline: arrayVideoMake,
      settings: {
        resolution: "1920x1080",
        framerate: 30,
        duration: getTimelineDuration(),
        masterVolume: masterVolume,
      },
      exportSettings: {
        format: "mp4",
        quality: "high",
        timestamp: new Date().toISOString(),
      },
    };

    // In a real implementation, this would be sent to a server for processing
    console.log("Export data:", exportData);

    // Create file with export configuration
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `reelmotion_export_config_${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    alert(
      "Export configuration saved. In a complete implementation, the video would be processed here."
    );
  };

  // Automatically load project when component mounts
  useEffect(() => {
    const savedProject = localStorage.getItem("reelmotion_project");
    if (savedProject) {
      try {
        const projectData = JSON.parse(savedProject);
        if (projectData.timeline && projectData.timeline.length > 0) {
          const shouldLoad = window.confirm(
            "Do you want to load the last saved project?"
          );
          if (shouldLoad) {
            setArrayVideoMake(projectData.timeline);
            if (projectData.settings) {
              setMasterVolume(projectData.settings.masterVolume || 1);
            }
          }
        }
      } catch (error) {
        console.warn("Error loading saved project:", error);
      }
    }
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

  return (
    <div className="bg-primarioDark w-full h-[91.8vh] pr-4">
      {/* Header */}
      <div className="flex justify-between">
        <span className="text-white text-3xl font-leagueGothic font-medium ">
          Video Editor
        </span>
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
          <button
            type="button"
            onClick={handleSaveProject}
            className="bg-[#F2D543] text-primarioDark px-6 py-2 rounded-3xl font-medium hover:bg-[#f2f243]"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleLoadProject}
            className="bg-[#F2D54310] text-[#F2D543] border-[#F2D543] border px-6 py-2 rounded-3xl font-medium hover:bg-[#F2D543] hover:text-black"
          >
            Load
          </button>
          <button
            type="button"
            onClick={handleExportVideo}
            className="bg-[#F2D54310] text-[#F2D543] border-[#F2D543] border px-6 py-2 rounded-3xl font-medium hover:bg-[#F2D543] hover:text-black"
          >
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
              <div className=" p-4 w-full  h-full">
                <div className="grid grid-cols-2 gap-4 h-full">
                  {videos.map((video, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => handleDragStart(e, video, "video")}
                      className="bg-darkBox cursor-pointer hover:bg-opacity-80 rounded-2xl transition-all duration-200 hover:scale-105"
                    >
                      <video
                        src={video.url}
                        className="rounded-t-2xl"
                        onLoadedMetadata={(e) =>
                          handleVideoMetadata(video.url, e.target)
                        }
                        preload="metadata"
                      ></video>
                      <div className="pb-4 pt-1 px-1 relative">
                        <span
                          className="text-[#E7E7E7] text-xs line-clamp-2 mt-2"
                          title={video.title}
                        >
                          {video.title}
                        </span>
                        {/* Mostrar duración si está disponible */}
                        {videoDurations[video.url] && (
                          <div className="absolute top-1 right-1 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {videoDurations[video.url]}s
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
              <div className="bg-darkBoxSub p-4 w-full rounded-tr-4xl rounded-br-4xl h-full">
                <div className="grid grid-cols-2 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => handleDragStart(e, image, "image")}
                      className="bg-darkBox cursor-pointer hover:bg-opacity-80 rounded-2xl transition-all duration-200 hover:scale-105"
                    >
                      <img
                        src={image.url}
                        className="rounded-t-2xl w-full h-auto object-cover"
                        alt={image.name}
                      />
                      <div className="pb-4 pt-1 px-1">
                        <span
                          className="text-[#E7E7E7] text-xs line-clamp-2 mt-2"
                          title={image.name}
                        >
                          {image.name}
                        </span>
                      </div>
                    </div>
                  ))}
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
            .map((item) => (
              <div
                key={item.id}
                className="absolute inset-4 flex items-center justify-center overflow-hidden"
                style={{ zIndex: item.zIndex || 1 }}
              >
                <img
                  src={item.url}
                  alt={item.title}
                  className="object-contain max-w-full max-h-full cursor-move"
                  style={{
                    opacity: item.opacity || 1,
                    transform: `scale(${item.scale || 1}) translate(${
                      item.position?.x || 0
                    }px, ${item.position?.y || 0}px)`,
                    maxWidth: "100%",
                    maxHeight: "100%",
                    pointerEvents: "auto",
                  }}
                  onMouseDown={(e) => handleImageDragStart(e, item)}
                  onClick={(e) => handleSelectElement(item, e)}
                />
              </div>
            ))}
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
                  <p className="text-xs mt-1">
                    Click again to deselect
                  </p>
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

                {/* Color Correction */}
                <div className="border-t border-gray-600 pt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">
                    Color Correction
                  </h4>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Brightness: {selectedElement.colorCorrection?.brightness || 0}
                    </label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={selectedElement.colorCorrection?.brightness || 0}
                      onChange={(e) =>
                        updateSelectedElement(
                          "colorCorrection.brightness",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Contrast:{" "}
                      {selectedElement.colorCorrection?.contrast || 0}
                    </label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={selectedElement.colorCorrection?.contrast || 0}
                      onChange={(e) =>
                        updateSelectedElement(
                          "colorCorrection.contrast",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Saturation:{" "}
                      {selectedElement.colorCorrection?.saturation || 0}
                    </label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={selectedElement.colorCorrection?.saturation || 0}
                      onChange={(e) =>
                        updateSelectedElement(
                          "colorCorrection.saturation",
                          parseInt(e.target.value)
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
                      Temperature:{" "}
                      {selectedElement.colorCorrection?.temperature || 0}
                    </label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={selectedElement.colorCorrection?.temperature || 0}
                      onChange={(e) =>
                        updateSelectedElement(
                          "colorCorrection.temperature",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Tint: {selectedElement.colorCorrection?.tint || 0}
                    </label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={selectedElement.colorCorrection?.tint || 0}
                      onChange={(e) =>
                        updateSelectedElement(
                          "colorCorrection.tint",
                          parseInt(e.target.value)
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
                      updateSelectedElement("colorCorrection.contrast", 0);
                      updateSelectedElement("colorCorrection.saturation", 0);
                      updateSelectedElement("colorCorrection.hue", 0);
                      updateSelectedElement("colorCorrection.temperature", 0);
                      updateSelectedElement("colorCorrection.tint", 0);
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

                {/* Opacity Control */}
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">
                    Opacity: {Math.round((selectedElement.opacity || 1) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
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
                    Size: {Math.round((selectedElement.scale || 1) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.5"
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

                {/* Action buttons */}
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => {
                      updateSelectedElement("opacity", 1);
                      updateSelectedElement("scale", 1);
                      updateSelectedElement("position", { x: 0, y: 0 });
                      updateSelectedElement("zIndex", 1);
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
    </div>
  );
}

export default Editor;
