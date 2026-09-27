"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

import { useStoredValue } from "@/hooks/use-stored-value";
import { syncTimerAppearance } from "@/lib/timer-appearance";
import { loadTheme } from "@/lib/theme-assets";
import { toast } from "sonner";

type AccentTheme = "pink" | "dark";

interface AccentContextType {
  accent: AccentTheme;
  setAccent: (accent: AccentTheme) => void;
}

const AccentContext = createContext<AccentContextType>({
  accent: "dark",
  setAccent: () => {},
});

export function AccentProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useStoredValue("accent-theme");
  const selection = useRef(0);
  const accent: AccentTheme = stored === "pink" ? "pink" : "dark";

  useEffect(() => {
    if (stored === undefined) return;
    let disposed = false;
    void loadTheme(accent === "pink" ? "she" : "he").then(() => {
      if (disposed) return;
      document.documentElement.setAttribute("data-accent", accent);
      document.body.dataset.variant = accent === "pink" ? "she" : "he";
      syncTimerAppearance();
      window.dispatchEvent(new Event('refocus-variant-change'));
    }).catch(error => { if (!disposed) toast.error(error.message); });
    return () => { disposed = true; };
  }, [accent, stored]);

  useEffect(() => {
    if (stored === "neutral") setStored("dark");
  }, [stored, setStored]);

  const setAccent = useCallback((newAccent: AccentTheme) => {
    const request = ++selection.current;
    void loadTheme(newAccent === "pink" ? "she" : "he").then(() => { if (request === selection.current) setStored(newAccent); }).catch(error => { if (request === selection.current) toast.error(error.message); });
  }, [setStored]);
  const value = useMemo(() => ({ accent, setAccent }), [accent, setAccent]);

  return (
    <AccentContext.Provider value={value}>
      {children}
    </AccentContext.Provider>
  );
}

export function useAccent() {
  return useContext(AccentContext);
}
