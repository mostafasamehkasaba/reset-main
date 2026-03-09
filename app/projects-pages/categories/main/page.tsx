"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";
import { getErrorMessage } from "../../../lib/fetcher";
import {
  createMainCategory,
  deleteMainCategory,
  listCategories,
  updateMainCategory,
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

const emptyCategoryForm = {
  name: "",
  code: "",
  status: "نشط" as CategoryStatus,
};

const getStatusLabel = (value: string) => statusLabelMap[value] ?? value;
const isActiveStatus = (value: string) => getStatusLabel(value) === "نشط";

export default function MainCategoriesPage() {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
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
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listCategories();
        if (!active) return;
        setCategories(data.mainCategories);
        setSubCategories(data.subCategories);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getErrorMessage(error, "تعذر تحميل التصنيفات الأساسية."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;

    return categories.filter((item) =>
      [item.name, item.code, item.status, getStatusLabel(item.status)]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [categories, query]);

  const totalProducts = useMemo(
    () => categories.reduce((sum, category) => sum + category.products, 0),
    [categories]
  );

  const activeCount = useMemo(
    () => categories.filter((category) => isActiveStatus(category.status)).length,
    [categories]
  );

  const subCountByMain = useMemo(
    () =>
      subCategories.reduce<Record<number, number>>((acc, category) => {
        acc[category.mainCategoryId] = (acc[category.mainCategoryId] ?? 0) + 1;
        return acc;
      }, {}),
    [subCategories]
  );

  const selectedActionCategory = useMemo(
    () => categories.find((category) => category.id === openCategoryId) ?? null,
    [categories, openCategoryId]
  );

  const selectedViewCategory = useMemo(
    () => categories.find((category) => category.id === viewCategoryId) ?? null,
    [categories, viewCategoryId]
  );

  const selectedDeleteCategory = useMemo(
    () => categories.find((category) => category.id === deleteCategoryId) ?? null,
    [categories, deleteCategoryId]
  );

  const resetCategoryForm = () => {
    setCategoryForm(emptyCategoryForm);
    setEditingCategoryId(null);
  };

  const openAddModal = () => {
    setSaveError("");
    resetCategoryForm();
    setShowFormModal(true);
  };

  const openEditModal = (category: MainCategory) => {
    setSaveError("");
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      code: category.code,
      status: isActiveStatus(category.status) ? "نشط" : "معلّق",
    });
    setOpenCategoryId(null);
    setViewCategoryId(null);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (isSaving) return;
    setShowFormModal(false);
    resetCategoryForm();
  };

  const handleSaveCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryForm.name.trim()) return;

    setSaveError("");
    setIsSaving(true);

    const nextCode = categoryForm.code.trim()
      ? categoryForm.code.trim().toUpperCase()
      : `CAT${String(categories.length + 1).padStart(2, "0")}`;

    try {
      if (editingCategoryId !== null) {
        const updatedCategory = await updateMainCategory(editingCategoryId, {
          name: categoryForm.name.trim(),
          code: nextCode,
          status: categoryForm.status,
        });

        setCategories((prev) =>
          prev.map((category) =>
            category.id === editingCategoryId ? updatedCategory : category
          )
        );
      } else {
        const createdCategory = await createMainCategory({
          name: categoryForm.name.trim(),
          code: nextCode,
          status: categoryForm.status,
        });

        setCategories((prev) => [createdCategory, ...prev]);
      }

      closeFormModal();
    } catch (error) {
      setSaveError(getErrorMessage(error, "تعذر حفظ التصنيف."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    setDeleteError("");
    setIsDeleting(true);

    try {
      await deleteMainCategory(categoryId);
      setCategories((prev) => prev.filter((category) => category.id !== categoryId));
      setSubCategories((prev) =>
        prev.filter((category) => category.mainCategoryId !== categoryId)
      );
      setDeleteCategoryId(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error, "تعذر حذف التصنيف الأساسي."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="التصنيفات الأساسية" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">إجمالي التصنيفات الأساسية</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{categories.length}</p>
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
                  href="/projects-pages/categories/sub"
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  الذهاب للفرعية
                </Link>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
                >
                  تصنيف أساسي جديد
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
                التصنيفات الأساسية
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-separate border-spacing-0 text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 text-center sm:px-3 sm:py-3">#</th>
                    <th className="px-2 py-2 text-right sm:px-3 sm:py-3">اسم التصنيف</th>
                    <th className="px-2 py-2 text-center sm:px-3 sm:py-3">الكود</th>
                    <th className="px-2 py-2 text-center sm:px-3 sm:py-3">عدد الفرعية</th>
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
                      <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                        جاري تحميل التصنيفات...
                      </td>
                    </tr>
                  ) : filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                        لا توجد تصنيفات أساسية حاليا.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((category, index) => (
                      <tr key={category.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-2 py-2 text-center text-slate-700 sm:px-3 sm:py-3">
                          {category.id}
                        </td>
                        <td className="px-2 py-2 text-right font-semibold text-slate-800 sm:px-3 sm:py-3">
                          {category.name}
                        </td>
                        <td className="px-2 py-2 text-center text-slate-600 sm:px-3 sm:py-3">
                          {category.code}
                        </td>
                        <td className="px-2 py-2 text-center text-slate-700 sm:px-3 sm:py-3">
                          {subCountByMain[category.id] ?? 0}
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

        <Sidebar activeLabel="التصنيفات الأساسية" />
      </div>

      {selectedActionCategory ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">خيارات التصنيف الأساسي</p>
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
                <span className="text-slate-600">الكود</span>
                <span className="font-semibold text-slate-700">{selectedActionCategory.code}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-slate-600">الفرعية</span>
                <span className="font-semibold text-slate-700">
                  {subCountByMain[selectedActionCategory.id] ?? 0}
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
                <p className="text-sm font-semibold text-slate-700">بيانات التصنيف الأساسي</p>
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
                <span className="text-slate-600">الكود</span>
                <span className="font-semibold text-slate-700">{selectedViewCategory.code}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-slate-600">عدد الفرعية</span>
                <span className="font-semibold text-slate-700">
                  {subCountByMain[selectedViewCategory.id] ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-slate-600">المنتجات</span>
                <span className="font-semibold text-slate-700">{selectedViewCategory.products}</span>
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
                  {editingCategoryId !== null ? "تعديل تصنيف أساسي" : "إضافة تصنيف أساسي"}
                </h2>
                <p className="text-sm text-slate-500">
                  {editingCategoryId !== null
                    ? "حدّث بيانات التصنيف ثم احفظ التعديلات."
                    : "أدخل البيانات وسيتم إضافته مباشرة."}
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

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm text-slate-600">
                  الاسم *
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={categoryForm.name}
                    onChange={(event) =>
                      setCategoryForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    required
                  />
                </label>

                <label className="text-sm text-slate-600">
                  الكود
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={categoryForm.code}
                    onChange={(event) =>
                      setCategoryForm((prev) => ({ ...prev, code: event.target.value }))
                    }
                  />
                </label>

                <label className="text-sm text-slate-600 md:col-span-2">
                  الحالة
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={categoryForm.status}
                    onChange={(event) =>
                      setCategoryForm((prev) => ({
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
        title="تأكيد حذف التصنيف الأساسي"
        message={
          selectedDeleteCategory
            ? `سيتم حذف "${selectedDeleteCategory.name}" وأي تصنيفات فرعية مرتبطة به. هل تريد المتابعة؟`
            : "هل تريد حذف هذا التصنيف الأساسي؟"
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
