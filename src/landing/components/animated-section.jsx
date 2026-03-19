import React from "react";
import { motion } from "framer-motion";

const directionOffsets = {
  up: { x: 0, y: 60 },
  down: { x: 0, y: -60 },
  left: { x: -60, y: 0 },
  right: { x: 60, y: 0 },
};

const AnimatedSection = ({
  children,
  className = "",
  delay = 0,
  direction = "up",
}) => {
  const offset = directionOffsets[direction] || directionOffsets.up;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection;
