"use client";

import { useSidebar } from "./SidebarContext";
import type { SidebarToggleProps } from "../types";

export default function SidebarToggle({ className }: SidebarToggleProps) {
  const { open, toggle } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggle}
      className={[
        "rounded-md p-1 transition hover:bg-white/10",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
      aria-expanded={open}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
