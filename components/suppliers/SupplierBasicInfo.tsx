import type { SupplierFormState } from "@/lib/suppliers/supplierTypes";
import { supplierPaymentTerms } from "@/lib/suppliers/supplierTypes";
import { Building2, CalendarClock } from "lucide-react";

type SupplierBasicInfoProps = {
  values: SupplierFormState;
  isDisabled: boolean;
  onChange: <K extends keyof SupplierFormState>(
    key: K,
    value: SupplierFormState[K]
  ) => void;
};

const fieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export function SupplierBasicInfo({
  values,
  isDisabled,
  onChange,
}: SupplierBasicInfoProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
            المعلومات الأساسية
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            هوية المورد وشروطه الأساسية
          </h2>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            اسم المورد <span className="text-rose-500">*</span>
          </span>
          <input
            value={values.name}
            onChange={(event) => onChange("name", event.target.value)}
            className={fieldClassName}
            placeholder="مثال: مؤسسة الريادة للتوريد"
            disabled={isDisabled}
            required
          />
        </label>

        <label className="space-y-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CalendarClock className="h-4 w-4 text-slate-400" />
            مدة السداد
          </span>
          <select
            value={values.paymentTermDays}
            onChange={(event) =>
              onChange(
                "paymentTermDays",
                Number(event.target.value) as SupplierFormState["paymentTermDays"]
              )
            }
            className={fieldClassName}
            disabled={isDisabled}
          >
            {supplierPaymentTerms.map((term) => (
              <option key={term} value={term}>
                {term} يوم
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
