"use client";

import { useEffect, useState } from "react";
import SidebarToggle from "./SidebarToggle";
import ThemeToggle from "./ThemeToggle";

type TopNavProps = {
  currentLabel: string;
  parentLabel?: string;
  actionLabel?: string;
  searchPlaceholder?: string;
};

export default function TopNav({
  currentLabel,
  parentLabel = "الرئيسية",
  actionLabel = "إجراء جديد +",
  searchPlaceholder = "بحث سريع عن العملاء، المنتجات، الفواتير...",
}: TopNavProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header
      className="app-topnav border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 text-white shadow-sm"
      dir="ltr"
    >
      <div className="flex h-16 w-full items-center gap-4 px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/70 px-3 py-2 shadow-inner"
            dir="rtl"
          >
            <div className="h-10 w-10 rounded-xl bg-slate-800/80" />
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-slate-100">أحمد محمد</p>
              <p className="text-xs text-slate-400">مدير النظام</p>
            </div>
          </div>

          <ThemeToggle variant="compact" />
          <SidebarToggle />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
          <button
            className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
            type="button"
          >
            {actionLabel}
          </button>

          <div className="app-search w-full max-w-md">
            <input
              className="app-search-input h-9 w-full px-2 text-right text-sm outline-none"
              placeholder={searchPlaceholder}
              dir="rtl"
            />
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="app-search-icon h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-3" dir="rtl">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 px-3 py-2 text-xs text-slate-200 shadow-inner">
            <div className="font-semibold">{now.toLocaleTimeString("ar-EG")}</div>
            <div className="text-[11px] text-slate-400">
              {now.toLocaleDateString("ar-EG", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
          <div className="text-sm text-slate-400">{parentLabel}</div>
          <div className="rounded-2xl bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow-sm">
            {currentLabel}
          </div>
        </div>
      </div>
    </header>
  );
}
