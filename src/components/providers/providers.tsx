"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AccentProvider } from "./accent-provider";
import { MinimalModeProvider } from "./minimal-mode-provider";
import { PwaProvider } from "./pwa-provider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AccentProvider>
        <MinimalModeProvider><PwaProvider>{children}</PwaProvider></MinimalModeProvider>
      </AccentProvider>
    </NextThemesProvider>
  );
}
