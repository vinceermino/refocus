"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

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
  const [accent, setAccentState] = useState<AccentTheme>("neutral");

  useEffect(() => {
    const stored = localStorage.getItem("accent-theme") as AccentTheme | null;
    if (stored) {
      setAccentState(stored);
      document.documentElement.setAttribute("data-accent", stored);
    }
  }, []);

  const setAccent = (newAccent: AccentTheme) => {
    setAccentState(newAccent);
    localStorage.setItem("accent-theme", newAccent);
    document.documentElement.setAttribute("data-accent", newAccent);
  };

  return (
    <AccentContext.Provider value={{ accent, setAccent }}>
      {children}
    </AccentContext.Provider>
  );
}

export function useAccent() {
  return useContext(AccentContext);
}
