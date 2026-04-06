"use client";

import { useSyncExternalStore } from "react";
import {
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

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getThemeSnapshot(): ThemeMode {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, () => "light");

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
