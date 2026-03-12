"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Eye,
  FolderTree,
  MoreHorizontal,
  PencilLine,
  Search,
  Trash2,
} from "lucide-react";
import ActionDrawer from "@/components/ActionDrawer";
import ViewModeToggle from "@/components/ViewModeToggle";
import { useCollectionViewMode } from "@/hooks/useCollectionViewMode";
import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";
import { getErrorMessage } from "../../../lib/fetcher";
import {
  createSubCategory,
  deleteSubCategory,
  listCategories,
  updateSubCategory,
} from "../../../services/categories";
import type { CategoryStatus, MainCategory, SubCategory } from "../../../types";

const statusLabelMap: Record<string, string> = {
  نشط: "نشط",
  "معلّق": "معلق",
  معلق: "معلق",
  active: "نشط",
  inactive: "معلق",
  disabled: "معلق",
  paused: "معلق",
};

const emptySubCategoryForm = {
  name: "",
  mainCategoryId: 0,
  status: "نشط" as CategoryStatus,
};

const getStatusLabel = (value: string) => statusLabelMap[value] ?? value;
const isActiveStatus = (value: string) => getStatusLabel(value) === "نشط";
const getStatusClasses = (value: string) =>
  isActiveStatus(value)
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";

export default function SubCategoriesPage() {
  const [query, setQuery] = useState("");
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [openCategoryId, setOpenCategoryId] = useState<number | null>(null);
  const [viewCategoryId, setViewCategoryId] = useState<number | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [subCategoryForm, setSubCategoryForm] = useState(emptySubCategoryForm);
  const { viewMode, setViewMode, isTableView } = useCollectionViewMode(
    "reset-main-view-mode-sub-categories"
  );

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listCategories();
        if (!active) return;
        setMainCategories(data.mainCategories);
        setSubCategories(data.subCategories);
        setSubCategoryForm((prev) => ({
          ...prev,
          mainCategoryId: prev.mainCategoryId || data.mainCategories[0]?.id || 0,
        }));
      } catch (error) {
        if (!active) return;
        setErrorMessage(
          getErrorMessage(error, "تعذر تحميل التصنيفات الفرعية.")
        );
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadData();
    return () => {
      active = false;
    };
  }, []);

  const mainById = useMemo(
    () => Object.fromEntries(mainCategories.map((item) => [item.id, item.name])),
    [mainCategories]
  );

  const filteredSubCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return subCategories;

    return subCategories.filter((item) =>
      [
        item.name,
        mainById[item.mainCategoryId] ?? "",
        item.status,
        getStatusLabel(item.status),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [mainById, query, subCategories]);

  const activeCount = useMemo(
    () => subCategories.filter((item) => isActiveStatus(item.status)).length,
    [subCategories]
  );

  const totalProducts = useMemo(
    () => subCategories.reduce((sum, item) => sum + item.products, 0),
    [subCategories]
  );

  const selectedActionCategory = useMemo(
    () => subCategories.find((category) => category.id === openCategoryId) ?? null,
    [openCategoryId, subCategories]
  );

  const selectedViewCategory = useMemo(
    () => subCategories.find((category) => category.id === viewCategoryId) ?? null,
    [subCategories, viewCategoryId]
  );

  const selectedDeleteCategory = useMemo(
    () => subCategories.find((category) => category.id === deleteCategoryId) ?? null,
    [deleteCategoryId, subCategories]
  );

  const resetSubCategoryForm = () => {
    setSubCategoryForm({
      ...emptySubCategoryForm,
      mainCategoryId: mainCategories[0]?.id || 0,
    });
    setEditingCategoryId(null);
  };

  const openAddModal = () => {
    setSaveError("");
    resetSubCategoryForm();
    setShowFormModal(true);
  };

  const openEditModal = (category: SubCategory) => {
    setSaveError("");
    setEditingCategoryId(category.id);
    setSubCategoryForm({
      name: category.name,
      mainCategoryId: category.mainCategoryId,
      status: isActiveStatus(category.status) ? "نشط" : "معلّق",
    });
    setOpenCategoryId(null);
    setViewCategoryId(null);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (isSaving) return;
    setShowFormModal(false);
    resetSubCategoryForm();
  };

  const handleSaveSubCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!subCategoryForm.name.trim() || !subCategoryForm.mainCategoryId) return;

    setSaveError("");
    setIsSaving(true);

    try {
      if (editingCategoryId !== null) {
        const updatedCategory = await updateSubCategory(editingCategoryId, {
          name: subCategoryForm.name.trim(),
          mainCategoryId: subCategoryForm.mainCategoryId,
          status: subCategoryForm.status,
        });

        setSubCategories((prev) =>
          prev.map((category) =>
            category.id === editingCategoryId ? updatedCategory : category
          )
        );
      } else {
        const createdCategory = await createSubCategory({
          name: subCategoryForm.name.trim(),
          mainCategoryId: subCategoryForm.mainCategoryId,
          status: subCategoryForm.status,
        });

        setSubCategories((prev) => [createdCategory, ...prev]);
      }

      closeFormModal();
    } catch (error) {
      setSaveError(getErrorMessage(error, "تعذر حفظ التصنيف الفرعي."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    setDeleteError("");
    setIsDeleting(true);

    try {
      await deleteSubCategory(categoryId);
      setSubCategories((prev) => prev.filter((category) => category.id !== categoryId));
      setDeleteCategoryId(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error, "تعذر حذف التصنيف الفرعي."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="التصنيفات الفرعية" />

      <div
        className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6"
        dir="ltr"
      >
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">إجمالي التصنيفات الفرعية</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {subCategories.length}
              </p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">النشط</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {activeCount}
              </p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">إجمالي المنتجات</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {totalProducts}
              </p>
            </article>
          </section>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {saveError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {saveError}
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
                  إدارة التصنيفات
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">
                  التصنيفات الفرعية
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {isLoading
                    ? "يتم تحميل التصنيفات الآن..."
                    : `يعرض ${filteredSubCategories.length} من أصل ${subCategories.length} تصنيف.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <ViewModeToggle value={viewMode} onChange={setViewMode} />
                <Link
                  href="/projects-pages/categories/main"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  التصنيفات الأساسية
                </Link>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  تصنيف فرعي جديد
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
                  placeholder="ابحث بالاسم أو التصنيف الأساسي أو الحالة"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>

              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                {isTableView ? "عرض جدولي" : "عرض بالكروت"}
              </div>
            </div>
          </section>

          {isTableView ? (
            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    قائمة التصنيفات الفرعية
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    عرض واضح للتصنيفات الفرعية مع إجراءات موحدة.
                  </p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                  {filteredSubCategories.length} نتيجة
                </div>
              </div>

              {isLoading ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-right">
                    <thead className="bg-slate-50/90 text-sm text-slate-500">
                      <tr>
                        <th className="px-4 py-4 font-medium">#</th>
                        <th className="px-4 py-4 font-medium">اسم التصنيف</th>
                        <th className="px-4 py-4 font-medium">التصنيف الأساسي</th>
                        <th className="px-4 py-4 font-medium">المنتجات</th>
                        <th className="px-4 py-4 font-medium">الحالة</th>
                        <th className="px-4 py-4 text-center font-medium">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 6 }).map((_, index) => (
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
              ) : filteredSubCategories.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                    <FolderTree className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950">
                    لا توجد تصنيفات فرعية مطابقة
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    جرّب تعديل البحث الحالي أو أضف تصنيفًا فرعيًا جديدًا.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      مسح البحث
                    </button>
                    <button
                      type="button"
                      onClick={openAddModal}
                      className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      إضافة تصنيف
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-right">
                    <thead className="bg-slate-50/90 text-sm text-slate-500">
                      <tr>
                        <th className="px-4 py-4 font-medium">#</th>
                        <th className="px-4 py-4 font-medium">اسم التصنيف</th>
                        <th className="px-4 py-4 font-medium">التصنيف الأساسي</th>
                        <th className="px-4 py-4 font-medium">المنتجات</th>
                        <th className="px-4 py-4 font-medium">الحالة</th>
                        <th className="px-4 py-4 text-center font-medium">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubCategories.map((category) => (
                        <tr
                          key={category.id}
                          className="border-t border-slate-100 transition hover:bg-slate-50/80"
                        >
                          <td className="px-4 py-4 text-sm font-medium text-slate-700">
                            #{category.id}
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-semibold text-slate-950">
                              {category.name}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">
                            {mainById[category.mainCategoryId] ?? "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">
                            {category.products}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
                                  category.status
                                )}`}
                              >
                                {getStatusLabel(category.status)}
                              </span>
                              {category.isLocal && (
                                <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-bold text-indigo-700">
                                  بانتظار المزامنة
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => setOpenCategoryId(category.id)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                              aria-label={`إجراءات ${category.name}`}
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
          ) : isLoading ? (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="h-24 animate-pulse rounded-[22px] bg-slate-100" />
                  <div className="mt-4 h-28 animate-pulse rounded-[22px] bg-slate-100" />
                </div>
              ))}
            </section>
          ) : filteredSubCategories.length === 0 ? (
            <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                <Boxes className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-950">
                لا توجد بطاقات لعرضها الآن
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                لا توجد نتائج مطابقة للبحث الحالي.
              </p>
            </section>
          ) : (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredSubCategories.map((category) => (
                <article
                  key={category.id}
                  className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-slate-950">
                        {category.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {mainById[category.mainCategoryId] ?? "-"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenCategoryId(category.id)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                      aria-label={`إجراءات ${category.name}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
                        category.status
                      )}`}
                    >
                      {getStatusLabel(category.status)}
                    </span>
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      #{category.id}
                    </span>
                    {category.isLocal && (
                      <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-bold text-indigo-700">
                        بانتظار المزامنة
                      </span>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                      <p className="text-xs text-slate-400">التصنيف الأساسي</p>
                      <p className="mt-1 truncate text-sm font-medium text-slate-900">
                        {mainById[category.mainCategoryId] ?? "-"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                      <p className="text-xs text-slate-400">المنتجات</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {category.products}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </main>

        <Sidebar activeLabel="التصنيفات الفرعية" />
      </div>

      <ActionDrawer
        open={selectedActionCategory !== null}
        title="إجراءات التصنيف الفرعي"
        subtitle={selectedActionCategory?.name}
        onClose={() => setOpenCategoryId(null)}
        actions={
          selectedActionCategory
            ? [
                {
                  id: "view",
                  label: "عرض البيانات",
                  description: "افتح تفاصيل التصنيف الفرعي داخل النافذة الحالية.",
                  icon: Eye,
                  onClick: () => {
                    setViewCategoryId(selectedActionCategory.id);
                    setOpenCategoryId(null);
                  },
                },
                {
                  id: "edit",
                  label: "تعديل التصنيف",
                  description: "افتح نموذج التعديل بنفس منطق الحفظ الحالي.",
                  icon: PencilLine,
                  onClick: () => openEditModal(selectedActionCategory),
                },
                {
                  id: "delete",
                  label: "حذف التصنيف",
                  description: "احذف التصنيف بعد رسالة التأكيد.",
                  icon: Trash2,
                  tone: "danger" as const,
                  onClick: () => {
                    setDeleteCategoryId(selectedActionCategory.id);
                    setOpenCategoryId(null);
                  },
                },
              ]
            : []
        }
      >
        {selectedActionCategory ? (
          <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">التصنيف الأساسي</span>
              <span className="font-medium text-slate-900">
                {mainById[selectedActionCategory.mainCategoryId] ?? "-"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">المنتجات</span>
              <span className="font-medium text-slate-900">
                {selectedActionCategory.products}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">الحالة</span>
              <span className="font-medium text-slate-900">
                {getStatusLabel(selectedActionCategory.status)}
              </span>
            </div>
          </div>
        ) : null}
      </ActionDrawer>

      {selectedViewCategory ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-4 shadow-xl" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">
                  بيانات التصنيف الفرعي
                </p>
                <p className="text-xs text-slate-500">{selectedViewCategory.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewCategoryId(null)}
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>

            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-slate-600">الاسم</span>
                <span className="font-semibold text-slate-700">
                  {selectedViewCategory.name}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-slate-600">التصنيف الأساسي</span>
                <span className="font-semibold text-slate-700">
                  {mainById[selectedViewCategory.mainCategoryId] ?? "-"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-slate-600">المنتجات</span>
                <span className="font-semibold text-slate-700">
                  {selectedViewCategory.products}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-slate-600">الحالة</span>
                <span className="font-semibold text-slate-700">
                  {getStatusLabel(selectedViewCategory.status)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showFormModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {editingCategoryId !== null
                    ? "تعديل تصنيف فرعي"
                    : "إضافة تصنيف فرعي"}
                </h2>
                <p className="text-sm text-slate-500">
                  {editingCategoryId !== null
                    ? "حدّث البيانات ثم احفظ التعديلات."
                    : "حدد التصنيف الأساسي ثم احفظ."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeFormModal}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveSubCategory} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm text-slate-600">
                  الاسم *
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={subCategoryForm.name}
                    onChange={(event) =>
                      setSubCategoryForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    required
                  />
                </label>

                <label className="text-sm text-slate-600">
                  التصنيف الأساسي
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={subCategoryForm.mainCategoryId}
                    onChange={(event) =>
                      setSubCategoryForm((prev) => ({
                        ...prev,
                        mainCategoryId: Number(event.target.value),
                      }))
                    }
                  >
                    {mainCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-slate-600 md:col-span-2">
                  الحالة
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={subCategoryForm.status}
                    onChange={(event) =>
                      setSubCategoryForm((prev) => ({
                        ...prev,
                        status: event.target.value as CategoryStatus,
                      }))
                    }
                  >
                    <option value="نشط">نشط</option>
                    <option value="معلّق">معلق</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-brand-900 px-4 py-2 text-sm text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving
                    ? editingCategoryId !== null
                      ? "جارٍ حفظ التعديلات..."
                      : "جارٍ الحفظ..."
                    : editingCategoryId !== null
                      ? "حفظ التعديلات"
                      : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDeleteModal
        open={deleteCategoryId !== null}
        title="تأكيد حذف التصنيف الفرعي"
        message={
          selectedDeleteCategory
            ? `هل تريد حذف التصنيف الفرعي "${selectedDeleteCategory.name}"؟`
            : "هل تريد حذف هذا التصنيف الفرعي؟"
        }
        isProcessing={isDeleting}
        onClose={() => {
          if (isDeleting) return;
          setDeleteCategoryId(null);
        }}
        onConfirm={() => {
          if (deleteCategoryId === null || isDeleting) return;
          void handleDeleteCategory(deleteCategoryId);
        }}
      />
    </div>
  );
}
