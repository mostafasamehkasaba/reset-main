"use client";

import Link from "next/link";
import {
  Copy,
  Eye,
  MoreHorizontal,
  PencilLine,
  Search,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ActionDrawer from "@/components/ActionDrawer";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";
import { getErrorMessage } from "../../lib/fetcher";
import { deleteDelegate, listDelegates } from "@/app/services/delegates";
import type { Delegate } from "@/app/types";

const getSafeText = (value: string, fallback = "-") => {
  const normalized = value ? value.trim() : "";
  return normalized && normalized !== "-" ? normalized : fallback;
};

export default function DelegatesPage() {
  const [query, setQuery] = useState("");
  const [delegatesList, setDelegatesList] = useState<Delegate[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [deleteDelegateId, setDeleteDelegateId] = useState<number | null>(null);
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
        const data = await listDelegates();
        if (!active) return;
        setDelegatesList(data);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getErrorMessage(error, "تعذر تحميل المندوبين."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredDelegates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return delegatesList;

    return delegatesList.filter((delegate) =>
      [
        delegate.name,
        delegate.phone,
        delegate.email,
        delegate.region,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [delegatesList, query]);

  const selectedDelegate = useMemo(
    () => delegatesList.find((delegate) => delegate.id === openId) ?? null,
    [delegatesList, openId]
  );

  const selectedDeleteDelegate = useMemo(
    () => delegatesList.find((delegate) => delegate.id === deleteDelegateId) ?? null,
    [delegatesList, deleteDelegateId]
  );

  const handleDeleteDelegate = async (delegate: Delegate) => {
    setDeleteError("");
    setIsDeleting(true);

    try {
      await deleteDelegate(delegate);
      setDelegatesList((prev) => prev.filter((d) => d.id !== delegate.id));
      setDeleteDelegateId(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error, "تعذر حذف المندوب."));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyDelegate = async (delegate: Delegate) => {
    const details = [
      `الاسم: ${delegate.name}`,
      `الهاتف: ${getSafeText(delegate.phone)}`,
      `البريد: ${getSafeText(delegate.email)}`,
      `المنطقة: ${getSafeText(delegate.region)}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(details);
      setOpenId(null);
    } catch {
      window.alert(details);
      setOpenId(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="المندوبين" />

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
                  إدارة المندوبين
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">قائمة المندوبين</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {isLoading
                    ? "يتم تحميل المندوبين الآن..."
                    : `يعرض ${filteredDelegates.length} من أصل ${delegatesList.length} مندوب.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/projects-pages/delegates/new"
                  className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  إضافة مندوب
                </Link>
              </div>
            </div>

            <div className="mt-5">
              <label className="relative block">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
                  placeholder="ابحث بالاسم أو الهاتف أو المنطقة"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">المندوبين</h3>
                <p className="mt-1 text-sm text-slate-500">
                  عرض جميع المندوبين المسجلين في النظام.
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                {filteredDelegates.length} نتيجة
              </div>
            </div>

            {isLoading ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-right">
                  <thead className="bg-slate-50/90 text-sm text-slate-500">
                    <tr>
                      <th className="px-4 py-4 font-medium">#</th>
                      <th className="px-4 py-4 font-medium">الاسم</th>
                      <th className="px-4 py-4 font-medium">الهاتف</th>
                      <th className="px-4 py-4 font-medium">المنطقة</th>
                      <th className="px-4 py-4 font-medium">الحالة</th>
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
            ) : filteredDelegates.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                  <UsersRound className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-950">
                  لا توجد نتائج
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  جرّب تعديل البحث الحالي أو أضف مندوبًا جديدًا.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    مسح البحث
                  </button>
                  <Link
                    href="/projects-pages/delegates/new"
                    className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    إضافة مندوب
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-right">
                  <thead className="bg-slate-50/90 text-sm text-slate-500">
                    <tr>
                      <th className="px-4 py-4 font-medium">#</th>
                      <th className="px-4 py-4 font-medium">الاسم</th>
                      <th className="px-4 py-4 font-medium">الهاتف</th>
                      <th className="px-4 py-4 font-medium">المنطقة</th>
                      <th className="px-4 py-4 font-medium">الحالة</th>
                      <th className="px-4 py-4 text-center font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDelegates.map((delegate) => (
                      <tr
                        key={delegate.id}
                        className="border-t border-slate-100 transition hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-4 text-sm font-medium text-slate-700">
                          #{delegate.id}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-semibold text-slate-950">
                            {delegate.name}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {getSafeText(delegate.phone)}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {getSafeText(delegate.region)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              delegate.status === "نشط"
                                ? "bg-emerald-50 text-emerald-700 shadow-[0_0_0_1px_rgba(16,185,129,0.1)]"
                                : "bg-rose-50 text-rose-700 shadow-[0_0_0_1px_rgba(244,63,94,0.1)]"
                            }`}
                          >
                            {delegate.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => setOpenId(delegate.id)}
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

        <Sidebar activeLabel="المندوبين" />
      </div>

      <ActionDrawer
        open={selectedDelegate !== null}
        title="إجراءات المندوب"
        subtitle={selectedDelegate?.name}
        onClose={() => setOpenId(null)}
        actions={
          selectedDelegate
            ? [
                {
                  id: "edit",
                  label: "تعديل",
                  description: "تحديث بيانات المندوب.",
                  icon: PencilLine,
                  href: `/projects-pages/delegates/new?id=${selectedDelegate.id}`,
                },
                {
                  id: "copy",
                  label: "نسخ",
                  description: "نسخ معلومات المندوب.",
                  icon: Copy,
                  onClick: () => handleCopyDelegate(selectedDelegate),
                },
                {
                  id: "delete",
                  label: "حذف",
                  description: "إزالة المندوب نهائيًا.",
                  icon: Trash2,
                  tone: "danger",
                  onClick: () => {
                    setDeleteDelegateId(selectedDelegate.id);
                    setOpenId(null);
                  },
                },
              ]
            : []
        }
      />

      <ConfirmDeleteModal
        open={deleteDelegateId !== null}
        title="حذف المندوب"
        message={`هل أنت متأكد من حذف المندوب "${selectedDeleteDelegate?.name}"؟`}
        isProcessing={isDeleting}
        onClose={() => setDeleteDelegateId(null)}
        onConfirm={() => selectedDeleteDelegate && handleDeleteDelegate(selectedDeleteDelegate)}
      />
    </div>
  );
}
