import type { ReactNode } from "react";
import { Building2, FileText, Mail, MapPin, Phone } from "lucide-react";
import type { Client } from "@/app/types";
import type {
  InvoiceEditorCustomer,
  InvoiceEditorValidationErrors,
} from "@/lib/invoice/invoiceTypes";

type InvoiceCustomerProps = {
  clients: Client[];
  customer: InvoiceEditorCustomer;
  errors: Pick<
    InvoiceEditorValidationErrors,
    "customer" | "taxNumber" | "commercialRegister"
  >;
  onSelectClient: (clientIdText: string) => void;
  onChange: <K extends keyof Omit<InvoiceEditorCustomer, "selectedClientId">>(
    field: K,
    value: InvoiceEditorCustomer[K]
  ) => void;
};

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
        <span className="text-slate-400">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

export function InvoiceCustomer({
  clients,
  customer,
  errors,
  onSelectClient,
  onChange,
}: InvoiceCustomerProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="العميل" icon={<Building2 className="h-4 w-4" />}>
          <select
            value={customer.selectedClientId ?? ""}
            onChange={(event) => onSelectClient(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          >
            <option value="">اختر العميل</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="نوع المستلم" icon={<FileText className="h-4 w-4" />}>
          <select
            value={customer.recipientType}
            onChange={(event) =>
              onChange(
                "recipientType",
                event.target.value as InvoiceEditorCustomer["recipientType"]
              )
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          >
            <option value="individual">فرد</option>
            <option value="company">شركة</option>
          </select>
        </Field>

        <Field label="البريد الإلكتروني" icon={<Mail className="h-4 w-4" />}>
          <input
            value={customer.email}
            onChange={(event) => onChange("email", event.target.value)}
            placeholder="client@example.com"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          />
        </Field>

        <Field label="اسم جهة الفاتورة" icon={<Building2 className="h-4 w-4" />}>
          <input
            value={customer.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="اسم العميل"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          />
        </Field>

        <Field label="الهاتف" icon={<Phone className="h-4 w-4" />}>
          <input
            type="tel"
            inputMode="tel"
            dir="rtl"
            value={customer.phone}
            onChange={(event) => onChange("phone", event.target.value)}
            placeholder="+966 ..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          />
        </Field>
      </div>

      <Field label="العنوان" icon={<MapPin className="h-4 w-4" />}>
        <textarea
          rows={3}
          value={customer.address}
          onChange={(event) => onChange("address", event.target.value)}
          placeholder="عنوان العميل"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        />
      </Field>

      {customer.recipientType === "company" ? (
        <div className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-4">
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-800">البيانات المالية للشركة</p>
            <p className="mt-1 text-xs leading-6 text-slate-500">
              تظهر فقط عند اختيار الفاتورة لصالح شركة وتبقى مخفية في حالة الأفراد.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="الرقم الضريبي" icon={<FileText className="h-4 w-4" />}>
              <div className="space-y-2">
                <input
                  value={customer.taxNumber}
                  onChange={(event) => onChange("taxNumber", event.target.value)}
                  placeholder="أدخل الرقم الضريبي"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                />
                {errors.taxNumber ? (
                  <p className="text-sm text-rose-700">{errors.taxNumber}</p>
                ) : null}
              </div>
            </Field>

            <Field label="السجل التجاري" icon={<Building2 className="h-4 w-4" />}>
              <div className="space-y-2">
                <input
                  value={customer.commercialRegister}
                  onChange={(event) => onChange("commercialRegister", event.target.value)}
                  placeholder="أدخل السجل التجاري"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                />
                {errors.commercialRegister ? (
                  <p className="text-sm text-rose-700">{errors.commercialRegister}</p>
                ) : null}
              </div>
            </Field>
          </div>
        </div>
      ) : null}

      {errors.customer ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errors.customer}
        </div>
      ) : null}
    </div>
  );
}
