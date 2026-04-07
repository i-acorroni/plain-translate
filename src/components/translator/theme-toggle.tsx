"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  loadTheme,
  saveTheme,
  themeStorageKey,
  type ThemeMode,
} from "@/lib/storage";

const listeners = new Set<() => void>();

function emitThemeChange() {
  listeners.forEach((listener) => listener());
}

function setDocumentTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (typeof window === "undefined") {
    return () => {
      listeners.delete(listener);
    };
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === themeStorageKey) {
      listener();
    }
  };
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const onMediaChange = () => {
    listener();
  };

  window.addEventListener("storage", onStorage);
  mediaQuery.addEventListener("change", onMediaChange);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
    mediaQuery.removeEventListener("change", onMediaChange);
  };
}

function getThemeSnapshot(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = loadTheme();

  if (storedTheme) {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore<ThemeMode>(
    subscribe,
    getThemeSnapshot,
    () => "light",
  );

  useEffect(() => {
    setDocumentTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setDocumentTheme(nextTheme);
    saveTheme(nextTheme);
    emitThemeChange();
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="ghost-button rounded-full px-4 py-2 text-sm font-medium"
      aria-pressed={theme === "dark"}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? "Dark mode" : "Light mode"}
    </button>
  );
}
