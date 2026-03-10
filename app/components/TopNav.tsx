"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  CreditCard,
  FileText,
  Package,
  Plus,
  Search,
  Tag,
  Truck,
  Users,
} from "lucide-react";
import SidebarToggle from "./SidebarToggle";
import ThemeToggle from "./ThemeToggle";

type TopNavProps = {
  currentLabel: string;
  parentLabel?: string;
  actionLabel?: string;
  searchPlaceholder?: string;
};

const quickActions = [
  {
    label: "فاتورة جديدة",
    href: "/invoices/new",
    icon: FileText,
  },
  {
    label: "تصنيف جديد",
    href: "/projects-pages/categories/main",
    icon: Tag,
  },
  {
    label: "عميل جديد",
    href: "/customers/new",
    icon: Users,
  },
  {
    label: "مورد جديد",
    href: "/projects-pages/Suppliers/new",
    icon: Truck,
  },
  {
    label: "منتج جديد",
    href: "/products/new",
    icon: Package,
  },
  {
    label: "وسيلة دفع جديدة",
    href: "/projects-pages/payment-methods/new",
    icon: CreditCard,
  },
];

export default function TopNav({
  currentLabel,
  parentLabel = "مساحة العمل",
  actionLabel = "إجراء سريع",
  searchPlaceholder = "ابحث بسرعة عن العملاء أو الفواتير أو المنتجات...",
}: TopNavProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointer = (event: MouseEvent) => {
      if (!actionsRef.current) {
        return;
      }

      if (!actionsRef.current.contains(event.target as Node)) {
        setActionsOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <header className="app-topnav border-b backdrop-blur-xl">
      <div className="px-3 py-3 sm:px-4 lg:px-6" dir="rtl">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start justify-between gap-3 xl:flex-1 xl:items-center">
            <div className="min-w-0">
              <div className="app-nav-muted flex items-center gap-2 text-[11px] font-medium">
                <span>{parentLabel}</span>
                <span>/</span>
                <span className="app-nav-title">{currentLabel}</span>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <h1 className="app-nav-title truncate text-xl font-semibold tracking-tight sm:text-[1.35rem]">
                  {currentLabel}
                </h1>
                <span className="app-chip hidden sm:inline-flex">لوحة تشغيل مباشرة</span>
              </div>
            </div>

            <div className="flex items-center gap-2 xl:hidden">
              <ThemeToggle variant="compact" />
              <SidebarToggle />
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-end xl:flex-none">
            <label className="relative block w-full lg:w-[340px] xl:w-[400px]">
              <Search className="app-search-icon pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                className="app-search-field w-full rounded-2xl border px-11 py-3 text-sm outline-none transition"
                placeholder={searchPlaceholder}
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden xl:block">
                <ThemeToggle variant="compact" />
              </div>

              <div className="relative" ref={actionsRef}>
                <button
                  type="button"
                  onClick={() => setActionsOpen((current) => !current)}
                  className="app-control-button app-control-button--primary inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
                  aria-expanded={actionsOpen}
                  aria-haspopup="menu"
                >
                  <Plus className="h-4 w-4" />
                  {actionLabel}
                  <ChevronDown
                    className={`h-4 w-4 transition ${actionsOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {actionsOpen ? (
                  <div
                    className="app-menu-panel absolute left-0 top-full z-50 mt-2 w-72 rounded-[24px] border p-2"
                    role="menu"
                  >
                    {quickActions.map((action) => {
                      const Icon = action.icon;

                      return (
                        <Link
                          key={action.href}
                          href={action.href}
                          onClick={() => setActionsOpen(false)}
                          className="app-menu-item flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition"
                          role="menuitem"
                        >
                          <span className="app-menu-icon flex h-10 w-10 items-center justify-center rounded-xl border">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="font-medium">{action.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
