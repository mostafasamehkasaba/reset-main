import { z } from "zod";

export const unitFormSchema = z.object({
  name: z.string().min(1, "اسم الوحدة مطلوب"),
  isDefault: z.boolean(),
});

export const defaultUnitValues = {
  name: "",
  isDefault: false,
};
