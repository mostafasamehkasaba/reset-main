import { getStoredAuthToken } from "../lib/auth-session";
import { apiRequest } from "../lib/fetcher";
import type { CategoryStatus, MainCategory, SubCategory } from "../types";

export type MainCategoryPayload = {
  name: string;
  code?: string;
  status: CategoryStatus;
};

export type SubCategoryPayload = {
  name: string;
  mainCategoryId: number;
  status: CategoryStatus;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const getFirstText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const getFirstNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return 0;
};

const normalizeStatus = (value: unknown): CategoryStatus => {
  const normalized = getFirstText(value).toLowerCase();
  if (
    normalized === "inactive" ||
    normalized === "disabled" ||
    normalized === "paused" ||
    normalized === "معلق" ||
    normalized === "معلّق"
  ) {
    return "معلّق";
  }

  return "نشط";
};

const normalizeMainCategory = (input: unknown, index: number): MainCategory => {
  const record = asRecord(input) || {};
  return {
    id: Math.floor(getFirstNumber(record.id, record.category_id, index + 1)),
    name: getFirstText(record.name, record.category_name, `تصنيف ${index + 1}`),
    code: getFirstText(
      record.code,
      record.category_code,
      record.slug,
      `CAT${String(index + 1).padStart(2, "0")}`
    ).toUpperCase(),
    status: normalizeStatus(record.status ?? record.state),
    products: Math.floor(getFirstNumber(record.products, record.products_count, record.items_count, 0)),
  };
};

const normalizeSubCategory = (
  input: unknown,
  mainCategoryId: number,
  index: number
): SubCategory => {
  const record = asRecord(input) || {};
  return {
    id: Math.floor(getFirstNumber(record.id, record.category_id, index + 1)),
    name: getFirstText(
      record.name,
      record.category_name,
      `تصنيف فرعي ${index + 1}`
    ),
    mainCategoryId,
    status: normalizeStatus(record.status ?? record.state),
    products: Math.floor(getFirstNumber(record.products, record.products_count, record.items_count, 0)),
  };
};

const extractCollection = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;

  const record = asRecord(payload);
  if (!record) return [];

  const candidates = [record.data, record.categories, record.items, record.results];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    const nestedRecord = asRecord(candidate);
    if (nestedRecord && Array.isArray(nestedRecord.data)) {
      return nestedRecord.data;
    }
  }

  return [];
};

const requireToken = () => {
  const token = getStoredAuthToken();
  if (!token) {
    throw new Error("الجلسة غير متاحة. سجل الدخول أولًا.");
  }

  return token;
};

const buildMainPayload = (category: MainCategoryPayload) => ({
  name: category.name,
  category_name: category.name,
  code: category.code,
  category_code: category.code,
  status: category.status,
});

const buildSubPayload = (category: SubCategoryPayload) => ({
  name: category.name,
  category_name: category.name,
  mainCategoryId: category.mainCategoryId,
  main_category_id: category.mainCategoryId,
  parent_id: category.mainCategoryId,
  status: category.status,
});

export const listCategories = async () => {
  const payload = await apiRequest<unknown>("/api/categories", {
    token: requireToken(),
  });

  const records = extractCollection(payload);
  const mainCategories: MainCategory[] = [];
  const subCategories: SubCategory[] = [];

  records.forEach((item) => {
    const record = asRecord(item) || {};
    const parentId = Math.floor(
      getFirstNumber(
        record.parentId,
        record.parent_id,
        record.mainCategoryId,
        record.main_category_id,
        0
      )
    );

    if (parentId) {
      subCategories.push(normalizeSubCategory(record, parentId, subCategories.length));
    } else {
      mainCategories.push(normalizeMainCategory(record, mainCategories.length));
    }
  });

  return { mainCategories, subCategories };
};

export const createMainCategory = async (payload: MainCategoryPayload) => {
  const response = await apiRequest<unknown>("/api/categories", {
    method: "POST",
    token: requireToken(),
    body: JSON.stringify(buildMainPayload(payload)),
  });
  const record = asRecord(response);
  return normalizeMainCategory(record?.data || record?.category || response, 0);
};

export const createSubCategory = async (payload: SubCategoryPayload) => {
  const response = await apiRequest<unknown>("/api/categories", {
    method: "POST",
    token: requireToken(),
    body: JSON.stringify(buildSubPayload(payload)),
  });
  const record = asRecord(response);
  return normalizeSubCategory(
    record?.data || record?.category || response,
    payload.mainCategoryId,
    0
  );
};
