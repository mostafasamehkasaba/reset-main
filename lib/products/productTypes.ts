import {
  createProductCode,
  normalizeProductStatusLabel,
  PRODUCT_UNITS,
  type Product,
  type ProductTaxMode,
  type ProductUnit,
} from "@/app/lib/product-store";

export type ProductFormState = {
  name: string;
  code: string;
  barcode: string;
  category: string;
  mainCategoryId: string;
  subCategoryId: string;
  imageUrl: string;
  imageFile: File | null;
  sellingPrice: string;
  purchasePrice: string;
  quantity: string;
  unit: ProductUnit;
  minStockLevel: string;
  reorderPoint: string;
  taxMode: ProductTaxMode;
  defaultTaxRate: string;
  supplierName: string;
  currency: string;
  dateAdded: string;
  status: Product["status"];
  description: string;
};

export const FALLBACK_PRODUCT_IMAGE = "/file.svg";
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const PRODUCT_CURRENCY_OPTIONS = ["OMR", "SAR", "USD", "EGP"] as const;
export const SUPPORTED_IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".bmp",
  ".svg",
  ".avif",
  ".heic",
  ".heif",
  ".tif",
  ".tiff",
  ".ico",
  ".jfif",
  ".pjp",
  ".pjpeg",
];
export const IMAGE_INPUT_ACCEPT = ["image/*", ...SUPPORTED_IMAGE_EXTENSIONS].join(",");
export const SUPPORTED_IMAGE_HINT =
  "JPG, JPEG, PNG, WEBP, GIF, BMP, SVG, AVIF, HEIC, HEIF, TIFF, ICO حتى 10MB";

export const todayDate = () => new Date().toISOString().slice(0, 10);
export const createBarcode = () => Date.now().toString().slice(-12).padStart(12, "0");

export const toDateInputValue = (value: string, fallback = todayDate()) => {
  const text = value.trim();
  if (!text || text === "-") {
    return fallback;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return fallback;
};

export const hasAcceptedImageExtension = (fileName: string) => {
  const lowerFileName = fileName.trim().toLowerCase();
  return SUPPORTED_IMAGE_EXTENSIONS.some((extension) => lowerFileName.endsWith(extension));
};

export const createInitialProductFormState = (): ProductFormState => ({
  name: "",
  code: createProductCode(""),
  barcode: createBarcode(),
  category: "",
  mainCategoryId: "",
  subCategoryId: "",
  imageUrl: "",
  imageFile: null,
  sellingPrice: "",
  purchasePrice: "",
  quantity: "",
  unit: PRODUCT_UNITS[0] as ProductUnit,
  minStockLevel: "2",
  reorderPoint: "5",
  taxMode: "rate",
  defaultTaxRate: "15",
  supplierName: "",
  currency: "OMR",
  dateAdded: todayDate(),
  status: "متاح" as Product["status"],
  description: "",
});

export const buildProductFormStateFromProduct = (
  product: Product
): ProductFormState => ({
  name: product.name,
  code: product.code,
  barcode: product.barcode === "-" ? "" : product.barcode,
  category: product.category === "-" ? "" : product.category,
  mainCategoryId: product.mainCategoryId ? String(product.mainCategoryId) : "",
  subCategoryId: product.subCategoryId ? String(product.subCategoryId) : "",
  imageUrl: product.imageUrl === FALLBACK_PRODUCT_IMAGE ? "" : product.imageUrl,
  imageFile: null,
  sellingPrice: product.sellingPrice > 0 ? String(product.sellingPrice) : "",
  purchasePrice: product.purchasePrice > 0 ? String(product.purchasePrice) : "",
  quantity: product.quantity > 0 ? String(product.quantity) : "",
  unit: product.unit,
  minStockLevel: String(product.minStockLevel),
  reorderPoint: String(product.reorderPoint),
  taxMode: product.taxMode,
  defaultTaxRate: String(product.defaultTaxRate),
  supplierName: product.supplierName === "-" ? "" : product.supplierName,
  currency: product.currency || "OMR",
  dateAdded: toDateInputValue(product.dateAdded),
  status: normalizeProductStatusLabel(product.status),
  description: product.description === "-" ? "" : product.description,
});
