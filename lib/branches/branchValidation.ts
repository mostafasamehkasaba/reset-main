import { z } from "zod";

export const branchFormSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  address: z.string().optional(),
  phone: z.string().optional(),
  manager: z.string().optional(),
});

export const defaultBranchValues = {
  name: "",
  address: "",
  phone: "",
  manager: "",
};
