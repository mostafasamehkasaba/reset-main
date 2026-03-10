import { NextResponse } from "next/server";
import { createStoredProductUnit, listAllProductUnits } from "./_storage";

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

export const runtime = "nodejs";

export async function GET() {
  const units = await listAllProductUnits();
  return NextResponse.json({ data: units });
}

export async function POST(request: Request) {
  const payload = asRecord(await request.json().catch(() => null)) || {};
  const name =
    (typeof payload.name === "string" && payload.name.trim()) ||
    (typeof payload.unit_name === "string" && payload.unit_name.trim()) ||
    "";

  if (!name) {
    return NextResponse.json({ message: "اسم وحدة القياس مطلوب." }, { status: 422 });
  }

  const unit = await createStoredProductUnit(name);
  return NextResponse.json({ data: unit }, { status: 201 });
}
