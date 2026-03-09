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

const emptyCategoryState: {
  mainCategories: MainCategory[];
  subCategories: SubCategory[];
} = {
  mainCategories: [],
  subCategories: [],
};

const CATEGORIES_STORAGE_KEY = "reset-main-categories-v1";

const clearLegacyCategoryCache = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(CATEGORIES_STORAGE_KEY);
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
      if (Number.isFinite(parsed)) {
        return parsed;
      }
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
    products: Math.floor(
      getFirstNumber(record.products, record.products_count, record.items_count, 0)
    ),
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
    name: getFirstText(record.name, record.category_name, `تصنيف فرعي ${index + 1}`),
    mainCategoryId,
    status: normalizeStatus(record.status ?? record.state),
    products: Math.floor(
      getFirstNumber(record.products, record.products_count, record.items_count, 0)
    ),
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

const getRemoteParentId = (record: Record<string, unknown>) =>
  Math.floor(
    getFirstNumber(
      record.parentId,
      record.parent_id,
      record.mainCategoryId,
      record.main_category_id,
      asRecord(record.parent)?.id,
      asRecord(record.main_category)?.id,
      asRecord(record.mainCategory)?.id,
      0
    )
  );

const buildCategoriesResponse = (payload: unknown) => {
  const records = extractCollection(payload);
  const mainCategories: MainCategory[] = [];
  const subCategories: SubCategory[] = [];

  records.forEach((item) => {
    const record = asRecord(item) || {};
    const parentId = getRemoteParentId(record);

    if (parentId > 0) {
      subCategories.push(normalizeSubCategory(record, parentId, subCategories.length));
      return;
    }

    mainCategories.push(normalizeMainCategory(record, mainCategories.length));
  });

  return { mainCategories, subCategories };
};

export const listCategories = async () => {
  clearLegacyCategoryCache();
  const token = getStoredAuthToken();
  const payload = await apiRequest<unknown>("/api/categories", {
    ...(token ? { token } : {}),
  });

  return buildCategoriesResponse(payload);
};

export const createMainCategory = async (payload: MainCategoryPayload) => {
  clearLegacyCategoryCache();
  const token = getStoredAuthToken();
  const response = await apiRequest<unknown>("/api/categories", {
    method: "POST",
    ...(token ? { token } : {}),
    body: JSON.stringify(buildMainPayload(payload)),
  });
  const record = asRecord(response);
  return normalizeMainCategory(
    {
      ...buildMainPayload(payload),
      ...(asRecord(record?.data || record?.category || response) || {}),
    },
    0
  );
};

export const createSubCategory = async (payload: SubCategoryPayload) => {
  clearLegacyCategoryCache();
  const token = getStoredAuthToken();
  const response = await apiRequest<unknown>("/api/categories", {
    method: "POST",
    ...(token ? { token } : {}),
    body: JSON.stringify(buildSubPayload(payload)),
  });
  const record = asRecord(response);
  const createdRecord = asRecord(record?.data || record?.category || response) || {};
  return normalizeSubCategory(
    {
      ...buildSubPayload(payload),
      ...createdRecord,
    },
    getRemoteParentId(createdRecord) || payload.mainCategoryId,
    0
  );
};

export const updateMainCategory = async (categoryId: number, payload: MainCategoryPayload) => {
  clearLegacyCategoryCache();
  const token = getStoredAuthToken();
  const response = await apiRequest<unknown>(`/api/categories/${categoryId}`, {
    method: "PUT",
    ...(token ? { token } : {}),
    body: JSON.stringify(buildMainPayload(payload)),
  });
  const record = asRecord(response);
  return normalizeMainCategory(
    {
      ...buildMainPayload(payload),
      ...(asRecord(record?.data || record?.category || response) || {}),
      id: categoryId,
    },
    0
  );
};

export const updateSubCategory = async (categoryId: number, payload: SubCategoryPayload) => {
  clearLegacyCategoryCache();
  const token = getStoredAuthToken();
  const response = await apiRequest<unknown>(`/api/categories/${categoryId}`, {
    method: "PUT",
    ...(token ? { token } : {}),
    body: JSON.stringify(buildSubPayload(payload)),
  });
  const record = asRecord(response);
  const updatedRecord = asRecord(record?.data || record?.category || response) || {};
  return normalizeSubCategory(
    {
      ...buildSubPayload(payload),
      ...updatedRecord,
      id: categoryId,
    },
    getRemoteParentId(updatedRecord) || payload.mainCategoryId,
    0
  );
};

export const deleteMainCategory = async (categoryId: number) => {
  clearLegacyCategoryCache();
  const token = getStoredAuthToken();
  await apiRequest(`/api/categories/${categoryId}`, {
    method: "DELETE",
    ...(token ? { token } : {}),
  });
};

export const deleteSubCategory = async (categoryId: number) => {
  clearLegacyCategoryCache();
  const token = getStoredAuthToken();
  await apiRequest(`/api/categories/${categoryId}`, {
    method: "DELETE",
    ...(token ? { token } : {}),
  });
};
