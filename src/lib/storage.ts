export type ThemeMode = "light" | "dark";

export const draftStorageKey = "plain-language-translator:draft";
export const themeStorageKey = "plain-language-translator:theme";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadDraft() {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(draftStorageKey);
}

export function saveDraft(value: string) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(draftStorageKey, value);
}

export function clearDraft() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(draftStorageKey);
}

export function loadTheme(): ThemeMode | null {
  if (!canUseStorage()) {
    return null;
  }

  const stored = window.localStorage.getItem(themeStorageKey);
  return stored === "light" || stored === "dark" ? stored : null;
}

export function saveTheme(theme: ThemeMode) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(themeStorageKey, theme);
}
