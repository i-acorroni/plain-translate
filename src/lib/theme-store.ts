import { loadTheme, saveTheme, themeStorageKey, type ThemeMode } from "@/lib/storage";

const listeners = new Set<() => void>();

function canUseWindow() {
  return typeof window !== "undefined";
}

export function setDocumentTheme(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
}

export function getThemeSnapshot(): ThemeMode {
  if (!canUseWindow()) {
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

function emitThemeChange() {
  listeners.forEach((listener) => listener());
}

export function subscribeToTheme(listener: () => void) {
  listeners.add(listener);

  if (!canUseWindow()) {
    return () => {
      listeners.delete(listener);
    };
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const onMediaChange = () => {
    listener();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === themeStorageKey) {
      listener();
    }
  };

  mediaQuery.addEventListener("change", onMediaChange);
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    mediaQuery.removeEventListener("change", onMediaChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function applyTheme(theme: ThemeMode) {
  saveTheme(theme);
  setDocumentTheme(theme);
  emitThemeChange();
}
