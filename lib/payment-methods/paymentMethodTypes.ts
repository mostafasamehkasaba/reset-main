import type { PaymentMethod, PaymentMethodPayload } from "@/app/services/payment-methods";

export type PaymentMethodFormValues = Required<
  Pick<PaymentMethodPayload, "name" | "type" | "currency" | "desc">
>;

export const PAYMENT_METHOD_TYPE_OPTIONS = [
  { value: "cash", label: "نقدي" },
  { value: "bank", label: "تحويل بنكي" },
  { value: "card", label: "بطاقة ائتمان" },
  { value: "wallet", label: "محفظة" },
  { value: "custom", label: "مخصص" },
] as const;

export const PAYMENT_METHOD_CURRENCY_OPTIONS = ["OMR", "SAR", "USD", "EGP"] as const;

export const createPaymentMethodFormValues = (
  method?: Partial<PaymentMethod> | null
): PaymentMethodFormValues => ({
  name: method?.name?.trim() || "",
  type: method?.type?.trim() || PAYMENT_METHOD_TYPE_OPTIONS[0].value,
  currency: method?.currency?.trim() || PAYMENT_METHOD_CURRENCY_OPTIONS[0],
  desc: method?.desc?.trim() && method.desc.trim() !== "-" ? method.desc.trim() : "",
});

export const getPaymentMethodTypeLabel = (value?: string) => {
  const normalizedValue = value?.trim().toLowerCase() || "";
  return (
    PAYMENT_METHOD_TYPE_OPTIONS.find((option) => option.value === normalizedValue)?.label ||
    value ||
    "-"
  );
};

const totalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatPaymentMethodTotal = (value: number, currency: string) =>
  `${totalFormatter.format(value)} ${currency}`;

export const formatPaymentMethodDate = (value?: string) => {
  if (!value) return "-";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsedDate);
};
