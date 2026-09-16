"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AccentProvider } from "./accent-provider";
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
        {children}
      </AccentProvider>
    </NextThemesProvider>
  );
}
