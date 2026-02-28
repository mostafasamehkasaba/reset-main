"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import SidebarToggle from "../../components/SidebarToggle";

const products = [
  { id: 1, name: "إضافة ووردبريس", sold: 0, desc: "لا يوجد", date: "24-08-2024" },
  { id: 2, name: "إعداد سيرفر", sold: 5, desc: "لا يوجد", date: "31-08-2024" },
  { id: 3, name: "برمجة أدوات", sold: 1, desc: "لا يوجد", date: "24-08-2024" },
  { id: 4, name: "تثبيت برمجيات", sold: 13, desc: "لا يوجد", date: "24-08-2024" },
  { id: 5, name: "تسجيل استضافة", sold: 2, desc: "لا يوجد", date: "31-08-2024" },
  { id: 6, name: "تسجيل دومين", sold: 1, desc: "لا يوجد", date: "31-08-2024" },
  { id: 7, name: "تصميم موقع", sold: 6, desc: "لا يوجد", date: "06-09-2024" },
  { id: 8, name: "تطوير تطبيق", sold: 3, desc: "لا يوجد", date: "24-08-2024" },
  { id: 9, name: "قالب ووردبريس", sold: 1, desc: "لا يوجد", date: "24-08-2024" },
  { id: 10, name: "متجر إلكتروني", sold: 1, desc: "لا يوجد", date: "29-08-2024" },
  { id: 11, name: "ووردبريس", sold: 14, desc: "لا يوجد", date: "24-08-2024" },
];

export default function ProductsPage() {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const filteredProducts = useMemo(() => {
    const q = query.trim();
    if (!q) return products;
    return products.filter(
      (product) =>
        product.name.includes(q) ||
        product.desc.includes(q) ||
        String(product.id).includes(q)
    );
  }, [query]);
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === openId) ?? null,
    [openId]
  );

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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right text-lg font-semibold text-slate-700">
              المنتجات
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/projects-pages/products/new"
                className="rounded-full bg-brand-900 px-4 py-2 text-sm text-white"
              >
                جديد +
              </Link>
              <div className="flex items-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                <span className="grid h-10 w-10 place-items-center bg-emerald-500 text-white">
                  🔍
                </span>
                <input
                  className="h-10 w-44 px-3 text-sm outline-none"
                  placeholder="بحث"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-right text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-3 text-center">#</th>
                    <th className="px-3 py-3 text-right">الاسم</th>
                    <th className="px-3 py-3 text-center">الكمية المباعة</th>
                    <th className="px-3 py-3 text-center">الوصف</th>
                    <th className="px-3 py-3 text-center">التاريخ</th>
                    <th className="px-3 py-3 text-center" aria-label="الإجراءات">
                      …
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => (
                    <tr
                      key={product.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="px-3 py-3 text-center text-slate-700">
                        {product.id}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-800">
                        {product.name}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-700">
                        {product.sold}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-500">
                        {product.desc}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-600">
                        {product.date}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-500">
                        <button
                          className="rounded-full p-1 hover:bg-slate-200"
                          aria-label="خيارات"
                          type="button"
                          onClick={() => setOpenId(product.id)}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedProduct && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
              تم اختيار المنتج: <span className="font-semibold">{selectedProduct.name}</span>
            </div>
          )}
        </main>

        <Sidebar activeLabel="المنتجات" />
      </div>
    </div>
  );
}
