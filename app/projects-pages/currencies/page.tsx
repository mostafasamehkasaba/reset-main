"use client";

import Link from "next/link";
import {
  Copy,
  MoreHorizontal,
  PencilLine,
  Search,
  Trash2,
  Coins,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ActionDrawer from "@/components/ActionDrawer";
import ConfirmDeleteModal from "@/app/components/ConfirmDeleteModal";
import Sidebar from "@/app/components/Sidebar";
import TopNav from "@/app/components/TopNav";
import { getErrorMessage } from "@/app/lib/fetcher";
import { deleteCurrency, listCurrencies } from "@/app/services/currencies";
import type { Currency } from "@/app/types";

export default function CurrenciesPage() {
  const [query, setQuery] = useState("");
  const [currenciesList, setCurrenciesList] = useState<Currency[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [deleteCurrencyId, setDeleteCurrencyId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listCurrencies();
        if (!active) return;
        setCurrenciesList(data);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getErrorMessage(error, "تعذر تحميل العملات."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredCurrencies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return currenciesList;

    return currenciesList.filter((currency) =>
      [currency.name, currency.code, currency.symbol]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [currenciesList, query]);

  const selectedCurrency = useMemo(
    () => currenciesList.find((c) => c.id === openId) ?? null,
    [currenciesList, openId]
  );

  const selectedDeleteCurrency = useMemo(
    () => currenciesList.find((c) => c.id === deleteCurrencyId) ?? null,
    [currenciesList, deleteCurrencyId]
  );

  const handleDeleteCurrency = async (currency: Currency) => {
    setDeleteError("");
    setIsDeleting(true);

    try {
      await deleteCurrency(currency);
      setCurrenciesList((prev) => prev.filter((c) => c.id !== currency.id));
      setDeleteCurrencyId(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error, "تعذر حذف العملة."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="الإعدادات" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
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

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
                  إدارة العملات
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">قائمة العملات</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {isLoading
                    ? "يتم تحميل العملات الآن..."
                    : `يعرض ${filteredCurrencies.length} من أصل ${currenciesList.length} عملة.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/projects-pages/currencies/new"
                  className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  إضافة عملة
                </Link>
              </div>
            </div>

            <div className="mt-5">
              <label className="relative block">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
                  placeholder="ابحث باسم العملة أو الكود"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">العملات</h3>
                <p className="mt-1 text-sm text-slate-500">
                  عرض جميع العملات المسجلة في النظام.
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                {filteredCurrencies.length} نتيجة
              </div>
            </div>

            {isLoading ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-right">
                  <thead className="bg-slate-50/90 text-sm text-slate-500">
                    <tr>
                      <th className="px-4 py-4 font-medium">#</th>
                      <th className="px-4 py-4 font-medium">اسم العملة</th>
                      <th className="px-4 py-4 font-medium">الرمز</th>
                      <th className="px-4 py-4 font-medium">الكود</th>
                      <th className="px-4 py-4 font-medium">الافتراضية</th>
                      <th className="px-4 py-4 text-center font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index} className="border-t border-slate-100">
                        {Array.from({ length: 6 }).map((__, cell) => (
                          <td key={cell} className="px-4 py-4">
                            <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : filteredCurrencies.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                  <Coins className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-950">
                  لا توجد نتائج
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  جرّب تعديل البحث الحالي أو أضف عملة جديدة.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-right">
                  <thead className="bg-slate-50/90 text-sm text-slate-500">
                    <tr>
                      <th className="px-4 py-4 font-medium">#</th>
                      <th className="px-4 py-4 font-medium">اسم العملة</th>
                      <th className="px-4 py-4 font-medium">الرمز</th>
                      <th className="px-4 py-4 font-medium">الكود</th>
                      <th className="px-4 py-4 font-medium">الافتراضية</th>
                      <th className="px-4 py-4 text-center font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCurrencies.map((currency) => (
                      <tr
                        key={currency.id}
                        className="border-t border-slate-100 transition hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-4 text-sm font-medium text-slate-700">
                          #{currency.id}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-semibold text-slate-950">
                            {currency.name}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {currency.symbol}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {currency.code}
                        </td>
                        <td className="px-4 py-4">
                          {currency.isDefault && (
                            <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 shadow-[0_0_0_1px_rgba(56,189,248,0.1)]">
                              افتراضية
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => setOpenId(currency.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
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
        </main>

        <Sidebar activeLabel="الإعدادات" />
      </div>

      <ActionDrawer
        open={selectedCurrency !== null}
        title="إجراءات العملة"
        subtitle={selectedCurrency?.name}
        onClose={() => setOpenId(null)}
        actions={
          selectedCurrency
            ? [
                {
                  id: "edit",
                  label: "تعديل",
                  description: "تحديث بيانات العملة.",
                  icon: PencilLine,
                  href: `/projects-pages/currencies/new?id=${selectedCurrency.id}`,
                },
                {
                  id: "delete",
                  label: "حذف",
                  description: "إزالة العملة نهائيًا.",
                  icon: Trash2,
                  tone: "danger",
                  onClick: () => {
                    setDeleteCurrencyId(selectedCurrency.id);
                    setOpenId(null);
                  },
                },
              ]
            : []
        }
      />

      <ConfirmDeleteModal
        open={deleteCurrencyId !== null}
        title="حذف العملة"
        message={`هل أنت متأكد من حذف العملة "${selectedDeleteCurrency?.name}"؟`}
        isProcessing={isDeleting}
        onClose={() => setDeleteCurrencyId(null)}
        onConfirm={() => selectedDeleteCurrency && handleDeleteCurrency(selectedDeleteCurrency)}
      />
    </div>
  );
}
