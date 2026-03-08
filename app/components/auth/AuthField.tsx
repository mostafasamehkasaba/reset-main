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
  ...props
}: AuthFieldProps) {
  return (
    <label className="block text-right">
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
        <span>{label}</span>
        {hint ? <span className="text-xs font-medium text-slate-400">{hint}</span> : null}
      </span>

      <span className="group flex min-h-14 items-center gap-3 rounded-[1.4rem] border border-[#e7dccf] bg-[#fbf8f3] px-4 transition focus-within:border-[#c96f3f] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(201,111,63,0.10)]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#b85c2f] shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
        <input
          className={`min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 ${className ?? ""}`}
          {...props}
        />
        {endAdornment ? <span className="shrink-0">{endAdornment}</span> : null}
      </span>
    </label>
  );
}
