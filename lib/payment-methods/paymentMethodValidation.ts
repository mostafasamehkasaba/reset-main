import type { PaymentMethodFormValues } from "./paymentMethodTypes";

export const validatePaymentMethodForm = (values: PaymentMethodFormValues) => {
  if (!values.name.trim()) {
    return "يرجى إدخال اسم وسيلة الدفع.";
  }

  return "";
};
