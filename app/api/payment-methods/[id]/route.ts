import { NextResponse } from "next/server";
import { deleteStoredPaymentMethod } from "../_storage";

export const runtime = "nodejs";

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
