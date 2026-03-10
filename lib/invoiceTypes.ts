export type InvoiceWorkflowStepId = "customer" | "products" | "invoice" | "payment" | "status";

export type InvoiceLifecycleStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export type InvoiceTableItem = {
  id: string;
  number: number;
  customer: string;
  products: number;
  total: number;
  paid: number;
  due: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  rawStatus: string;
  lifecycleStatus: InvoiceLifecycleStatus;
};

export type InvoicePaymentMethodValue = "cash" | "transfer" | "card" | "credit";

export const invoiceWorkflow: Array<{
  id: InvoiceWorkflowStepId;
  title: string;
  description: string;
}> = [
  {
    id: "customer",
    title: "العميل",
    description: "تحديد الجهة التي ستصدر لها الفاتورة.",
  },
  {
    id: "products",
    title: "المنتجات",
    description: "اختيار البنود والخدمات مع الأسعار والكميات.",
  },
  {
    id: "invoice",
    title: "الفاتورة",
    description: "إنشاء المستند المالي مع المجاميع والضرائب.",
  },
  {
    id: "payment",
    title: "الدفع",
    description: "تسجيل التحصيل وربطه بطريقة دفع مناسبة.",
  },
  {
    id: "status",
    title: "الحالة",
    description: "متابعة دورة الفاتورة من المسودة حتى الإغلاق.",
  },
];
export type {
  InvoiceEditorCustomer,
  InvoiceEditorDraft,
  InvoiceEditorFormState,
  InvoiceEditorItem,
  InvoiceEditorItemKind,
  InvoiceEditorPaymentMethod,
  InvoiceEditorSection,
  InvoiceEditorStatus,
  InvoiceEditorTotals,
  InvoiceEditorValidationErrors,
} from "./invoice/invoiceTypes";

export {
  createEmptyInvoiceItem,
  createInvoiceItemFromProduct,
  invoiceEditorCurrencyOptions,
  invoiceEditorPaymentMethodOptions,
  invoiceEditorSections,
  invoiceEditorStatusAccent,
  invoiceEditorStatusLabels,
  invoiceEditorStatusOptions,
} from "./invoice/invoiceTypes";

export const invoiceStatusLabels: Record<InvoiceLifecycleStatus, string> = {
  draft: "مسودة",
  sent: "مرسلة",
  paid: "مدفوعة",
  overdue: "متأخرة",
  cancelled: "ملغاة",
};

export const invoiceStatusStyles: Record<InvoiceLifecycleStatus, string> = {
  draft: "border-slate-200 bg-slate-50 text-slate-700",
  sent: "border-sky-100 bg-sky-50 text-sky-700",
  paid: "border-emerald-100 bg-emerald-50 text-emerald-700",
  overdue: "border-amber-100 bg-amber-50 text-amber-700",
  cancelled: "border-rose-100 bg-rose-50 text-rose-700",
};

export const invoicePaymentMethodOptions: Array<{
  value: InvoicePaymentMethodValue;
  label: string;
}> = [
  { value: "cash", label: "نقدي" },
  { value: "transfer", label: "تحويل" },
  { value: "card", label: "بطاقة" },
  { value: "credit", label: "آجل" },
];
