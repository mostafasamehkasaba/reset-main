import { Mail, Phone } from "lucide-react";
import type { SupplierFormState } from "@/lib/suppliers/supplierTypes";

type SupplierContactInfoProps = {
  values: SupplierFormState;
  isDisabled: boolean;
  onChange: <K extends keyof SupplierFormState>(
    key: K,
    value: SupplierFormState[K]
  ) => void;
};

const fieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export function SupplierContactInfo({
  values,
  isDisabled,
  onChange,
}: SupplierContactInfoProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Phone className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-emerald-700">
            معلومات التواصل
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            الهاتف والبريد الإلكتروني
          </h2>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <label className="space-y-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Phone className="h-4 w-4 text-slate-400" />
            الهاتف <span className="text-rose-500">*</span>
          </span>
          <input
            type="tel"
            inputMode="tel"
            dir="rtl"
            value={values.phone}
            onChange={(event) => onChange("phone", event.target.value)}
            className={`${fieldClassName} text-right`}
            placeholder="مثال: 01000000000"
            disabled={isDisabled}
            required
          />
        </label>

        <label className="space-y-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Mail className="h-4 w-4 text-slate-400" />
            البريد الإلكتروني
          </span>
          <input
            type="email"
            value={values.email}
            onChange={(event) => onChange("email", event.target.value)}
            className={fieldClassName}
            placeholder="supplier@example.com"
            disabled={isDisabled}
          />
        </label>
      </div>
    </section>
  );
}
