"use client";

import { LayoutGrid, List } from "lucide-react";
import type { CollectionViewMode } from "@/hooks/useCollectionViewMode";

export default function ViewModeToggle({
  value,
  onChange,
}: {
  value: CollectionViewMode;
  onChange: (value: CollectionViewMode) => void;
}) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1"
      role="tablist"
      aria-label="تبديل طريقة العرض"
    >
      <button
        type="button"
        onClick={() => onChange("table")}
        aria-pressed={value === "table"}
        title="عرض جدولي"
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition ${
          value === "table"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
        }`}
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("cards")}
        aria-pressed={value === "cards"}
        title="عرض بالكروت"
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition ${
          value === "cards"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
    </div>
  );
}
