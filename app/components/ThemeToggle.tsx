"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import type { Theme } from "../types";

const STORAGE_KEY = "ui-theme";

const getPreferredTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
};

type ThemeToggleProps = {
  variant?: "compact" | "full";
  className?: string;
};

export default function ThemeToggle({ variant = "full", className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const preferred = getPreferredTheme();
    setTheme(preferred);
    applyTheme(preferred);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  const nextTheme = theme === "dark" ? "light" : "dark";

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={() => setTheme(nextTheme)}
        className={`rounded-full border border-slate-800/80 bg-slate-900/70 p-2 text-slate-200 shadow-sm hover:bg-slate-800/80 ${className ?? ""}`}
        aria-pressed={theme === "dark"}
        aria-label="تبديل وضع العرض"
        title={theme === "dark" ? "الوضع الداكن" : "الوضع الفاتح"}
      >
        {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className={`flex w-full items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 ${className ?? ""}`}
      aria-pressed={theme === "dark"}
      aria-label="تبديل وضع العرض"
    >
      <span className="font-semibold text-slate-700">
        الوضع: {theme === "dark" ? "داكن" : "فاتح"}
      </span>
      <span
        dir="ltr"
        className={`relative ml-auto inline-flex h-5 w-10 items-center rounded-full transition ${
          theme === "dark" ? "bg-slate-700" : "bg-slate-200"
        }`}
        aria-hidden="true"
      >
        <span
          className={`theme-toggle__thumb inline-block h-4 w-4 rounded-full shadow transition ${
            theme === "dark" ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}
