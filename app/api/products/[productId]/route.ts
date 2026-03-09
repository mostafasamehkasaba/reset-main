import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { API_BASE_URL } from "../../../lib/constant";
import { removeStoredProduct, upsertStoredProduct } from "../_storage";

export const runtime = "nodejs";

const upstreamProductsUrl = `${API_BASE_URL}/api/products`;

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

const inferImageMimeType = (file: File) => {
  const explicitType = getText(file.type).toLowerCase();
  if (explicitType.startsWith("image/")) {
    return explicitType;
  }

  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".apng")) return "image/apng";
  if (lowerName.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) return "image/jpeg";
  if (lowerName.endsWith(".jfif")) return "image/jpeg";
  if (lowerName.endsWith(".pjpeg")) return "image/jpeg";
  if (lowerName.endsWith(".pjp")) return "image/jpeg";
  if (lowerName.endsWith(".webp")) return "image/webp";
  if (lowerName.endsWith(".gif")) return "image/gif";
  if (lowerName.endsWith(".bmp")) return "image/bmp";
  if (lowerName.endsWith(".svg")) return "image/svg+xml";
  if (lowerName.endsWith(".avif")) return "image/avif";
  if (lowerName.endsWith(".heic")) return "image/heic";
  if (lowerName.endsWith(".heif")) return "image/heif";
  if (lowerName.endsWith(".tif") || lowerName.endsWith(".tiff")) return "image/tiff";
  if (lowerName.endsWith(".ico")) return "image/x-icon";

  return "application/octet-stream";
};

const fileToDataUrl = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${inferImageMimeType(file)};base64,${buffer.toString("base64")}`;
};

const getMessageFromPayload = (payload: unknown) => {
  if (typeof payload === "string") {
    return payload.trim() || null;
  }

  const record = asRecord(payload);
  if (!record) {
    return null;
  }

  if (record.errors && typeof record.errors === "object") {
    const messages = Object.values(record.errors as Record<string, unknown>)
      .flatMap((value) => {
        if (typeof value === "string" && value.trim()) {
          return [value.trim()];
        }

        if (Array.isArray(value)) {
          return value.filter(
            (entry): entry is string => typeof entry === "string" && entry.trim().length > 0
          );
        }

        return [];
      })
      .map((message) => message.trim())
      .filter(Boolean);

    if (messages.length > 0) {
      return [...new Set(messages)].join("، ");
    }
  }

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message.trim();
  }

  return null;
};

const createErrorBody = (payload: unknown, fallbackMessage: string) => {
  if (typeof payload === "string") {
    return { message: payload.trim() || fallbackMessage };
  }

  const record = asRecord(payload);
  if (record) {
    return record;
  }

  return { message: fallbackMessage };
};

const buildUpstreamHeaders = (request: Request, includeJsonBody = false) => {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");

  headers.set("Accept", "application/json");

  if (includeJsonBody) {
    headers.set("Content-Type", "application/json");
  }

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return headers;
};

const readResponsePayload = async (response: Response) => {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? response.json() : response.text();
};

const toNumericPayloadValue = (payload: Record<string, unknown>, key: string) => {
  const rawValue = payload[key];
  if (typeof rawValue !== "string" || !rawValue.trim()) {
    return;
  }

  const parsed = Number(rawValue);
  if (Number.isFinite(parsed)) {
    payload[key] = parsed;
  }
};

const parseMultipartRequest = async (request: Request) => {
  const formData = await request.formData();
  const payload: Record<string, unknown> = {};
  const upstreamBody = new FormData();

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      payload[key] = value;
      upstreamBody.append(key, value);
      continue;
    }

    if (!(value instanceof File) || value.size === 0) {
      continue;
    }

    if (key === "image" || key === "image_file") {
      const imageDataUrl = await fileToDataUrl(value);
      payload.imageUrl = imageDataUrl;
      payload.image_url = imageDataUrl;
      payload.image = imageDataUrl;
      upstreamBody.set("image", value, value.name);
      upstreamBody.set("imageUrl", imageDataUrl);
      upstreamBody.set("image_url", imageDataUrl);
      continue;
    }

    upstreamBody.append(key, value, value.name);
  }

  for (const key of [
    "sellingPrice",
    "selling_price",
    "purchasePrice",
    "purchase_price",
    "cost_price",
    "defaultTaxRate",
    "default_tax_rate",
    "quantity",
    "stock",
    "minStockLevel",
    "min_stock_level",
    "reorderPoint",
    "reorder_point",
    "reorder_level",
  ]) {
    toNumericPayloadValue(payload, key);
  }

  return { payload, upstreamBody, includeJsonBody: false };
};

const parseJsonRequest = async (request: Request) => {
  const payload = asRecord(await request.json().catch(() => null)) || {};
  return {
    payload,
    upstreamBody: JSON.stringify(payload),
    includeJsonBody: true,
  };
};

const parseRequestPayload = async (request: Request) => {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    return parseMultipartRequest(request);
  }

  return parseJsonRequest(request);
};

const shouldReturnUpstreamError = (status: number) =>
  status === 401 || status === 403 || status === 422;

const buildProductDraft = (payload: Record<string, unknown>) => ({
  code: getText(payload.code, payload.product_code, payload.sku),
  product_code: getText(payload.product_code, payload.code, payload.sku),
  sku: getText(payload.sku, payload.code, payload.product_code),
  name: getText(payload.name, payload.product_name),
  product_name: getText(payload.product_name, payload.name),
  category: getText(payload.category, payload.category_name, asRecord(payload.category)?.name, "-"),
  category_name: getText(
    payload.category_name,
    payload.category,
    asRecord(payload.category)?.name,
    "-"
  ),
  sellingPrice: payload.sellingPrice ?? payload.selling_price ?? payload.price ?? 0,
  selling_price: payload.selling_price ?? payload.sellingPrice ?? payload.price ?? 0,
  purchasePrice: payload.purchasePrice ?? payload.purchase_price ?? payload.cost ?? payload.cost_price ?? 0,
  purchase_price:
    payload.purchase_price ?? payload.purchasePrice ?? payload.cost ?? payload.cost_price ?? 0,
  cost_price: payload.cost_price ?? payload.purchase_price ?? payload.purchasePrice ?? 0,
  defaultTaxRate: payload.defaultTaxRate ?? payload.default_tax_rate ?? payload.tax_rate ?? 0,
  default_tax_rate: payload.default_tax_rate ?? payload.defaultTaxRate ?? payload.tax_rate ?? 0,
  default_tax_type: getText(payload.default_tax_type, payload.tax_mode, "exclusive"),
  quantity: payload.quantity ?? payload.stock ?? payload.available_quantity ?? 0,
  stock: payload.stock ?? payload.quantity ?? payload.available_quantity ?? 0,
  minStockLevel: payload.minStockLevel ?? payload.min_stock_level ?? payload.reorder_level ?? 0,
  min_stock_level:
    payload.min_stock_level ?? payload.minStockLevel ?? payload.reorder_level ?? 0,
  reorderPoint: payload.reorderPoint ?? payload.reorder_point ?? payload.reorder_level ?? 0,
  reorder_point: payload.reorder_point ?? payload.reorderPoint ?? payload.reorder_level ?? 0,
  reorder_level: payload.reorder_level ?? payload.reorderPoint ?? payload.reorder_point ?? 0,
  description: getText(payload.description, payload.desc, "-"),
  desc: getText(payload.desc, payload.description, "-"),
  imageUrl: getText(payload.imageUrl, payload.image_url, payload.image, payload.image_path, "/file.svg"),
  image_url: getText(payload.image_url, payload.imageUrl, payload.image, payload.image_path, "/file.svg"),
  image: getText(payload.image, payload.imageUrl, payload.image_url, payload.image_path, "/file.svg"),
  image_path: getText(payload.image_path),
  dateAdded: getText(payload.dateAdded, payload.date_added, new Date().toISOString().slice(0, 10)),
  date_added: getText(
    payload.date_added,
    payload.dateAdded,
    new Date().toISOString().slice(0, 10)
  ),
  status: getText(payload.status, payload.state, "active"),
  currency: getText(payload.currency, payload.currency_code, "OMR"),
  unit: getText(payload.unit, "piece"),
  supplierName: getText(
    payload.supplierName,
    payload.supplier_name,
    asRecord(payload.supplier)?.name,
    "-"
  ),
  supplier_name: getText(
    payload.supplier_name,
    payload.supplierName,
    asRecord(payload.supplier)?.name,
    "-"
  ),
  barcode: getText(payload.barcode, payload.bar_code, "-"),
  bar_code: getText(payload.bar_code, payload.barcode, "-"),
  taxMode: getText(payload.taxMode, payload.tax_mode, payload.default_tax_type, "rate"),
  tax_mode: getText(payload.tax_mode, payload.taxMode, payload.default_tax_type, "rate"),
});

const parseNumericId = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function PUT(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  const { productId } = await context.params;
  let payload: Record<string, unknown>;
  let upstreamBody: FormData | string;
  let includeJsonBody: boolean;

  try {
    ({ payload, upstreamBody, includeJsonBody } = await parseRequestPayload(request));
  } catch {
    return NextResponse.json(
      {
        message:
          "تعذر قراءة بيانات المنتج. حاول مجددًا أو استخدم ملف صورة أصغر.",
      },
      { status: 400 }
    );
  }

  const productDraft: Record<string, unknown> = buildProductDraft(payload);
  const normalizedId = parseNumericId(productId);

  if (normalizedId !== null) {
    productDraft.id = normalizedId;
    productDraft.product_id = normalizedId;
  }

  try {
    const upstreamResponse = await fetch(
      `${upstreamProductsUrl}/${encodeURIComponent(productId)}`,
      {
        method: "PUT",
        headers: buildUpstreamHeaders(request, includeJsonBody),
        body: upstreamBody,
        cache: "no-store",
      }
    );
    const upstreamPayload = await readResponsePayload(upstreamResponse);

    if (!upstreamResponse.ok) {
      if (shouldReturnUpstreamError(upstreamResponse.status)) {
        return NextResponse.json(
          createErrorBody(
            upstreamPayload,
            getMessageFromPayload(upstreamPayload) || "تعذر تحديث المنتج."
          ),
          { status: upstreamResponse.status }
        );
      }

      const fallbackProduct = await upsertStoredProduct(productDraft);
      return NextResponse.json({ data: fallbackProduct });
    }

    const upstreamRecord = asRecord(upstreamPayload);
    const upstreamProduct = upstreamRecord?.data || upstreamRecord?.product || upstreamPayload;
    const updatedProduct = await upsertStoredProduct({
      ...productDraft,
      ...(asRecord(upstreamProduct) || {}),
    });

    return NextResponse.json({ data: updatedProduct });
  } catch {
    const fallbackProduct = await upsertStoredProduct(productDraft);
    return NextResponse.json({ data: fallbackProduct });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  const { productId } = await context.params;

  try {
    const upstreamResponse = await fetch(
      `${upstreamProductsUrl}/${encodeURIComponent(productId)}`,
      {
        method: "DELETE",
        headers: buildUpstreamHeaders(request),
        cache: "no-store",
      }
    );
    const upstreamPayload = await readResponsePayload(upstreamResponse);

    if (!upstreamResponse.ok) {
      if (shouldReturnUpstreamError(upstreamResponse.status)) {
        return NextResponse.json(
          createErrorBody(
            upstreamPayload,
            getMessageFromPayload(upstreamPayload) || "تعذر حذف المنتج."
          ),
          { status: upstreamResponse.status }
        );
      }
    }

    await removeStoredProduct(productId);
    return NextResponse.json({ ok: true });
  } catch {
    await removeStoredProduct(productId);
    return NextResponse.json({ ok: true });
  }
}
