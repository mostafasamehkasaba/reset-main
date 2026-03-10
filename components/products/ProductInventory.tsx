import { AlertTriangle, Boxes, RotateCcw } from "lucide-react";
import type { ProductFormState } from "@/lib/products/productTypes";

type ProductInventoryProps = {
  values: ProductFormState;
  isDisabled: boolean;
  onFieldChange: <K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K]
  ) => void;
};

const fieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const inventoryStateStyles = {
  critical: "border-rose-200 bg-rose-50 text-rose-700",
  reorder: "border-amber-200 bg-amber-50 text-amber-700",
  stable: "border-emerald-200 bg-emerald-50 text-emerald-700",
} as const;

export function ProductInventory({
  values,
  isDisabled,
  onFieldChange,
}: ProductInventoryProps) {
  const quantity = Math.max(0, Number.parseInt(values.quantity, 10) || 0);
  const minStockLevel = Math.max(0, Number.parseInt(values.minStockLevel, 10) || 0);
  const reorderPoint = Math.max(minStockLevel, Number.parseInt(values.reorderPoint, 10) || 0);

  const inventoryState =
    quantity <= minStockLevel
      ? {
          tone: "critical" as const,
          label: "المخزون منخفض جدًا",
          description: "وصلت الكمية إلى الحد الأدنى أو أقل.",
        }
      : quantity <= reorderPoint
        ? {
            tone: "reorder" as const,
            label: "وقت إعادة الطلب",
            description: "الكمية الحالية تقترب من نقطة إعادة الطلب.",
          }
        : {
            tone: "stable" as const,
            label: "المخزون مستقر",
            description: "الكمية الحالية أعلى من حدود التنبيه.",
          };

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <Boxes className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-amber-700">
            المخزون
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            الكمية وحدود التنبيه
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            هذه الحقول تستخدم نفس القيم الحالية للمخزون والتنبيه دون أي تغيير في منطق
            الحفظ.
          </p>
        </div>
      </div>

      <div
        className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
          inventoryStateStyles[inventoryState.tone]
        }`}
      >
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4" />
          {inventoryState.label}
        </div>
        <p className="mt-1 text-xs leading-6">{inventoryState.description}</p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <label className="space-y-2 xl:col-span-2">
          <span className="text-sm font-semibold text-slate-700">الكمية المتاحة</span>
          <input
            type="number"
            min="0"
            step="1"
            value={values.quantity}
            onChange={(event) => onFieldChange("quantity", event.target.value)}
            className={fieldClassName}
            placeholder="0"
            disabled={isDisabled}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">الحد الأدنى للمخزون</span>
          <input
            type="number"
            min="0"
            step="1"
            value={values.minStockLevel}
            onChange={(event) => onFieldChange("minStockLevel", event.target.value)}
            className={fieldClassName}
            disabled={isDisabled}
          />
        </label>

        <label className="space-y-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <RotateCcw className="h-4 w-4 text-slate-400" />
            حد إعادة الطلب
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={values.reorderPoint}
            onChange={(event) => onFieldChange("reorderPoint", event.target.value)}
            className={fieldClassName}
            disabled={isDisabled}
          />
        </label>
      </div>
    </section>
  );
}
