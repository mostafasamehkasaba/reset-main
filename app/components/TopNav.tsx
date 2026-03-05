"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FileText, Package, Tag, Truck, Users } from "lucide-react";
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
  actionLabel = "إجراء جديد",
  searchPlaceholder = "بحث سريع عن العملاء، المنتجات، الفواتير...",
}: TopNavProps) {
  const [now, setNow] = useState(() => new Date());
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handlePointer = (event: MouseEvent) => {
      if (!actionsRef.current) return;
      if (!actionsRef.current.contains(event.target as Node)) {
        setActionsOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActionsOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <header
      className="app-topnav border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 text-white shadow-sm"
      dir="ltr"
    >
      <div className="flex h-20 w-full items-center gap-4 px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div
            className="app-surface-card flex items-center gap-2 rounded-2xl border px-3 py-2 shadow-inner"
            dir="rtl"
          >
            <div className="h-10 w-10 rounded-xl bg-slate-200-70" />
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-slate-800">أحمد محمد</p>
              <p className="text-xs text-slate-500">مدير النظام</p>
            </div>
          </div>

          <ThemeToggle variant="compact" />
          <SidebarToggle />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
          <div className="relative" ref={actionsRef}>
            <button
              className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
              type="button"
              onClick={() => setActionsOpen((current) => !current)}
              aria-expanded={actionsOpen}
              aria-haspopup="menu"
            >
              {actionLabel}
            </button>
            {actionsOpen && (
              <div
                className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-lg"
                dir="rtl"
                role="menu"
              >
                <Link
                  href="/projects-pages/invoices/new"
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-right transition hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => setActionsOpen(false)}
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    إضافة فاتورة جديدة
                  </span>
                </Link>
                <Link
                  href="/projects-pages/categories/main"
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-right transition hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => setActionsOpen(false)}
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-blue-600" />
                    إضافة تصنيف جديد
                  </span>
                </Link>
                <Link
                  href="/projects-pages/clients/new"
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-right transition hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => setActionsOpen(false)}
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    إضافة عميل جديد
                  </span>
                </Link>
                <Link
                  href="/projects-pages/Suppliers/new"
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-right transition hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => setActionsOpen(false)}
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-600" />
                    إضافة مورد جديد
                  </span>
                </Link>
                <Link
                  href="/projects-pages/products/new"
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-right transition hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => setActionsOpen(false)}
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    إضافة منتج جديد
                  </span>
                </Link>
              </div>
            )}
          </div>

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
          <div className="app-surface-card rounded-2xl border px-3 py-2 text-xs text-slate-700 shadow-inner">
            <div className="font-semibold">{now.toLocaleTimeString("ar-EG")}</div>
            <div className="text-[11px] text-slate-500">
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
