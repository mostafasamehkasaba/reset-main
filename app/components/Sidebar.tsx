"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  FileText,
  Package,
  CreditCard,
  Tag,
  Tags,
  Users,
  Settings,
  Mail,
  Info,
  Truck,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";
import type { SidebarProps } from "../types";

const itemsBeforeCategories = [
  { label: "لوحة البيانات", href: "/", icon: LayoutDashboard },
];

const itemsAfterCategories = [
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
  const pathname = usePathname();
  const isHrefActive = (href: string) => {
    const normalizedPath = pathname.toLowerCase();
    const normalizedHref = href.toLowerCase();
    if (normalizedHref === "/") return normalizedPath === "/";
    return (
      normalizedPath === normalizedHref ||
      normalizedPath.startsWith(`${normalizedHref}/`)
    );
  };

  const categoriesActive = categoryItems.some(
    (item) => item.label === activeLabel || isHrefActive(item.href)
  );
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
        className={`fixed inset-y-0 right-0 z-50 w-80 overflow-y-auto bg-transparent transition duration-200 lg:static lg:block lg:h-full lg:w-72 lg:translate-x-0 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        dir="rtl"
      >
        <div className="app-sidebar-shell rounded-3xl border border-slate-800/70 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 px-3 py-4 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.7)]">
          <div className="relative mb-3">
            <Link
              href="/"
              className="app-sidebar-brand flex w-full items-center gap-3 rounded-2xl border border-slate-700/60 px-3 py-2"
            >
              <img
                src="/file.svg"
                alt="فاتورة"
                className="h-11 w-11 rounded-2xl bg-slate-800/70 p-2"
              />
              <div className="text-right leading-tight">
                <p className="sidebar-brand-title text-sm font-semibold">فاتورة</p>
                <p className="sidebar-brand-sub text-xs">نظام إدارة الأعمال</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={close}
              className="absolute left-2 top-2 rounded-md p-1 text-slate-400 hover:bg-white/10 lg:hidden"
              aria-label="إغلاق القائمة"
            >
              ✕
            </button>
          </div>

          <p className="sidebar-section-label mb-2 px-2 text-xs font-semibold text-slate-400">
            الرئيسية
          </p>

          <nav className="space-y-3 text-sm">
            {itemsBeforeCategories.map((item) => {
              const isActive = item.label === activeLabel || isHrefActive(item.href);
              const isPrimary = item.label === "لوحة البيانات";
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  className={`sidebar-item flex items-center justify-between gap-3 rounded-2xl border border-slate-800/60 px-4 py-3 text-right transition-colors ${
                    isActive ? "sidebar-item--active" : isPrimary ? "sidebar-item--primary" : ""
                  }`}
                  href={item.href}
                  onClick={close}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`sidebar-item__icon-wrap ${
                        isActive || isPrimary ? "sidebar-item__icon-wrap--active" : ""
                      }`}
                    >
                      <Icon
                        className="sidebar-item__icon h-4 w-4"
                      />
                    </span>
                    {item.label}
                  </span>
                </Link>
              );
            })}

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setCategoriesOpen((prev) => !prev)}
                className={`sidebar-item flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-800/60 px-4 py-3 text-right transition-colors ${
                  categoriesActive ? "sidebar-item--active" : ""
                }`}
                aria-expanded={categoriesOpen}
                aria-label="قائمة التصنيفات"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`sidebar-item__icon-wrap ${
                      categoriesActive ? "sidebar-item__icon-wrap--active" : ""
                    }`}
                  >
                    <Tag
                      className="sidebar-item__icon h-4 w-4"
                    />
                  </span>
                  التصنيفات
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition ${
                    categoriesOpen ? "rotate-180" : "rotate-0"
                  } ${categoriesActive ? "text-white" : "text-slate-400"}`}
                />
              </button>

              {categoriesOpen && (
                <div className="space-y-3 pr-4">
                  {categoryItems.map((item) => {
                    const isSubActive =
                      item.label === activeLabel || isHrefActive(item.href);
                    const Icon = item.href.includes("/main") ? Tag : Tags;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={close}
                        className={`sidebar-item sidebar-item--sub flex items-center justify-between rounded-xl border border-slate-800/60 px-4 py-2 text-right transition-colors ${
                          isSubActive ? "sidebar-item--active" : ""
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`sidebar-item__icon-wrap ${
                              isSubActive ? "sidebar-item__icon-wrap--active" : ""
                            }`}
                          >
                            <Icon className="sidebar-item__icon h-4 w-4" />
                          </span>
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {itemsAfterCategories.map((item) => {
              const isActive = item.label === activeLabel || isHrefActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  className={`sidebar-item flex items-center justify-between gap-3 rounded-2xl border border-slate-800/60 px-4 py-3 text-right transition-colors ${
                    isActive ? "sidebar-item--active" : ""
                  }`}
                  href={item.href}
                  onClick={close}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`sidebar-item__icon-wrap ${
                        isActive ? "sidebar-item__icon-wrap--active" : ""
                      }`}
                    >
                      <Icon className="sidebar-item__icon h-4 w-4" />
                    </span>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 border-t border-slate-800/80 px-3 py-3" />
        </div>
      </aside>
    </>
  );
}
