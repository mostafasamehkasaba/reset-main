"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { Building2, Landmark, PhoneCall, ReceiptText } from "lucide-react";
import { SupplierAddressInfo } from "@/components/suppliers/SupplierAddressInfo";
import { SupplierBasicInfo } from "@/components/suppliers/SupplierBasicInfo";
import { SupplierContactInfo } from "@/components/suppliers/SupplierContactInfo";
import { SupplierFinancialInfo } from "@/components/suppliers/SupplierFinancialInfo";
import { SupplierNotesStatus } from "@/components/suppliers/SupplierNotesStatus";
import { SupplierStatusBadge } from "@/components/suppliers/SupplierStatusBadge";
import { getSupplierStatusLabel } from "@/app/lib/api-lookups";
import type { SupplierFormState } from "@/lib/suppliers/supplierTypes";

type SupplierFormProps = {
  values: SupplierFormState;
  isEditMode: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage?: string;
  saveMessage?: string;
  onChange: <K extends keyof SupplierFormState>(
    key: K,
    value: SupplierFormState[K]
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const summaryCardClassName =
  "rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]";

export function SupplierForm({
  values,
  isEditMode,
  isLoading,
  isSubmitting,
  errorMessage,
  saveMessage,
  onChange,
  onSubmit,
}: SupplierFormProps) {
  const isDisabled = isLoading || isSubmitting;
  const statusLabel = getSupplierStatusLabel(values.status);

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"
      aria-busy={isDisabled}
    >
      <div className="space-y-4">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
                نموذج المورد
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                {isEditMode ? "تحديث بيانات المورد الحالية" : "إدخال بيانات المورد الجديد"}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                نفس الحقول الحالية ستُحفظ بنفس البنية المرتبطة بالباكند، لكن داخل نموذج
                أوضح وأسرع للمراجعة.
              </p>
            </div>

            <Link
              href="/projects-pages/Suppliers"
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              رجوع للقائمة
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
              جاري تحميل بيانات المورد...
            </div>
          ) : null}

          {saveMessage ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {saveMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <SupplierBasicInfo
            values={values}
            isDisabled={isDisabled}
            onChange={onChange}
          />
          <SupplierContactInfo
            values={values}
            isDisabled={isDisabled}
            onChange={onChange}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <SupplierAddressInfo
            values={values}
            isDisabled={isDisabled}
            onChange={onChange}
          />
          <SupplierFinancialInfo
            values={values}
            isDisabled={isDisabled}
            onChange={onChange}
          />
        </div>

        <SupplierNotesStatus values={values} isDisabled={isDisabled} onChange={onChange} />

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm leading-7 text-slate-500">
              {isEditMode
                ? "سيتم حفظ التعديلات على نفس المورد الحالي بنفس منطق الربط والتحديث."
                : "سيتم إنشاء المورد بنفس منطق الحفظ الحالي دون أي تغيير في البنية أو الحقول."}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/projects-pages/Suppliers"
                className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                إلغاء
              </Link>
              <button
                type="submit"
                disabled={isDisabled}
                className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting
                  ? isEditMode
                    ? "جارٍ حفظ التعديلات..."
                    : "جارٍ حفظ المورد..."
                  : isEditMode
                    ? "حفظ التعديلات"
                    : "حفظ المورد"}
              </button>
            </div>
          </div>
        </section>
      </div>

      <aside className="space-y-4">
        <section className={summaryCardClassName}>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
                ملخص سريع
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                مراجعة سريعة قبل الحفظ
              </h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-xs text-slate-400">اسم المورد</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{values.name || "-"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-xs text-slate-400">الحالة</p>
              <div className="mt-2">
                <SupplierStatusBadge status={statusLabel} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="text-xs text-slate-400">الهاتف</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{values.phone || "-"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="text-xs text-slate-400">البريد</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{values.email || "-"}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-xs text-slate-400">الموقع</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {[values.city, values.country].filter(Boolean).join("، ") || "-"}
              </p>
            </div>
          </div>
        </section>

        <section className={summaryCardClassName}>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-emerald-700">
                ملخص مالي
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                أهم القيم المرتبطة بالحساب
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-xs text-slate-400">الحد الائتماني</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {(Number.parseFloat(values.creditLimit) || 0).toLocaleString()} ج.م
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-xs text-slate-400">الرصيد الافتتاحي</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {(Number.parseFloat(values.openingBalance) || 0).toLocaleString()} ج.م
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-xs text-slate-400">الرقم الضريبي</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{values.taxNumber || "-"}</p>
            </div>
          </div>
        </section>

        <section className={summaryCardClassName}>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-amber-700">
                بيانات مساندة
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                البنك والملاحظات
              </h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-xs text-slate-400">اسم البنك</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{values.bankName || "-"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-xs text-slate-400">رقم الحساب / IBAN</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {[values.bankAccountNumber, values.iban].filter(Boolean).join(" • ") || "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-xs text-slate-400">الملاحظات</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{values.notes || "-"}</p>
            </div>
          </div>
        </section>
      </aside>
    </form>
  );
}
