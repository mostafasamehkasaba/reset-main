import { NextResponse } from "next/server";
import {
  deleteStoredPaymentMethod,
  updateStoredPaymentMethod,
} from "../_storage";

export const runtime = "nodejs";

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const methodId = Number(params.id);

  if (!Number.isFinite(methodId)) {
    return NextResponse.json(
      { message: "معرّف وسيلة الدفع غير صالح." },
      { status: 400 }
    );
  }

  const deleted = await deleteStoredPaymentMethod(methodId);

  if (!deleted) {
    return NextResponse.json(
      { message: "وسيلة الدفع غير موجودة." },
      { status: 404 }
    );
  }

  return new NextResponse(null, { status: 204 });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const methodId = Number(params.id);

  if (!Number.isFinite(methodId)) {
    return NextResponse.json(
      { message: "معرّف وسيلة الدفع غير صالح." },
      { status: 400 }
    );
  }

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

  const method = await updateStoredPaymentMethod(methodId, {
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

  if (!method) {
    return NextResponse.json(
      { message: "وسيلة الدفع غير موجودة." },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: method });
}
