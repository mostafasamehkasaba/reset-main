"use client";

import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useSidebar } from "./SidebarContext";
import type { SidebarToggleProps } from "../types";

export default function SidebarToggle({ className }: SidebarToggleProps) {
  const { open, toggle } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggle}
      className={[
        "app-control-button inline-flex h-11 w-11 items-center justify-center rounded-2xl lg:hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
      aria-expanded={open}
    >
      {open ? (
        <PanelRightClose className="h-5 w-5" />
      ) : (
        <PanelRightOpen className="h-5 w-5" />
      )}
    </button>
  );
}
