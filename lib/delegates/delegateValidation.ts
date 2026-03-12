import { z } from "zod";

export const delegateFormSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  phone: z.string().min(1, "رقم الهاتف مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح").or(z.literal("")),
  region: z.string().min(1, "المنطقة مطلوبة"),
  status: z.enum(["نشط", "معلّق"]),
});

export const defaultDelegateValues: {
  name: string;
  phone: string;
  email: string;
  region: string;
  status: "نشط" | "معلّق";
} = {
  name: "",
  phone: "",
  email: "",
  region: "",
  status: "نشط",
};
