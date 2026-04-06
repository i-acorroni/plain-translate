import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDraft,
  draftStorageKey,
  loadDraft,
  loadTheme,
  saveDraft,
  saveTheme,
  themeStorageKey,
} from "@/lib/storage";

describe("storage helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves, loads, and clears the draft", () => {
    saveDraft("Example draft");
    expect(loadDraft()).toBe("Example draft");

    clearDraft();
    expect(loadDraft()).toBeNull();
    expect(window.localStorage.getItem(draftStorageKey)).toBeNull();
  });

  it("returns only supported theme values", () => {
    saveTheme("dark");
    expect(loadTheme()).toBe("dark");

    window.localStorage.setItem(themeStorageKey, "sepia");
    expect(loadTheme()).toBeNull();
  });
});
