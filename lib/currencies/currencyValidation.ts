import { z } from "zod";

export const currencyFormSchema = z.object({
  name: z.string().min(1, "اسم العملة مطلوب"),
  symbol: z.string().min(1, "رمز العملة مطلوب"),
  code: z.string().min(1, "كود العملة مطلوب"),
  isDefault: z.boolean(),
});

export const defaultCurrencyValues = {
  name: "",
  symbol: "",
  code: "",
  isDefault: false,
};
