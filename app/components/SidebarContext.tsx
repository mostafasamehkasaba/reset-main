"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { SidebarContextValue, SidebarProviderProps } from "../types";

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [open, setOpen] = useState(false);
  const value = useMemo(
    () => ({
      open,
      setOpen,
      toggle: () => setOpen((prev) => !prev),
      close: () => setOpen(false),
    }),
    [open]
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
    };
  }
  return context;
}
