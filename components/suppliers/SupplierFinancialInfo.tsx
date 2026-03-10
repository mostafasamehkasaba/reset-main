import { Building, CreditCard, Landmark, ReceiptText } from "lucide-react";
import type { SupplierFormState } from "@/lib/suppliers/supplierTypes";

type SupplierFinancialInfoProps = {
  values: SupplierFormState;
  isDisabled: boolean;
  onChange: <K extends keyof SupplierFormState>(
    key: K,
    value: SupplierFormState[K]
  ) => void;
};

const fieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export function SupplierFinancialInfo({
  values,
  isDisabled,
  onChange,
}: SupplierFinancialInfoProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <Landmark className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-amber-700">
            المعلومات المالية والقانونية
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            الضرائب والحدود والبيانات البنكية
          </h2>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <label className="space-y-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ReceiptText className="h-4 w-4 text-slate-400" />
            الرقم الضريبي
          </span>
          <input
            value={values.taxNumber}
            onChange={(event) => onChange("taxNumber", event.target.value)}
            className={fieldClassName}
            disabled={isDisabled}
          />
        </label>

        <label className="space-y-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CreditCard className="h-4 w-4 text-slate-400" />
            الحد الائتماني
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.creditLimit}
            onChange={(event) => onChange("creditLimit", event.target.value)}
            className={fieldClassName}
            disabled={isDisabled}
          />
        </label>

        <label className="space-y-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CreditCard className="h-4 w-4 text-slate-400" />
            الرصيد الافتتاحي
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.openingBalance}
            onChange={(event) => onChange("openingBalance", event.target.value)}
            className={fieldClassName}
            disabled={isDisabled}
          />
        </label>

        <label className="space-y-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Building className="h-4 w-4 text-slate-400" />
            اسم البنك
          </span>
          <input
            value={values.bankName}
            onChange={(event) => onChange("bankName", event.target.value)}
            className={fieldClassName}
            disabled={isDisabled}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">رقم الحساب البنكي</span>
          <input
            value={values.bankAccountNumber}
            onChange={(event) => onChange("bankAccountNumber", event.target.value)}
            className={fieldClassName}
            disabled={isDisabled}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">IBAN</span>
          <input
            value={values.iban}
            onChange={(event) => onChange("iban", event.target.value)}
            className={fieldClassName}
            disabled={isDisabled}
          />
        </label>
      </div>
    </section>
  );
}
