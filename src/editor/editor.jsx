import { div, span } from "framer-motion/client";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Clapperboard,
  ClapperboardIcon,
  Music,
  Image,
  X,
  Trash2,
  Mic,
} from "lucide-react";

/**
 * Editor - Advanced Timeline Video Editor
 *
 * Features:
 * - Drag and drop video, image, music, and voice elements to timeline
 * - Real-time drag and drop with collision resolution
 * - Trimming/resizing of timeline elements with handles
 * - Master volume control affecting all media
 * - Timeline scrubbing and playback controls
 * - Visual feedback during drag and resize operations
 *
 * Trimming Logic:
 * - Video/Music/Voice: Respects original media duration, tracks trimStart/trimEnd
 * - Images: Can be expanded/contracted freely (duration is flexible)
 * - Resize handles appear on hover for all timeline elements
 */

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

  // Estados para el drag de elementos del timeline
  const [draggingElement, setDraggingElement] = useState(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [currentDragX, setCurrentDragX] = useState(0); // Para guardar la posición actual del mouse
  const [dragPreviewPosition, setDragPreviewPosition] = useState(0); // Para mostrar la posición durante el drag
  const [masterVolume, setMasterVolume] = useState(1); // Volumen maestro (100% por defecto)
  const [isDraggingVolume, setIsDraggingVolume] = useState(false); // Para controlar el drag del volumen
  const volumeRef = useRef(null);

  // Estados para el recorte de elementos
  const [isResizing, setIsResizing] = useState(false);
  const [resizingElement, setResizingElement] = useState(null);
  const [resizeType, setResizeType] = useState(null); // 'start' o 'end'
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartTime, setResizeStartTime] = useState(0);

  // Estado para elemento seleccionado
  const [selectedElement, setSelectedElement] = useState(null);

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
      duration: 5, // duración por defecto para imágenes
    },
  ];

  const musicFiles = [
    {
      url: "/test/sample_music.mp3", // Placeholder - replace with actual music files
      name: "Sample Music Track",
      duration: 120, // duración por defecto para música
    },
  ];

  const voiceFiles = [
    {
      url: "/test/sample_voice.wav", // Placeholder - replace with actual voice files
      name: "Sample Voice Track",
      duration: 60, // duración por defecto para voz
    },
  ];

  // Funciones para controlar el volumen
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
    // Actualizar volumen de todos los audios
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) {
        audio.volume = volume;
      }
    });

    // Para el video principal, se actualizará en syncMediaWithTime
    // considerando tanto el volumen maestro como el volumen específico del video
  };

  // Funciones para drag and drop
  const handleDragStart = (e, video, type = "video") => {
    setDraggedItem({ ...video, type });
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // Función para obtener la duración real de un video
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
        console.warn(`No se pudo cargar el video: ${videoUrl}`);
        resolve(10); // duración por defecto si hay error
      };

      video.src = videoUrl;
    });
  };

  // Función para manejar cuando se carga la metadata de un video
  const handleVideoMetadata = async (videoUrl, videoElement) => {
    const duration = formatDuration(videoElement.duration);
    setVideoDurations((prev) => ({
      ...prev,
      [videoUrl]: duration,
    }));
  };

  // Calcular la duración total del timeline
  const getTimelineDuration = () => {
    if (arrayVideoMake.length === 0) return 120; // default 2 minutos

    const endTimes = arrayVideoMake.map((item) => item.endTime);
    const maxEndTime = endTimes.length > 0 ? Math.max(...endTimes) : 0;
    return Math.max(maxEndTime, 120); // mínimo 2 minutos
  };

  // Función para obtener el elemento activo en un momento dado
  const getActiveElements = (time) => {
    return arrayVideoMake.filter(
      (item) => time >= item.startTime && time < item.endTime
    );
  };

  // Función helper para formatear duraciones a 2 decimales
  const formatDuration = (duration) => {
    return Math.round(duration * 100) / 100;
  };

  // Función para reproducir/pausar
  const handlePlayPause = () => {
    if (isPlaying) {
      // Pausar
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Pausar todos los medios
      if (mainVideoRef.current) {
        mainVideoRef.current.pause();
      }

      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) audio.pause();
      });
    } else {
      // Solo reproducir si hay contenido en el timeline
      if (arrayVideoMake.length === 0) {
        alert("Agrega contenido al timeline antes de reproducir");
        return;
      }

      // Reproducir
      setIsPlaying(true);

      // Iniciar el timer del timeline
      intervalRef.current = setInterval(() => {
        // No actualizar el tiempo si el usuario está arrastrando el timeline
        if (!isDraggingTimeline) {
          setCurrentTime((prevTime) => {
            const newTime = prevTime + 0.2; // actualizar cada 200ms para mejor performance

            // Si llegamos al final, parar
            if (newTime >= getTimelineDuration()) {
              setIsPlaying(false);
              clearInterval(intervalRef.current);
              intervalRef.current = null;
              return 0; // reiniciar
            }

            return newTime;
          });
        }
      }, 200); // cambiar a 200ms
    }
  };

  // Función para sincronizar todos los medios con el tiempo actual
  const syncMediaWithTime = (time) => {
    const activeElements = getActiveElements(time);
    const activeVideo = activeElements.find((el) => el.channel === "video");

    // Manejar video principal
    if (mainVideoRef.current) {
      if (activeVideo) {
        const elementTime = time - activeVideo.startTime;
        // Ajustar por trim del inicio
        const adjustedTime = elementTime + (activeVideo.trimStart || 0);

        // Solo cambiar src si es diferente para evitar parpadeo
        if (!mainVideoRef.current.src.includes(activeVideo.url)) {
          mainVideoRef.current.src = activeVideo.url;
          mainVideoRef.current.currentTime = adjustedTime;
          // Aplicar volumen específico del video y volumen maestro
          mainVideoRef.current.volume =
            (activeVideo.volume !== undefined ? activeVideo.volume : 1) *
            masterVolume;
          if (isPlaying) {
            mainVideoRef.current.play().catch(() => {});
          }
        } else {
          // Solo ajustar tiempo si está muy desincronizado
          const timeDiff = Math.abs(
            mainVideoRef.current.currentTime - adjustedTime
          );
          if (timeDiff > 0.5) {
            mainVideoRef.current.currentTime = adjustedTime;
          }
          // Actualizar volumen siempre
          mainVideoRef.current.volume =
            (activeVideo.volume !== undefined ? activeVideo.volume : 1) *
            masterVolume;
          if (mainVideoRef.current.paused && isPlaying) {
            mainVideoRef.current.play().catch(() => {});
          }
        }

        // Aplicar corrección de color
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
          // Simular temperatura usando sepia y hue-rotate
          if (cc.temperature !== 0) {
            const tempIntensity = Math.abs(cc.temperature) / 100;
            if (cc.temperature > 0) {
              // Cálido (sepia + hue hacia amarillo)
              filters.push(`sepia(${tempIntensity * 0.3})`);
              filters.push(`hue-rotate(${cc.temperature * 0.3}deg)`);
            } else {
              // Frío (hue hacia azul)
              filters.push(`hue-rotate(${cc.temperature * 1.5}deg)`);
            }
          }
          // Simular tinte usando hue-rotate
          if (cc.tint !== 0) {
            filters.push(`hue-rotate(${cc.tint * 1.8}deg)`);
          }
        }

        // Aplicar filtros siempre, incluso si está vacío
        mainVideoRef.current.style.filter =
          filters.length > 0 ? filters.join(" ") : "none";

        // Mostrar el video
        mainVideoRef.current.style.display = "block";
      } else {
        // No hay video activo, pausar y ocultar
        if (!mainVideoRef.current.paused) {
          mainVideoRef.current.pause();
        }
        // Limpiar efectos cuando no hay video
        mainVideoRef.current.style.filter = "none";
        mainVideoRef.current.style.display = "none";
      }
    }

    // Manejar audio (simplificado)
    activeElements.forEach((element) => {
      if (element.channel === "music" || element.channel === "voice") {
        if (!audioRefs.current[element.id]) {
          const audio = new Audio(element.url);
          audio.volume = masterVolume; // Aplicar volumen maestro
          audioRefs.current[element.id] = audio;
        }

        const audio = audioRefs.current[element.id];
        const elementTime = time - element.startTime;
        // Ajustar por trim del inicio
        const adjustedTime = elementTime + (element.trimStart || 0);

        if (Math.abs(audio.currentTime - adjustedTime) > 0.3) {
          audio.currentTime = adjustedTime;
        }
        if (audio.paused) {
          audio.play().catch(() => {});
        }
      }
    });

    // Pausar elementos inactivos
    Object.keys(audioRefs.current).forEach((elementId) => {
      const isActive = activeElements.some((el) => el.id === elementId);
      if (!isActive && audioRefs.current[elementId]) {
        audioRefs.current[elementId].pause();
      }
    });
  };

  // Efecto para sincronizar medios cuando cambia el tiempo actual
  useEffect(() => {
    if (isPlaying) {
      syncMediaWithTime(currentTime);
    }
  }, [currentTime, isPlaying]);

  // Limpiar intervalos cuando el componente se desmonte
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

  // Efecto para manejar cambios en el timeline o cuando se detiene la reproducción
  useEffect(() => {
    if (!isPlaying && currentTime === 0) {
      // Reset - ocultar video y mostrar placeholder
      if (mainVideoRef.current) {
        mainVideoRef.current.style.display = "none";
        mainVideoRef.current.pause();
      }
    }
  }, [isPlaying, currentTime]);

  // Efecto para aplicar cambios en tiempo real cuando se edita el elemento seleccionado
  useEffect(() => {
    if (
      selectedElement &&
      (selectedElement.colorCorrection || selectedElement.volume !== undefined)
    ) {
      // Forzar re-sincronización para aplicar efectos inmediatamente
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

    // Determinar el canal correcto basado en el tipo de elemento
    let targetChannel = channel;
    if (draggedItem.type === "video") {
      targetChannel = "video";
    } else if (draggedItem.type === "image") {
      targetChannel = "image";
    }

    // Obtener duración real del elemento
    let elementDuration = 10; // duración por defecto
    let originalDuration = 10; // duración original del medio

    if (draggedItem.type === "video") {
      // Si ya tenemos la duración en cache, la usamos
      if (videoDurations[draggedItem.url]) {
        elementDuration = videoDurations[draggedItem.url];
        originalDuration = videoDurations[draggedItem.url];
      } else {
        // Si no, la obtenemos dinámicamente
        elementDuration = await getVideoDuration(draggedItem.url);
        originalDuration = elementDuration;
        setVideoDurations((prev) => ({
          ...prev,
          [draggedItem.url]: elementDuration,
        }));
      }
    } else if (draggedItem.type === "image") {
      elementDuration = draggedItem.duration || 5; // 5 segundos para imágenes
      originalDuration = null; // Las imágenes no tienen duración fija
    } else if (draggedItem.type === "music" || draggedItem.type === "voice") {
      // Para audio, asumir duración por defecto (esto debería mejorarse con carga real)
      elementDuration = 30; // 30 segundos por defecto para audio
      originalDuration = 30;
    }

    // Encontrar el último elemento en el canal target para evitar superposiciones
    const elementsInChannel = arrayVideoMake.filter(
      (item) => item.channel === targetChannel
    );
    let startTime = 0;

    if (elementsInChannel.length > 0) {
      // Encontrar el tiempo final más grande en este canal
      const lastEndTime = Math.max(
        ...elementsInChannel.map((item) => item.endTime)
      );
      startTime = lastEndTime; // Empezar después del último elemento
    }

    // Crear nuevo elemento para el timeline
    const newElement = {
      id: `${targetChannel}_${Date.now()}`,
      channel: targetChannel,
      startTime: formatDuration(startTime),
      endTime: formatDuration(startTime + elementDuration), // usar duración real
      type: draggedItem.type,
      url: draggedItem.url,
      title: draggedItem.title || draggedItem.name,
      duration: formatDuration(elementDuration), // duración actual en el timeline
      originalDuration: originalDuration, // duración original del medio (null para imágenes)
      trimStart: 0, // tiempo recortado del inicio
      trimEnd: 0, // tiempo recortado del final
      effects: [],
      volume: targetChannel === "music" || targetChannel === "voice" ? 0.5 : 1,
      opacity: 1,
      position: { x: 0, y: 0 },
      scale: 1,
      zIndex: 1,
      // Propiedades específicas para videos
      colorCorrection: {
        brightness: 0, // -100 a 100
        contrast: 0, // -100 a 100
        saturation: 0, // -100 a 100
        hue: 0, // -180 a 180
        temperature: 0, // -100 a 100 (cálido/frío)
        tint: 0, // -100 a 100 (magenta/verde)
      },
    };

    setArrayVideoMake((prev) => [...prev, newElement]);
    setDraggedItem(null);
  };

  // Función para manejar clic en el timeline
  const handleTimelineClick = (e) => {
    // No procesar si estamos arrastrando un elemento
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

  // Función para iniciar el arrastre del timeline
  const handleTimelineMouseDown = (e) => {
    // No procesar si estamos arrastrando un elemento
    if (draggingElement) return;

    setIsDraggingTimeline(true);
    handleTimelineClick(e);
  };

  // Efecto para manejar eventos globales de mouse
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingTimeline && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(clickX / rect.width, 1));
        const newTime = percentage * getTimelineDuration();
        setCurrentTime(newTime);
      }

      // Manejar drag de volumen
      if (isDraggingVolume && volumeRef.current) {
        const rect = volumeRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(clickX / rect.width, 1));
        setMasterVolume(percentage);
        updateAllVolumes(percentage);
      }

      // Manejar drag de elementos del timeline
      if (draggingElement && timelineRef.current) {
        setCurrentDragX(e.clientX); // Guardar la posición actual del mouse
        const rect = timelineRef.current.getBoundingClientRect();
        const newStartTime = calculateNewPosition(e.clientX, rect);

        // Actualizar la posición de vista previa en tiempo real
        setDragPreviewPosition(newStartTime);
      }

      // Manejar redimensionamiento de elementos
      if (isResizing && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const newTime = calculateResizePosition(e.clientX, rect);

        // Aplicar redimensionamiento en tiempo real
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
        // Sincronizar inmediatamente los medios cuando se termina de arrastrar
        syncMediaWithTime(currentTime);
      }

      // Manejar fin del drag de volumen
      if (isDraggingVolume) {
        setIsDraggingVolume(false);
      }

      // Manejar fin del drag de elementos
      if (draggingElement && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        // Usar currentDragX si está disponible, sino usar e.clientX
        const dragEndX = currentDragX || e.clientX;
        const newStartTime = calculateNewPosition(dragEndX, rect);

        // Resolver colisiones y actualizar el array
        const updatedElements = resolveCollisions(
          draggingElement,
          newStartTime
        );
        setArrayVideoMake(updatedElements);

        // Limpiar estado de drag
        setDraggingElement(null);
        setDragStartX(0);
        setDragStartTime(0);
        setCurrentDragX(0);
        setDragPreviewPosition(0);
        document.body.style.cursor = "default";
      }

      // Manejar fin del redimensionamiento
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
    isResizing,
    resizingElement,
    resizeType,
  ]);

  // Función para obtener un color único para cada elemento
  const getElementColor = (elementId, index) => {
    const colors = [
      "#4A90E2", // Azul
      "#FF6B6B", // Rojo coral
      "#50C878", // Verde esmeralda
      "#9B59B6", // Púrpura
      "#F39C12", // Naranja
      "#E74C3C", // Rojo
      "#3498DB", // Azul claro
      "#2ECC71", // Verde
      "#9B2ECC", // Morado
      "#E67E22", // Naranja oscuro
      "#1ABC9C", // Turquesa
      "#F1C40F", // Amarillo
      "#E91E63", // Rosa
      "#FF5722", // Naranja rojizo
      "#607D8B", // Azul grisáceo
    ];

    // Usar el hash del ID para obtener un índice consistente
    const hashCode = elementId.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hashCode) % colors.length];
  };

  // Función para seleccionar/deseleccionar un elemento
  const handleSelectElement = (element, e) => {
    e.stopPropagation();
    if (selectedElement && selectedElement.id === element.id) {
      // Si ya está seleccionado, deseleccionar
      setSelectedElement(null);
    } else {
      // Seleccionar el elemento
      setSelectedElement(element);
    }
  };

  // Función para actualizar propiedades del elemento seleccionado
  const updateSelectedElement = (property, value) => {
    if (!selectedElement) return;

    setArrayVideoMake((prev) =>
      prev.map((item) => {
        if (item.id === selectedElement.id) {
          // Manejar propiedades anidadas como colorCorrection
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

    // Actualizar también el estado del elemento seleccionado
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

  // Función para eliminar un elemento del timeline
  const handleDeleteElement = (elementId) => {
    setArrayVideoMake((prev) => {
      // Simplemente filtrar el elemento sin reacomodar los demás
      return prev.filter((item) => item.id !== elementId);
    });

    // Si el elemento eliminado era el seleccionado, deseleccionar
    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement(null);
    }
  };

  // Funciones para el redimensionamiento/recorte de elementos
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
      // Redimensionar desde el inicio
      const newStartTime = Math.max(
        0,
        Math.min(newTime, element.endTime - 0.1)
      );
      const newDuration = element.endTime - newStartTime;

      if (isMediaWithFixedDuration && element.originalDuration) {
        // Para medios con duración fija, verificar límites
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
        // Para imágenes, permitir redimensionamiento libre
        updatedElement.startTime = formatDuration(newStartTime);
        updatedElement.duration = formatDuration(newDuration);
      }
    } else {
      // Redimensionar desde el final
      if (isMediaWithFixedDuration && element.originalDuration) {
        // Para medios con duración fija, NO PERMITIR EXPANDIR más allá de la duración original
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
        // Para imágenes, permitir redimensionamiento libre
        const newEndTime = Math.max(element.startTime + 0.1, newTime);
        const newDuration = newEndTime - element.startTime;

        updatedElement.endTime = formatDuration(newEndTime);
        updatedElement.duration = formatDuration(newDuration);
      }
    }

    return updatedElement;
  };

  // Función helper para obtener la posición de renderizado de un elemento
  const getElementRenderPosition = (element) => {
    // Si este elemento se está arrastrando, usar la posición de vista previa
    if (draggingElement?.id === element.id && dragPreviewPosition !== null) {
      return dragPreviewPosition;
    }
    // Si no, usar la posición normal
    return element.startTime;
  };

  // Función para iniciar el drag de un elemento del timeline
  const handleElementDragStart = (e, element) => {
    e.stopPropagation(); // Evitar que se active el drag del timeline
    setDraggingElement(element);
    setDragStartX(e.clientX);
    setCurrentDragX(e.clientX); // Inicializar la posición actual
    setDragStartTime(element.startTime);
    setDragPreviewPosition(element.startTime); // Inicializar la posición de vista previa

    // Cambiar el cursor
    document.body.style.cursor = "grabbing";
  };

  // Función para calcular nueva posición basada en el drag
  const calculateNewPosition = (clientX, timelineRect) => {
    const deltaX = clientX - dragStartX;
    const timelineWidth = timelineRect.width;
    const timelineDuration = getTimelineDuration();

    // Convertir el delta de píxeles a tiempo
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

    // Hay colisión, encontrar la mejor posición
    const sortedElements = sameChannelElements.sort(
      (a, b) => a.startTime - b.startTime
    );

    // Intentar colocar el elemento antes del primer elemento que colisiona
    for (let i = 0; i < sortedElements.length; i++) {
      const element = sortedElements[i];

      // Verificar si cabe antes de este elemento
      if (
        formattedNewStartTime < element.startTime &&
        newEndTime <= element.startTime
      ) {
        // Cabe aquí
        return otherElements.concat([
          {
            ...movedElement,
            startTime: formattedNewStartTime,
            endTime: newEndTime,
          },
        ]);
      }

      // Intentar colocar después de este elemento
      const afterPosition = formatDuration(element.endTime);
      const afterEndTime = formatDuration(afterPosition + duration);

      // Verificar si cabe después de este elemento y antes del siguiente (si existe)
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

    // Si no encuentra lugar, colocar al final
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

  // Funciones para guardar y exportar proyecto
  const handleSaveProject = () => {
    const projectData = {
      timeline: arrayVideoMake,
      settings: {
        masterVolume: masterVolume,
        duration: getTimelineDuration(),
        currentTime: currentTime,
      },
      metadata: {
        name: "Mi Proyecto",
        createdAt: new Date().toISOString(),
        version: "1.0",
      },
    };

    // Guardar en localStorage (para persistencia local)
    localStorage.setItem("reelmotion_project", JSON.stringify(projectData));

    // También crear un archivo descargable
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

    alert("Proyecto guardado exitosamente!");
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

          // Deseleccionar cualquier elemento
          setSelectedElement(null);

          alert("Proyecto cargado exitosamente!");
        } catch (error) {
          alert("Error al cargar el proyecto: " + error.message);
        }
      };
      reader.readAsText(file);
    };

    input.click();
  };

  const handleExportVideo = () => {
    // Simulación de exportación de video
    if (arrayVideoMake.length === 0) {
      alert("No hay contenido en el timeline para exportar");
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

    // En una implementación real, esto se enviaría a un servidor para procesar
    console.log("Datos de exportación:", exportData);

    // Crear archivo con la configuración de exportación
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
      "Configuración de exportación guardada. En una implementación completa, aquí se procesaría el video."
    );
  };

  // Cargar proyecto automáticamente al montar el componente
  useEffect(() => {
    const savedProject = localStorage.getItem("reelmotion_project");
    if (savedProject) {
      try {
        const projectData = JSON.parse(savedProject);
        if (projectData.timeline && projectData.timeline.length > 0) {
          const shouldLoad = window.confirm(
            "¿Deseas cargar el último proyecto guardado?"
          );
          if (shouldLoad) {
            setArrayVideoMake(projectData.timeline);
            if (projectData.settings) {
              setMasterVolume(projectData.settings.masterVolume || 1);
            }
          }
        }
      } catch (error) {
        console.warn("Error al cargar proyecto guardado:", error);
      }
    }
  }, []);

  // Sincronizar elemento seleccionado con cambios en el array
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
          Editing Video
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
              {/* Barra de progreso del volumen */}
              <div
                className="h-full bg-primarioLogo rounded-full transition-all duration-100"
                style={{ width: `${masterVolume * 100}%` }}
              ></div>

              {/* Indicador del volumen */}
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

              {/* Indicador visual cuando se hace hover */}
              <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-2 opacity-0 group-hover:opacity-20 bg-primarioLogo rounded-full transition-opacity duration-200"></div>
            </div>

            {/* Mostrar porcentaje del volumen */}
            <span className="text-xs text-gray-400 w-8">
              {Math.round(masterVolume * 100)}%
            </span>

            {/* Debug: Mostrar cantidad de elementos en el timeline */}
            <span className="text-xs text-gray-400 ml-4">
              Elementos: {arrayVideoMake.length}
              {arrayVideoMake.length > 0 && (
                <span>
                  {" "}
                  | Duración:{" "}
                  {Math.max(...arrayVideoMake.map((item) => item.endTime), 0)}s
                </span>
              )}
              {isResizing && resizingElement && (
                <span className="text-yellow-400">
                  {" "}
                  | Recortando: {resizingElement.title}
                </span>
              )}
              {draggingElement && (
                <span className="text-blue-400">
                  {" "}
                  | Moviendo: {draggingElement.title}
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
                  ? "Presiona play para ver tu video"
                  : "Arrastra videos aquí para empezar"}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Tu video final aparecerá en esta área
              </p>
            </div>
          </div>
          {/* Overlay para imágenes y texto */}
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
                className="absolute inset-4 flex items-center justify-center pointer-events-none overflow-hidden"
                style={{ zIndex: item.zIndex || 1 }}
              >
                <img
                  src={item.url}
                  alt={item.title}
                  className="object-contain max-w-full max-h-full"
                  style={{
                    opacity: item.opacity || 1,
                    transform: `scale(${item.scale || 1}) translate(${
                      item.position?.x || 0
                    }px, ${item.position?.y || 0}px)`,
                    maxWidth: "100%",
                    maxHeight: "100%",
                  }}
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
                  ? `Editar Imagen: ${selectedElement.title}`
                  : selectedElement && selectedElement.type === "video"
                  ? `Editar Video: ${selectedElement.title}`
                  : "Controles del Editor"
              }
            >
              {selectedElement && selectedElement.type === "image"
                ? `Editar Imagen: ${selectedElement.title}`
                : selectedElement && selectedElement.type === "video"
                ? `Editar Video: ${selectedElement.title}`
                : "Controles del Editor"}
            </h3>

            {selectedElement && selectedElement.type === "video" ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-300 mb-4">
                  <p>Duración: {selectedElement.duration}s</p>
                  <p className="text-xs mt-1">
                    Haz clic nuevamente para deseleccionar
                  </p>
                </div>

                {/* Control de Volumen para Videos */}
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">
                    Volumen:{" "}
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

                {/* Control de Z-Index para Videos */}
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">
                    Capa (Z-Index): {selectedElement.zIndex || 1}
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

                {/* Corrección de Color */}
                <div className="border-t border-gray-600 pt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">
                    Corrección de Color
                  </h4>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Brillo: {selectedElement.colorCorrection?.brightness || 0}
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
                      Contraste:{" "}
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
                      Saturación:{" "}
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
                      Matiz: {selectedElement.colorCorrection?.hue || 0}°
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
                      Temperatura:{" "}
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
                      Tinte: {selectedElement.colorCorrection?.tint || 0}
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

                {/* Botones de acción */}
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
                    Resetear
                  </button>
                  <button
                    onClick={() => setSelectedElement(null)}
                    className="flex-1 bg-primarioLogo text-black px-3 py-2 rounded-lg text-sm hover:bg-opacity-80 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : selectedElement && selectedElement.type === "image" ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-300 mb-4">
                  <p>Duración: {selectedElement.duration}s</p>
                  <p className="text-xs mt-1">
                    Haz clic nuevamente para deseleccionar
                  </p>
                </div>

                {/* Control de Opacidad */}
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">
                    Opacidad: {Math.round((selectedElement.opacity || 1) * 100)}
                    %
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

                {/* Control de Tamaño */}
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">
                    Tamaño: {Math.round((selectedElement.scale || 1) * 100)}%
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

                {/* Control de Posición X */}
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">
                    Posición X: {selectedElement.position?.x || 0}px
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="5"
                    value={selectedElement.position?.x || 0}
                    onChange={(e) =>
                      updateSelectedElement("position", {
                        ...selectedElement.position,
                        x: parseInt(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                  />
                </div>

                {/* Control de Posición Y */}
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">
                    Posición Y: {selectedElement.position?.y || 0}px
                  </label>
                  <input
                    type="range"
                    min="-80"
                    max="80"
                    step="5"
                    value={selectedElement.position?.y || 0}
                    onChange={(e) =>
                      updateSelectedElement("position", {
                        ...selectedElement.position,
                        y: parseInt(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-darkBoxSub rounded-lg appearance-none cursor-pointer accent-primarioLogo"
                  />
                </div>

                {/* Control de Z-Index */}
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">
                    Capa (Z-Index): {selectedElement.zIndex || 1}
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

                {/* Botones de acción */}
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
                    Resetear
                  </button>
                  <button
                    onClick={() => setSelectedElement(null)}
                    className="flex-1 bg-primarioLogo text-black px-3 py-2 rounded-lg text-sm hover:bg-opacity-80 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : arrayVideoMake.length === 0 ? (
              <div className="text-sm text-gray-300 space-y-2">
                <p>• Arrastra videos, imágenes, música o voz al timeline</p>
                <p>• Usa las pestañas de la izquierda para navegar</p>
                <p>• Los elementos se colocan automáticamente</p>
              </div>
            ) : (
              <div className="text-sm text-gray-300 space-y-2">
                <p>• Arrastra elementos para moverlos</p>
                <p>• Arrastra los bordes para recortar</p>
                <p>• Haz clic en la línea de tiempo para navegar</p>
                <p>• Usa el control de volumen maestro</p>
                <p>• Haz clic en videos/imágenes para editarlos</p>
                {(isResizing || draggingElement) && (
                  <div className="mt-3 p-2 bg-yellow-500 bg-opacity-20 rounded text-yellow-200">
                    {isResizing && "✂️ Recortando elemento"}
                    {draggingElement && "📦 Moviendo elemento"}
                  </div>
                )}
                {selectedElement && (
                  <div className="mt-3 p-2 bg-primarioLogo bg-opacity-20 rounded text-yellow-200">
                    {selectedElement.type === "video" &&
                      `🎬 Video seleccionado: ${
                        selectedElement.title
                      } (Vol: ${Math.round(
                        (selectedElement.volume !== undefined
                          ? selectedElement.volume
                          : 1) * 100
                      )}%)`}
                    {selectedElement.type === "image" &&
                      `🎨 Imagen seleccionada: ${selectedElement.title}`}
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
              {/* Renderizar elementos del timeline para el canal de video */}
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
                      // Solo iniciar drag si no es el botón de eliminar o las manijas
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

          {/* Images/Text Track */}
          <div className="flex items-center gap-3">
            <div className="w-16 text-white text-sm font-medium">Imagen</div>
            <div
              className="flex-1 bg-darkBoxSub rounded-lg h-8 relative transition-all duration-200 hover:bg-opacity-80"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "image")}
            >
              {/* Renderizar elementos del timeline para el canal de imagen/texto */}
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
            <div className="w-16 text-white text-sm font-medium">Música</div>
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
            <div className="w-16 text-white text-sm font-medium">Voz</div>
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
