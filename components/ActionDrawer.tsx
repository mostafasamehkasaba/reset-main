"use client";

import Link from "next/link";
import { X, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

export type ActionDrawerItem = {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  tone?: "default" | "accent" | "danger";
  disabled?: boolean;
};

const toneClasses: Record<NonNullable<ActionDrawerItem["tone"]>, string> = {
  default:
    "border-slate-200/90 bg-white/95 text-slate-700 hover:border-slate-300 hover:bg-white",
  accent:
    "border-sky-100 bg-sky-50/95 text-sky-700 hover:border-sky-200 hover:bg-sky-100/90",
  danger:
    "border-rose-100 bg-rose-50/95 text-rose-700 hover:border-rose-200 hover:bg-rose-100/90",
};

export default function ActionDrawer({
  open,
  title,
  subtitle,
  actions,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  actions: ActionDrawerItem[];
  onClose: () => void;
  children?: ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsVisible(false);
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80]" dir="rtl">
      <button
        type="button"
        className={`absolute inset-0 bg-slate-950/24 backdrop-blur-[2px] transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        aria-label="إغلاق لوحة الإجراءات"
        onClick={onClose}
      />

      <aside
        className={`absolute inset-y-3 left-3 flex w-[calc(100%-1.5rem)] max-w-[360px] flex-col overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_100%)] shadow-[0_42px_120px_-52px_rgba(15,23,42,0.55)] transition-transform duration-200 sm:inset-y-4 sm:left-4 sm:w-full ${
          isVisible ? "translate-x-0" : "-translate-x-[108%]"
        }`}
      >
        <div className="border-b border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.92)_0%,rgba(239,246,255,0.96)_100%)] px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex rounded-full border border-sky-100 bg-white/90 px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] text-sky-700">
                الإجراءات
              </span>
              <h2 className="mt-3 text-lg font-semibold text-slate-950 sm:text-xl">{title}</h2>
              {subtitle ? (
                <p className="mt-1 truncate text-sm text-slate-500">{subtitle}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 transition hover:bg-white hover:text-slate-700"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {children ? <div className="mb-4">{children}</div> : null}

          <div className="space-y-2.5">
            {actions.map((action) => {
              const Icon = action.icon;
              const toneClass = toneClasses[action.tone || "default"];
              const content = (
                <div
                  className={`group flex items-start gap-3 rounded-[22px] border px-3.5 py-3.5 text-right shadow-[0_16px_32px_-28px_rgba(15,23,42,0.38)] transition ${toneClass} ${
                    action.disabled ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border border-current/10 bg-white/85 shadow-sm">
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{action.label}</p>
                    {action.description ? (
                      <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-current/80">
                        {action.description}
                      </p>
                    ) : null}
                  </div>

                  <span className="mt-1 text-xs text-current/45 transition group-hover:text-current/70">
                    ‹
                  </span>
                </div>
              );

              if (action.href && !action.disabled) {
                return (
                  <Link key={action.id} href={action.href} onClick={onClose}>
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={action.id}
                  type="button"
                  disabled={action.disabled}
                  onClick={action.onClick}
                  className="block w-full text-right"
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
