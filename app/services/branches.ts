import type { Branch } from "../types";
import {
  getNextNumericId,
  loadStoredValue,
  saveStoredValue,
  upsertByKey,
} from "../lib/local-fallback";

export type BranchPayload = {
  name: string;
  address: string;
  phone: string;
  manager: string;
};

const BRANCHES_STORAGE_KEY = "reset-main-branches-v1";

const defaultBranches: Branch[] = [];

const normalizeBranch = (input: unknown, index: number): Branch => {
  const record = input as Record<string, unknown> || {};

  return {
    id: record.id as number ?? index + 1,
    name: record.name as string ?? `فرع ${index + 1}`,
    address: record.address as string ?? "-",
    phone: record.phone as string ?? "-",
    manager: record.manager as string ?? "-",
  };
};

const getBranchKey = (branch: Branch) => String(branch.id);

export const loadLocalBranches = () => {
  return loadStoredValue(BRANCHES_STORAGE_KEY, defaultBranches, (value) => {
    if (!Array.isArray(value) || value.length === 0) {
      return defaultBranches;
    }

    return value.map((branch, index) => normalizeBranch(branch, index));
  });
};

const saveLocalBranches = (branches: Branch[]) => {
  saveStoredValue(BRANCHES_STORAGE_KEY, branches);
};

export const listBranches = async () => {
  return Promise.resolve(loadLocalBranches());
};

export const getBranch = async (branchId: number) => {
  const branches = await listBranches();
  return Promise.resolve(branches.find((branch) => branch.id === branchId) ?? null);
};

export const createBranch = async (branch: BranchPayload) => {
  const branches = loadLocalBranches();
  const newBranch = normalizeBranch(
    {
      ...branch,
      id: getNextNumericId(branches, (entry) => entry.id),
    },
    branches.length
  );

  saveLocalBranches(upsertByKey(branches, newBranch, getBranchKey));
  return Promise.resolve(newBranch);
};

export const updateBranch = async (branchId: number, branch: BranchPayload) => {
  const branches = loadLocalBranches();
  const existingBranch = branches.find((entry) => entry.id === branchId);
  const nextBranch = normalizeBranch(
    {
      ...(existingBranch || {}),
      ...branch,
      id: branchId,
    },
    0
  );

  if (!existingBranch) {
    saveLocalBranches(upsertByKey(branches, nextBranch, getBranchKey));
    return Promise.resolve(nextBranch);
  }

  saveLocalBranches(
    branches.map((entry) => (entry.id === branchId ? nextBranch : entry))
  );
  return Promise.resolve(nextBranch);
};

export const deleteBranch = async (branch: Branch) => {
  const branches = loadLocalBranches();
  saveLocalBranches(branches.filter((b) => b.id !== branch.id));
  return Promise.resolve();
};
