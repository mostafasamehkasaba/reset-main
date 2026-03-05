"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";
import type { CategoryStatus, MainCategory, SubCategory } from "../../../types";

const mainCategories: MainCategory[] = [
  { id: 1, name: "الإلكترونيات", code: "ELEC", status: "نشط", products: 56 },
  { id: 2, name: "مستلزمات مكتبية", code: "OFFC", status: "نشط", products: 33 },
  { id: 3, name: "برمجيات", code: "SOFT", status: "معلّق", products: 14 },
];

const initialSubCategories: SubCategory[] = [
  { id: 1, name: "هواتف", mainCategoryId: 1, status: "نشط", products: 19 },
  { id: 2, name: "لابتوب", mainCategoryId: 1, status: "نشط", products: 12 },
  { id: 3, name: "طابعات", mainCategoryId: 2, status: "نشط", products: 9 },
  { id: 4, name: "أوراق", mainCategoryId: 2, status: "معلّق", products: 7 },
  { id: 5, name: "أنظمة محاسبية", mainCategoryId: 3, status: "نشط", products: 6 },
];

export default function SubCategoriesPage() {
  const [query, setQuery] = useState("");
  const [subCategories, setSubCategories] = useState<SubCategory[]>(initialSubCategories);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubCategory, setNewSubCategory] = useState({
    name: "",
    mainCategoryId: mainCategories[0]?.id ?? 0,
    status: "نشط" as CategoryStatus,
  });

  const mainById = useMemo(
    () => Object.fromEntries(mainCategories.map((item) => [item.id, item.name])),
    []
  );

  const filteredSubCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subCategories;
    return subCategories.filter((item) =>
      [item.name, mainById[item.mainCategoryId] ?? "", item.status]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [mainById, query, subCategories]);

  const activeCount = useMemo(
    () => subCategories.filter((item) => item.status === "نشط").length,
    [subCategories]
  );

  const totalProducts = useMemo(
    () => subCategories.reduce((sum, item) => sum + item.products, 0),
    [subCategories]
  );

  const handleAddSubCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newSubCategory.name.trim() || !newSubCategory.mainCategoryId) return;

    const category: SubCategory = {
      id: subCategories.length ? Math.max(...subCategories.map((item) => item.id)) + 1 : 1,
      name: newSubCategory.name.trim(),
      mainCategoryId: newSubCategory.mainCategoryId,
      status: newSubCategory.status,
      products: 0,
    };

    setSubCategories((prev) => [category, ...prev]);
    setNewSubCategory({
      name: "",
      mainCategoryId: mainCategories[0]?.id ?? 0,
      status: "نشط",
    });
    setShowAddModal(false);
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
                  onClick={() => setShowAddModal(true)}
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
              <h2 className="text-right text-lg font-semibold text-slate-700" dir="rtl">التصنيفات الفرعية</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-0 text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">#</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-right">اسم التصنيف</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">التصنيف الأساسي</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">المنتجات</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubCategories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                        لا يوجد نتائج مطابقة.
                      </td>
                    </tr>
                  ) : (
                    filteredSubCategories.map((category, index) => (
                      <tr key={category.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-700">{category.id}</td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-right font-semibold text-slate-800">{category.name}</td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-600">
                          {mainById[category.mainCategoryId] ?? "-"}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-700">{category.products}</td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              category.status === "نشط"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {category.status}
                          </span>
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">إضافة تصنيف فرعي</h2>
                <p className="text-sm text-slate-500">حدد التصنيف الأساسي ثم احفظ.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubCategory} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm text-slate-600">
                  الاسم *
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={newSubCategory.name}
                    onChange={(event) =>
                      setNewSubCategory((prev) => ({ ...prev, name: event.target.value }))
                    }
                    required
                  />
                </label>

                <label className="text-sm text-slate-600">
                  التصنيف الأساسي *
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={newSubCategory.mainCategoryId}
                    onChange={(event) =>
                      setNewSubCategory((prev) => ({
                        ...prev,
                        mainCategoryId: Number(event.target.value),
                      }))
                    }
                    required
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
                    value={newSubCategory.status}
                    onChange={(event) =>
                      setNewSubCategory((prev) => ({
                        ...prev,
                        status: event.target.value as CategoryStatus,
                      }))
                    }
                  >
                    <option value="نشط">نشط</option>
                    <option value="معلّق">معلّق</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-900 px-4 py-2 text-sm text-white hover:bg-brand-800"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
