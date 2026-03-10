"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { getStoredAuthUser } from "@/app/lib/auth-session";
import { LOGIN_PATH } from "@/app/lib/constant";
import { getErrorMessage } from "@/app/lib/fetcher";
import { logout } from "@/app/services/auth";
import type { AuthUser } from "@/app/types";

type SidebarFooterProps = {
  collapsed: boolean;
};

const getInitials = (user: AuthUser | null) => {
  const source = (user?.name || user?.email || "FM").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
};

export function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [logoutError, setLogoutError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const syncAuthUser = () => setAuthUser(getStoredAuthUser());

    syncAuthUser();
    window.addEventListener("storage", syncAuthUser);
    window.addEventListener("focus", syncAuthUser);

    return () => {
      window.removeEventListener("storage", syncAuthUser);
      window.removeEventListener("focus", syncAuthUser);
    };
  }, []);

  const handleLogout = async () => {
    setLogoutError("");
    setIsLoggingOut(true);

    try {
      await logout();
      router.replace(LOGIN_PATH);
      router.refresh();
    } catch (error) {
      setLogoutError(getErrorMessage(error, "تعذر تسجيل الخروج."));
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (collapsed) {
    return (
      <div className="space-y-2 border-t border-slate-200 pt-4">
        <div className="app-sidebar-user-avatar mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold">
          {getInitials(authUser)}
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
          title="تسجيل الخروج"
          className="app-control-button app-control-button--danger mx-auto flex h-11 w-11 items-center justify-center rounded-2xl disabled:cursor-not-allowed disabled:opacity-70"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t border-slate-200 pt-4">
      <div className="app-sidebar-footer-card rounded-[24px] border p-3.5">
        <div className="flex items-center gap-3">
          <div className="app-sidebar-user-avatar flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold">
            {getInitials(authUser)}
          </div>

          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-semibold text-slate-900">
              {authUser?.name || authUser?.email || "مستخدم النظام"}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">
              {authUser?.role || authUser?.email || "جلسة نشطة"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
          className="app-control-button app-control-button--danger mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}
        </button>
      </div>

      {logoutError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {logoutError}
        </div>
      ) : null}
    </div>
  );
}
