"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useSyncExternalStore } from "react";

type A11yMode = "default" | "high-contrast" | "large-text";

interface A11yContextValue {
  mode: A11yMode;
  setMode: (mode: A11yMode) => void;
  cycleMode: () => void;
}

const A11yContext = createContext<A11yContextValue>({
  mode: "default",
  setMode: () => {},
  cycleMode: () => {},
});

export function useA11y() {
  return useContext(A11yContext);
}

const MODES: A11yMode[] = ["default", "high-contrast", "large-text"];
const MODE_LABELS: Record<A11yMode, string> = {
  default: "Default",
  "high-contrast": "High Contrast",
  "large-text": "Large Text",
};

const STORAGE_KEY = "de-a11y-mode";

function getStoredMode(): A11yMode {
  if (typeof window === "undefined") return "default";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && MODES.includes(stored as A11yMode)) return stored as A11yMode;
  return "default";
}

function subscribeToStorage(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function applyMode(m: A11yMode) {
  const root = document.documentElement;
  root.classList.remove("a11y-high-contrast", "a11y-large-text");
  if (m === "high-contrast") root.classList.add("a11y-high-contrast");
  if (m === "large-text") root.classList.add("a11y-large-text");
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const storedMode = useSyncExternalStore(subscribeToStorage, getStoredMode, (): A11yMode => "default");
  const [liveMode, setLiveMode] = useState<A11yMode>("default");

  const mode: A11yMode = liveMode !== "default" ? liveMode : storedMode;

  const setMode = useCallback((m: A11yMode) => {
    localStorage.setItem(STORAGE_KEY, m);
    applyMode(m);
    setLiveMode(m);
  }, []);

  const cycleMode = useCallback(() => {
    const idx = MODES.indexOf(mode);
    const next = MODES[(idx + 1) % MODES.length];
    setMode(next);
  }, [mode, setMode]);

  return (
    <A11yContext.Provider value={{ mode, setMode, cycleMode }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2"
        role="group"
        aria-label="Accessibility controls"
      >
        <button
          onClick={() => setMode("high-contrast")}
          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)] ${
            mode === "high-contrast"
? "bg-[var(--primary)]/20 border-[var(--primary)] text-[var(--primary-text)]"
  : "bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
          }`}
          aria-pressed={mode === "high-contrast"}
          aria-label="High Contrast mode"
          title="High Contrast"
        >
          ◐ High Contrast
        </button>
        <button
          onClick={() => setMode("large-text")}
          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)] ${
            mode === "large-text"
? "bg-[var(--primary)]/20 border-[var(--primary)] text-[var(--primary-text)]"
  : "bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
          }`}
          aria-pressed={mode === "large-text"}
          aria-label="Large Text mode"
          title="Large Text"
        >
          Aa Large Text
        </button>
        {mode !== "default" && (
          <button
            onClick={() => setMode("default")}
            className="px-2 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-all text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]"
            aria-label="Reset to default display mode"
            title="Reset to Default"
          >
            ✕
          </button>
        )}
      </div>
    </A11yContext.Provider>
  );
}
