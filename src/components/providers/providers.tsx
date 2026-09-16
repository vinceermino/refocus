"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AccentProvider } from "./accent-provider";
import { UserDataProvider } from "./user-data-provider";
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
        <UserDataProvider>{children}</UserDataProvider>
      </AccentProvider>
    </NextThemesProvider>
  );
}
