import { Boxes, MoreHorizontal, Truck } from "lucide-react";
import type { Supplier } from "@/app/types";
import type { CollectionViewMode } from "@/hooks/useCollectionViewMode";
import { SupplierStatusBadge } from "@/components/suppliers/SupplierStatusBadge";

type SuppliersTableProps = {
  suppliers: Supplier[];
  isLoading: boolean;
  viewMode: CollectionViewMode;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onOpenActions: (supplierId: number) => void;
};

const formatCurrency = (value: number) => `${value.toLocaleString()} ج.م`;

export function SuppliersTable({
  suppliers,
  isLoading,
  viewMode,
  hasActiveFilters,
  onResetFilters,
  onOpenActions,
}: SuppliersTableProps) {
  if (viewMode === "cards") {
    if (isLoading) {
      return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.22)]"
            >
              <div className="h-20 animate-pulse rounded-[22px] bg-slate-100" />
              <div className="mt-4 h-28 animate-pulse rounded-[22px] bg-slate-100" />
            </div>
          ))}
        </section>
      );
    }

    if (suppliers.length === 0) {
      return (
        <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-14 text-center shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
            <Boxes className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-950">
            لا توجد نتائج مطابقة
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            جرّب تعديل البحث أو الفلاتر الحالية.
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              مسح الفلاتر
            </button>
          ) : null}
        </section>
      );
    }

    return (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {suppliers.map((supplier) => (
          <article
            key={supplier.id}
            className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-42px_rgba(15,23,42,0.26)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-slate-950">
                  {supplier.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {supplier.city}، {supplier.country}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenActions(supplier.id)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                aria-label={`إجراءات ${supplier.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <SupplierStatusBadge status={supplier.status} />
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                #{supplier.id}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                <p className="text-xs text-slate-400">الهاتف</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{supplier.phone}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                <p className="text-xs text-slate-400">مدة السداد</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {supplier.paymentTermDays} يوم
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                <p className="text-xs text-slate-400">الرصيد</p>
                <p className="mt-1 text-sm font-semibold text-emerald-700">
                  {formatCurrency(supplier.balance)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                <p className="text-xs text-slate-400">الحد الائتماني</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatCurrency(supplier.creditLimit)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <p className="text-xs text-slate-400">البريد والبنك</p>
              <p className="mt-1 text-sm font-medium text-slate-700">{supplier.email}</p>
              <p className="mt-2 text-xs text-slate-500">
                {supplier.bankName} {supplier.bankAccountNumber !== "-" ? `• ${supplier.bankAccountNumber}` : ""}
              </p>
            </div>
          </article>
        ))}
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">الموردون</h3>
          <p className="mt-1 text-sm text-slate-500">
            قائمة أوضح للموردين الحاليين مع أهم الحقول المرتبطة بالمشتريات والمخزون.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
          {suppliers.length} نتيجة
        </div>
      </div>

      {isLoading ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-right">
            <thead className="bg-slate-50/90 text-sm text-slate-500">
              <tr>
                <th className="px-4 py-4 font-medium">المورد</th>
                <th className="px-4 py-4 font-medium">التواصل</th>
                <th className="px-4 py-4 font-medium">الموقع</th>
                <th className="px-4 py-4 font-medium">الرقم الضريبي</th>
                <th className="px-4 py-4 font-medium">مدة السداد</th>
                <th className="px-4 py-4 font-medium">الحد الائتماني</th>
                <th className="px-4 py-4 font-medium">الرصيد</th>
                <th className="px-4 py-4 font-medium">الحالة</th>
                <th className="px-4 py-4 text-center font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="border-t border-slate-100">
                  {Array.from({ length: 9 }).map((__, cell) => (
                    <td key={cell} className="px-4 py-4">
                      <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
            <Truck className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-950">لا توجد نتائج مطابقة</h3>
          <p className="mt-2 text-sm text-slate-500">
            جرّب تغيير البحث الحالي أو أضف موردًا جديدًا.
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              مسح الفلاتر
            </button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-right">
            <thead className="bg-slate-50/90 text-sm text-slate-500">
              <tr>
                <th className="px-4 py-4 font-medium">المورد</th>
                <th className="px-4 py-4 font-medium">التواصل</th>
                <th className="px-4 py-4 font-medium">الموقع</th>
                <th className="px-4 py-4 font-medium">الرقم الضريبي</th>
                <th className="px-4 py-4 font-medium">مدة السداد</th>
                <th className="px-4 py-4 font-medium">الحد الائتماني</th>
                <th className="px-4 py-4 font-medium">الرصيد</th>
                <th className="px-4 py-4 font-medium">الحالة</th>
                <th className="px-4 py-4 text-center font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="border-t border-slate-100 transition hover:bg-slate-50/80"
                >
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{supplier.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        #{supplier.id} {supplier.bankName !== "-" ? `• ${supplier.bankName}` : ""}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    <p>{supplier.phone}</p>
                    <p className="mt-1 text-xs text-slate-500">{supplier.email}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    <p>{supplier.city}</p>
                    <p className="mt-1 text-xs text-slate-500">{supplier.country}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">{supplier.taxNumber}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    {supplier.paymentTermDays} يوم
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-slate-900">
                    {formatCurrency(supplier.creditLimit)}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-emerald-700">
                    {formatCurrency(supplier.balance)}
                  </td>
                  <td className="px-4 py-4">
                    <SupplierStatusBadge status={supplier.status} />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => onOpenActions(supplier.id)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                      aria-label={`إجراءات ${supplier.name}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
