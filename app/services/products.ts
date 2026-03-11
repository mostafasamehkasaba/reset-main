import { getStoredAuthToken } from "../lib/auth-session";
import { API_BASE_URL } from "../lib/constant";
import { ApiError } from "../lib/fetcher";
import { PRODUCT_UNITS, type Product, type ProductTaxMode, type ProductUnit } from "../lib/product-store";

export type ProductPayload = {
  code: string;
  name: string;
  category: string;
  mainCategoryId?: number | null;
  mainCategoryName?: string;
  subCategoryId?: number | null;
  subCategoryName?: string;
  sellingPrice: number;
  purchasePrice: number;
  defaultTaxRate: number;
  quantity: number;
  minStockLevel: number;
  reorderPoint: number;
  description: string;
  imageUrl: string;
  imageFile?: File | null;
  dateAdded: string;
  status: Product["status"];
  currency: string;
  unit: ProductUnit;
  supplierName: string;
  barcode: string;
  taxMode: ProductTaxMode;
};

const LOCAL_CREATED_PRODUCTS_STORAGE_KEY = "reset-main-created-products-v1";
const PRODUCT_IMAGE_BASE_URL = `${API_BASE_URL}/storage/app/public`;
const FALLBACK_PRODUCT_IMAGE = "/file.svg";

type LocalRequestOptions = RequestInit & {
  token?: string | null;
};

const localApiRequest = async <T>(
  endpoint: string,
  options: LocalRequestOptions = {}
): Promise<T> => {
  const { token, headers, body, credentials = "same-origin", ...restOptions } = options;
  const normalizedHeaders = new Headers(headers);

  normalizedHeaders.set("Accept", "application/json");

  if (body && !(body instanceof FormData) && !normalizedHeaders.has("Content-Type")) {
    normalizedHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    normalizedHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...restOptions,
    body,
    credentials,
    headers: normalizedHeaders,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload =
    response.status === 204
      ? null
      : contentType.includes("application/json")
        ? await response.json()
        : await response.text();

  if (!response.ok) {
    const message =
      (typeof payload === "string" && payload.trim()) ||
      (asRecord(payload)?.message as string | undefined) ||
      `ظپط´ظ„ ط§ظ„ط·ظ„ط¨ (${response.status}).`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
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

const toApiImageUrl = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return "";

  if (/^(data:|blob:|https?:\/\/|\/)/i.test(normalized)) {
    return normalized;
  }

  return `${PRODUCT_IMAGE_BASE_URL}/${normalized.replace(/^\/+/, "")}`;
};

const normalizeUnit = (value: unknown): ProductUnit => {
  const rawValue = getFirstText(value);
  const normalized = rawValue.toLowerCase();

  if (normalized === "piece" || normalized === "قطعة") return "قطعة" as ProductUnit;
  if (normalized === "carton" || normalized === "كرتونة") return "كرتونة" as ProductUnit;
  if (normalized === "meter" || normalized === "متر") return "متر" as ProductUnit;
  if (normalized === "kilo" || normalized === "kilogram" || normalized === "kg" || normalized === "كيلو") {
    return "كيلو" as ProductUnit;
  }
  if (normalized === "hour" || normalized === "ساعة") return "ساعة" as ProductUnit;
  if (normalized === "service" || normalized === "خدمة") return "خدمة" as ProductUnit;

  return rawValue || ("قطعة" as ProductUnit);
};

const normalizeTaxMode = (value: unknown): ProductTaxMode => {
  const normalized = getFirstText(value).toLowerCase();

  if (normalized === "inclusive" || normalized === "ط´ط§ظ…ظ„ ط¶ط±ظٹط¨ط©") return "inclusive";
  if (normalized === "none" || normalized === "ط¨ط¯ظˆظ† ط¶ط±ظٹط¨ط©") return "none";
  if (normalized === "exclusive") return "rate";

  return "rate";
};

const normalizeStatus = (value: unknown): Product["status"] => {
  const normalized = getFirstText(value).toLowerCase();

  if (
    normalized === "ط؛ظٹط± ظ…طھط§ط­" ||
    normalized === "unavailable" ||
    normalized === "inactive" ||
    normalized === "out_of_stock"
  ) {
    return "ط؛ظٹط± ظ…طھط§ط­" as Product["status"];
  }

  return "ظ…طھط§ط­" as Product["status"];
};

const toApiUnit = (value: ProductUnit) => {
  if (value === PRODUCT_UNITS[0]) return "piece";
  if (value === PRODUCT_UNITS[1]) return "carton";
  if (value === PRODUCT_UNITS[2]) return "meter";
  if (value === PRODUCT_UNITS[3]) return "kilo";
  if (value === PRODUCT_UNITS[4]) return "hour";
  if (value === PRODUCT_UNITS[5]) return "service";
  return value.trim() || "piece";
};

const toApiStatus = (value: Product["status"]) =>
  value === ("ط؛ظٹط± ظ…طھط§ط­" as Product["status"]) ? "inactive" : "active";

const toApiDefaultTaxType = (value: ProductTaxMode) =>
  value === "inclusive" ? "inclusive" : "exclusive";

const normalizeImageUrl = (record: Record<string, unknown>, fallback = FALLBACK_PRODUCT_IMAGE) => {
  return toApiImageUrl(
    getFirstText(
      record.imageUrl,
      record.image_url,
      record.image,
      record.image_path,
      fallback
    )
  );
};

const normalizeProduct = (input: unknown, index: number): Product => {
  const record = asRecord(input) || {};
  const backendId =
    Math.floor(getFirstNumber(record.backendId, record.backend_id, 0)) || null;

  return {
    id: Math.floor(getFirstNumber(record.id, record.product_id, index + 1)),
    backendId,
    code: getFirstText(
      record.code,
      record.product_code,
      record.sku,
      `PRD-${String(index + 1).padStart(3, "0")}`
    ),
    name: getFirstText(record.name, record.product_name, `ظ…ظ†طھط¬ ${index + 1}`),
    category: getFirstText(
      record.category,
      record.category_name,
      record.subCategoryName,
      record.sub_category_name,
      record.mainCategoryName,
      record.main_category_name,
      asRecord(record.category)?.name,
      "-"
    ),
    mainCategoryId: Math.floor(
      getFirstNumber(record.mainCategoryId, record.main_category_id, asRecord(record.main_category)?.id, 0)
    ) || null,
    mainCategoryName: getFirstText(
      record.mainCategoryName,
      record.main_category_name,
      asRecord(record.main_category)?.name,
      "-"
    ),
    subCategoryId: Math.floor(
      getFirstNumber(record.subCategoryId, record.sub_category_id, asRecord(record.sub_category)?.id, 0)
    ) || null,
    subCategoryName: getFirstText(
      record.subCategoryName,
      record.sub_category_name,
      asRecord(record.sub_category)?.name,
      "-"
    ),
    sellingPrice: getFirstNumber(record.sellingPrice, record.selling_price, record.price),
    purchasePrice: getFirstNumber(
      record.purchasePrice,
      record.purchase_price,
      record.cost,
      record.cost_price
    ),
    defaultTaxRate: getFirstNumber(
      record.defaultTaxRate,
      record.default_tax_rate,
      record.tax_rate
    ),
    quantity: Math.floor(getFirstNumber(record.quantity, record.stock, record.available_quantity)),
    minStockLevel: Math.floor(
      getFirstNumber(record.minStockLevel, record.min_stock_level, record.reorder_level, 0)
    ),
    reorderPoint: Math.floor(
      getFirstNumber(record.reorderPoint, record.reorder_point, record.reorder_level, 0)
    ),
    sold: Math.floor(getFirstNumber(record.sold, record.sold_count, record.sales_count, 0)),
    description: getFirstText(record.description, record.desc, "-"),
    imageUrl: normalizeImageUrl(record),
    dateAdded: getFirstText(record.dateAdded, record.date_added, record.created_at, "-"),
    status: normalizeStatus(record.status ?? record.state ?? record.is_active),
    currency: getFirstText(record.currency, record.currency_code, "OMR"),
    unit: normalizeUnit(record.unit),
    supplierName: getFirstText(
      record.supplierName,
      record.supplier_name,
      asRecord(record.supplier)?.name,
      "-"
    ),
    barcode: getFirstText(record.barcode, record.bar_code, "-"),
    taxMode: normalizeTaxMode(record.taxMode ?? record.tax_mode ?? record.default_tax_type),
  };
};

const normalizeCreatedProduct = (input: unknown, fallback: ProductPayload): Product => {
  const record = asRecord(input) || {};
  const backendId =
    Math.floor(getFirstNumber(record.backendId, record.backend_id, 0)) || null;

  return {
    id: Math.floor(getFirstNumber(record.id, record.product_id, Date.now())),
    backendId,
    code: getFirstText(record.code, record.product_code, record.sku, fallback.code),
    name: getFirstText(record.name, record.product_name, fallback.name),
    category: getFirstText(
      record.category,
      record.category_name,
      record.subCategoryName,
      record.sub_category_name,
      record.mainCategoryName,
      record.main_category_name,
      asRecord(record.category)?.name,
      fallback.category,
      "-"
    ),
    mainCategoryId:
      Math.floor(
        getFirstNumber(
          record.mainCategoryId,
          record.main_category_id,
          asRecord(record.main_category)?.id,
          fallback.mainCategoryId ?? 0
        )
      ) || null,
    mainCategoryName: getFirstText(
      record.mainCategoryName,
      record.main_category_name,
      asRecord(record.main_category)?.name,
      fallback.mainCategoryName,
      "-"
    ),
    subCategoryId:
      Math.floor(
        getFirstNumber(
          record.subCategoryId,
          record.sub_category_id,
          asRecord(record.sub_category)?.id,
          fallback.subCategoryId ?? 0
        )
      ) || null,
    subCategoryName: getFirstText(
      record.subCategoryName,
      record.sub_category_name,
      asRecord(record.sub_category)?.name,
      fallback.subCategoryName,
      "-"
    ),
    sellingPrice: getFirstNumber(
      record.sellingPrice,
      record.selling_price,
      record.price,
      fallback.sellingPrice
    ),
    purchasePrice: getFirstNumber(
      record.purchasePrice,
      record.purchase_price,
      record.cost,
      record.cost_price,
      fallback.purchasePrice
    ),
    defaultTaxRate: getFirstNumber(
      record.defaultTaxRate,
      record.default_tax_rate,
      record.tax_rate,
      fallback.defaultTaxRate
    ),
    quantity: Math.floor(
      getFirstNumber(record.quantity, record.stock, record.available_quantity, fallback.quantity)
    ),
    minStockLevel: Math.floor(
      getFirstNumber(
        record.minStockLevel,
        record.min_stock_level,
        record.reorder_level,
        fallback.minStockLevel
      )
    ),
    reorderPoint: Math.floor(
      getFirstNumber(
        record.reorderPoint,
        record.reorder_point,
        record.reorder_level,
        fallback.reorderPoint
      )
    ),
    sold: Math.floor(getFirstNumber(record.sold, record.sold_count, record.sales_count, 0)),
    description: getFirstText(record.description, record.desc, fallback.description, "-"),
    imageUrl: normalizeImageUrl(record, fallback.imageUrl || FALLBACK_PRODUCT_IMAGE),
    dateAdded: getFirstText(
      record.dateAdded,
      record.date_added,
      record.created_at,
      fallback.dateAdded
    ),
    status: normalizeStatus(record.status ?? record.state ?? record.is_active ?? fallback.status),
    currency: getFirstText(record.currency, record.currency_code, fallback.currency, "OMR"),
    unit: normalizeUnit(record.unit ?? fallback.unit),
    supplierName: getFirstText(
      record.supplierName,
      record.supplier_name,
      asRecord(record.supplier)?.name,
      fallback.supplierName,
      "-"
    ),
    barcode: getFirstText(record.barcode, record.bar_code, fallback.barcode, "-"),
    taxMode: normalizeTaxMode(
      record.taxMode ?? record.tax_mode ?? record.default_tax_type ?? fallback.taxMode
    ),
  };
};

const extractCollection = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;

  const record = asRecord(payload);
  if (!record) return [];

  const candidates = [record.data, record.products, record.items, record.results];

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
    throw new Error("ط§ظ„ط¬ظ„ط³ط© ط؛ظٹط± ظ…طھط§ط­ط©. ط³ط¬ظ„ ط§ظ„ط¯ط®ظˆظ„ ط£ظˆظ„ظ‹ط§.");
  }

  return token;
};

const clearLocalCreatedProductsCache = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LOCAL_CREATED_PRODUCTS_STORAGE_KEY);
};

const buildRequestBody = (product: ProductPayload) => {
  const apiStatus = toApiStatus(product.status);
  const apiUnit = toApiUnit(product.unit);
  const apiDefaultTaxType = toApiDefaultTaxType(product.taxMode);
  const apiTaxRate = product.taxMode === "none" ? 0 : product.defaultTaxRate;
  const normalizedCategory =
    product.subCategoryName?.trim() ||
    product.mainCategoryName?.trim() ||
    product.category.trim() ||
    "-";

  return {
    code: product.code,
    product_code: product.code,
    sku: product.code,
    name: product.name,
    product_name: product.name,
    category: normalizedCategory,
    category_name: normalizedCategory,
    mainCategoryId: product.mainCategoryId ?? null,
    main_category_id: product.mainCategoryId ?? null,
    mainCategoryName: product.mainCategoryName || "-",
    main_category_name: product.mainCategoryName || "-",
    subCategoryId: product.subCategoryId ?? null,
    sub_category_id: product.subCategoryId ?? null,
    subCategoryName: product.subCategoryName || "-",
    sub_category_name: product.subCategoryName || "-",
    sellingPrice: product.sellingPrice,
    selling_price: product.sellingPrice,
    purchasePrice: product.purchasePrice,
    purchase_price: product.purchasePrice,
    cost_price: product.purchasePrice,
    defaultTaxRate: apiTaxRate,
    default_tax_rate: apiTaxRate,
    default_tax_type: apiDefaultTaxType,
    quantity: product.quantity,
    stock: product.quantity,
    minStockLevel: product.minStockLevel,
    min_stock_level: product.minStockLevel,
    reorderPoint: product.reorderPoint,
    reorder_point: product.reorderPoint,
    reorder_level: product.reorderPoint,
    description: product.description,
    imageUrl: product.imageUrl,
    image_url: product.imageUrl,
    dateAdded: product.dateAdded,
    date_added: product.dateAdded,
    status: apiStatus,
    currency: product.currency,
    unit: apiUnit,
    supplierName: product.supplierName,
    supplier_name: product.supplierName,
    barcode: product.barcode,
    taxMode: product.taxMode,
    tax_mode: product.taxMode,
  };
};

const buildFormData = (product: ProductPayload) => {
  const apiStatus = toApiStatus(product.status);
  const apiUnit = toApiUnit(product.unit);
  const apiDefaultTaxType = toApiDefaultTaxType(product.taxMode);
  const apiTaxRate = product.taxMode === "none" ? 0 : product.defaultTaxRate;
  const formData = new FormData();
  const normalizedCategory =
    product.subCategoryName?.trim() ||
    product.mainCategoryName?.trim() ||
    product.category.trim() ||
    "-";

  formData.set("code", product.code);
  formData.set("product_code", product.code);
  formData.set("sku", product.code);
  formData.set("name", product.name);
  formData.set("product_name", product.name);
  formData.set("category", normalizedCategory);
  formData.set("category_name", normalizedCategory);
  formData.set("mainCategoryId", String(product.mainCategoryId ?? ""));
  formData.set("main_category_id", String(product.mainCategoryId ?? ""));
  formData.set("mainCategoryName", product.mainCategoryName || "-");
  formData.set("main_category_name", product.mainCategoryName || "-");
  formData.set("subCategoryId", String(product.subCategoryId ?? ""));
  formData.set("sub_category_id", String(product.subCategoryId ?? ""));
  formData.set("subCategoryName", product.subCategoryName || "-");
  formData.set("sub_category_name", product.subCategoryName || "-");
  formData.set("sellingPrice", String(product.sellingPrice));
  formData.set("selling_price", String(product.sellingPrice));
  formData.set("purchasePrice", String(product.purchasePrice));
  formData.set("purchase_price", String(product.purchasePrice));
  formData.set("cost_price", String(product.purchasePrice));
  formData.set("defaultTaxRate", String(apiTaxRate));
  formData.set("default_tax_rate", String(apiTaxRate));
  formData.set("default_tax_type", apiDefaultTaxType);
  formData.set("quantity", String(product.quantity));
  formData.set("stock", String(product.quantity));
  formData.set("minStockLevel", String(product.minStockLevel));
  formData.set("min_stock_level", String(product.minStockLevel));
  formData.set("reorderPoint", String(product.reorderPoint));
  formData.set("reorder_point", String(product.reorderPoint));
  formData.set("reorder_level", String(product.reorderPoint));
  formData.set("description", product.description);
  formData.set("dateAdded", product.dateAdded);
  formData.set("date_added", product.dateAdded);
  formData.set("status", apiStatus);
  formData.set("currency", product.currency);
  formData.set("unit", apiUnit);
  formData.set("supplierName", product.supplierName);
  formData.set("supplier_name", product.supplierName);
  formData.set("barcode", product.barcode);
  formData.set("taxMode", product.taxMode);
  formData.set("tax_mode", product.taxMode);

  if (product.imageFile) {
    formData.set("image", product.imageFile, product.imageFile.name);
  } else {
    formData.set("imageUrl", product.imageUrl);
    formData.set("image_url", product.imageUrl);
  }

  return formData;
};

const isFailedToFetchError = (error: unknown) =>
  error instanceof Error && /failed to fetch/i.test(error.message);

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    if (typeof FileReader === "undefined") {
      reject(new Error("Failed to read image file."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Failed to read image file."));
    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result) {
        resolve(reader.result);
        return;
      }

      reject(new Error("Failed to read image file."));
    };
    reader.readAsDataURL(file);
  });

const normalizeProductFromPayload = (payload: unknown, fallback: ProductPayload) => {
  const record = asRecord(payload);
  return normalizeCreatedProduct(record?.data || record?.product || payload, fallback);
};

export const listProducts = async () => {
  clearLocalCreatedProductsCache();
  const payload = await localApiRequest<unknown>("/api/products", {
    token: requireToken(),
  });

  const remoteProducts = extractCollection(payload).map((product, index) =>
    normalizeProduct(product, index)
  );

  return remoteProducts;
};

export const createProduct = async (product: ProductPayload) => {
  const token = requireToken();
  clearLocalCreatedProductsCache();
  const requestBody = product.imageFile
    ? buildFormData(product)
    : JSON.stringify(buildRequestBody(product));

  try {
    const payload = await localApiRequest<unknown>("/api/products", {
      method: "POST",
      token,
      body: requestBody,
    });

    return normalizeProductFromPayload(payload, product);
  } catch (error) {
    if (!isFailedToFetchError(error)) {
      throw error;
    }

    if (product.imageFile) {
      try {
        const imageDataUrl = await readFileAsDataUrl(product.imageFile);
        const retryPayload = await localApiRequest<unknown>("/api/products", {
          method: "POST",
          token,
          body: JSON.stringify(
            buildRequestBody({ ...product, imageUrl: imageDataUrl, imageFile: null })
          ),
        });

        return normalizeProductFromPayload(retryPayload, {
          ...product,
          imageUrl: imageDataUrl,
          imageFile: null,
        });
      } catch (retryError) {
        throw retryError;
      }
    }
    throw error;
  }
};



export const updateProduct = async (productId: number, product: ProductPayload) => {
  const token = requireToken();
  clearLocalCreatedProductsCache();
  const requestBody = product.imageFile
    ? buildFormData(product)
    : JSON.stringify(buildRequestBody(product));

  try {
    const payload = await localApiRequest<unknown>(
      `/api/products/${encodeURIComponent(productId)}`,
      {
        method: "PUT",
        token,
        body: requestBody,
      }
    );

    return normalizeProductFromPayload(payload, product);
  } catch (error) {
    if (!isFailedToFetchError(error)) {
      throw error;
    }

    if (product.imageFile) {
      try {
        const imageDataUrl = await readFileAsDataUrl(product.imageFile);
        const retryPayload = await localApiRequest<unknown>(
          `/api/products/${encodeURIComponent(productId)}`,
          {
            method: "PUT",
            token,
            body: JSON.stringify(
              buildRequestBody({ ...product, imageUrl: imageDataUrl, imageFile: null })
            ),
          }
        );

        return normalizeProductFromPayload(retryPayload, {
          ...product,
          imageUrl: imageDataUrl,
          imageFile: null,
        });
      } catch (retryError) {
        throw retryError;
      }
    }
    throw error;
  }
};

export const deleteProduct = async (product: Product) => {
  const token = requireToken();
  const productId = product.backendId ?? product.id;
  clearLocalCreatedProductsCache();

  await localApiRequest(`/api/products/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    token,
  });
};
