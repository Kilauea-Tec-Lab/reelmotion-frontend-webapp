import { useEffect, useRef, useState } from "react";

/**
 * Custom hook que utiliza Intersection Observer para detectar cuando un elemento es visible
 * @param {Object} options - Opciones para el Intersection Observer
 * @param {number} options.threshold - Umbral de visibilidad (0-1)
 * @param {string} options.rootMargin - Margen del root
 * @param {boolean} options.triggerOnce - Si solo se ejecuta una vez
 * @returns {Array} [ref, isIntersecting, hasIntersected]
 */
export function useIntersectionObserver(options = {}) {
  const { threshold = 0.1, rootMargin = "50px", triggerOnce = false } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;

        if (isElementIntersecting) {
          setHasIntersected(true);
        }

        if (!triggerOnce || !hasIntersected) {
          setIsIntersecting(isElementIntersecting);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, hasIntersected]);

  return [ref, isIntersecting, hasIntersected];
}
