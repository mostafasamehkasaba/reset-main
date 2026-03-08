"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: LucideIcon;
  hint?: string;
  endAdornment?: ReactNode;
};

export default function AuthField({
  label,
  icon: Icon,
  hint,
  endAdornment,
  className,
  dir,
  ...props
}: AuthFieldProps) {
  const inputAlignmentClass = dir === "ltr" ? "text-left" : "text-right";

  return (
    <label className="block text-right">
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
        <span>{label}</span>
        {hint ? <span className="text-xs font-medium text-slate-400">{hint}</span> : null}
      </span>

      <span className="group flex min-h-12 items-center gap-3 rounded-[1.25rem] border border-[#e7dccf] bg-[#fbf8f3] px-3.5 transition focus-within:border-[#c96f3f] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(201,111,63,0.10)]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-[#b85c2f] shadow-sm">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <input
          className={`auth-field-input min-w-0 flex-1 bg-transparent py-2.5 text-sm text-slate-900 caret-[#b85c2f] outline-none placeholder:text-slate-400 [color-scheme:light] [-webkit-text-fill-color:#0f172a] ${inputAlignmentClass} ${className ?? ""}`}
          dir={dir}
          {...props}
        />
        {endAdornment ? <span className="shrink-0">{endAdornment}</span> : null}
      </span>
    </label>
  );
}
