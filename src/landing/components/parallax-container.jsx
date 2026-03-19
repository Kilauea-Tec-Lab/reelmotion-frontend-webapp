import React, { createContext, useContext, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";

const ParallaxContext = createContext({ mouseX: null, mouseY: null });

const springConfig = { damping: 25, stiffness: 120, mass: 0.5 };

export const ParallaxContainer = ({ children, className = "" }) => {
  const containerRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const normalizedX = (e.clientX - centerX) / (rect.width / 2);
    const normalizedY = (e.clientY - centerY) / (rect.height / 2);

    mouseX.set(normalizedX);
    mouseY.set(normalizedY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <ParallaxContext.Provider value={{ mouseX, mouseY }}>
      <div
        ref={containerRef}
        className={className}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    </ParallaxContext.Provider>
  );
};

export const ParallaxElement = ({ children, className = "", depth = 1 }) => {
  const { mouseX, mouseY } = useContext(ParallaxContext);

  const multiplier = depth * 20;

  const rawX = useTransform(mouseX, (v) => v * multiplier);
  const rawY = useTransform(mouseY, (v) => v * multiplier);

  const x = useSpring(rawX, springConfig);
  const y = useSpring(rawY, springConfig);

  return (
    <motion.div className={className} style={{ x, y }}>
      {children}
    </motion.div>
  );
};

export default ParallaxContainer;
