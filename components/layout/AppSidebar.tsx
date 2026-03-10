"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  CreditCard,
  FileText,
  Info,
  LayoutDashboard,
  Mail,
  Package,
  PanelRightClose,
  PanelRightOpen,
  Settings,
  Tag,
  Tags,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useSidebar } from "@/app/components/SidebarContext";
import type { SidebarProps } from "@/app/types";

type SidebarNavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

const itemsBeforeCategories: SidebarNavItem[] = [
  { label: "لوحة البيانات", href: "/", icon: LayoutDashboard },
];

const categoryItems = [
  { label: "التصنيفات الأساسية", href: "/projects-pages/categories/main" },
  { label: "التصنيفات الفرعية", href: "/projects-pages/categories/sub" },
];

const itemsAfterCategories: SidebarNavItem[] = [
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

const getItemState = (
  itemLabel: string,
  itemHref: string,
  activeLabel: string,
  pathname: string
) => {
  const normalizedPath = pathname.toLowerCase();
  const normalizedHref = itemHref.toLowerCase();

  if (itemLabel === activeLabel) {
    return true;
  }

  if (normalizedHref === "/") {
    return normalizedPath === "/";
  }

  return (
    normalizedPath === normalizedHref ||
    normalizedPath.startsWith(`${normalizedHref}/`)
  );
};

export function AppSidebar({ activeLabel }: SidebarProps) {
  const pathname = usePathname();
  const { open, close, collapsed, toggleCollapsed } = useSidebar();
  const categoriesActive = categoryItems.some((item) =>
    getItemState(item.label, item.href, activeLabel, pathname)
  );
  const [categoriesOpen, setCategoriesOpen] = useState(categoriesActive);

  useEffect(() => {
    if (categoriesActive) {
      setCategoriesOpen(true);
    }
  }, [categoriesActive]);

  const renderItem = (
    item: SidebarNavItem,
    options?: {
      isSubItem?: boolean;
    }
  ) => {
    const isActive = getItemState(item.label, item.href, activeLabel, pathname);
    const Icon = item.icon;
    const isSubItem = options?.isSubItem ?? false;

    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={close}
        title={collapsed ? item.label : undefined}
        aria-current={isActive ? "page" : undefined}
        className={`sidebar-item group flex items-center rounded-2xl border text-sm transition-all duration-200 ${
          collapsed ? "justify-center px-2.5 py-2.5" : "gap-3 px-3.5 py-3"
        } ${isSubItem ? "rounded-xl" : ""} ${isActive ? "sidebar-item--active" : ""}`}
      >
        <span
          className={`sidebar-item__icon-wrap flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
            isActive ? "sidebar-item__icon-wrap--active" : ""
          }`}
        >
          <Icon className="sidebar-item__icon h-4 w-4" />
        </span>

        {!collapsed ? (
          <>
            <span className="sidebar-item__label truncate font-medium">
              {item.label}
            </span>
            <span
              className={`sidebar-item__dot mr-auto h-2 w-2 rounded-full transition ${
                isActive ? "bg-white/80" : "bg-transparent"
              }`}
            />
          </>
        ) : null}
      </Link>
    );
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] transition lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 right-0 z-50 w-[308px] max-w-[calc(100vw-1rem)] px-3 py-3 transition-transform duration-300 ease-out lg:static lg:z-auto lg:flex lg:h-auto lg:self-stretch lg:px-0 lg:py-0 ${
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-[108px]" : "lg:w-[292px]"}`}
        dir="rtl"
      >
        <div className="app-sidebar-shell flex h-full w-full flex-1 flex-col overflow-hidden rounded-[30px] border p-3 shadow-[0_36px_90px_-56px_rgba(15,23,42,0.45)]">
          <div className="border-b border-slate-200 pb-4">
            <div
              className={`app-sidebar-brand flex items-center rounded-[24px] border px-3 py-3 ${
                collapsed ? "justify-center" : "justify-between gap-3"
              }`}
            >
              <Link
                href="/"
                onClick={close}
                className={`flex min-w-0 items-center ${
                  collapsed ? "justify-center" : "gap-3"
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] shadow-[0_18px_36px_-24px_rgba(37,99,235,0.55)]">
                  <img src="/file.svg" alt="فاتورة" className="h-6 w-6 invert" />
                </span>

                {!collapsed ? (
                  <span className="min-w-0 text-right leading-tight">
                    <span className="sidebar-brand-title block truncate text-sm font-semibold">
                      فاتورة
                    </span>
                    <span className="sidebar-brand-sub mt-1 block truncate text-[11px]">
                      نظام إدارة الأعمال
                    </span>
                  </span>
                ) : null}
              </Link>

              <div className={`items-center gap-2 ${collapsed ? "hidden" : "flex"}`}>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  className="app-control-button hidden h-10 w-10 items-center justify-center rounded-2xl lg:inline-flex"
                  aria-label="طي الشريط الجانبي"
                  title="طي"
                >
                  <PanelRightClose className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={close}
                  className="app-control-button inline-flex h-10 w-10 items-center justify-center rounded-2xl lg:hidden"
                  aria-label="إغلاق القائمة"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {collapsed ? (
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  className="app-control-button hidden h-10 w-10 items-center justify-center rounded-2xl lg:inline-flex"
                  aria-label="توسيع الشريط الجانبي"
                  title="توسيع"
                >
                  <PanelRightOpen className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto pl-1">
            {!collapsed ? (
              <p className="sidebar-section-label mb-2 px-2 text-[11px] font-semibold tracking-[0.18em]">
                الرئيسية
              </p>
            ) : (
              <div className="sidebar-group-divider mx-auto mb-3 h-px w-10" />
            )}

            <nav className="space-y-2.5">
              {itemsBeforeCategories.map((item) => renderItem(item))}

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setCategoriesOpen((prev) => !prev)}
                  title={collapsed ? "التصنيفات" : undefined}
                  aria-expanded={categoriesOpen}
                  aria-label="قائمة التصنيفات"
                  className={`sidebar-item group flex w-full items-center rounded-2xl border text-sm transition-all duration-200 ${
                    collapsed ? "justify-center px-2.5 py-2.5" : "gap-3 px-3.5 py-3"
                  } ${categoriesActive ? "sidebar-item--active" : ""}`}
                >
                  <span
                    className={`sidebar-item__icon-wrap flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
                      categoriesActive ? "sidebar-item__icon-wrap--active" : ""
                    }`}
                  >
                    <Tag className="sidebar-item__icon h-4 w-4" />
                  </span>

                  {!collapsed ? (
                    <>
                      <span className="sidebar-item__label truncate font-medium">
                        التصنيفات
                      </span>
                      <span className="mr-auto flex items-center gap-2">
                        <span
                          className={`sidebar-item__dot h-2 w-2 rounded-full transition ${
                            categoriesActive ? "bg-white/80" : "bg-transparent"
                          }`}
                        />
                        <ChevronDown
                          className={`h-4 w-4 transition ${
                            categoriesOpen ? "rotate-180" : "rotate-0"
                          } ${categoriesActive ? "text-white" : "text-slate-400"}`}
                        />
                      </span>
                    </>
                  ) : null}
                </button>

                {categoriesOpen ? (
                  <div className={`space-y-1.5 ${collapsed ? "" : "pr-4"}`}>
                    {renderItem(
                      {
                        label: categoryItems[0].label,
                        href: categoryItems[0].href,
                        icon: Tag,
                      },
                      { isSubItem: true }
                    )}
                    {renderItem(
                      {
                        label: categoryItems[1].label,
                        href: categoryItems[1].href,
                        icon: Tags,
                      },
                      { isSubItem: true }
                    )}
                  </div>
                ) : null}
              </div>

              {itemsAfterCategories.map((item) => renderItem(item))}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}
