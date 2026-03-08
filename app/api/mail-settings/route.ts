import { NextResponse } from "next/server";
import {
  getDefaultMailSettings,
  readStoredMailSettings,
  writeStoredMailSettings,
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

export async function GET() {
  const data = await readStoredMailSettings();
  return NextResponse.json({ data });
}

export async function PUT(request: Request) {
  const payload = asRecord(await request.json().catch(() => null)) || {};
  const defaults = getDefaultMailSettings();

  const contactEmail = getText(payload.contactEmail);
  const smtpHost = getText(payload.smtpHost);
  const smtpUsername = getText(payload.smtpUsername);
  const smtpPassword = getText(payload.smtpPassword);
  const smtpPort = Math.max(1, getNumber(payload.smtpPort, defaults.smtpPort));
  const tlsEnabled =
    typeof payload.tlsEnabled === "boolean" ? payload.tlsEnabled : defaults.tlsEnabled;

  const errors: Record<string, string[]> = {};

  if (!contactEmail) {
    errors.contactEmail = ["البريد الإلكتروني للتواصل مطلوب."];
  }

  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    errors.contactEmail = ["صيغة البريد الإلكتروني للتواصل غير صحيحة."];
  }

  if (!smtpHost) {
    errors.smtpHost = ["مضيف SMTP مطلوب."];
  }

  if (!smtpUsername) {
    errors.smtpUsername = ["مستخدم SMTP مطلوب."];
  }

  if (!smtpPassword) {
    errors.smtpPassword = ["كلمة مرور SMTP مطلوبة."];
  }

  if (!smtpPort || smtpPort > 65535) {
    errors.smtpPort = ["منفذ SMTP غير صالح."];
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      {
        message: "بيانات البريد غير صالحة.",
        errors,
      },
      { status: 422 }
    );
  }

  const saved = await writeStoredMailSettings({
    contactEmail,
    smtpHost,
    smtpUsername,
    smtpPassword,
    smtpPort,
    tlsEnabled,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ data: saved });
}
