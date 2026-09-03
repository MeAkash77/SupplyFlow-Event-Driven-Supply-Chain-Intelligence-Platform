"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme("dark");
    applyTheme("dark");
    if (typeof window !== "undefined") {
      window.localStorage.setItem("easyflow-theme", "dark");
    }
  }, []);

  function applyTheme(t: Theme) {
    const root = document.documentElement;
    if (t === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  }

  function toggle() {
    setTheme("dark");
    applyTheme("dark");
    if (typeof window !== "undefined") {
      window.localStorage.setItem("easyflow-theme", "dark");
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
