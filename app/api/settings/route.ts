import { NextResponse } from "next/server";
import {
  getDefaultSettings,
  readStoredSettings,
  writeStoredSettings,
} from "./_storage";

export const runtime = "nodejs";

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const getText = (value: unknown, fallback = "") => {
  return typeof value === "string" ? value.trim() : fallback;
};

const getNumber = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const isValidLogoDataUrl = (value: string) => {
  if (!value) return true;
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value);
};

export async function GET() {
  const data = await readStoredSettings();
  return NextResponse.json({ data });
}

export async function PUT(request: Request) {
  const payload = asRecord(await request.json().catch(() => null)) || {};
  const defaults = getDefaultSettings();

  const siteName = getText(payload.siteName);
  const siteUrl = getText(payload.siteUrl);
  const siteEmail = getText(payload.siteEmail);
  const sitePhone = getText(payload.sitePhone);
  const itemsPerPage = Math.max(1, getNumber(payload.itemsPerPage, defaults.itemsPerPage));
  const defaultCurrency = getText(payload.defaultCurrency, defaults.defaultCurrency);
  const companyTagline = getText(payload.companyTagline);
  const invoiceNotes = getText(payload.invoiceNotes, defaults.invoiceNotes);
  const logoDataUrl = getText(payload.logoDataUrl);

  const errors: Record<string, string[]> = {};

  if (!siteName) {
    errors.siteName = ["اسم الموقع مطلوب."];
  }

  if (!siteEmail) {
    errors.siteEmail = ["البريد الإلكتروني مطلوب."];
  }

  if (siteEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(siteEmail)) {
    errors.siteEmail = ["صيغة البريد الإلكتروني غير صحيحة."];
  }

  if (siteUrl && !/^https?:\/\//i.test(siteUrl)) {
    errors.siteUrl = ["رابط الموقع يجب أن يبدأ بـ http:// أو https://."];
  }

  if (!invoiceNotes) {
    errors.invoiceNotes = ["تفاصيل الفاتورة مطلوبة."];
  }

  if (!isValidLogoDataUrl(logoDataUrl)) {
    errors.logoDataUrl = ["ملف الشعار غير صالح."];
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      {
        message: "بيانات الإعدادات غير صالحة.",
        errors,
      },
      { status: 422 }
    );
  }

  const saved = await writeStoredSettings({
    siteName,
    siteUrl,
    siteEmail,
    sitePhone,
    itemsPerPage,
    defaultCurrency,
    companyTagline,
    invoiceNotes,
    logoDataUrl,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ data: saved });
}
