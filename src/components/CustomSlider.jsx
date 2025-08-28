import { useState, useRef, useEffect, useCallback } from "react";

const CustomSlider = ({ value, min, max, step, onChange, className = "" }) => {
  const sliderRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const isDraggingRef = useRef(false);
  const minRef = useRef(min);
  const maxRef = useRef(max);
  const handleMouseUpRef = useRef(null);
  const currentDragValueRef = useRef(null); // Ref para el valor actual del drag
  const [dragValue, setDragValue] = useState(null);

  // Actualizar refs
  useEffect(() => {
    onChangeRef.current = onChange;
    minRef.current = min;
    maxRef.current = max;
  });

  // Usar dragValue para visualización durante drag, value para cuando no está draggeando
  const currentValue =
    isDraggingRef.current && dragValue !== null ? dragValue : value;
  const percentage = ((currentValue - min) / (max - min)) * 100;

  const handleInputChange = (e) => {
    onChange(e);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(
      0,
      Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
    );
    const newValue =
      minRef.current + (percentage / 100) * (maxRef.current - minRef.current);

    // Actualizar tanto el state como la ref con el valor más reciente
    currentDragValueRef.current = newValue;
    setDragValue(newValue);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current && currentDragValueRef.current !== null) {
      // Usar el valor más reciente del drag desde la ref
      const finalValue = currentDragValueRef.current;
      const syntheticEvent = { target: { value: finalValue.toString() } };
      onChangeRef.current(syntheticEvent);
    }

    // Reset todo
    isDraggingRef.current = false;
    currentDragValueRef.current = null;
    setDragValue(null);

    // Remover listeners usando las mismas referencias
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUpRef.current);
  }, [handleMouseMove]);

  // Almacenar la referencia actualizada
  useEffect(() => {
    handleMouseUpRef.current = handleMouseUp;
  });

  const startDrag = (clientX) => {
    isDraggingRef.current = true;

    document.addEventListener("mousemove", handleMouseMove, { passive: false });
    document.addEventListener("mouseup", handleMouseUpRef.current);
  };

  const handleThumbMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    startDrag(e.clientX);
  };

  return (
    <div className={`custom-slider-container ${className}`} ref={sliderRef}>
      <div
        className="custom-slider-track"
        onMouseDown={(e) => {
          if (!isDraggingRef.current && sliderRef.current) {
            const rect = sliderRef.current.getBoundingClientRect();
            const percentage = ((e.clientX - rect.left) / rect.width) * 100;
            const newValue =
              minRef.current +
              (percentage / 100) * (maxRef.current - minRef.current);
            const syntheticEvent = { target: { value: newValue.toString() } };
            onChangeRef.current(syntheticEvent);
          }
        }}
      ></div>
      <div
        className="custom-slider-progress"
        style={{ width: `${percentage}%` }}
      ></div>
      <div
        className="custom-slider-thumb"
        style={{ left: `${percentage}%` }}
        onMouseDown={handleThumbMouseDown}
      ></div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleInputChange}
        className="custom-slider-input"
      />
    </div>
  );
};

export default CustomSlider;
