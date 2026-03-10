import type { InvoiceDetails, InvoiceLineItemPayload } from "../../services/invoices";
import type { AppSettings } from "../../services/settings";
import { calculateInvoiceRowTotal } from "@/lib/invoice/invoiceCalculations";

type InvoiceDocumentProps = {
  invoice: InvoiceDetails;
  company: AppSettings;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const paymentMethodLabels: Record<InvoiceDetails["paymentMethod"], string> = {
  cash: "نقدي",
  transfer: "تحويل",
  card: "بطاقة",
  credit: "آجل",
};

const formatMoney = (value: number) =>
  Number.isFinite(value) ? moneyFormatter.format(value) : "0.00";

const formatDisplayDate = (value: string, fallback = "-") => {
  const normalized = value.trim();
  if (!normalized || normalized === "-") {
    return fallback;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return normalized;
  }

  return new Intl.DateTimeFormat("ar-EG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const calculateLineTotal = (item: InvoiceLineItemPayload) => {
  const base = calculateInvoiceRowTotal(item);
  const discount =
    item.discountType === "percent"
      ? base * (Math.max(0, item.discountValue) / 100)
      : Math.max(0, item.discountValue);
  const taxableBase = Math.max(0, base - discount);
  const tax = taxableBase * (Math.max(0, item.taxRate) / 100);

  return taxableBase + tax;
};

const buildLineDescription = (item: InvoiceLineItemPayload, currency: string) => {
  const segments = [
    item.itemType === "product" ? "منتج" : "خدمة",
    item.discountValue > 0
      ? item.discountType === "percent"
        ? `خصم ${item.discountValue.toFixed(2)}%`
        : `خصم ${formatMoney(item.discountValue)} ${currency}`
      : "بدون خصم",
    item.taxRate > 0 ? `ضريبة ${item.taxRate.toFixed(2)}%` : "بدون ضريبة",
  ];

  return segments.join(" • ");
};

const getInitial = (value: string, fallback = "I") => {
  const normalized = value.trim();
  if (!normalized) {
    return fallback;
  }

  return normalized[0]?.toUpperCase() || fallback;
};

function MetaItem({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        accent ? "border-sky-100 bg-sky-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function DetailBlock({
  label,
  title,
  lines,
}: {
  label: string;
  title: string;
  lines: string[];
}) {
  const normalizedLines = lines.filter((line) => line.trim());

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-lg font-semibold text-slate-950">{title}</p>
      <div className="mt-3 space-y-1.5 text-sm leading-7 text-slate-600">
        {normalizedLines.length > 0 ? (
          normalizedLines.map((line, index) => <p key={`${label}-${index}`}>{line}</p>)
        ) : (
          <p>-</p>
        )}
      </div>
    </section>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={strong ? "text-sm font-semibold text-slate-950" : "text-sm font-medium text-slate-700"}>
        {value}
      </span>
    </div>
  );
}

export function InvoiceDocument({ invoice, company }: InvoiceDocumentProps) {
  const companyName = company.siteName.trim() || "اسم الشركة";
  const companyTagline = company.companyTagline.trim();
  const companyContact = [company.siteEmail.trim(), company.sitePhone.trim(), company.siteUrl.trim()].filter(
    Boolean
  );
  const clientContact = [invoice.clientEmail.trim(), invoice.clientPhone.trim()].filter(Boolean);
  const notes = invoice.notes.trim() || company.invoiceNotes.trim() || "لا توجد ملاحظات إضافية.";
  const invoiceNumber = invoice.id.trim() || `#${invoice.num}`;

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_-32px_rgba(15,23,42,0.18)]">
      <div className="border-b border-slate-200 px-6 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-lg font-semibold text-sky-700">
              {company.logoDataUrl.trim() ? (
                <img
                  src={company.logoDataUrl}
                  alt={companyName}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitial(companyName)
              )}
            </div>

            <div className="min-w-0 space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-sky-700">
                  الفاتورة
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  فاتورة
                </h1>
              </div>

              <div>
                <p className="text-lg font-semibold text-slate-950">{companyName}</p>
                {companyTagline ? (
                  <p className="mt-1 text-sm leading-7 text-slate-500">{companyTagline}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                {companyContact.length > 0 ? (
                  companyContact.map((entry) => <span key={entry}>{entry}</span>)
                ) : (
                  <span>أضف بيانات الشركة من الإعدادات لتظهر هنا.</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-sky-100 bg-sky-50 px-5 py-4">
              <p className="text-xs font-semibold tracking-[0.18em] text-sky-700/80">
                الإجمالي النهائي
              </p>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-semibold leading-none text-slate-950">
                  {formatMoney(invoice.totals.total)}
                </span>
                <span className="pb-1 text-sm font-semibold text-sky-700">{invoice.currency}</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <MetaItem label="رقم الفاتورة" value={invoiceNumber} accent />
              <MetaItem label="تاريخ الإصدار" value={formatDisplayDate(invoice.issueDate)} />
              <MetaItem label="تاريخ الاستحقاق" value={formatDisplayDate(invoice.dueDate)} />
              <MetaItem label="الحالة" value={invoice.status || "-"} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 border-b border-slate-200 px-6 py-6 sm:px-8 lg:grid-cols-2">
        <DetailBlock
          label="من"
          title={companyName}
          lines={[companyTagline, ...companyContact]}
        />
        <DetailBlock
          label="إلى"
          title={invoice.clientName.trim() || "عميل غير محدد"}
          lines={[invoice.clientAddress.trim(), ...clientContact]}
        />
      </div>

      <div className="border-b border-slate-200">
        <div className="flex items-center justify-between px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">بنود الفاتورة</h2>
            <p className="mt-1 text-sm text-slate-500">
              تخطيط نظيف يسهّل قراءة البنود والمبالغ بسرعة.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            {invoice.items.length} بند
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-right">
            <thead className="border-y border-slate-200 bg-slate-50/90">
              <tr className="text-sm text-slate-500">
                <th className="px-6 py-3 font-medium sm:px-8">البند</th>
                <th className="px-6 py-3 font-medium">الوصف</th>
                <th className="px-6 py-3 text-center font-medium">الكمية</th>
                <th className="px-6 py-3 text-center font-medium">سعر الوحدة</th>
                <th className="px-6 py-3 text-center font-medium sm:px-8">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.length > 0 ? (
                invoice.items.map((item, index) => (
                  <tr key={`${item.name}-${index}`} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-6 py-4 align-top sm:px-8">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-950">
                          {item.name.trim() || "بدون اسم"}
                        </p>
                        <p className="text-xs text-slate-400">#{String(index + 1).padStart(2, "0")}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top text-sm leading-7 text-slate-500">
                      {buildLineDescription(item, invoice.currency)}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                      {formatMoney(item.price)} {invoice.currency}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-slate-950 sm:px-8">
                      {formatMoney(calculateLineTotal(item))} {invoice.currency}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500 sm:px-8">
                    لا توجد بنود محفوظة لهذه الفاتورة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium tracking-[0.18em] text-slate-400">
              معلومات الدفع
            </p>
            <div className="mt-4 divide-y divide-slate-100">
              <SummaryRow
                label="طريقة الدفع"
                value={paymentMethodLabels[invoice.paymentMethod] || invoice.paymentMethod}
              />
              <SummaryRow label="الحالة" value={invoice.status || "-"} />
              <SummaryRow
                label="المدفوع"
                value={`${formatMoney(invoice.paidAmount)} ${invoice.currency}`}
              />
              <SummaryRow
                label="المتبقي"
                value={`${formatMoney(invoice.totals.due)} ${invoice.currency}`}
                strong
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <p className="text-xs font-medium tracking-[0.18em] text-slate-400">
              الملاحظات والشروط
            </p>
            <p className="mt-4 text-sm leading-8 text-slate-600">{notes}</p>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
          <p className="text-xs font-medium tracking-[0.18em] text-slate-400">
            الإجماليات
          </p>

          <div className="mt-4 divide-y divide-slate-200">
            <SummaryRow
              label="الإجمالي الفرعي"
              value={`${formatMoney(invoice.totals.subtotal)} ${invoice.currency}`}
            />
            <SummaryRow
              label="الضريبة"
              value={`${formatMoney(invoice.totals.tax)} ${invoice.currency}`}
            />
            <SummaryRow
              label="الخصم"
              value={`${formatMoney(invoice.totals.discount)} ${invoice.currency}`}
            />
          </div>

          <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-5">
            <p className="text-xs font-semibold tracking-[0.18em] text-sky-700/80">
              الإجمالي النهائي
            </p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-semibold leading-none text-slate-950">
                  {formatMoney(invoice.totals.total)}
                </p>
                <p className="mt-2 text-sm font-medium text-sky-700">{invoice.currency}</p>
              </div>
              <div className="text-left text-sm text-slate-500">
                <p>مدفوع: {formatMoney(invoice.paidAmount)}</p>
                <p>متبقي: {formatMoney(invoice.totals.due)}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
