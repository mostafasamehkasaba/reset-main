import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { API_BASE_URL } from "../../lib/constant";

export type StoredProduct = {
  id: number;
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
  sold: number;
  description: string;
  imageUrl: string;
  dateAdded: string;
  status: string;
  currency: string;
  unit: string;
  supplierName: string;
  barcode: string;
  taxMode: string;
};

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "products.json");
const productImageBaseUrl = `${API_BASE_URL}/storage/app/public`;
const ensureDataFile = async () => {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, "[]", "utf8");
  }
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const getText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const getNumber = (...values: unknown[]) => {
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

const resolveImageUrl = (record: Record<string, unknown>) => {
  const imageValue = getText(record.imageUrl, record.image_url, record.image, record.image_path);

  if (!imageValue) {
    return "/file.svg";
  }

  if (/^(data:|blob:|https?:\/\/|\/)/i.test(imageValue)) {
    return imageValue;
  }

  return `${productImageBaseUrl}/${imageValue.replace(/^\/+/, "")}`;
};

const normalizeStatus = (value: unknown) => {
  const normalized = getText(value).toLowerCase();

  if (
    normalized === "غير متاح" ||
    normalized === "unavailable" ||
    normalized === "inactive" ||
    normalized === "out_of_stock"
  ) {
    return "غير متاح";
  }

  return "متاح";
};

const normalizeUnit = (value: unknown) => {
  const rawValue = getText(value);
  const normalized = rawValue.toLowerCase();

  if (normalized === "قطعة" || normalized === "piece") return "piece";
  if (normalized === "كرتونة" || normalized === "carton") return "carton";
  if (normalized === "متر" || normalized === "meter") return "meter";
  if (normalized === "كيلو" || normalized === "kilo" || normalized === "kilogram" || normalized === "kg") {
    return "kilo";
  }
  if (normalized === "ساعة" || normalized === "hour") return "hour";
  if (normalized === "خدمة" || normalized === "service") return "service";

  return rawValue || "piece";
};

const normalizeTaxMode = (value: unknown) => {
  const normalized = getText(value).toLowerCase();

  if (normalized === "inclusive" || normalized === "شامل ضريبة") {
    return "inclusive";
  }

  if (normalized === "none" || normalized === "بدون ضريبة") {
    return "none";
  }

  return "rate";
};

export const normalizeStoredProduct = (input: unknown, index = 0): StoredProduct => {
  const record = asRecord(input) || {};
  const minStockLevel = Math.max(
    0,
    Math.floor(getNumber(record.minStockLevel, record.min_stock_level, record.reorder_level))
  );
  const reorderValue = Math.max(
    0,
    Math.floor(
      getNumber(record.reorderPoint, record.reorder_point, record.reorder_level, minStockLevel)
    )
  );
  const normalizedUnit = normalizeUnit(record.unit);

  return {
    id: Math.max(1, Math.floor(getNumber(record.id, record.product_id, Date.now() + index))),
    code: getText(
      record.code,
      record.product_code,
      record.sku,
      `PRD-${String(index + 1).padStart(3, "0")}`
    ),
    name: getText(record.name, record.product_name, `منتج ${index + 1}`),
    category: getText(
      record.category,
      record.category_name,
      record.subCategoryName,
      record.sub_category_name,
      record.mainCategoryName,
      record.main_category_name,
      asRecord(record.category)?.name,
      "-"
    ),
    mainCategoryId: Math.max(
      0,
      Math.floor(
        getNumber(record.mainCategoryId, record.main_category_id, asRecord(record.main_category)?.id)
      )
    ) || null,
    mainCategoryName: getText(
      record.mainCategoryName,
      record.main_category_name,
      asRecord(record.main_category)?.name,
      "-"
    ),
    subCategoryId: Math.max(
      0,
      Math.floor(
        getNumber(record.subCategoryId, record.sub_category_id, asRecord(record.sub_category)?.id)
      )
    ) || null,
    subCategoryName: getText(
      record.subCategoryName,
      record.sub_category_name,
      asRecord(record.sub_category)?.name,
      "-"
    ),
    sellingPrice: Math.max(0, getNumber(record.sellingPrice, record.selling_price, record.price)),
    purchasePrice: Math.max(
      0,
      getNumber(record.purchasePrice, record.purchase_price, record.cost, record.cost_price)
    ),
    defaultTaxRate: Math.max(
      0,
      getNumber(record.defaultTaxRate, record.default_tax_rate, record.tax_rate)
    ),
    quantity: Math.max(
      0,
      Math.floor(getNumber(record.quantity, record.stock, record.available_quantity))
    ),
    minStockLevel,
    reorderPoint: Math.max(minStockLevel, reorderValue),
    sold: Math.max(0, Math.floor(getNumber(record.sold, record.sold_count, record.sales_count))),
    description: getText(record.description, record.desc, "-"),
    imageUrl: resolveImageUrl(record),
    dateAdded: getText(
      record.dateAdded,
      record.date_added,
      record.created_at,
      new Date().toISOString().slice(0, 10)
    ),
    status: normalizeStatus(record.status ?? record.state ?? record.is_active),
    currency: getText(record.currency, record.currency_code, "OMR"),
    unit: normalizedUnit || "piece",
    supplierName: getText(
      record.supplierName,
      record.supplier_name,
      asRecord(record.supplier)?.name,
      "-"
    ),
    barcode: getText(record.barcode, record.bar_code, "-"),
    taxMode: normalizeTaxMode(record.taxMode ?? record.tax_mode ?? record.default_tax_type),
  };
};

const parseCollection = (raw: string): StoredProduct[] => {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((product, index) => normalizeStoredProduct(product, index));
  } catch {
    return [];
  }
};

const saveStoredProducts = async (products: StoredProduct[]) => {
  await ensureDataFile();
  await writeFile(dataFile, JSON.stringify(products, null, 2), "utf8");
};

const getProductKey = (product: Pick<StoredProduct, "code">) => product.code.trim().toLowerCase();

export const listStoredProducts = async () => {
  await ensureDataFile();
  const raw = await readFile(dataFile, "utf8");
  return parseCollection(raw);
};

export const mergeStoredProducts = (
  primaryProducts: StoredProduct[],
  secondaryProducts: StoredProduct[]
) => {
  const seen = new Set<string>();
  const merged: StoredProduct[] = [];

  for (const product of [...primaryProducts, ...secondaryProducts]) {
    const normalized = normalizeStoredProduct(product, merged.length);
    const productKey = getProductKey(normalized);

    if (!productKey || seen.has(productKey)) {
      continue;
    }

    seen.add(productKey);
    merged.push(normalized);
  }

  return merged;
};

export const upsertStoredProduct = async (input: unknown) => {
  const products = await listStoredProducts();
  const draft = normalizeStoredProduct(input, products.length);
  const draftKey = getProductKey(draft);

  const productIndex = products.findIndex(
    (product) => getProductKey(product) === draftKey || product.id === draft.id
  );

  if (productIndex === -1) {
    const nextProducts = [draft, ...products];
    await saveStoredProducts(nextProducts);
    return draft;
  }

  const existing = products[productIndex];
  const merged = normalizeStoredProduct(
    {
      ...existing,
      ...(asRecord(input) || {}),
      id: existing.id,
      code: getText((asRecord(input) || {}).code, (asRecord(input) || {}).product_code, (asRecord(input) || {}).sku, existing.code),
    },
    productIndex
  );

  const nextProducts = [...products];
  nextProducts[productIndex] = merged;
  await saveStoredProducts(nextProducts);
  return merged;
};

export const removeStoredProduct = async (productIdOrCode: string | number) => {
  const products = await listStoredProducts();
  const normalizedCode =
    typeof productIdOrCode === "string" ? productIdOrCode.trim().toLowerCase() : "";
  const normalizedId =
    typeof productIdOrCode === "number"
      ? Math.floor(productIdOrCode)
      : typeof productIdOrCode === "string" && /^\d+$/.test(productIdOrCode.trim())
        ? Math.floor(Number.parseInt(productIdOrCode.trim(), 10))
        : null;

  const nextProducts = products.filter((product) => {
    if (normalizedId !== null && product.id === normalizedId) {
      return false;
    }

    if (normalizedCode && product.code.trim().toLowerCase() === normalizedCode) {
      return false;
    }

    return true;
  });

  await saveStoredProducts(nextProducts);
  return nextProducts;
};
