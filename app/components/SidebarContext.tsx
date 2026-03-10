"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { SidebarContextValue, SidebarProviderProps } from "../types";

const SidebarContext = createContext<SidebarContextValue | null>(null);
const SIDEBAR_COLLAPSED_STORAGE_KEY = "reset-main-sidebar-collapsed";

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    setCollapsed(stored === "1");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      collapsed ? "1" : "0"
    );
  }, [collapsed]);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      toggle: () => setOpen((prev) => !prev),
      close: () => setOpen(false),
      collapsed,
      setCollapsed,
      toggleCollapsed: () => setCollapsed((prev) => !prev),
    }),
    [collapsed, open]
  );

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    return {
      open: false,
      setOpen: () => {},
      toggle: () => {},
      close: () => {},
      collapsed: false,
      setCollapsed: () => {},
      toggleCollapsed: () => {},
    };
  }
  return context;
}
