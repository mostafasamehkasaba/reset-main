export type ProductStatus = "متاح" | "غير متاح";
export type ProductUnit = "قطعة" | "كرتونة" | "متر" | "كيلو" | "ساعة" | "خدمة";
export type ProductTaxMode = "inclusive" | "rate" | "none";

export type Product = {
  id: number;
  code: string;
  name: string;
  category: string;
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

export const defaultProducts: Product[] = [
  {
    id: 1,
    code: "PRD-001-24",
    name: "قالب ووردبريس",
    category: "تصميم",
    sellingPrice: 20,
    purchasePrice: 12,
    defaultTaxRate: 5,
    quantity: 4,
    minStockLevel: 3,
    reorderPoint: 7,
    sold: 1,
    description: "لا يوجد",
    imageUrl: "/file.svg",
    dateAdded: "2024-08-24",
    status: "متاح",
    currency: "OMR",
    unit: "قطعة",
    supplierName: "شركة الريادة للتوريد",
    barcode: "6281000010012",
    taxMode: "rate",
  },
  {
    id: 2,
    code: "PRD-002-24",
    name: "استضافة مشتركة",
    category: "خدمات",
    sellingPrice: 30,
    purchasePrice: 18,
    defaultTaxRate: 5,
    quantity: 2,
    minStockLevel: 2,
    reorderPoint: 5,
    sold: 5,
    description: "باقة شهرية",
    imageUrl: "/globe.svg",
    dateAdded: "2024-08-31",
    status: "متاح",
    currency: "OMR",
    unit: "خدمة",
    supplierName: "مؤسسة المستقبل",
    barcode: "6281000010013",
    taxMode: "inclusive",
  },
  {
    id: 3,
    code: "PRD-003-24",
    name: "تطوير تطبيق",
    category: "برمجة",
    sellingPrice: 120,
    purchasePrice: 75,
    defaultTaxRate: 0,
    quantity: 10,
    minStockLevel: 4,
    reorderPoint: 8,
    sold: 3,
    description: "لا يوجد",
    imageUrl: "/next.svg",
    dateAdded: "2024-09-06",
    status: "متاح",
    currency: "OMR",
    unit: "ساعة",
    supplierName: "Delta Traders",
    barcode: "6281000010014",
    taxMode: "none",
  },
  {
    id: 4,
    code: "PRD-004-24",
    name: "ترخيص إضافات",
    category: "إضافات",
    sellingPrice: 45,
    purchasePrice: 22,
    defaultTaxRate: 10,
    quantity: 1,
    minStockLevel: 2,
    reorderPoint: 4,
    sold: 2,
    description: "ترخيص سنوي",
    imageUrl: "/window.svg",
    dateAdded: "2024-09-01",
    status: "متاح",
    currency: "OMR",
    unit: "قطعة",
    supplierName: "شركة الريادة للتوريد",
    barcode: "6281000010015",
    taxMode: "rate",
  },
];

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
    status: raw.status === "غير متاح" ? "غير متاح" : "متاح",
    currency: normalizeText(raw.currency, "OMR"),
    unit: PRODUCT_UNITS.includes(raw.unit as ProductUnit) ? (raw.unit as ProductUnit) : "قطعة",
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
    if (!Array.isArray(parsed) || parsed.length === 0) {
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
