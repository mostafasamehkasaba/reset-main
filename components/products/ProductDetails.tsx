import Link from "next/link";
import { CalendarDays, FileText, PackageCheck, Plus, Ruler } from "lucide-react";
import type { Product, ProductUnit } from "@/app/lib/product-store";
import type { ProductFormState } from "@/lib/products/productTypes";

type ProductDetailsProps = {
  values: ProductFormState;
  unitOptions: string[];
  isDisabled: boolean;
  onFieldChange: <K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K]
  ) => void;
};

const fieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const addLinkClassName =
  "inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700";

export function ProductDetails({
  values,
  unitOptions,
  isDisabled,
  onFieldChange,
}: ProductDetailsProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
          <PackageCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-violet-700">
            تفاصيل المنتج
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            بيانات العرض والحالة والوصف
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            نظّم طريقة عرض المنتج داخل النظام عبر وحدة القياس والحالة والوصف الداخلي.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Ruler className="h-4 w-4 text-slate-400" />
            وحدة القياس
          </span>
          <div className="flex gap-2">
            <select
              value={values.unit}
              onChange={(event) => onFieldChange("unit", event.target.value as ProductUnit)}
              className={fieldClassName}
              disabled={isDisabled}
            >
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            <Link
              href="/products/units"
              className={addLinkClassName}
              aria-label="إضافة وحدة قياس"
            >
              <Plus className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">الحالة</span>
          <select
            value={values.status}
            onChange={(event) =>
              onFieldChange("status", event.target.value as Product["status"])
            }
            className={fieldClassName}
            disabled={isDisabled}
          >
            <option value="متاح">متاح</option>
            <option value="غير متاح">غير متاح</option>
          </select>
        </label>

        <label className="space-y-2 xl:col-span-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            تاريخ الإضافة
          </span>
          <input
            type="date"
            value={values.dateAdded}
            onChange={(event) => onFieldChange("dateAdded", event.target.value)}
            className={fieldClassName}
            disabled={isDisabled}
          />
        </label>

        <label className="space-y-2 xl:col-span-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FileText className="h-4 w-4 text-slate-400" />
            الوصف
          </span>
          <textarea
            rows={5}
            value={values.description}
            onChange={(event) => onFieldChange("description", event.target.value)}
            className={fieldClassName}
            placeholder="وصف اختياري يساعد فريق المبيعات والمحاسبة على فهم المنتج بسرعة"
            disabled={isDisabled}
          />
        </label>
      </div>
    </section>
  );
}
