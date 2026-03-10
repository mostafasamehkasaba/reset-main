import type { NavigationGroup } from "@/lib/navigation/navigation.config";
import {
  isNavigationItemActive,
} from "@/lib/navigation/navigation.config";
import { SidebarItem } from "./SidebarItem";

type SidebarGroupProps = {
  group: NavigationGroup;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
};

export function SidebarGroup({
  group,
  pathname,
  collapsed,
  onNavigate,
}: SidebarGroupProps) {
  return (
    <section className="space-y-2.5">
      {!collapsed ? (
        <div className="px-2">
          <p className="sidebar-section-label text-[11px] font-semibold tracking-[0.18em]">
            {group.label}
          </p>
        </div>
      ) : (
        <div className="sidebar-group-divider mx-auto h-px w-10" />
      )}

      <div className="space-y-1.5">
        {group.items.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            active={isNavigationItemActive(pathname, item)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  );
}
