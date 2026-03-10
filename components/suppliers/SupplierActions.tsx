"use client";

import { Copy, PencilLine, Trash2 } from "lucide-react";
import ActionDrawer from "@/components/ActionDrawer";
import { SupplierStatusBadge } from "@/components/suppliers/SupplierStatusBadge";
import type { Supplier } from "@/app/types";

type SupplierActionsProps = {
  supplier: Supplier | null;
  onClose: () => void;
  onDelete: (supplierId: number) => void;
  onCopy: (supplier: Supplier) => void;
};

const formatCurrency = (value: number) => `${value.toLocaleString()} ج.م`;

export function SupplierActions({
  supplier,
  onClose,
  onDelete,
  onCopy,
}: SupplierActionsProps) {
  return (
    <ActionDrawer
      open={supplier !== null}
      title="إجراءات المورد"
      subtitle={supplier?.name}
      onClose={onClose}
      actions={
        supplier
          ? [
              {
                id: "edit",
                label: "تعديل المورد",
                description: "افتح نموذج التعديل بنفس الحقول الحالية المرتبطة بالباكند.",
                icon: PencilLine,
                href: `/projects-pages/Suppliers/new?id=${encodeURIComponent(supplier.id)}`,
              },
              {
                id: "copy",
                label: "نسخ البيانات",
                description: "انسخ بيانات التواصل والرصيد لاستخدامها بسرعة.",
                icon: Copy,
                onClick: () => {
                  onCopy(supplier);
                  onClose();
                },
              },
              {
                id: "delete",
                label: "حذف المورد",
                description: "احذف المورد بعد رسالة التأكيد.",
                icon: Trash2,
                tone: "danger" as const,
                onClick: () => {
                  onDelete(supplier.id);
                  onClose();
                },
              },
            ]
          : []
      }
    >
      {supplier ? (
        <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">الحالة</p>
              <div className="mt-2">
                <SupplierStatusBadge status={supplier.status} />
              </div>
            </div>
            <div className="text-left">
              <p className="text-xs text-slate-400">انضم في</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{supplier.joinedAt}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-400">الهاتف</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{supplier.phone}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-400">البريد</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{supplier.email}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-400">الرصيد</p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">
                {formatCurrency(supplier.balance)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-400">الحد الائتماني</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {formatCurrency(supplier.creditLimit)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-400">البيانات البنكية</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{supplier.bankName}</p>
            <p className="mt-2 text-xs text-slate-500">
              {supplier.bankAccountNumber} {supplier.iban !== "-" ? `• ${supplier.iban}` : ""}
            </p>
          </div>
        </div>
      ) : null}
    </ActionDrawer>
  );
}
