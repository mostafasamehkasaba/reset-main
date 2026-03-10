import type { ProductFormState } from "./productTypes";

type ProductValidationArgs = {
  values: ProductFormState;
  isEditMode: boolean;
  editingProductId: number | null;
};

export const validateProductForm = ({
  values,
  isEditMode,
  editingProductId,
}: ProductValidationArgs) => {
  if (!values.name.trim()) {
    return "يرجى إدخال اسم المنتج.";
  }

  if (!values.code.trim()) {
    return "يرجى إدخال كود المنتج.";
  }

  if (isEditMode && !editingProductId) {
    return "تعذر تحديد المنتج للتعديل.";
  }

  return "";
};
