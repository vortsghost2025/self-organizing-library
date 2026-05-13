"use client";

import { ReactNode } from "react";
import { useScrollReveal } from "@/lib/useScrollReveal";

interface ScrollRevealWrapperProps {
  children: ReactNode;
  className?: string;
  delay?: 1 | 2 | 3 | 4 | 5;
}

export function ScrollRevealWrapper({
  children,
  className = "",
  delay,
}: ScrollRevealWrapperProps) {
  const ref = useScrollReveal<HTMLDivElement>();
  const delayClass = delay ? ` reveal-delay-${delay}` : "";

  return (
    <div
      ref={ref}
      data-revealed
      className={`${className}${delayClass}`}
    >
      {children}
    </div>
  );
}
