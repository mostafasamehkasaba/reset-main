import { MapPin } from "lucide-react";
import {
  countryOptions,
  type CountryApiValue,
} from "@/app/lib/api-lookups";
import type { SupplierFormState } from "@/lib/suppliers/supplierTypes";

type SupplierAddressInfoProps = {
  values: SupplierFormState;
  isDisabled: boolean;
  onChange: <K extends keyof SupplierFormState>(
    key: K,
    value: SupplierFormState[K]
  ) => void;
};

const fieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export function SupplierAddressInfo({
  values,
  isDisabled,
  onChange,
}: SupplierAddressInfoProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-violet-700">
            معلومات العنوان
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            الدولة والمدينة والعنوان
          </h2>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">الدولة</span>
          <select
            value={values.country}
            onChange={(event) => onChange("country", event.target.value as CountryApiValue)}
            className={fieldClassName}
            disabled={isDisabled}
          >
            {countryOptions.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">المدينة</span>
          <input
            value={values.city}
            onChange={(event) => onChange("city", event.target.value)}
            className={fieldClassName}
            placeholder="مثال: القاهرة"
            disabled={isDisabled}
          />
        </label>

        <label className="space-y-2 xl:col-span-2">
          <span className="text-sm font-semibold text-slate-700">العنوان</span>
          <textarea
            rows={4}
            value={values.address}
            onChange={(event) => onChange("address", event.target.value)}
            className={fieldClassName}
            placeholder="العنوان الكامل للمورد"
            disabled={isDisabled}
          />
        </label>
      </div>
    </section>
  );
}
