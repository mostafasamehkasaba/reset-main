"use client";

import { useEffect, useState } from "react";
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

export default function ThemeToggle() {
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

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="flex w-full items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
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
