"use client";

import { useEffect, useSyncExternalStore } from "react";
import { applyTheme, getThemeSnapshot, setDocumentTheme, subscribeToTheme } from "@/lib/theme-store";
import type { ThemeMode } from "@/lib/storage";

export function ThemeToggle() {
  const theme = useSyncExternalStore<ThemeMode>(
    subscribeToTheme,
    getThemeSnapshot,
    () => "light",
  );

  useEffect(() => {
    setDocumentTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    applyTheme(nextTheme);
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
