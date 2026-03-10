"use client";

import Link from "next/link";
import { CreditCard, PackagePlus, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";
import ViewModeToggle from "@/components/ViewModeToggle";
import { PaymentMethodActions } from "@/components/payment-methods/PaymentMethodActions";
import { PaymentMethodFilters } from "@/components/payment-methods/PaymentMethodFilters";
import { PaymentMethodsTable } from "@/components/payment-methods/PaymentMethodsTable";
import { useCollectionViewMode } from "@/hooks/useCollectionViewMode";
import { getErrorMessage } from "../../lib/fetcher";
import {
  deletePaymentMethod,
  listPaymentMethods,
  type PaymentMethod,
} from "../../services/payment-methods";

export default function PaymentMethodsPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [methodsList, setMethodsList] = useState<PaymentMethod[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [deleteMethodId, setDeleteMethodId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { viewMode, setViewMode } = useCollectionViewMode(
    "reset-main-view-mode-payment-methods"
  );

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listPaymentMethods();
        if (!active) return;
        setMethodsList(data);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getErrorMessage(error, "تعذر تحميل وسائل الدفع."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredMethods = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return methodsList.filter((method) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          method.name,
          method.desc,
          method.currency,
          method.type,
          String(method.total),
          String(method.id),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesType =
        typeFilter === "all" ||
        (method.type || "").trim().toLowerCase() === typeFilter;

      return matchesQuery && matchesType;
    });
  }, [methodsList, query, typeFilter]);

  const selectedMethod = useMemo(
    () => methodsList.find((method) => method.id === openId) ?? null,
    [openId, methodsList]
  );

  const selectedDeleteMethod = useMemo(
    () => methodsList.find((method) => method.id === deleteMethodId) ?? null,
    [deleteMethodId, methodsList]
  );

  const totalPaymentsCount = useMemo(
    () => methodsList.reduce((sum, method) => sum + method.payments, 0),
    [methodsList]
  );

  const uniqueCurrenciesCount = useMemo(
    () => new Set(methodsList.map((method) => method.currency).filter(Boolean)).size,
    [methodsList]
  );

  const topMethod = useMemo(
    () =>
      methodsList.reduce<PaymentMethod | null>((top, method) => {
        if (!top || method.payments > top.payments) {
          return method;
        }

        return top;
      }, null),
    [methodsList]
  );

  const hasActiveFilters = query.trim().length > 0 || typeFilter !== "all";

  const handleDeleteMethod = async (methodId: number) => {
    setDeleteError("");
    setIsDeleting(true);

    try {
      await deletePaymentMethod(methodId);
      setMethodsList((prev) => prev.filter((method) => method.id !== methodId));
      setDeleteMethodId(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error, "تعذر حذف وسيلة الدفع."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900">
      <TopNav currentLabel="وسائل الدفع" />

      <div
        className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6"
        dir="ltr"
      >
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <section className="rounded-[32px] border border-slate-200 bg-white px-5 py-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.3)] sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
                  وسائل الدفع
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  إدارة احترافية لطرق الدفع داخل النظام
                </h1>
                <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
                  نفس البيانات المتصلة حاليًا بالباكند، لكن بواجهة أوضح للمتابعة والبحث والتحكم.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <ViewModeToggle value={viewMode} onChange={setViewMode} />
                <Link
                  href="/projects-pages/payment-methods/new"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <PackagePlus className="h-4 w-4" />
                  وسيلة دفع جديدة
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400">
                  إجمالي الوسائل
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {methodsList.length}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  عدد الطرق المحفوظة في النظام حاليًا.
                </p>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400">
                  إجمالي الدفعات
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {totalPaymentsCount}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  مجموع العمليات المسجلة على كل الوسائل.
                </p>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400">
                  العملات المستخدمة
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {uniqueCurrenciesCount}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  عدد العملات الظاهرة في الوسائل الحالية.
                </p>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400">
                  الأكثر استخدامًا
                </p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
                  {topMethod?.name || "-"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {topMethod ? `${topMethod.payments} دفعة` : "لا توجد بيانات كافية بعد."}
                </p>
              </div>
            </div>
          </section>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {deleteError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {deleteError}
            </div>
          ) : null}

          <PaymentMethodFilters
            query={query}
            typeFilter={typeFilter}
            hasActiveFilters={hasActiveFilters}
            onQueryChange={setQuery}
            onTypeFilterChange={setTypeFilter}
            onReset={() => {
              setQuery("");
              setTypeFilter("all");
            }}
          />

          <PaymentMethodsTable
            methods={filteredMethods}
            isLoading={isLoading}
            viewMode={viewMode}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={() => {
              setQuery("");
              setTypeFilter("all");
            }}
            onOpenActions={setOpenId}
          />
        </main>

        <Sidebar activeLabel="وسائل الدفع" />
      </div>

      <PaymentMethodActions
        method={selectedMethod}
        onClose={() => setOpenId(null)}
        onDelete={(methodId) => setDeleteMethodId(methodId)}
      />

      <ConfirmDeleteModal
        open={deleteMethodId !== null}
        title="تأكيد حذف وسيلة الدفع"
        message={
          selectedDeleteMethod
            ? `هل تريد حذف الوسيلة "${selectedDeleteMethod.name}"؟`
            : "هل تريد حذف وسيلة الدفع؟"
        }
        isProcessing={isDeleting}
        onClose={() => {
          if (isDeleting) return;
          setDeleteMethodId(null);
        }}
        onConfirm={() => {
          if (deleteMethodId === null || isDeleting) return;
          void handleDeleteMethod(deleteMethodId);
        }}
      />
    </div>
  );
}
