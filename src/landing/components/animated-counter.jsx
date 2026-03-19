import React, { useEffect, useRef } from "react";
import {
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";

const AnimatedCounter = ({
  target,
  suffix = "",
  duration = 2,
  className = "",
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(motionValue, target, {
      duration,
      ease: "easeOut",
    });

    return () => controls.stop();
  }, [isInView, target, duration, motionValue]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${latest}${suffix}`;
      }
    });

    return () => unsubscribe();
  }, [rounded, suffix]);

  return <span ref={ref} className={className}>0{suffix}</span>;
};

export default AnimatedCounter;
