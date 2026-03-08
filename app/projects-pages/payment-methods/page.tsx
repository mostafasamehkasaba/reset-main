"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";
import { getErrorMessage } from "../../lib/fetcher";
import { deletePaymentMethod, listPaymentMethods, type PaymentMethod } from "../../services/payment-methods";

export default function PaymentMethodsPage() {
  const [query, setQuery] = useState("");
  const [methodsList, setMethodsList] = useState<PaymentMethod[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [deleteMethodId, setDeleteMethodId] = useState<number | null>(null);
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

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredMethods = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return methodsList;
    return methodsList.filter((method) =>
      [method.name, method.desc, method.currency, String(method.total), String(method.id)]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query, methodsList]);

  const selectedMethod = useMemo(
    () => methodsList.find((method) => method.id === openId) ?? null,
    [openId, methodsList]
  );
  const selectedDeleteMethod = useMemo(
    () => methodsList.find((method) => method.id === deleteMethodId) ?? null,
    [deleteMethodId, methodsList]
  );

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
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="وسائل الدفع" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm md:grid-cols-[1fr_auto_1fr] md:items-center"
            dir="ltr"
          >
            <div className="flex justify-start">
              <Link
                href="/projects-pages/payment-methods/new"
                className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
              >
                وسيلة دفع جديدة
              </Link>
            </div>
            <div className="flex justify-center">
              <div className="app-search">
                <input
                  className="app-search-input h-10 w-44 px-3 text-right text-sm outline-none"
                  placeholder="بحث"
                  dir="rtl"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="app-search-icon h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
              </div>
            </div>
            <div className="text-right text-lg font-semibold text-slate-700" dir="rtl">
              وسائل الدفع
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {deleteError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {deleteError}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-0 text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">#</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-right">الاسم</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">الدفعات</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">المجموع</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">الوصف</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center" aria-label="الإجراءات">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                        جارٍ تحميل وسائل الدفع...
                      </td>
                    </tr>
                  ) : filteredMethods.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                        لا توجد وسائل دفع من الـ API حاليًا.
                      </td>
                    </tr>
                  ) : (
                    filteredMethods.map((method, index) => (
                      <tr key={method.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-700">
                          {method.id}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-right font-semibold text-slate-800">
                          {method.name}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-700">
                          {method.payments}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center font-semibold text-emerald-700">
                          {method.currency} {method.total}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-600">
                          {method.desc}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-500">
                          <button
                            className="rounded-full p-1 hover:bg-slate-200"
                            aria-label="خيارات"
                            type="button"
                            onClick={() => setOpenId(method.id)}
                          >
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="currentColor"
                            >
                              <circle cx="12" cy="5" r="1.6" />
                              <circle cx="12" cy="12" r="1.6" />
                              <circle cx="12" cy="19" r="1.6" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <Sidebar activeLabel="وسائل الدفع" />
      </div>

      {selectedMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">إجراءات الوسيلة</p>
                <p className="text-xs text-slate-500">{selectedMethod.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <a
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-center text-slate-600 hover:bg-slate-50"
                href={`/projects-pages/payment-methods/view?id=${selectedMethod.id}`}
              >
                عرض
              </a>
              <a
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-center text-slate-600 hover:bg-slate-50"
                href="/projects-pages/payment-methods/new"
              >
                تعديل
              </a>
              <button
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50"
                type="button"
                onClick={() => alert("تم نسخ وسيلة الدفع (واجهة فقط)")}
              >
                نسخ
              </button>
              <button
                className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 hover:bg-rose-100"
                type="button"
                onClick={() => {
                  setDeleteMethodId(selectedMethod.id);
                  setOpenId(null);
                }}
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

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
