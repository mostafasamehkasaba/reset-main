import Link from "next/link";
import {
  PAYMENT_METHOD_CURRENCY_OPTIONS,
  PAYMENT_METHOD_TYPE_OPTIONS,
  type PaymentMethodFormValues,
} from "@/lib/payment-methods/paymentMethodTypes";

type PaymentMethodFormProps = {
  values: PaymentMethodFormValues;
  isEditMode: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  loadError?: string;
  submitError?: string;
  successMessage?: string;
  onChange: <K extends keyof PaymentMethodFormValues>(
    key: K,
    value: PaymentMethodFormValues[K]
  ) => void;
  onSubmit: () => Promise<unknown> | void;
};

export function PaymentMethodForm({
  values,
  isEditMode,
  isLoading,
  isSubmitting,
  loadError,
  submitError,
  successMessage,
  onChange,
  onSubmit,
}: PaymentMethodFormProps) {
  const typeOptions = Array.from(
    new Set([
      ...PAYMENT_METHOD_TYPE_OPTIONS.map((option) => option.value),
      values.type || "",
    ].filter(Boolean))
  );

  const currencyOptions = Array.from(
    new Set([...PAYMENT_METHOD_CURRENCY_OPTIONS, values.currency || ""].filter(Boolean))
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
      className="grid gap-4 lg:grid-cols-[320px_1fr]"
    >
      <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
        <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
          ملخص سريع
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">
          {isEditMode ? "تعديل وسيلة دفع" : "إضافة وسيلة دفع"}
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          استخدم نفس الحقول المدعومة حاليًا في النظام فقط: الاسم، النوع، العملة، والوصف.
        </p>

        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-xs text-slate-400">الاسم الحالي</p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {values.name || "-"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-xs text-slate-400">النوع</p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {PAYMENT_METHOD_TYPE_OPTIONS.find((option) => option.value === values.type)
                ?.label || values.type || "-"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-xs text-slate-400">العملة</p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {values.currency || "-"}
            </p>
          </div>
        </div>
      </aside>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
              بيانات الوسيلة
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">
              {isEditMode ? "تحديث البيانات الحالية" : "إدخال بيانات الوسيلة الجديدة"}
            </h3>
          </div>

          <Link
            href="/projects-pages/payment-methods"
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            رجوع للقائمة
          </Link>
        </div>

        {loadError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {loadError}
          </div>
        ) : null}

        {submitError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">اسم وسيلة الدفع</span>
            <input
              value={values.name}
              onChange={(event) => onChange("name", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
              placeholder="مثال: تحويل بنكي"
              disabled={isLoading || isSubmitting}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">النوع</span>
            <select
              value={values.type}
              onChange={(event) => onChange("type", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
              disabled={isLoading || isSubmitting}
            >
              {typeOptions.map((optionValue) => (
                <option key={optionValue} value={optionValue}>
                  {PAYMENT_METHOD_TYPE_OPTIONS.find(
                    (option) => option.value === optionValue
                  )?.label || optionValue}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">العملة</span>
            <select
              value={values.currency}
              onChange={(event) => onChange("currency", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
              disabled={isLoading || isSubmitting}
            >
              {currencyOptions.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold text-slate-700">الوصف</span>
            <textarea
              rows={4}
              value={values.desc}
              onChange={(event) => onChange("desc", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
              placeholder="وصف مختصر يفيد فريق المحاسبة والإدارة"
              disabled={isLoading || isSubmitting}
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <div className="text-sm text-slate-500">
            {isEditMode
              ? "سيتم تحديث نفس الوسيلة الحالية."
              : "سيتم إنشاء وسيلة دفع جديدة بنفس التكامل الحالي."}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/projects-pages/payment-methods"
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? "جارٍ الحفظ..."
                : isEditMode
                  ? "حفظ التعديلات"
                  : "حفظ وسيلة الدفع"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
