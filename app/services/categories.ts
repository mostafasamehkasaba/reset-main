import { getStoredAuthToken } from "../lib/auth-session";
import { ApiError, apiRequest } from "../lib/fetcher";
import {
  getNextNumericId,
  isRecoverableApiError,
  loadStoredValue,
  mergeUniqueByKey,
  saveStoredValue,
  upsertByKey,
} from "../lib/local-fallback";
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

const CATEGORIES_STORAGE_KEY = "reset-main-categories-v1";

const defaultCategoryState: {
  mainCategories: MainCategory[];
  subCategories: SubCategory[];
} = {
  mainCategories: [
    {
      id: 1,
      name: "خدمات",
      code: "CAT01",
      status: "نشط",
      products: 4,
    },
    {
      id: 2,
      name: "منتجات رقمية",
      code: "CAT02",
      status: "نشط",
      products: 6,
    },
  ],
  subCategories: [
    {
      id: 1,
      name: "استضافة",
      mainCategoryId: 1,
      status: "نشط",
      products: 2,
    },
    {
      id: 2,
      name: "قوالب",
      mainCategoryId: 2,
      status: "نشط",
      products: 3,
    },
  ],
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
    name: getFirstText(record.name, record.category_name, `تصنيف فرعي ${index + 1}`),
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

const getMainCategoryKey = (category: MainCategory) =>
  getFirstText(category.code, category.name, String(category.id));

const getSubCategoryKey = (category: SubCategory) =>
  getFirstText(`${category.mainCategoryId}-${category.name}`, String(category.id));

const loadLocalCategories = () =>
  loadStoredValue(CATEGORIES_STORAGE_KEY, defaultCategoryState, (value) => {
    const record = asRecord(value) || {};
    const mainCategories = Array.isArray(record.mainCategories)
      ? record.mainCategories.map((item, index) => normalizeMainCategory(item, index))
      : defaultCategoryState.mainCategories;
    const subCategories = Array.isArray(record.subCategories)
      ? record.subCategories.map((item, index) =>
          normalizeSubCategory(
            item,
            Math.floor(
              getFirstNumber(
                asRecord(item)?.mainCategoryId,
                asRecord(item)?.main_category_id,
                asRecord(item)?.parent_id,
                0
              )
            ),
            index
          )
        )
      : defaultCategoryState.subCategories;

    return {
      mainCategories: mainCategories.length ? mainCategories : defaultCategoryState.mainCategories,
      subCategories: subCategories.length ? subCategories : defaultCategoryState.subCategories,
    };
  });

const saveLocalCategories = (value: {
  mainCategories: MainCategory[];
  subCategories: SubCategory[];
}) => {
  saveStoredValue(CATEGORIES_STORAGE_KEY, value);
};

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

const resolveKnownSubCategoryParentId = (
  record: Record<string, unknown>,
  localCategories: { subCategories: SubCategory[] }
) => {
  const directParentId = getRemoteParentId(record);
  if (directParentId > 0) {
    return directParentId;
  }

  const recordId = Math.floor(getFirstNumber(record.id, record.category_id, 0));
  if (recordId > 0) {
    const byId = localCategories.subCategories.find((item) => item.id === recordId);
    if (byId) {
      return byId.mainCategoryId;
    }
  }

  const recordName = getFirstText(record.name, record.category_name).toLowerCase();
  if (recordName) {
    const byName = localCategories.subCategories.find(
      (item) => item.name.trim().toLowerCase() === recordName
    );
    if (byName) {
      return byName.mainCategoryId;
    }
  }

  return 0;
};

const removeLocalMainCategory = (categoryId: number) => {
  const categories = loadLocalCategories();
  saveLocalCategories({
    mainCategories: categories.mainCategories.filter((category) => category.id !== categoryId),
    subCategories: categories.subCategories.filter(
      (category) => category.mainCategoryId !== categoryId
    ),
  });
};

const removeLocalSubCategory = (categoryId: number) => {
  const categories = loadLocalCategories();
  saveLocalCategories({
    ...categories,
    subCategories: categories.subCategories.filter((category) => category.id !== categoryId),
  });
};

export const listCategories = async () => {
  const localCategories = loadLocalCategories();

  try {
    const token = getStoredAuthToken();
    const payload = await apiRequest<unknown>("/api/categories", {
      ...(token ? { token } : {}),
    });

    const records = extractCollection(payload);
    const remoteMainCategories: MainCategory[] = [];
    const remoteSubCategories: SubCategory[] = [];

    records.forEach((item) => {
      const record = asRecord(item) || {};
      const parentId = resolveKnownSubCategoryParentId(record, localCategories);

      if (parentId > 0) {
        remoteSubCategories.push(
          normalizeSubCategory(record, parentId, remoteSubCategories.length)
        );
        return;
      }

      remoteMainCategories.push(normalizeMainCategory(record, remoteMainCategories.length));
    });

    const merged = {
      mainCategories: mergeUniqueByKey(
        localCategories.mainCategories,
        remoteMainCategories,
        getMainCategoryKey
      ),
      subCategories: mergeUniqueByKey(
        localCategories.subCategories,
        remoteSubCategories,
        getSubCategoryKey
      ),
    };

    saveLocalCategories(merged);
    return merged;
  } catch (error) {
    if (isRecoverableApiError(error)) {
      return localCategories;
    }

    throw error;
  }
};

export const createMainCategory = async (payload: MainCategoryPayload) => {
  try {
    const token = getStoredAuthToken();
    const response = await apiRequest<unknown>("/api/categories", {
      method: "POST",
      ...(token ? { token } : {}),
      body: JSON.stringify(buildMainPayload(payload)),
    });
    const record = asRecord(response);
    const createdCategory = normalizeMainCategory(
      {
        ...buildMainPayload(payload),
        ...(asRecord(record?.data || record?.category || response) || {}),
      },
      0
    );
    const categories = loadLocalCategories();
    saveLocalCategories({
      ...categories,
      mainCategories: upsertByKey(
        categories.mainCategories,
        createdCategory,
        getMainCategoryKey
      ),
    });
    return createdCategory;
  } catch (error) {
    if (isRecoverableApiError(error)) {
      const categories = loadLocalCategories();
      const createdCategory = normalizeMainCategory(
        {
          ...buildMainPayload(payload),
          id: getNextNumericId(categories.mainCategories, (entry) => entry.id),
          products: 0,
        },
        categories.mainCategories.length
      );
      saveLocalCategories({
        ...categories,
        mainCategories: upsertByKey(
          categories.mainCategories,
          createdCategory,
          getMainCategoryKey
        ),
      });
      return createdCategory;
    }

    throw error;
  }
};

export const createSubCategory = async (payload: SubCategoryPayload) => {
  const categories = loadLocalCategories();
  const createdCategory = normalizeSubCategory(
    {
      ...buildSubPayload(payload),
      id: getNextNumericId(categories.subCategories, (entry) => entry.id),
      products: 0,
    },
    payload.mainCategoryId,
    categories.subCategories.length
  );

  saveLocalCategories({
    ...categories,
    subCategories: upsertByKey(
      categories.subCategories,
      createdCategory,
      getSubCategoryKey
    ),
  });

  return createdCategory;
};

export const deleteMainCategory = async (categoryId: number) => {
  try {
    const token = getStoredAuthToken();
    await apiRequest(`/api/categories/${categoryId}`, {
      method: "DELETE",
      ...(token ? { token } : {}),
    });
    removeLocalMainCategory(categoryId);
  } catch (error) {
    if (
      isRecoverableApiError(error) ||
      (error instanceof ApiError && (error.status === 404 || error.status === 405))
    ) {
      removeLocalMainCategory(categoryId);
      return;
    }

    throw error;
  }
};

export const deleteSubCategory = async (categoryId: number) => {
  removeLocalSubCategory(categoryId);
};
