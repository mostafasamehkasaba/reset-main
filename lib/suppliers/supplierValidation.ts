import type { SupplierFormState } from "./supplierTypes";

export const validateSupplierForm = (values: SupplierFormState) => {
  if (!values.name.trim() || !values.phone.trim()) {
    return "يرجى إدخال اسم المورد والهاتف على الأقل.";
  }

  return "";
};
