"use client";

import { useEffect, useRef } from "react";

export function useScrollReveal<T extends HTMLElement = HTMLElement>(
  threshold = 0.15
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      el.setAttribute("data-revealed", "true");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute("data-revealed", "true");
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);

    return () => {
      observer.unobserve(el);
    };
  }, [threshold]);

  return ref;
}
