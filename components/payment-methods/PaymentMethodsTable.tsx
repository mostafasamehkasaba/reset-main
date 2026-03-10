import { Boxes, MoreHorizontal, WalletCards } from "lucide-react";
import type { PaymentMethod } from "@/app/services/payment-methods";
import type { CollectionViewMode } from "@/hooks/useCollectionViewMode";
import {
  formatPaymentMethodTotal,
  getPaymentMethodTypeLabel,
} from "@/lib/payment-methods/paymentMethodTypes";

type PaymentMethodsTableProps = {
  methods: PaymentMethod[];
  isLoading: boolean;
  viewMode: CollectionViewMode;
  onOpenActions: (methodId: number) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
};

export function PaymentMethodsTable({
  methods,
  isLoading,
  viewMode,
  onOpenActions,
  onResetFilters,
  hasActiveFilters,
}: PaymentMethodsTableProps) {
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
              <div className="mt-4 h-24 animate-pulse rounded-[22px] bg-slate-100" />
            </div>
          ))}
        </section>
      );
    }

    if (methods.length === 0) {
      return (
        <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-14 text-center shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
            <Boxes className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-950">
            لا توجد وسائل دفع مطابقة
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
        {methods.map((method) => (
          <article
            key={method.id}
            className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-42px_rgba(15,23,42,0.26)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-slate-950">
                  {method.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {getPaymentMethodTypeLabel(method.type)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenActions(method.id)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                aria-label={`إجراءات ${method.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                {method.currency}
              </span>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                #{method.id}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                <p className="text-xs text-slate-400">عدد الدفعات</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {method.payments}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                <p className="text-xs text-slate-400">الإجمالي</p>
                <p className="mt-1 text-sm font-semibold text-emerald-700">
                  {formatPaymentMethodTotal(method.total, method.currency)}
                </p>
              </div>
            </div>

            <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
              {method.desc || "-"}
            </p>
          </article>
        ))}
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">
            وسائل الدفع
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            قائمة منظمة بالطرق المتاحة داخل النظام.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
          {methods.length} نتيجة
        </div>
      </div>

      {isLoading ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-right">
            <thead className="bg-slate-50/90 text-sm text-slate-500">
              <tr>
                <th className="px-4 py-4 font-medium">اسم الوسيلة</th>
                <th className="px-4 py-4 font-medium">النوع</th>
                <th className="px-4 py-4 font-medium">العملة</th>
                <th className="px-4 py-4 font-medium">عدد الدفعات</th>
                <th className="px-4 py-4 font-medium">الإجمالي</th>
                <th className="px-4 py-4 font-medium">الوصف</th>
                <th className="px-4 py-4 text-center font-medium">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="border-t border-slate-100">
                  {Array.from({ length: 7 }).map((__, cell) => (
                    <td key={cell} className="px-4 py-4">
                      <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : methods.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
            <WalletCards className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-950">
            لا توجد وسائل دفع مطابقة
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            جرّب تغيير البحث الحالي أو أضف وسيلة دفع جديدة.
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
          <table className="w-full min-w-[980px] text-right">
            <thead className="bg-slate-50/90 text-sm text-slate-500">
              <tr>
                <th className="px-4 py-4 font-medium">اسم الوسيلة</th>
                <th className="px-4 py-4 font-medium">النوع</th>
                <th className="px-4 py-4 font-medium">العملة</th>
                <th className="px-4 py-4 font-medium">عدد الدفعات</th>
                <th className="px-4 py-4 font-medium">الإجمالي</th>
                <th className="px-4 py-4 font-medium">الوصف</th>
                <th className="px-4 py-4 text-center font-medium">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {methods.map((method) => (
                <tr
                  key={method.id}
                  className="border-t border-slate-100 transition hover:bg-slate-50/80"
                >
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {method.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">#{method.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    {getPaymentMethodTypeLabel(method.type)}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    {method.currency}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    {method.payments}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-emerald-700">
                    {formatPaymentMethodTotal(method.total, method.currency)}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {method.desc || "-"}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => onOpenActions(method.id)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                      aria-label={`إجراءات ${method.name}`}
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
