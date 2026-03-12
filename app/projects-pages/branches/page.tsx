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
import { deleteBranch, listBranches } from "../../services/branches";
import type { Branch } from "../../types";

const getSafeText = (value: string, fallback = "-") => {
  const normalized = value.trim();
  return normalized && normalized !== "-" ? normalized : fallback;
};

export default function BranchesPage() {
  const [query, setQuery] = useState("");
  const [branchesList, setBranchesList] = useState<Branch[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [deleteBranchId, setDeleteBranchId] = useState<number | null>(null);
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
        const data = await listBranches();
        if (!active) return;
        setBranchesList(data);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getErrorMessage(error, "تعذر تحميل الفروع."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredBranches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return branchesList;

    return branchesList.filter((branch) =>
      [
        branch.name,
        branch.address,
        branch.phone,
        branch.manager,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [branchesList, query]);

  const selectedBranch = useMemo(
    () => branchesList.find((branch) => branch.id === openId) ?? null,
    [branchesList, openId]
  );

  const selectedDeleteBranch = useMemo(
    () => branchesList.find((branch) => branch.id === deleteBranchId) ?? null,
    [branchesList, deleteBranchId]
  );

  const handleDeleteBranch = async (branch: Branch) => {
    setDeleteError("");
    setIsDeleting(true);

    try {
      await deleteBranch(branch);
      setBranchesList((prev) => prev.filter((b) => b.id !== branch.id));
      setDeleteBranchId(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error, "تعذر حذف الفرع."));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyBranch = async (branch: Branch) => {
    const details = [
      `الاسم: ${branch.name}`,
      `العنوان: ${getSafeText(branch.address)}`,
      `الهاتف: ${getSafeText(branch.phone)}`,
      `المدير: ${getSafeText(branch.manager)}`,
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
      <TopNav currentLabel="الفروع" />

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
                  إدارة الفروع
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">قائمة الفروع</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {isLoading
                    ? "يتم تحميل الفروع الآن..."
                    : `يعرض ${filteredBranches.length} من أصل ${branchesList.length} فرع.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/branches/new"
                  className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  فرع جديد
                </Link>
              </div>
            </div>

            <div className="mt-5">
              <label className="relative block">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
                  placeholder="ابحث بالاسم أو العنوان أو الهاتف أو المدير"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">قائمة الفروع</h3>
                <p className="mt-1 text-sm text-slate-500">
                  عرض منظم لبيانات الفروع مع الوصول السريع إلى الإجراءات.
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                {filteredBranches.length} نتيجة
              </div>
            </div>

            {isLoading ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-right">
                  <thead className="bg-slate-50/90 text-sm text-slate-500">
                    <tr>
                      <th className="px-4 py-4 font-medium">#</th>
                      <th className="px-4 py-4 font-medium">الاسم</th>
                      <th className="px-4 py-4 font-medium">العنوان</th>
                      <th className="px-4 py-4 font-medium">الهاتف</th>
                      <th className="px-4 py-4 font-medium">المدير</th>
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
            ) : filteredBranches.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                  <UsersRound className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-950">
                  لا توجد فروع مطابقة
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  جرّب تعديل البحث الحالي أو أضف فرعًا جديدًا.
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
                    href="/branches/new"
                    className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    إضافة فرع
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
                      <th className="px-4 py-4 font-medium">العنوان</th>
                      <th className="px-4 py-4 font-medium">الهاتف</th>
                      <th className="px-4 py-4 font-medium">المدير</th>
                      <th className="px-4 py-4 text-center font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBranches.map((branch) => (
                      <tr
                        key={branch.id}
                        className="border-t border-slate-100 transition hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-4 text-sm font-medium text-slate-700">
                          #{branch.id}
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <Link
                              href={`/branches/${branch.id}`}
                              className="text-sm font-semibold text-slate-950 hover:text-sky-700"
                            >
                              {branch.name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {getSafeText(branch.address)}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {getSafeText(branch.phone)}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {getSafeText(branch.manager)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => setOpenId(branch.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                            aria-label={`إجراءات ${branch.name}`}
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

        <Sidebar activeLabel="الفروع" />
      </div>

      <ActionDrawer
        open={selectedBranch !== null}
        title="إجراءات الفرع"
        subtitle={selectedBranch?.name}
        onClose={() => setOpenId(null)}
        actions={
          selectedBranch
            ? [
                {
                  id: "view",
                  label: "عرض الفرع",
                  description: "افتح صفحة الفرع بكامل التفاصيل.",
                  icon: Eye,
                  href: `/branches/${selectedBranch.id}`,
                },
                {
                  id: "edit",
                  label: "تعديل الفرع",
                  description: "افتح نموذج تعديل بيانات الفرع الحالية.",
                  icon: PencilLine,
                  href: `/branches/new?id=${selectedBranch.id}`,
                },
                {
                  id: "copy",
                  label: "نسخ البيانات",
                  description: "انسخ معلومات الفرع الأساسية بسرعة.",
                  icon: Copy,
                  onClick: () => {
                    void handleCopyBranch(selectedBranch);
                  },
                },
                {
                  id: "delete",
                  label: "حذف الفرع",
                  description: "احذف الفرع نهائيًا بعد التأكيد.",
                  icon: Trash2,
                  tone: "danger" as const,
                  onClick: () => {
                    setDeleteBranchId(selectedBranch.id);
                    setOpenId(null);
                  },
                },
              ]
            : []
        }
      >
        {selectedBranch ? (
          <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">العنوان</span>
              <span className="font-medium text-slate-900">
                {getSafeText(selectedBranch.address, "لا يوجد")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">الهاتف</span>
              <span className="font-medium text-slate-900">
                {getSafeText(selectedBranch.phone, "لا يوجد")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">المدير</span>
              <span className="font-medium text-slate-900">
                {getSafeText(selectedBranch.manager, "لا يوجد")}
              </span>
            </div>
          </div>
        ) : null}
      </ActionDrawer>

      <ConfirmDeleteModal
        open={deleteBranchId !== null}
        title="تأكيد حذف الفرع"
        message={
          selectedDeleteBranch
            ? `هل تريد حذف الفرع "${selectedDeleteBranch.name}"؟`
            : "هل تريد حذف هذا الفرع؟"
        }
        isProcessing={isDeleting}
        onClose={() => {
          if (isDeleting) return;
          setDeleteBranchId(null);
        }}
        onConfirm={() => {
          if (!selectedDeleteBranch || isDeleting) return;
          void handleDeleteBranch(selectedDeleteBranch);
        }}
      />
    </div>
  );
}
