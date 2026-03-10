"use client";

import { Eye, PencilLine, Trash2 } from "lucide-react";
import ActionDrawer from "@/components/ActionDrawer";
import type { PaymentMethod } from "@/app/services/payment-methods";
import {
  formatPaymentMethodDate,
  formatPaymentMethodTotal,
  getPaymentMethodTypeLabel,
} from "@/lib/payment-methods/paymentMethodTypes";

type PaymentMethodActionsProps = {
  method: PaymentMethod | null;
  onClose: () => void;
  onDelete: (methodId: number) => void;
};

export function PaymentMethodActions({
  method,
  onClose,
  onDelete,
}: PaymentMethodActionsProps) {
  return (
    <ActionDrawer
      open={method !== null}
      title="إجراءات وسيلة الدفع"
      subtitle={method?.name}
      onClose={onClose}
      actions={
        method
          ? [
              {
                id: "view",
                label: "عرض الوسيلة",
                description: "افتح صفحة التفاصيل لعرض البيانات الحالية.",
                icon: Eye,
                href: `/projects-pages/payment-methods/view?id=${encodeURIComponent(
                  method.id
                )}`,
              },
              {
                id: "edit",
                label: "تعديل الوسيلة",
                description: "افتح نموذج التعديل بنفس الحقول المرتبطة بالباكند.",
                icon: PencilLine,
                href: `/projects-pages/payment-methods/new?id=${encodeURIComponent(
                  method.id
                )}`,
              },
              {
                id: "delete",
                label: "حذف الوسيلة",
                description: "احذف الوسيلة بعد رسالة التأكيد.",
                icon: Trash2,
                tone: "danger" as const,
                onClick: () => {
                  onDelete(method.id);
                  onClose();
                },
              },
            ]
          : []
      }
    >
      {method ? (
        <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-400">النوع</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {getPaymentMethodTypeLabel(method.type)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-400">الإجمالي</p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">
                {formatPaymentMethodTotal(method.total, method.currency)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-400">عدد الدفعات</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {method.payments}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-400">تاريخ الإنشاء</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {formatPaymentMethodDate(method.createdAt)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-400">الوصف</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {method.desc || "-"}
            </p>
          </div>
        </div>
      ) : null}
    </ActionDrawer>
  );
}
