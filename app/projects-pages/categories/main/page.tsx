"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import Sidebar from "../../../components/Sidebar";
import SidebarToggle from "../../../components/SidebarToggle";
import type { CategoryStatus, MainCategory, SubCategory } from "../../../types";

const initialMainCategories: MainCategory[] = [
  { id: 1, name: "الإلكترونيات", code: "ELEC", status: "نشط", products: 56 },
  { id: 2, name: "مستلزمات مكتبية", code: "OFFC", status: "نشط", products: 33 },
  { id: 3, name: "برمجيات", code: "SOFT", status: "معلّق", products: 14 },
];

const seedSubCategories: SubCategory[] = [
  { id: 1, name: "هواتف", mainCategoryId: 1, status: "نشط", products: 19 },
  { id: 2, name: "لابتوب", mainCategoryId: 1, status: "نشط", products: 12 },
  { id: 3, name: "طابعات", mainCategoryId: 2, status: "نشط", products: 9 },
  { id: 4, name: "أوراق", mainCategoryId: 2, status: "معلّق", products: 7 },
  { id: 5, name: "أنظمة محاسبية", mainCategoryId: 3, status: "نشط", products: 6 },
];

export default function MainCategoriesPage() {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<MainCategory[]>(initialMainCategories);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    code: "",
    status: "نشط" as CategoryStatus,
  });

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((item) =>
      [item.name, item.code, item.status].join(" ").toLowerCase().includes(q)
    );
  }, [categories, query]);

  const totalProducts = useMemo(
    () => categories.reduce((sum, category) => sum + category.products, 0),
    [categories]
  );

  const activeCount = useMemo(
    () => categories.filter((category) => category.status === "نشط").length,
    [categories]
  );

  const subCountByMain = useMemo(
    () =>
      seedSubCategories.reduce<Record<number, number>>((acc, category) => {
        acc[category.mainCategoryId] = (acc[category.mainCategoryId] ?? 0) + 1;
        return acc;
      }, {}),
    []
  );

  const handleAddCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newCategory.name.trim()) return;

    const nextCode = newCategory.code.trim()
      ? newCategory.code.trim().toUpperCase()
      : `CAT${String(categories.length + 1).padStart(2, "0")}`;

    const category: MainCategory = {
      id: categories.length ? Math.max(...categories.map((item) => item.id)) + 1 : 1,
      name: newCategory.name.trim(),
      code: nextCode,
      status: newCategory.status,
      products: 0,
    };

    setCategories((prev) => [category, ...prev]);
    setNewCategory({ name: "", code: "", status: "نشط" });
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <header className="bg-brand-900 text-white shadow-sm" dir="ltr">
        <div className="flex h-14 w-full items-center justify-between px-6">
          <div className="flex items-center gap-3 text-slate-200">
            <SidebarToggle />
          </div>
          <div className="text-right text-base font-semibold">فاتورة+</div>
        </div>
      </header>

      <div className="flex w-full gap-5 px-6 py-6" dir="ltr">
        <main className="flex-1 space-y-4" dir="rtl">
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

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <h2 className="text-right text-lg font-semibold text-slate-700">التصنيفات الأساسية</h2>
              <div className="flex items-center gap-2">
                <Link
                  href="/projects-pages/categories/sub"
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  الذهاب للفرعية
                </Link>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="rounded-full bg-brand-900 px-4 py-2 text-sm text-white transition hover:bg-brand-800"
                >
                  إضافة تصنيف أساسي +
                </button>
                <div className="flex items-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                  <span className="grid h-10 w-10 place-items-center bg-emerald-500 text-white">🔍</span>
                  <input
                    className="h-10 w-48 px-3 text-sm outline-none"
                    placeholder="بحث"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-right text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-3 text-center">#</th>
                    <th className="px-3 py-3 text-right">اسم التصنيف</th>
                    <th className="px-3 py-3 text-center">الكود</th>
                    <th className="px-3 py-3 text-center">عدد الفرعية</th>
                    <th className="px-3 py-3 text-center">المنتجات</th>
                    <th className="px-3 py-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                        لا يوجد نتائج مطابقة.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((category, index) => (
                      <tr key={category.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-3 py-3 text-center text-slate-700">{category.id}</td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-800">{category.name}</td>
                        <td className="px-3 py-3 text-center text-slate-600">{category.code}</td>
                        <td className="px-3 py-3 text-center text-slate-700">
                          {subCountByMain[category.id] ?? 0}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-700">{category.products}</td>
                        <td className="px-3 py-3 text-center">
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

        <Sidebar activeLabel="التصنيفات الأساسية" />
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">إضافة تصنيف أساسي</h2>
                <p className="text-sm text-slate-500">أدخل البيانات وسيتم إضافته مباشرة.</p>
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

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm text-slate-600">
                  الاسم *
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={newCategory.name}
                    onChange={(event) =>
                      setNewCategory((prev) => ({ ...prev, name: event.target.value }))
                    }
                    required
                  />
                </label>

                <label className="text-sm text-slate-600">
                  الكود
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={newCategory.code}
                    onChange={(event) =>
                      setNewCategory((prev) => ({ ...prev, code: event.target.value }))
                    }
                  />
                </label>

                <label className="text-sm text-slate-600 md:col-span-2">
                  الحالة
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={newCategory.status}
                    onChange={(event) =>
                      setNewCategory((prev) => ({
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
