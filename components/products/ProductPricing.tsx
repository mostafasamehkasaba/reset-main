import { BadgePercent, Coins, ReceiptText } from "lucide-react";
import { PRODUCT_TAX_MODES, type ProductTaxMode } from "@/app/lib/product-store";
import {
  PRODUCT_CURRENCY_OPTIONS,
  type ProductFormState,
} from "@/lib/products/productTypes";

type ProductPricingProps = {
  values: ProductFormState;
  isDisabled: boolean;
  onFieldChange: <K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K]
  ) => void;
};

const fieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const currencyLabels: Record<(typeof PRODUCT_CURRENCY_OPTIONS)[number], string> = {
  OMR: "ريال عماني",
  SAR: "ريال سعودي",
  USD: "دولار أمريكي",
  EGP: "جنيه مصري",
};

export function ProductPricing({
  values,
  isDisabled,
  onFieldChange,
}: ProductPricingProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Coins className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-emerald-700">
            التسعير
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            أسعار البيع والشراء والضريبة
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            استخدم نفس الحقول المتصلة حاليًا بالباكند لتحديد العملة والتسعير والضريبة
            الافتراضية.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">العملة</span>
          <select
            value={values.currency}
            onChange={(event) => onFieldChange("currency", event.target.value)}
            className={fieldClassName}
            disabled={isDisabled}
          >
            {PRODUCT_CURRENCY_OPTIONS.map((currencyCode) => (
              <option key={currencyCode} value={currencyCode}>
                {currencyLabels[currencyCode]}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ReceiptText className="h-4 w-4 text-slate-400" />
            سعر البيع
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.sellingPrice}
            onChange={(event) => onFieldChange("sellingPrice", event.target.value)}
            className={fieldClassName}
            placeholder="0.00"
            disabled={isDisabled}
          />
        </label>

        <label className="space-y-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ReceiptText className="h-4 w-4 text-slate-400" />
            سعر الشراء
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.purchasePrice}
            onChange={(event) => onFieldChange("purchasePrice", event.target.value)}
            className={fieldClassName}
            placeholder="0.00"
            disabled={isDisabled}
          />
        </label>

        <label className="space-y-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <BadgePercent className="h-4 w-4 text-slate-400" />
            نوع الضريبة
          </span>
          <select
            value={values.taxMode}
            onChange={(event) =>
              onFieldChange("taxMode", event.target.value as ProductTaxMode)
            }
            className={fieldClassName}
            disabled={isDisabled}
          >
            {PRODUCT_TAX_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 xl:col-span-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <BadgePercent className="h-4 w-4 text-slate-400" />
            نسبة الضريبة %
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.defaultTaxRate}
            disabled={isDisabled || values.taxMode === "none"}
            onChange={(event) => onFieldChange("defaultTaxRate", event.target.value)}
            className={fieldClassName}
          />
          <p className="text-xs text-slate-500">
            عند اختيار &quot;بدون ضريبة&quot; سيتم إرسال القيمة صفر كما هو مطبق حاليًا.
          </p>
        </label>
      </div>
    </section>
  );
}
