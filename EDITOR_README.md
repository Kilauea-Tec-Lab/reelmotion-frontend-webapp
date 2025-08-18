# Editor de Video Reelmotion

Un editor de video moderno y completo construido con React, similar a Canva o TikTok.

## 🚀 Características

### ✅ Funcionalidades Principales

- **Timeline Multi-pista**: Soporte para video, audio, imagen y texto
- **Drag & Drop**: Arrastra medios desde la librería al timeline o canvas
- **Canvas Visual**: Previsualización en tiempo real con elementos redimensionables
- **Controles de Reproducción**: Play, pause, seek, controles de volumen
- **Biblioteca de Medios**: Organización y búsqueda de archivos
- **Panel de Propiedades**: Edición detallada de elementos seleccionados

### 🎬 Edición de Video

- ✅ Agregar videos al timeline
- ✅ Recortar y dividir clips
- ✅ Ajustar velocidad de reproducción
- ✅ Controles de volumen y silencio
- ✅ Efectos de filtro (brillo, contraste, saturación, desenfoque)

### 🎵 Edición de Audio

- ✅ Pista de audio dedicada
- ✅ Múltiples tracks de audio simultáneos
- ✅ Controles de volumen individual
- ✅ Efectos de fade in/out
- ✅ Visualización de forma de onda

### 📝 Texto y Elementos

- ✅ Agregar texto personalizable
- ✅ Múltiples fuentes y tamaños
- ✅ Colores y estilos personalizables
- ✅ Posicionamiento libre en canvas
- ✅ Rotación y escalado

### 🎨 Efectos y Transiciones

- ✅ Animaciones de entrada y salida
- ✅ Transiciones entre clips
- ✅ Efectos de sombra y borde
- ✅ Filtros de imagen en tiempo real

### 🔧 Herramientas de Edición

- ✅ Zoom del timeline
- ✅ Herramientas de selección y movimiento
- ✅ Copiar y pegar elementos
- ✅ Deshacer/rehacer (en desarrollo)
- ✅ Capas y orden Z

## 📁 Estructura del Proyecto

```
src/editor/
├── main-editor.jsx          # Componente principal del editor
└── components/
    ├── Toolbar.jsx          # Barra de herramientas
    ├── MediaLibrary.jsx     # Biblioteca de medios
    ├── Timeline.jsx         # Timeline multi-pista
    ├── Canvas.jsx           # Canvas de edición visual
    ├── PropertiesPanel.jsx  # Panel de propiedades
    └── AudioTrack.jsx       # Pista de audio especializada
```

## 🛠️ Tecnologías Utilizadas

- **React 19** - Framework principal
- **Tailwind CSS** - Estilos y diseño
- **Framer Motion** - Animaciones suaves
- **@dnd-kit** - Drag and drop funcional
- **React Draggable** - Elementos arrastrables
- **React Resizable** - Redimensionado de elementos
- **Lucide React** - Iconos modernos

## 🎯 Uso del Editor

### 1. Navegación

- Accede al editor en `/editor`
- La interfaz se divide en 4 áreas principales:
  - **Toolbar** (superior): Herramientas y controles
  - **Media Library** (izquierda): Archivos disponibles
  - **Canvas** (centro): Previsualización del video
  - **Properties** (derecha): Propiedades del elemento seleccionado
  - **Timeline** (inferior): Línea de tiempo multi-pista

### 2. Agregando Medios

- **Subir archivos**: Usa el botón "Subir" en la biblioteca de medios
- **Drag & Drop**: Arrastra archivos desde tu sistema
- **Formatos soportados**: Video (mp4, webm), Audio (mp3, wav), Imágenes (jpg, png, webp)

### 3. Editando en el Timeline

- **Agregar al Timeline**: Arrastra medios al timeline
- **Mover clips**: Arrastra clips horizontalmente
- **Redimensionar**: Usa los handles en los extremos
- **Dividir clips**: Botón de tijeras cuando está seleccionado
- **Eliminar**: Botón de papelera o tecla Delete

### 4. Trabajando en el Canvas

- **Agregar elementos**: Arrastra medios al canvas
- **Seleccionar**: Haz clic en cualquier elemento
- **Mover**: Arrastra elementos seleccionados
- **Redimensionar**: Usa los handles de las esquinas
- **Rotar**: Ajusta en el panel de propiedades

### 5. Panel de Propiedades

- **Propiedades**: Posición, tamaño, rotación, opacidad
- **Estilo**: Filtros, bordes, sombras
- **Efectos**: Animaciones y transiciones
- **Capas**: Control de orden (en desarrollo)

### 6. Controles de Reproducción

- **Play/Pause**: Controla la reproducción
- **Seek**: Haz clic en el timeline para navegar
- **Volumen**: Control global de audio
- **Zoom**: Ajusta la escala del timeline

## 🎨 Atajos de Teclado

| Atajo      | Acción                |
| ---------- | --------------------- |
| `Espacio`  | Play/Pause            |
| `Ctrl + Z` | Deshacer              |
| `Ctrl + Y` | Rehacer               |
| `Ctrl + C` | Copiar                |
| `Ctrl + V` | Pegar                 |
| `Delete`   | Eliminar seleccionado |
| `Ctrl + S` | Guardar proyecto      |
| `+` / `-`  | Zoom in/out           |

## 🔄 Estados del Editor

### Timeline

- Múltiples pistas para diferentes tipos de media
- Indicador de tiempo actual (playhead rojo)
- Zoom ajustable para precisión
- Drag & drop entre pistas

### Canvas

- Previsualización en tiempo real
- Elementos redimensionables y arrastrables
- Grid de referencia
- Indicador de grabación durante reproducción

### Media Library

- Organización por tipo de archivo
- Búsqueda y filtrado
- Previsualización de thumbnails
- Información de duración y tamaño

## 🚧 Próximas Funcionalidades

- [ ] Exportación de video
- [ ] Más efectos de transición
- [ ] Keyframes para animaciones
- [ ] Capas avanzadas
- [ ] Plantillas predefinidas
- [ ] Colaboración en tiempo real
- [ ] Integración con IA para edición automática

## 💡 Tips de Uso

1. **Organización**: Usa la biblioteca de medios para mantener tus archivos organizados
2. **Precisión**: Usa el zoom del timeline para ediciones precisas
3. **Flujo de trabajo**: Primero agrega todos tus medios, luego organiza en el timeline
4. **Performance**: Mantén el canvas en una escala cómoda para mejor rendimiento
5. **Backup**: Guarda frecuentemente tu proyecto

¡Disfruta creando videos increíbles con Reelmotion! 🎬
