import { getStoredAuthToken } from "../lib/auth-session";
import { apiRequest } from "../lib/fetcher";
import type { Product, ProductTaxMode, ProductUnit } from "../lib/product-store";

export type ProductPayload = {
  code: string;
  name: string;
  category: string;
  sellingPrice: number;
  purchasePrice: number;
  defaultTaxRate: number;
  quantity: number;
  minStockLevel: number;
  reorderPoint: number;
  description: string;
  imageUrl: string;
  dateAdded: string;
  status: Product["status"];
  currency: string;
  unit: ProductUnit;
  supplierName: string;
  barcode: string;
  taxMode: ProductTaxMode;
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

const normalizeUnit = (value: unknown): ProductUnit => {
  const normalized = getFirstText(value);
  if (
    normalized === "قطعة" ||
    normalized === "كرتونة" ||
    normalized === "متر" ||
    normalized === "كيلو" ||
    normalized === "ساعة" ||
    normalized === "خدمة"
  ) {
    return normalized;
  }

  return "قطعة";
};

const normalizeTaxMode = (value: unknown): ProductTaxMode => {
  const normalized = getFirstText(value).toLowerCase();
  if (normalized === "inclusive" || normalized === "شامل ضريبة") return "inclusive";
  if (normalized === "none" || normalized === "بدون ضريبة") return "none";
  return "rate";
};

const normalizeStatus = (value: unknown): Product["status"] => {
  const normalized = getFirstText(value).toLowerCase();
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

const normalizeProduct = (input: unknown, index: number): Product => {
  const record = asRecord(input) || {};

  return {
    id: Math.floor(getFirstNumber(record.id, record.product_id, index + 1)),
    code: getFirstText(record.code, record.product_code, `PRD-${String(index + 1).padStart(3, "0")}`),
    name: getFirstText(record.name, record.product_name, `منتج ${index + 1}`),
    category: getFirstText(
      record.category,
      record.category_name,
      asRecord(record.category)?.name,
      "-"
    ),
    sellingPrice: getFirstNumber(record.sellingPrice, record.selling_price, record.price),
    purchasePrice: getFirstNumber(record.purchasePrice, record.purchase_price, record.cost),
    defaultTaxRate: getFirstNumber(record.defaultTaxRate, record.default_tax_rate, record.tax_rate),
    quantity: Math.floor(getFirstNumber(record.quantity, record.stock, record.available_quantity)),
    minStockLevel: Math.floor(getFirstNumber(record.minStockLevel, record.min_stock_level, 0)),
    reorderPoint: Math.floor(getFirstNumber(record.reorderPoint, record.reorder_point, 0)),
    sold: Math.floor(getFirstNumber(record.sold, record.sold_count, record.sales_count)),
    description: getFirstText(record.description, record.desc, "-"),
    imageUrl: getFirstText(record.imageUrl, record.image_url, record.image, "/file.svg"),
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
    taxMode: normalizeTaxMode(record.taxMode ?? record.tax_mode),
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
    throw new Error("الجلسة غير متاحة. سجل الدخول أولًا.");
  }

  return token;
};

const buildRequestBody = (product: ProductPayload) => ({
  code: product.code,
  product_code: product.code,
  name: product.name,
  product_name: product.name,
  category: product.category,
  category_name: product.category,
  sellingPrice: product.sellingPrice,
  selling_price: product.sellingPrice,
  purchasePrice: product.purchasePrice,
  purchase_price: product.purchasePrice,
  defaultTaxRate: product.defaultTaxRate,
  default_tax_rate: product.defaultTaxRate,
  quantity: product.quantity,
  stock: product.quantity,
  minStockLevel: product.minStockLevel,
  min_stock_level: product.minStockLevel,
  reorderPoint: product.reorderPoint,
  reorder_point: product.reorderPoint,
  description: product.description,
  imageUrl: product.imageUrl,
  image_url: product.imageUrl,
  image: product.imageUrl,
  dateAdded: product.dateAdded,
  date_added: product.dateAdded,
  status: product.status,
  currency: product.currency,
  unit: product.unit,
  supplierName: product.supplierName,
  supplier_name: product.supplierName,
  barcode: product.barcode,
  taxMode: product.taxMode,
  tax_mode: product.taxMode,
});

export const listProducts = async () => {
  const payload = await apiRequest<unknown>("/api/products", {
    token: requireToken(),
  });

  return extractCollection(payload).map((product, index) => normalizeProduct(product, index));
};

export const createProduct = async (product: ProductPayload) => {
  const payload = await apiRequest<unknown>("/api/products", {
    method: "POST",
    token: requireToken(),
    body: JSON.stringify(buildRequestBody(product)),
  });

  const record = asRecord(payload);
  return normalizeProduct(record?.data || record?.product || payload, 0);
};
