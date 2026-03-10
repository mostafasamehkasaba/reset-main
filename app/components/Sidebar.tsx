"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import type { SidebarProps } from "../types";

export default function Sidebar(props: SidebarProps) {
  return <AppSidebar {...props} />;
}
