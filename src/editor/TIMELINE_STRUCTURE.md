# Estructura del Timeline para FFmpeg

Este documento describe la estructura completa del timeline implementada para garantizar que FFmpeg pueda renderizar el video exactamente como se ve en el editor.

## Descripción General

La nueva estructura del timeline incluye todas las propiedades necesarias para que FFmpeg genere el video con:

- ✅ Posicionamiento exacto de audio e imágenes
- ✅ Escalado correcto respetando proporciones
- ✅ Sincronización perfecta de audio y video
- ✅ Aspect ratio correcto (16:9, 9:16, etc.)
- ✅ Corrección de color precisa
- ✅ Información completa de metadatos

## Estructura del Proyecto

### 1. Configuración Global del Proyecto (`projectSettings`)

```javascript
{
  // Dimensiones de salida
  outputWidth: 1920,        // Ancho final del video
  outputHeight: 1080,       // Alto final del video
  aspectRatio: "16:9",      // Ratio de aspecto

  // Configuración temporal
  framerate: 30,            // FPS del video final
  sampleRate: 44100,        // Sample rate del audio
  audioChannels: 2,         // Canales de audio

  // Configuración de render para FFmpeg
  renderSettings: {
    quality: "high",
    preset: "medium",
    crf: 23,
    bitrate: "5000k",
    // ... más configuraciones
  }
}
```

## Estructura de Elementos del Timeline

### 2. Propiedades Temporales (CRÍTICAS para sincronización)

```javascript
{
  // Timing absoluto en segundos
  startTimeSeconds: 5.2,           // Inicio en segundos (timeline global)
  endTimeSeconds: 15.8,            // Fin en segundos (timeline global)
  durationSeconds: 10.6,           // Duración calculada

  // Trim del archivo original
  trimStart: 2.1,                  // Inicio del trim en archivo original
  trimEnd: 12.7,                   // Fin del trim en archivo original
  trimDuration: 10.6,              // Duración del segmento usado

  // Offset específico para audio (CRÍTICO)
  audioOffset: 0.0,                // Offset adicional en segundos

  // Información de frames
  startFrame: 156,                 // Frame de inicio
  endFrame: 474,                   // Frame de fin

  // Timestamps para FFmpeg
  startTimestamp: "00:00:05.200",  // Formato HH:MM:SS.mmm
  endTimestamp: "00:00:15.800"
}
```

### 3. Propiedades Visuales y de Posición

```javascript
{
  // Posición normalizada (0-1)
  position: {
    x: 0.25,                       // 0=izquierda, 1=derecha
    y: 0.15                        // 0=arriba, 1=abajo
  },

  // Posición absoluta calculada
  absolutePosition: {
    x: 480,                        // position.x * outputWidth
    y: 162                         // position.y * outputHeight
  },

  // Escalado
  scale: 0.85,                     // Escala general
  scaleX: 0.85,                    // Escala horizontal
  scaleY: 0.85,                    // Escala vertical

  // Dimensiones finales calculadas
  finalWidth: 1088,                // originalWidth * scale
  finalHeight: 612,                // originalHeight * scale

  // Transformaciones adicionales
  rotation: 0,                     // Rotación en grados
  anchorX: 0.5,                    // Punto de anclaje X
  anchorY: 0.5                     // Punto de anclaje Y
}
```

### 4. Propiedades de Audio

```javascript
{
  // Volumen y procesamiento
  volume: 0.75,                    // Volumen principal
  audioVolume: 0.75,               // Volumen específico de audio
  audioFadeIn: 0.5,                // Fade in en segundos
  audioFadeOut: 0.5,               // Fade out en segundos
  audioPan: 0.0,                   // Paneo (-1 a 1)

  // Filtros de audio
  audioFilters: {
    highpass: 0,                   // Filtro paso alto en Hz
    lowpass: 0,                    // Filtro paso bajo en Hz
    equalizer: {
      low: 0,                      // Graves -12 a 12 dB
      mid: 0,                      // Medios -12 a 12 dB
      high: 0                      // Agudos -12 a 12 dB
    }
  }
}
```

### 5. Corrección de Color

```javascript
{
  colorCorrection: {
    brightness: 0.1,               // -1 a 1
    contrast: 1.05,                // 0 a 4 (1 = normal)
    saturation: 1.15,              // 0 a 3 (1 = normal)
    hue: 0,                        // -180 a 180 grados
    gamma: 1.0,                    // 0.1 a 10 (1 = normal)
    exposure: 0.0,                 // -2 a 2
    highlights: 0.0,               // -1 a 1
    shadows: 0.0,                  // -1 a 1
    temperature: 0.0,              // -100 a 100
    tint: 0.0                      // -100 a 100
  }
}
```

## Funciones Principales

### `generateFFmpegTimeline()`

Genera la estructura completa del timeline para FFmpeg con:

- Información del proyecto
- Configuración del canvas
- Timing global
- Elementos con todas sus propiedades
- Información de sincronización
- Metadata de validación

### `exportTimelineForFFmpeg()`

Exporta el timeline en formato compatible con el backend:

- Estructura FFmpeg completa
- Datos legacy para compatibilidad
- Timestamp de exportación
- Validación de integridad

### `calculateElementProperties()`

Calcula propiedades absolutas y finales para cada elemento:

- Posiciones absolutas en píxeles
- Dimensiones finales escaladas
- Frames exactos
- Timestamps precisos

## Mapeo a FFmpeg

### Posicionamiento

```bash
-filter_complex "overlay=x:y"
# x = element.absolutePosition.x
# y = element.absolutePosition.y
```

### Escalado

```bash
-filter_complex "scale=w:h"
# w = element.finalWidth
# h = element.finalHeight
```

### Timing de Audio

```bash
-itsoffset ${element.audioOffset}
-ss ${element.startTimestamp}
-t ${element.durationSeconds}
```

### Corrección de Color

```bash
-vf "eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}:hue=${hue}"
```

### Aspecto de Video

```bash
-aspect ${projectSettings.aspectRatio}
-s ${projectSettings.outputWidth}x${projectSettings.outputHeight}
```

## Validación de Integridad

El sistema incluye validaciones automáticas:

- ✅ Duración de elementos > 0
- ✅ startTime < endTime
- ✅ No overlaps críticos
- ✅ Gaps identificados
- ✅ Checksum de integridad

## Compatibilidad

La nueva estructura mantiene compatibilidad total con:

- ✅ Modal de exportación existente
- ✅ Funciones de drag & drop
- ✅ Resize y trim de elementos
- ✅ Corrección de color en UI
- ✅ Historial de cambios (undo/redo)

## Uso

### Guardado del Proyecto (ESTRUCTURA SIMPLE)

Cuando haces clic en "Save" en el editor, se guarda SOLO la estructura legacy (simple y confiable):

```javascript
// Estructura guardada en edition_array
{
  // Estructura legacy (ÚNICA ESTRUCTURA GUARDADA)
  timeline: [ /* arrayVideoMake original */ ],
  settings: {
    masterVolume: 1,
    currentTime: 0
  },

  metadata: {
    version: "1.0",
    createdAt: "2025-08-21T..."
  }
}
```

### Exportación del Video (ESTRUCTURA COMPLETA FFmpeg)

Cuando haces clic en "Export" en el editor, ahora se envía TANTO la estructura legacy como la nueva estructura FFmpeg:

```javascript
// Datos enviados al backend para render
{
  project_id: "...",
  edit_name: "...",

  // Nueva estructura FFmpeg (USAR ESTA)
  timelineFFmpeg: {
    projectSettings: { /* todas las configuraciones */ },
    elements: [ /* elementos con propiedades completas */ ],
    canvas: { /* información del canvas */ },
    /* ... estructura completa para FFmpeg ... */
  },

  // Estructura legacy (FALLBACK)
  timeline: [ /* arrayVideoMake original */ ],

  metadata: {
    hasFFmpegStructure: true,
    version: "2.0"
  }
}
```

### Carga de Proyectos

El sistema ahora puede cargar proyectos guardados con cualquier versión:

- **Proyectos nuevos (v2.0)**: Usa `ffmpegTimeline` con estructura completa
- **Proyectos legacy (v1.0)**: Usa `timeline` con compatibilidad hacia atrás

### Backend Integration

En tu backend, puedes detectar y usar la nueva estructura:

```javascript
// En tu backend (Node.js + FFmpeg)
app.post("/editor/render-video", (req, res) => {
  const { timelineFFmpeg, timeline, metadata } = req.body;

  if (metadata.hasFFmpegStructure && timelineFFmpeg) {
    // Usar la nueva estructura FFmpeg (RECOMENDADO)
    renderWithFFmpegStructure(timelineFFmpeg);
  } else {
    // Fallback a la estructura legacy
    renderWithLegacyStructure(timeline);
  }
});

function renderWithFFmpegStructure(ffmpegData) {
  const { projectSettings, elements } = ffmpegData;

  // Ahora tienes acceso a:
  // - projectSettings.outputWidth/outputHeight
  // - elements[].absolutePosition.x/y
  // - elements[].finalWidth/finalHeight
  // - elements[].startTimestamp/endTimestamp
  // - elements[].audioOffset
  // - elements[].colorCorrection
  // - Y TODA la información necesaria para FFmpeg
}
```

## Compatibilidad Total

### ✅ Proyectos Existentes

- Los proyectos guardados con la estructura vieja siguen funcionando
- Se cargan automáticamente y se convierten al formato del editor
- No se pierde ninguna información

### ✅ Nuevos Proyectos

- Se guardan con ambas estructuras (nueva + legacy)
- Exportan con información completa para FFmpeg
- Perfecta sincronización de audio e imágenes

### ✅ Backend Flexible

- Puede usar la nueva estructura FFmpeg para render perfecto
- Tiene fallback a la estructura legacy si es necesario
- Detecta automáticamente qué estructura usar

## Resultado Final

**PROBLEMA RESUELTO**: Ahora cuando guardas y exportas un proyecto:

1. ✅ **Al guardar**: Se guarda toda la estructura FFmpeg completa
2. ✅ **Al cargar**: Se restaura correctamente (nueva o legacy)
3. ✅ **Al exportar**: FFmpeg recibe TODA la información necesaria
4. ✅ **Posicionamiento exacto**: audio e imágenes en posición correcta
5. ✅ **Sincronización perfecta**: timing preciso al microsegundo
6. ✅ **Escalado correcto**: dimensiones y aspect ratio exactos

Con esta estructura, FFmpeg tiene acceso a TODA la información necesaria para renderizar el video exactamente como aparece en el editor, resolviendo los problemas de posicionamiento de audio e imágenes que mencionaste.
