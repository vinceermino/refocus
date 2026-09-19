"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";

import { useStoredValue } from "@/hooks/use-stored-value";

type AccentTheme = "pink" | "dark" | "neutral";

interface AccentContextType {
  accent: AccentTheme;
  setAccent: (accent: AccentTheme) => void;
}

const AccentContext = createContext<AccentContextType>({
  accent: "neutral",
  setAccent: () => {},
});

export function AccentProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useStoredValue("accent-theme");
  const accent: AccentTheme = stored === "pink" || stored === "dark" ? stored : "neutral";

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
  }, [accent]);

  const setAccent = (newAccent: AccentTheme) => setStored(newAccent);

  return (
    <AccentContext.Provider value={{ accent, setAccent }}>
      {children}
    </AccentContext.Provider>
  );
}

export function useAccent() {
  return useContext(AccentContext);
}
