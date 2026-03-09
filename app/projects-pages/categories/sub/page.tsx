"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
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
        setErrorMessage(getErrorMessage(error, "تعذر تحميل التصنيفات الفرعية."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const mainById = useMemo(
    () => Object.fromEntries(mainCategories.map((item) => [item.id, item.name])),
    [mainCategories]
  );

  const filteredSubCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subCategories;

    return subCategories.filter((item) =>
      [item.name, mainById[item.mainCategoryId] ?? "", item.status, getStatusLabel(item.status)]
        .join(" ")
        .toLowerCase()
        .includes(q)
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

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">إجمالي التصنيفات الفرعية</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{subCategories.length}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">النشط</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{activeCount}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">إجمالي المنتجات</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{totalProducts}</p>
            </article>
          </section>

          {errorMessage ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {saveError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {saveError}
            </div>
          ) : null}

          {deleteError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {deleteError}
            </div>
          ) : null}

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div
              className="grid grid-cols-1 gap-3 border-b border-slate-200 px-4 py-3 md:grid-cols-[1fr_auto_1fr] md:items-center"
              dir="ltr"
            >
              <div className="flex flex-wrap items-center justify-start gap-2">
                <Link
                  href="/projects-pages/categories/main"
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  الذهاب للأساسية
                </Link>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
                >
                  تصنيف فرعي جديد
                </button>
              </div>
              <div className="flex justify-center">
                <div className="app-search">
                  <input
                    className="app-search-input h-10 w-48 px-3 text-right text-sm outline-none"
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
              <h2 className="text-right text-lg font-semibold text-slate-700" dir="rtl">
                التصنيفات الفرعية
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-separate border-spacing-0 text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 text-center sm:px-3 sm:py-3">#</th>
                    <th className="px-2 py-2 text-right sm:px-3 sm:py-3">اسم التصنيف</th>
                    <th className="px-2 py-2 text-center sm:px-3 sm:py-3">التصنيف الأساسي</th>
                    <th className="px-2 py-2 text-center sm:px-3 sm:py-3">المنتجات</th>
                    <th className="px-2 py-2 text-center sm:px-3 sm:py-3">الحالة</th>
                    <th className="px-2 py-2 text-center sm:px-3 sm:py-3" aria-label="الإجراءات">
                      ...
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                        جاري تحميل التصنيفات الفرعية...
                      </td>
                    </tr>
                  ) : filteredSubCategories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                        لا توجد تصنيفات فرعية حاليا.
                      </td>
                    </tr>
                  ) : (
                    filteredSubCategories.map((category, index) => (
                      <tr key={category.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-2 py-2 text-center text-slate-700 sm:px-3 sm:py-3">
                          {category.id}
                        </td>
                        <td className="px-2 py-2 text-right font-semibold text-slate-800 sm:px-3 sm:py-3">
                          {category.name}
                        </td>
                        <td className="px-2 py-2 text-center text-slate-600 sm:px-3 sm:py-3">
                          {mainById[category.mainCategoryId] ?? "-"}
                        </td>
                        <td className="px-2 py-2 text-center text-slate-700 sm:px-3 sm:py-3">
                          {category.products}
                        </td>
                        <td className="px-2 py-2 text-center sm:px-3 sm:py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              isActiveStatus(category.status)
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {getStatusLabel(category.status)}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center text-slate-500 sm:px-3 sm:py-3">
                          <button
                            type="button"
                            onClick={() => setOpenCategoryId(category.id)}
                            className="rounded-full p-1 hover:bg-slate-200"
                            aria-label="خيارات"
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
          </section>
        </main>

        <Sidebar activeLabel="التصنيفات الفرعية" />
      </div>

      {selectedActionCategory ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">خيارات التصنيف الفرعي</p>
                <p className="text-xs text-slate-500">{selectedActionCategory.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenCategoryId(null)}
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-slate-600">التصنيف الأساسي</span>
                <span className="font-semibold text-slate-700">
                  {mainById[selectedActionCategory.mainCategoryId] ?? "-"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-slate-600">المنتجات</span>
                <span className="font-semibold text-slate-700">
                  {selectedActionCategory.products}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-slate-600">الحالة</span>
                <span className="font-semibold text-slate-700">
                  {getStatusLabel(selectedActionCategory.status)}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  setViewCategoryId(selectedActionCategory.id);
                  setOpenCategoryId(null);
                }}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50"
              >
                عرض
              </button>
              <button
                type="button"
                onClick={() => openEditModal(selectedActionCategory)}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50"
              >
                تعديل
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteCategoryId(selectedActionCategory.id);
                  setOpenCategoryId(null);
                }}
                className="col-span-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 hover:bg-rose-100"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedViewCategory ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-4 shadow-xl" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">بيانات التصنيف الفرعي</p>
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
                <span className="font-semibold text-slate-700">{selectedViewCategory.name}</span>
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
                  {editingCategoryId !== null ? "تعديل تصنيف فرعي" : "إضافة تصنيف فرعي"}
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
                x
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
