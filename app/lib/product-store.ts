export type ProductStatus = "متاح" | "غير متاح";
export type ProductUnit = string;
export type ProductTaxMode = "inclusive" | "rate" | "none";

export type Product = {
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
  status: ProductStatus;
  currency: string;
  unit: ProductUnit;
  supplierName: string;
  barcode: string;
  taxMode: ProductTaxMode;
};

export type StockAlertLevel = "critical" | "reorder";

export type StockAlert = {
  product: Product;
  level: StockAlertLevel;
};

export const PRODUCT_STORAGE_KEY = "reset-main-products-v1";
export const PRODUCT_UNITS: ProductUnit[] = [
  "قطعة",
  "كرتونة",
  "متر",
  "كيلو",
  "ساعة",
  "خدمة",
];

export const PRODUCT_TAX_MODES: Array<{ value: ProductTaxMode; label: string }> = [
  { value: "inclusive", label: "شامل ضريبة" },
  { value: "rate", label: "نسبة ضريبة" },
  { value: "none", label: "بدون ضريبة" },
];

export const normalizeProductStatusLabel = (value: unknown): ProductStatus => {
  const normalizedValue =
    typeof value === "string" ? value.trim().toLowerCase() : String(value ?? "").toLowerCase();

  if (
    normalizedValue === "غير متاح" ||
    normalizedValue === "unavailable" ||
    normalizedValue === "inactive" ||
    normalizedValue === "false" ||
    normalizedValue === "0"
  ) {
    return "غير متاح";
  }

  return "متاح";
};

export const defaultProducts: Product[] = [];

const toPositiveNumber = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return fallback;
  }
  return numberValue < 0 ? 0 : numberValue;
};

const normalizeText = (value: unknown, fallback = "") => {
  if (typeof value === "string") {
    return value.trim();
  }
  return fallback;
};

const sanitizeProduct = (raw: Partial<Product>, index: number): Product => {
  const minStockLevel = Math.floor(toPositiveNumber(raw.minStockLevel, 0));
  const reorderValue = Math.floor(toPositiveNumber(raw.reorderPoint, minStockLevel));
  return {
    id: Math.floor(toPositiveNumber(raw.id, index + 1)),
    code: normalizeText(raw.code, `PRD-${String(index + 1).padStart(3, "0")}`),
    name: normalizeText(raw.name, `منتج ${index + 1}`),
    category: normalizeText(raw.category, "-"),
    mainCategoryId: Math.floor(toPositiveNumber(raw.mainCategoryId, 0)) || null,
    mainCategoryName: normalizeText(raw.mainCategoryName, "-"),
    subCategoryId: Math.floor(toPositiveNumber(raw.subCategoryId, 0)) || null,
    subCategoryName: normalizeText(raw.subCategoryName, "-"),
    sellingPrice: toPositiveNumber(raw.sellingPrice, 0),
    purchasePrice: toPositiveNumber(raw.purchasePrice, 0),
    defaultTaxRate: toPositiveNumber(raw.defaultTaxRate, 0),
    quantity: Math.floor(toPositiveNumber(raw.quantity, 0)),
    minStockLevel,
    reorderPoint: reorderValue < minStockLevel ? minStockLevel : reorderValue,
    sold: Math.floor(toPositiveNumber(raw.sold, 0)),
    description: normalizeText(raw.description, "-"),
    imageUrl: normalizeText(raw.imageUrl, "/file.svg"),
    dateAdded: normalizeText(raw.dateAdded, new Date().toISOString().slice(0, 10)),
    status: normalizeProductStatusLabel(raw.status),
    currency: normalizeText(raw.currency, "OMR"),
    unit: normalizeText(raw.unit, "قطعة"),
    supplierName: normalizeText(raw.supplierName, "-"),
    barcode: normalizeText(raw.barcode, "-"),
    taxMode:
      raw.taxMode === "inclusive" || raw.taxMode === "none" || raw.taxMode === "rate"
        ? raw.taxMode
        : "rate",
  };
};

export const loadProductsFromStorage = () => {
  if (typeof window === "undefined") {
    return defaultProducts;
  }

  try {
    const raw = window.localStorage.getItem(PRODUCT_STORAGE_KEY);
    if (!raw) {
      return defaultProducts;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return defaultProducts;
    }

    return parsed.map((item, index) => sanitizeProduct(item as Partial<Product>, index));
  } catch {
    return defaultProducts;
  }
};

export const saveProductsToStorage = (products: Product[]) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products));
};

export const createProductCode = (name: string) => {
  const normalizedName = name.trim();
  const latinPrefix = normalizedName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3);
  const prefix = latinPrefix || "PRD";
  const hash = Array.from(normalizedName).reduce(
    (sum, char) => (sum + char.charCodeAt(0)) % 1000,
    0
  );
  const timeSuffix = Date.now().toString().slice(-4);
  return `${prefix}-${String(hash).padStart(3, "0")}-${timeSuffix}`;
};

export const getStockAlertLevel = (product: Product): StockAlertLevel | null => {
  if (product.quantity <= product.minStockLevel) {
    return "critical";
  }
  if (product.quantity <= product.reorderPoint) {
    return "reorder";
  }
  return null;
};

export const getStockAlerts = (products: Product[]) => {
  return products
    .map((product) => {
      const level = getStockAlertLevel(product);
      if (!level) {
        return null;
      }
      return { product, level } satisfies StockAlert;
    })
    .filter((alert): alert is StockAlert => alert !== null)
    .sort((first, second) => first.product.quantity - second.product.quantity);
};
