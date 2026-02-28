"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  FileText,
  Package,
  CreditCard,
  Tag,
  Users,
  Settings,
  Mail,
  Info,
  Truck,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useSidebar } from "./SidebarContext";
import type { SidebarProps } from "../types";

const items = [
  { label: "لوحة البيانات", href: "/", icon: LayoutDashboard },
  { label: "الفواتير", href: "/projects-pages/invoices", icon: FileText },
  { label: "المنتجات", href: "/projects-pages/products", icon: Package },
  {
    label: "وسائل الدفع",
    href: "/projects-pages/payment-methods",
    icon: CreditCard,
  },
  { label: "العملاء", href: "/projects-pages/clients", icon: Users },
  { label: "المستخدمين", href: "/projects-pages/users", icon: Users },
  { label: "الموردين", href: "/projects-pages/Suppliers", icon: Truck },
  { label: "الإعدادات", href: "/projects-pages/settings", icon: Settings },
  { label: "البريد", href: "/projects-pages/mail", icon: Mail },
  { label: "حول", href: "/projects-pages/about", icon: Info },
];

const categoryItems = [
  { label: "التصنيفات الأساسية", href: "/projects-pages/categories/main" },
  { label: "التصنيفات الفرعية", href: "/projects-pages/categories/sub" },
];

export default function Sidebar({ activeLabel }: SidebarProps) {
  const { open, close } = useSidebar();
  const categoriesActive = categoryItems.some((item) => item.label === activeLabel);
  const [categoriesOpen, setCategoriesOpen] = useState(categoriesActive);

  useEffect(() => {
    if (categoriesActive) setCategoriesOpen(true);
  }, [categoriesActive]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 translate-x-full overflow-y-auto bg-white transition duration-200 lg:static lg:block lg:w-60 lg:translate-x-0 ${
          open ? "translate-x-0" : ""
        }`}
        dir="rtl"
      >
        <div className="rounded-lg border border-slate-200 bg-white py-2 shadow-sm lg:rounded-none lg:border-0 lg:shadow-none">
          <div className="flex items-center justify-between px-4 py-2 text-right text-sm font-semibold text-slate-700 lg:justify-start">
            <span>القائمة</span>
            <button
              type="button"
              onClick={close}
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="إغلاق القائمة"
            >
              ✕
            </button>
          </div>
          <nav className="space-y-1 text-sm">
            {items.map((item) => {
              const isActive = item.label === activeLabel;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  className={`flex items-center justify-between gap-2 px-3 py-2 text-right ${
                    isActive
                      ? "border-r-4 border-brand-800 bg-brand-800 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                  href={item.href}
                  onClick={close}
                >
                  <span className="flex items-center gap-2">
                    <Icon
                      className={`h-4 w-4 ${
                        isActive ? "text-white" : "text-slate-400"
                      }`}
                    />
                    {item.label}
                  </span>
                  <span
                    className={`text-xs ${
                      isActive ? "text-white/80" : "text-slate-400"
                    }`}
                  >
                    ▪
                  </span>
                </Link>
              );
            })}

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setCategoriesOpen((prev) => !prev)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-right ${
                  categoriesActive
                    ? "border-r-4 border-brand-800 bg-brand-800 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                aria-expanded={categoriesOpen}
                aria-label="قائمة التصنيفات"
              >
                <span className="flex items-center gap-2">
                  <Tag
                    className={`h-4 w-4 ${
                      categoriesActive ? "text-white" : "text-slate-400"
                    }`}
                  />
                  التصنيفات
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition ${
                    categoriesOpen ? "rotate-180" : "rotate-0"
                  } ${categoriesActive ? "text-white" : "text-slate-400"}`}
                />
              </button>

              {categoriesOpen && (
                <div className="space-y-1 pr-4">
                  {categoryItems.map((item) => {
                    const isSubActive = item.label === activeLabel;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={close}
                        className={`flex items-center justify-between rounded-md px-3 py-2 text-right ${
                          isSubActive
                            ? "bg-slate-100 font-semibold text-brand-800"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span>{item.label}</span>
                        <span className="text-xs text-slate-400">•</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
          <div className="border-t border-slate-200 px-3 py-3">
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
