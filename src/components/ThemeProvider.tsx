"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

export type ThemeName = "verdant" | "indigo" | "sunset" | "rose" | "ocean" | "marigold" | "terracotta";
export type ColorMode = "light" | "dark";

const ThemeContext = createContext<{
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  mode: ColorMode;
  toggleMode: () => void;
} | null>(null);

const themeEvent = "karigar-theme-change";
const validThemes: ThemeName[] = ["verdant", "indigo", "sunset", "rose", "ocean", "marigold", "terracotta"];
const subscribe = (callback: () => void) => {
  window.addEventListener(themeEvent, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(themeEvent, callback);
    window.removeEventListener("storage", callback);
  };
};
const getSnapshot = (): ThemeName => {
  const saved = window.localStorage.getItem("karigar-theme") as ThemeName | null;
  return saved && validThemes.includes(saved) ? saved : "verdant";
};
const getServerSnapshot = (): ThemeName => "verdant";
const getModeSnapshot = (): ColorMode => window.localStorage.getItem("karigar-mode") === "dark" ? "dark" : "light";
const getModeServerSnapshot = (): ColorMode => "light";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const mode = useSyncExternalStore(subscribe, getModeSnapshot, getModeServerSnapshot);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.mode = mode;
  }, [theme, mode]);

  const setTheme = useCallback((nextTheme: ThemeName) => {
    window.localStorage.setItem("karigar-theme", nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.dispatchEvent(new Event(themeEvent));
  }, []);

  const toggleMode = useCallback(() => {
    const nextMode = getModeSnapshot() === "dark" ? "light" : "dark";
    window.localStorage.setItem("karigar-mode", nextMode);
    document.documentElement.dataset.mode = nextMode;
    window.dispatchEvent(new Event(themeEvent));
  }, []);

  const value = useMemo(() => ({ theme, setTheme, mode, toggleMode }), [theme, setTheme, mode, toggleMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useKarigarTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useKarigarTheme must be used inside ThemeProvider");
  return context;
}
