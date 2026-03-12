
import type { BranchPayload } from "@/app/services/branches";
import type { Branch } from "@/app/types";

export type BranchFormState = {
  name: string;
  address: string;
  phone: string;
  manager: string;
};

export const initialBranchFormState: BranchFormState = {
  name: "",
  address: "",
  phone: "",
  manager: "",
};

export const mapBranchToFormState = (branch: Branch): BranchFormState => ({
  name: branch.name || "",
  address: branch.address === "-" ? "" : branch.address,
  phone: branch.phone === "-" ? "" : branch.phone,
  manager: branch.manager === "-" ? "" : branch.manager,
});

export const buildBranchPayload = (form: BranchFormState): BranchPayload => ({
  name: form.name.trim(),
  address: form.address.trim() || "-",
  phone: form.phone.trim() || "-",
  manager: form.manager.trim() || "-",
});
