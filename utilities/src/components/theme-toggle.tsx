"use client";

import { useEffect, useState } from "react";
import { THEME_KEY, Theme, resolveTheme } from "@/lib/theme";

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  const stored = resolveTheme(window.localStorage.getItem(THEME_KEY));
  if (stored) return stored;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);

    const syncFromStorage = (event: StorageEvent) => {
      if (event.key !== THEME_KEY) return;
      const nextTheme = resolveTheme(event.newValue) ?? getInitialTheme();
      setTheme(nextTheme);
      document.documentElement.setAttribute("data-theme", nextTheme);
    };

    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem(THEME_KEY, next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed right-4 top-4 z-50 inline-flex items-center gap-2 rounded-md border border-[color:var(--border-default)] bg-[color:var(--card-bg)] px-3 py-2 text-xs font-semibold text-[color:var(--text-primary)] transition"
      aria-label="Toggle global theme"
    >
      <span className="inline-flex h-2 w-2 rounded-full bg-[color:var(--accent)]" aria-hidden="true" />
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
