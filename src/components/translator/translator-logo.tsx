"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { getThemeSnapshot, subscribeToTheme } from "@/lib/theme-store";
import type { ThemeMode } from "@/lib/storage";

export function TranslatorLogo() {
  const theme = useSyncExternalStore<ThemeMode>(
    subscribeToTheme,
    getThemeSnapshot,
    () => "light",
  );
  const logoSrc = theme === "dark" ? "/lingua-logo-dark.svg" : "/lingua-logo.svg";

  return (
    <div className="inline-flex items-center">
      <Image
        src={logoSrc}
        alt="Plain Language Translator"
        width={1838}
        height={691}
        priority
        className="h-11 w-auto sm:h-12"
      />
    </div>
  );
}
