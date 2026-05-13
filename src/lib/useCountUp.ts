"use client";

import { useCallback, useEffect, useRef } from "react";

function springEase(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

export function useCountUp<T extends HTMLElement = HTMLElement>(
  target: number,
  duration = 800
) {
  const elementRef = useRef<T>(null);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const targetRef = useRef(target);
  const durationRef = useRef(duration);
  const startedRef = useRef(false);

  useEffect(() => {
    targetRef.current = target;
    durationRef.current = duration;
  }, [target, duration]);

  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.textContent = "0";
    }
  }, []);

  const start = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startRef.current = 0;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      if (elementRef.current) {
        elementRef.current.textContent = String(targetRef.current);
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / durationRef.current, 1);
      const eased = springEase(progress);
      const current = Math.round(eased * targetRef.current);

      if (elementRef.current) {
        elementRef.current.textContent = String(current);
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return [elementRef, start] as const;
}
