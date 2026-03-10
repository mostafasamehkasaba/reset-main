import Link from "next/link";
import { PanelRightClose, PanelRightOpen, X } from "lucide-react";

type SidebarHeaderProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
};

export function SidebarHeader({
  collapsed,
  onToggleCollapsed,
  onCloseMobile,
}: SidebarHeaderProps) {
  return (
    <div className="border-b border-slate-200 pb-4">
      <div
        className={`app-sidebar-brand flex items-center gap-3 rounded-[24px] border px-3 py-3 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        <Link
          href="/dashboard"
          className={`flex min-w-0 items-center ${
            collapsed ? "justify-center" : "gap-3"
          }`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] shadow-[0_18px_36px_-24px_rgba(37,99,235,0.55)]">
            <img src="/file.svg" alt="فاتورة+" className="h-6 w-6 invert" />
          </span>

          {!collapsed ? (
            <span className="min-w-0 text-right">
              <span className="sidebar-brand-title block truncate text-sm font-semibold">
                فاتورة+
              </span>
              <span className="sidebar-brand-sub mt-1 block truncate text-[11px]">
                منصة إدارة الفواتير والعمليات
              </span>
            </span>
          ) : null}
        </Link>

        {!collapsed ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="app-control-button hidden h-10 w-10 items-center justify-center rounded-2xl lg:inline-flex"
              aria-label="طي الشريط الجانبي"
              title="طي"
            >
              <PanelRightClose className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onCloseMobile}
              className="app-control-button inline-flex h-10 w-10 items-center justify-center rounded-2xl lg:hidden"
              aria-label="إغلاق القائمة"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="app-control-button hidden h-10 w-10 items-center justify-center rounded-2xl lg:inline-flex"
            aria-label="توسيع الشريط الجانبي"
            title="توسيع"
          >
            <PanelRightOpen className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
