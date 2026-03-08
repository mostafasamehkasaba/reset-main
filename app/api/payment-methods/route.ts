import { NextResponse } from "next/server";
import {
  createStoredPaymentMethod,
  listStoredPaymentMethods,
} from "./_storage";

export const runtime = "nodejs";

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

export async function GET() {
  const methods = await listStoredPaymentMethods();
  return NextResponse.json({ data: methods });
}

export async function POST(request: Request) {
  const payload = asRecord(await request.json().catch(() => null)) || {};
  const name =
    (typeof payload.name === "string" && payload.name.trim()) ||
    (typeof payload.method_name === "string" && payload.method_name.trim()) ||
    "";

  if (!name) {
    return NextResponse.json(
      { message: "اسم وسيلة الدفع مطلوب." },
      { status: 422 }
    );
  }

  const method = await createStoredPaymentMethod({
    name,
    type:
      (typeof payload.type === "string" && payload.type.trim()) ||
      (typeof payload.method_type === "string" && payload.method_type.trim()) ||
      "",
    currency:
      (typeof payload.currency === "string" && payload.currency.trim()) ||
      (typeof payload.currency_code === "string" && payload.currency_code.trim()) ||
      "OMR",
    desc:
      (typeof payload.desc === "string" && payload.desc.trim()) ||
      (typeof payload.description === "string" && payload.description.trim()) ||
      "-",
  });

  return NextResponse.json({ data: method }, { status: 201 });
}
