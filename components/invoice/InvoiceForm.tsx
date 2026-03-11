import Link from "next/link";
import {
  AlertTriangle,
  CreditCard,
  LoaderCircle,
  Percent,
  ReceiptText,
  Save,
  Wallet,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { InvoiceCustomer } from "@/components/invoice/InvoiceCustomer";
import { InvoiceItemsTable } from "@/components/invoice/InvoiceItemsTable";
import type { UseInvoiceFormResult } from "@/hooks/useInvoiceForm";
import {
  invoiceEditorCurrencyOptions,
  invoiceEditorPaymentMethodOptions,
  invoiceEditorStatusOptions,
} from "@/lib/invoice/invoiceTypes";

type InvoiceFormProps = {
  state: UseInvoiceFormResult;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatMoney = (value: number, currency: string) =>
  `${moneyFormatter.format(value)} ${currency}`;

function SectionCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.42)] sm:p-6 ${className}`}
    >
      <div className="border-b border-slate-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
          {title}
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-500">{description}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Feedback({
  tone,
  message,
}: {
  tone: "error" | "success";
  message: string;
}) {
  const classes =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${classes}`}>{message}</div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.42)]">
        <div className="h-6 w-48 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-4 h-4 w-72 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded-full bg-slate-200" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {[0, 1].map((block) => (
          <div
            key={block}
            className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.42)]"
          >
            <div className="h-5 w-52 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.42)]">
        <div className="h-5 w-52 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-5 h-72 animate-pulse rounded-[28px] bg-slate-100" />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "accent" | "danger" | "success";
}) {
  const toneClasses =
    tone === "accent"
      ? "border-sky-100 bg-sky-50"
      : tone === "danger"
        ? "border-rose-100 bg-rose-50"
        : tone === "success"
          ? "border-emerald-100 bg-emerald-50"
          : "border-slate-200 bg-slate-50";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClasses}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-slate-950 sm:text-lg">{value}</p>
    </div>
  );
}

function CreditOverview({
  currency,
  currentDue,
  projectedDue,
  remainingCredit,
  creditLimit,
  exceeded,
  error,
}: {
  currency: string;
  currentDue: number;
  projectedDue: number;
  remainingCredit: number;
  creditLimit: number;
  exceeded: boolean;
  error?: string;
}) {
  return (
    <div
      className={`mt-5 rounded-[26px] border p-4 shadow-[0_22px_48px_-38px_rgba(15,23,42,0.35)] ${
        exceeded ? "border-rose-200 bg-rose-50/80" : "border-slate-200 bg-slate-50/80"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            exceeded ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-950">ملخص الحد الائتماني</p>
          <p className="mt-1 text-sm text-slate-500">
            متابعة سريعة للحد الائتماني قبل اعتماد فاتورة آجلة أو غير مدفوعة.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MetricCard label="الحد الائتماني" value={formatMoney(creditLimit, currency)} />
        <MetricCard
          label="المستحق المتوقع"
          value={formatMoney(projectedDue, currency)}
          tone={exceeded ? "danger" : "accent"}
        />
        <MetricCard label="المستحق الحالي" value={formatMoney(currentDue, currency)} />
        <MetricCard
          label="المتاح"
          value={formatMoney(remainingCredit, currency)}
          tone={exceeded ? "danger" : "success"}
        />
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}

export function InvoiceForm({ state }: InvoiceFormProps) {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await state.submit();
  };

  if (state.isLoading) {
    return <LoadingState />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f5f9ff_58%,#eff6ff_100%)] shadow-[0_40px_100px_-70px_rgba(15,23,42,0.5)]">
        <div className="grid gap-6 px-6 py-6">
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-sky-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
              منشئ الفواتير
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {state.isEditMode ? "تعديل الفاتورة" : "إنشاء فاتورة جديدة"}
              </h1>
            </div>
          </div>

        </div>
      </section>

      {state.loadError ? <Feedback tone="error" message={state.loadError} /> : null}
      {state.validationErrors.general ? (
        <Feedback tone="error" message={state.validationErrors.general} />
      ) : null}
      {state.saveError ? <Feedback tone="error" message={state.saveError} /> : null}
      {state.saveMessage ? <Feedback tone="success" message={state.saveMessage} /> : null}

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <SectionCard
          title="بيانات العميل"
          description="بيانات العميل الأساسية ومعلومات جهة الفاتورة، مع عرض الحد الائتماني بشكل مختصر وواضح."
          className="h-full"
        >
          <InvoiceCustomer
            clients={state.clients}
            customer={state.form.customer}
            errors={{
              customer: state.validationErrors.customer,
              taxNumber: state.validationErrors.taxNumber,
              commercialRegister: state.validationErrors.commercialRegister,
            }}
            onSelectClient={state.selectClient}
            onChange={state.updateCustomerField}
          />

          <CreditOverview
            currency={state.clientCredit.currency}
            currentDue={state.clientCredit.currentDue}
            projectedDue={state.clientCredit.projectedDue}
            remainingCredit={state.clientCredit.remainingCredit}
            creditLimit={state.clientCredit.creditLimit}
            exceeded={state.clientCredit.exceeded}
            error={state.validationErrors.creditLimit}
          />
        </SectionCard>

        <SectionCard
          title="تفاصيل الفاتورة"
          description="التواريخ، العملة، طريقة الدفع، حالة التحصيل، والحقول المالية المطلوبة للحفظ في مكان واحد."
          className="h-full"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-600">رقم الفاتورة</span>
              <input
                readOnly
                value={state.form.invoiceNumber}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-600">العملة</span>
              <select
                value={state.form.currency}
                onChange={(event) => state.updateDetailField("currency", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              >
                {invoiceEditorCurrencyOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-600">تاريخ الإصدار</span>
              <input
                type="date"
                value={state.form.issueDate}
                onChange={(event) => state.updateDetailField("issueDate", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
              {state.validationErrors.issueDate ? (
                <p className="text-sm text-rose-700">{state.validationErrors.issueDate}</p>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-600">تاريخ الاستحقاق</span>
              <input
                type="date"
                value={state.form.dueDate}
                onChange={(event) => state.updateDetailField("dueDate", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
              {state.validationErrors.dueDate ? (
                <p className="text-sm text-rose-700">{state.validationErrors.dueDate}</p>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Wallet className="h-4 w-4 text-slate-400" />
                طريقة الدفع
              </span>
              <select
                value={state.form.paymentMethod}
                onChange={(event) => state.updateDetailField("paymentMethod", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              >
                {invoiceEditorPaymentMethodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <CreditCard className="h-4 w-4 text-slate-400" />
                حالة التحصيل
              </span>
              <select
                value={state.form.status}
                onChange={(event) => state.updateDetailField("status", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              >
                {invoiceEditorStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Percent className="h-4 w-4 text-slate-400" />
                نسبة الضريبة
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={state.form.taxRate}
                onChange={(event) => state.updateDetailField("taxRate", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <ReceiptText className="h-4 w-4 text-slate-400" />
                الخصم
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={state.form.discount}
                onChange={(event) => state.updateDetailField("discount", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
              {state.validationErrors.discount ? (
                <p className="text-sm text-rose-700">{state.validationErrors.discount}</p>
              ) : null}
            </label>

            {state.form.status === "partial" ? (
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-600">المبلغ المحصل الآن</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={state.form.partialPaidAmount}
                  onChange={(event) =>
                    state.updateDetailField("partialPaidAmount", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                />
                {state.validationErrors.payment ? (
                  <p className="text-sm text-rose-700">{state.validationErrors.payment}</p>
                ) : null}
              </label>
            ) : null}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="جدول البنود"
        description="أضف المنتجات أو الخدمات وعدّل البنود داخل مساحة واحدة بعرض كامل، مع ملخص حي أسفل الجدول مباشرة."
      >
        <InvoiceItemsTable
          items={state.form.items}
          products={state.products}
          currency={state.form.currency}
          productCatalogMessage={state.productCatalogMessage}
          error={state.validationErrors.items}
          onAddProductItem={state.addProductItem}
          onAddServiceItem={state.addServiceItem}
          onChangeKind={state.changeItemKind}
          onSelectProduct={state.chooseProductForItem}
          onChangeField={state.updateItemField}
          onRemoveItem={state.removeItem}
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard
            label="الإجمالي الفرعي"
            value={formatMoney(state.totals.subtotal, state.form.currency)}
          />
          <MetricCard label="الضريبة" value={formatMoney(state.totals.tax, state.form.currency)} />
          <MetricCard
            label="الخصم"
            value={formatMoney(state.totals.discount, state.form.currency)}
          />
          <MetricCard
            label="الإجمالي"
            value={formatMoney(state.totals.total, state.form.currency)}
            tone="accent"
          />
          <MetricCard
            label="المدفوع"
            value={formatMoney(state.totals.paid, state.form.currency)}
            tone="success"
          />
          <MetricCard
            label="المتبقي"
            value={formatMoney(state.totals.due, state.form.currency)}
            tone={state.totals.due > 0 ? "danger" : "success"}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="ملاحظات"
        description="ملاحظات أو شروط دفع إضافية تظهر مع الفاتورة من غير ما تستهلك مساحة كبيرة في الشاشة."
      >
        <textarea
          rows={4}
          value={state.form.notes}
          onChange={(event) => state.updateDetailField("notes", event.target.value)}
          placeholder="أضف ملاحظات أو شروط دفع..."
          className="w-full rounded-[26px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        />
      </SectionCard>

      <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-4 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.42)] sm:px-6">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            href="/invoices"
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            رجوع
          </Link>
          <button
            type="button"
            onClick={() => void state.saveDraft()}
            disabled={state.isSavingDraft || state.isSubmitting}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state.isSavingDraft ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            حفظ كمسودة
          </button>
          <button
            type="submit"
            disabled={state.isSubmitting || state.isSavingDraft}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state.isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {state.isEditMode ? "حفظ التعديلات" : "حفظ الفاتورة"}
          </button>
        </div>
      </section>
    </form>
  );
}
