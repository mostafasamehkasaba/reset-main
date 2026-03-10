import Link from "next/link";
import type { NavigationItem } from "@/lib/navigation/navigation.config";

type SidebarItemProps = {
  item: NavigationItem;
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
};

export function SidebarItem({
  item,
  active,
  collapsed,
  onNavigate,
}: SidebarItemProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={`sidebar-item group flex items-center rounded-2xl border px-3 py-2.5 text-sm transition-all duration-200 ${
        collapsed ? "justify-center" : "gap-3"
      } ${
        active
          ? "sidebar-item--active"
          : ""
      }`}
    >
      <span
        className={`sidebar-item__icon-wrap flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
          active
            ? "sidebar-item__icon-wrap--active"
            : ""
        }`}
      >
        <Icon className="sidebar-item__icon h-4 w-4" />
      </span>

      {!collapsed ? (
        <>
          <span className="sidebar-item__label truncate font-medium">{item.label}</span>
          <span
            className={`sidebar-item__dot mr-auto h-2 w-2 rounded-full transition ${
              active ? "bg-white/80" : "bg-transparent"
            }`}
          />
        </>
      ) : null}
    </Link>
  );
}
