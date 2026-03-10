import type { SupplierStatus } from "@/app/types";

const statusClasses: Record<SupplierStatus, string> = {
  نشط: "border-emerald-100 bg-emerald-50 text-emerald-700",
  موقوف: "border-amber-100 bg-amber-50 text-amber-700",
  مؤرشف: "border-slate-200 bg-slate-100 text-slate-700",
};

export function SupplierStatusBadge({ status }: { status: SupplierStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}
    >
      {status}
    </span>
  );
}
