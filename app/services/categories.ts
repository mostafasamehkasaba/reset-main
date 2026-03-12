import { getStoredAuthToken } from "../lib/auth-session";
import { ApiError, apiRequest } from "../lib/fetcher";
import { isRecoverableApiError } from "../lib/local-fallback";
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
  const backendId = getFirstNumber(record.id, record.category_id)
    ? String(getFirstNumber(record.id, record.category_id))
    : undefined;

  return {
    id: Math.floor(getFirstNumber(record.id, record.category_id, index + 1)),
    backendId,
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
  const backendId = getFirstNumber(record.id, record.category_id)
    ? String(getFirstNumber(record.id, record.category_id))
    : undefined;

  return {
    id: Math.floor(getFirstNumber(record.id, record.category_id, index + 1)),
    backendId,
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
  category_id: category.mainCategoryId, // Some backends use this for subcats
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

  const processCategory = (item: unknown, depth = 0) => {
    const record = asRecord(item) || {};
    const parentId = getRemoteParentId(record);

    if (parentId > 0) {
      subCategories.push(normalizeSubCategory(record, parentId, subCategories.length));
    } else {
      mainCategories.push(normalizeMainCategory(record, mainCategories.length));
    }

    // Recursively process children if they exist
    const children = extractCollection(record.children || record.subs || record.sub_categories || record.subcategories);
    if (children.length > 0) {
      const currentCategoryId = Math.floor(getFirstNumber(record.id, record.category_id, 0));
      if (currentCategoryId > 0) {
        children.forEach((child: unknown) => {
          const childRecord = asRecord(child) || {};
          // Ensure child has the parent ID if it's missing
          if (!getRemoteParentId(childRecord)) {
            (childRecord as any).parent_id = currentCategoryId;
          }
          processCategory(childRecord, depth + 1);
        });
      } else {
        // If parent has no ID, just process children normally
        children.forEach((c: unknown) => processCategory(c, depth + 1));
      }
    }
  };

  records.forEach((item: unknown) => processCategory(item));

  return { 
    // Filter out duplicates if any (could happen with recursive processing)
    mainCategories: Array.from(new Map(mainCategories.map(c => [c.id, c])).values()),
    subCategories: Array.from(new Map(subCategories.map(c => [c.id, c])).values())
  };
};

const CATEGORIES_STORAGE_KEY = "reset-main-categories-v2";
const CATEGORIES_DELETED_KEY = "reset-main-categories-deleted-v1";

const loadDeletedCategoryKeys = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(CATEGORIES_DELETED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveDeletedCategoryKeys = (keys: Set<string>) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CATEGORIES_DELETED_KEY, JSON.stringify(Array.from(keys)));
};

const trackDeletedCategory = (id: number, backendId?: string, name?: string) => {
  const keys = loadDeletedCategoryKeys();
  keys.add(String(id));
  if (backendId) keys.add(backendId);
  if (name) keys.add(name.trim().toLowerCase());
  saveDeletedCategoryKeys(keys);
};

const loadLocalCategories = () => {
  if (typeof window === "undefined") return emptyCategoryState;
  try {
    const raw = window.localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) return emptyCategoryState;
    return JSON.parse(raw) as typeof emptyCategoryState;
  } catch {
    return emptyCategoryState;
  }
};

const saveLocalCategories = (state: typeof emptyCategoryState) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(state));
};

export const listCategories = async () => {
  const local = loadLocalCategories();
  const token = getStoredAuthToken();

  try {
    const payload = await apiRequest<unknown>("/api/categories", {
      ...(token ? { token } : {}),
    });
    console.log("[CategoriesService] List categories raw payload:", payload);

    const remote = buildCategoriesResponse(payload);
    const deletedKeys = loadDeletedCategoryKeys();
    
    // Smart merge Main Categories
    const mainMap = new Map<string | number, MainCategory>();
    // First, add all remote categories
    remote.mainCategories.forEach(c => {
      const isDeleted = deletedKeys.has(String(c.id)) || (c.backendId && deletedKeys.has(c.backendId)) || deletedKeys.has(c.name.trim().toLowerCase());
      if (!isDeleted) mainMap.set(c.id, c);
    });
    // Then, add local ones ONLY if they don't match a remote one by backendId or name
    local.mainCategories.forEach(localCat => {
      const isDeleted = deletedKeys.has(String(localCat.id)) || (localCat.backendId && deletedKeys.has(localCat.backendId)) || deletedKeys.has(localCat.name.trim().toLowerCase());
      if (isDeleted) return;

      const exists = remote.mainCategories.find(remoteCat => 
        (localCat.backendId && remoteCat.backendId === localCat.backendId) ||
        (remoteCat.name.trim().toLowerCase() === localCat.name.trim().toLowerCase())
      );
      if (!exists) {
        mainMap.set(localCat.id, localCat);
      }
    });

    // Smart merge Sub Categories
    const subMap = new Map<string | number, SubCategory>();
    remote.subCategories.forEach(s => {
      const isDeleted = deletedKeys.has(String(s.id)) || (s.backendId && deletedKeys.has(s.backendId)) || deletedKeys.has(s.name.trim().toLowerCase());
      if (!isDeleted) subMap.set(s.id, s);
    });
    local.subCategories.forEach(localSub => {
      const isDeleted = deletedKeys.has(String(localSub.id)) || (localSub.backendId && deletedKeys.has(localSub.backendId)) || deletedKeys.has(localSub.name.trim().toLowerCase());
      if (isDeleted) return;

      const exists = remote.subCategories.find(remoteSub => 
        (localSub.backendId && remoteSub.backendId === localSub.backendId) ||
        (remoteSub.name.trim().toLowerCase() === localSub.name.trim().toLowerCase() && 
         remoteSub.mainCategoryId === localSub.mainCategoryId)
      );
      if (!exists) {
        subMap.set(localSub.id, localSub);
      }
    });

    const merged = {
      mainCategories: Array.from(mainMap.values()),
      subCategories: Array.from(subMap.values())
    };

    saveLocalCategories(merged);
    return merged;
  } catch (error) {
    console.error("[CategoriesService] List categories failed:", error);
    if (isRecoverableApiError(error)) {
      return local;
    }

    throw error;
  }
};

export const createMainCategory = async (payload: MainCategoryPayload) => {
  const token = getStoredAuthToken();
  try {
    const response = await apiRequest<unknown>("/api/categories", {
      method: "POST",
      ...(token ? { token } : {}),
      body: JSON.stringify(buildMainPayload(payload)),
    });
    const record = asRecord(response);
    const created = normalizeMainCategory(
      {
        ...buildMainPayload(payload),
        ...(asRecord(record?.data || record?.category || response) || {}),
      },
      Date.now()
    );
    
    const local = loadLocalCategories();
    saveLocalCategories({
      ...local,
      mainCategories: [created, ...local.mainCategories]
    });
    
    return created;
  } catch (error) {
    if (isRecoverableApiError(error)) {
      const local = loadLocalCategories();
      const created = normalizeMainCategory({ ...buildMainPayload(payload), id: Date.now() }, local.mainCategories.length);
      saveLocalCategories({ ...local, mainCategories: [created, ...local.mainCategories] });
      return created;
    }
    throw error;
  }
};

export const createSubCategory = async (payload: SubCategoryPayload) => {
  const token = getStoredAuthToken();
  try {
    const response = await apiRequest<unknown>("/api/categories", {
      method: "POST",
      ...(token ? { token } : {}),
      body: JSON.stringify(buildSubPayload(payload)),
    });
    const record = asRecord(response);
    const createdRecord = asRecord(record?.data || record?.category || response) || {};
    const created = normalizeSubCategory(
      {
        ...buildSubPayload(payload),
        ...createdRecord,
      },
      getRemoteParentId(createdRecord) || payload.mainCategoryId,
      Date.now()
    );

    const local = loadLocalCategories();
    saveLocalCategories({
      ...local,
      subCategories: [created, ...local.subCategories]
    });
    
    return created;
  } catch (error) {
    if (isRecoverableApiError(error)) {
      const local = loadLocalCategories();
      const created = normalizeSubCategory({ ...buildSubPayload(payload), id: Date.now() }, payload.mainCategoryId, local.subCategories.length);
      saveLocalCategories({ ...local, subCategories: [created, ...local.subCategories] });
      return created;
    }
    throw error;
  }
};

export const updateMainCategory = async (categoryId: number, payload: MainCategoryPayload) => {
  const token = getStoredAuthToken();
  try {
    const response = await apiRequest<unknown>(`/api/categories/${categoryId}`, {
      method: "PUT",
      ...(token ? { token } : {}),
      body: JSON.stringify(buildMainPayload(payload)),
    });
    const record = asRecord(response);
    const updated = normalizeMainCategory(
      {
        ...buildMainPayload(payload),
        ...(asRecord(record?.data || record?.category || response) || {}),
        id: categoryId,
      },
      0
    );
    
    const local = loadLocalCategories();
    saveLocalCategories({
      ...local,
      mainCategories: local.mainCategories.map(c => c.id === categoryId ? updated : c)
    });
    
    return updated;
  } catch (error) {
    if (isRecoverableApiError(error)) {
      const local = loadLocalCategories();
      const updated = normalizeMainCategory({ ...buildMainPayload(payload), id: categoryId }, 0);
      saveLocalCategories({
        ...local,
        mainCategories: local.mainCategories.map(c => c.id === categoryId ? updated : c)
      });
      return updated;
    }
    throw error;
  }
};

export const updateSubCategory = async (categoryId: number, payload: SubCategoryPayload) => {
  const token = getStoredAuthToken();
  try {
    const response = await apiRequest<unknown>(`/api/categories/${categoryId}`, {
      method: "PUT",
      ...(token ? { token } : {}),
      body: JSON.stringify(buildSubPayload(payload)),
    });
    const record = asRecord(response);
    const updatedRecord = asRecord(record?.data || record?.category || response) || {};
    const updated = normalizeSubCategory(
      {
        ...buildSubPayload(payload),
        ...updatedRecord,
        id: categoryId,
      },
      getRemoteParentId(updatedRecord) || payload.mainCategoryId,
      0
    );

    const local = loadLocalCategories();
    saveLocalCategories({
      ...local,
      subCategories: local.subCategories.map(c => c.id === categoryId ? updated : c)
    });
    
    return updated;
  } catch (error) {
    if (isRecoverableApiError(error)) {
      const local = loadLocalCategories();
      const updated = normalizeSubCategory({ ...buildSubPayload(payload), id: categoryId }, payload.mainCategoryId, 0);
      saveLocalCategories({
        ...local,
        subCategories: local.subCategories.map(c => c.id === categoryId ? updated : c)
      });
      return updated;
    }
    throw error;
  }
};

export const deleteMainCategory = async (categoryId: number) => {
  const local = loadLocalCategories();
  const target = local.mainCategories.find(c => c.id === categoryId);
  trackDeletedCategory(categoryId, target?.backendId, target?.name);
  saveLocalCategories({
    ...local,
    mainCategories: local.mainCategories.filter(c => c.id !== categoryId)
  });

  const token = getStoredAuthToken();
  try {
    await apiRequest(`/api/categories/${categoryId}`, {
      method: "DELETE",
      ...(token ? { token } : {}),
    });
  } catch (error) {
    console.error("[CategoriesService] Delete main failed:", categoryId, error);
    const isSilenced =
      isRecoverableApiError(error) ||
      (error instanceof ApiError && [404, 405].includes(error.status)) ||
      !(error instanceof ApiError);

    if (!isSilenced) throw error;
  }
};

export const deleteSubCategory = async (categoryId: number) => {
  const local = loadLocalCategories();
  const target = local.subCategories.find(c => c.id === categoryId);
  trackDeletedCategory(categoryId, target?.backendId, target?.name);
  saveLocalCategories({
    ...local,
    subCategories: local.subCategories.filter(c => c.id !== categoryId)
  });

  const token = getStoredAuthToken();
  try {
    await apiRequest(`/api/categories/${categoryId}`, {
      method: "DELETE",
      ...(token ? { token } : {}),
    });
  } catch (error) {
    console.error("[CategoriesService] Delete sub failed:", categoryId, error);
    const isSilenced =
      isRecoverableApiError(error) ||
      (error instanceof ApiError && [404, 405].includes(error.status)) ||
      !(error instanceof ApiError);

    if (!isSilenced) throw error;
  }
};
