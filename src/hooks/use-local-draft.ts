"use client";

import {
  type Dispatch,
  type SetStateAction,
  useSyncExternalStore,
} from "react";
import {
  clearDraft,
  draftStorageKey,
  loadDraft,
  saveDraft,
} from "@/lib/storage";

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (typeof window === "undefined") {
    return () => {
      listeners.delete(listener);
    };
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === draftStorageKey) {
      listener();
    }
  };

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useLocalDraft(initialValue = "") {
  const value = useSyncExternalStore(
    subscribe,
    () => loadDraft() ?? initialValue,
    () => initialValue,
  );

  const setValue: Dispatch<SetStateAction<string>> = (nextValue) => {
    const resolvedValue =
      typeof nextValue === "function" ? nextValue(value) : nextValue;

    if (resolvedValue.trim()) {
      saveDraft(resolvedValue);
    } else {
      clearDraft();
    }

    emitChange();
  };

  return {
    value,
    setValue,
    clear: () => {
      clearDraft();
      emitChange();
    },
  };
}
