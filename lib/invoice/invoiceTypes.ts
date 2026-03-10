import type { Product } from "@/app/lib/product-store";

export type InvoiceEditorItemKind = "product" | "service";
export type InvoiceEditorPaymentMethod = "cash" | "transfer" | "card" | "credit";
export type InvoiceEditorStatus = "draft" | "paid" | "unpaid" | "partial" | "cancelled";

export type InvoiceEditorItem = {
  id: number;
  kind: InvoiceEditorItemKind;
  productId: number | null;
  name: string;
  quantity: number;
  price: number;
};

export type InvoiceEditorCustomer = {
  selectedClientId: number | null;
  recipientType: "individual" | "company";
  name: string;
  email: string;
  phone: string;
  address: string;
  taxNumber: string;
  commercialRegister: string;
};

export type InvoiceEditorFormState = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  paymentMethod: InvoiceEditorPaymentMethod;
  status: InvoiceEditorStatus;
  taxRate: number;
  discount: number;
  partialPaidAmount: number;
  notes: string;
  customer: InvoiceEditorCustomer;
  items: InvoiceEditorItem[];
};

export type InvoiceEditorTotals = {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paid: number;
  due: number;
  itemCount: number;
};

export type InvoiceEditorValidationErrors = Partial<
  Record<
    | "customer"
    | "issueDate"
    | "dueDate"
    | "items"
    | "payment"
    | "discount"
    | "creditLimit"
    | "taxNumber"
    | "commercialRegister"
    | "general",
    string
  >
>;

export type InvoiceEditorDraft = {
  savedAt: string;
  sequence: number;
  nextItemId: number;
  form: InvoiceEditorFormState;
};

export type InvoiceEditorSection = {
  id: "customer" | "details" | "items" | "totals" | "notes";
  title: string;
  description: string;
};

export const invoiceEditorSections: InvoiceEditorSection[] = [
  {
    id: "customer",
    title: "بيانات العميل",
    description: "حدد العميل وراجع بيانات التواصل والفوترة قبل الحفظ.",
  },
  {
    id: "details",
    title: "تفاصيل الفاتورة",
    description: "بيانات المستند، التواريخ، طريقة الدفع والعملة.",
  },
  {
    id: "items",
    title: "جدول البنود",
    description: "أضف البنود، حدّث الكمية والسعر، واترك الصفوف تحسب نفسها.",
  },
  {
    id: "totals",
    title: "الملخص المباشر",
    description: "إجمالي فرعي واضح مع ضريبة وخصم وحالة التحصيل.",
  },
  {
    id: "notes",
    title: "ملاحظات",
    description: "شروط إضافية أو ملاحظات تظهر مع الفاتورة.",
  },
];

export const invoiceEditorPaymentMethodOptions: Array<{
  value: InvoiceEditorPaymentMethod;
  label: string;
}> = [
  { value: "cash", label: "نقدي" },
  { value: "transfer", label: "تحويل" },
  { value: "card", label: "بطاقة" },
  { value: "credit", label: "آجل" },
];

export const invoiceEditorStatusOptions: Array<{
  value: InvoiceEditorStatus;
  label: string;
}> = [
  { value: "draft", label: "مسودة" },
  { value: "unpaid", label: "غير مدفوعة" },
  { value: "partial", label: "مدفوعة جزئيا" },
  { value: "paid", label: "مدفوعة" },
  { value: "cancelled", label: "ملغاة" },
];

export const invoiceEditorCurrencyOptions: Array<{
  code: string;
  label: string;
}> = [
  { code: "OMR", label: "ريال عماني" },
  { code: "SAR", label: "ريال سعودي" },
  { code: "USD", label: "دولار أمريكي" },
  { code: "QAR", label: "ريال قطري" },
];

export const invoiceEditorStatusLabels: Record<InvoiceEditorStatus, string> = {
  draft: "مسودة",
  unpaid: "غير مدفوعة",
  partial: "مدفوعة جزئيا",
  paid: "مدفوعة",
  cancelled: "ملغاة",
};

export const invoiceEditorStatusAccent: Record<InvoiceEditorStatus, string> = {
  draft: "border-slate-200 bg-white text-slate-700",
  unpaid: "border-amber-200 bg-amber-50 text-amber-700",
  partial: "border-sky-200 bg-sky-50 text-sky-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

export const createEmptyInvoiceItem = (id: number): InvoiceEditorItem => ({
  id,
  kind: "service",
  productId: null,
  name: "",
  quantity: 1,
  price: 0,
});

export const createInvoiceItemFromProduct = (
  id: number,
  product: Product
): InvoiceEditorItem => ({
  id,
  kind: "product",
  productId: product.id,
  name: product.name,
  quantity: 1,
  price: product.sellingPrice,
});
