"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";
import {
  defaultSuppliers,
  loadSuppliersFromStorage,
  saveSuppliersToStorage,
} from "../../lib/supplier-store";
import type { Supplier } from "../../types";

export default function SuppliersPage() {
  const [query, setQuery] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>(defaultSuppliers);
  const [deleteSupplierId, setDeleteSupplierId] = useState<number | null>(null);

  useEffect(() => {
    setSuppliers(loadSuppliersFromStorage());
  }, []);

  useEffect(() => {
    const syncSuppliers = () => setSuppliers(loadSuppliersFromStorage());
    window.addEventListener("storage", syncSuppliers);
    window.addEventListener("focus", syncSuppliers);
    return () => {
      window.removeEventListener("storage", syncSuppliers);
      window.removeEventListener("focus", syncSuppliers);
    };
  }, []);

  const filteredSuppliers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suppliers;

    return suppliers.filter((supplier) =>
      [
        supplier.name,
        supplier.email,
        supplier.phone,
        supplier.country,
        supplier.city,
        supplier.address,
        supplier.taxNumber,
        supplier.bankAccountNumber,
        supplier.bankName,
        supplier.iban,
        String(supplier.openingBalance),
        String(supplier.paymentTermDays),
        String(supplier.creditLimit),
        supplier.notes,
        supplier.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query, suppliers]);

  const totalBalance = useMemo(
    () => suppliers.reduce((sum, supplier) => sum + supplier.balance, 0),
    [suppliers]
  );

  const activeSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.status === "نشط").length,
    [suppliers]
  );

  const handleDeleteSupplier = (supplierId: number) => {
    const nextSuppliers = suppliers.filter((supplier) => supplier.id !== supplierId);
    setSuppliers(nextSuppliers);
    saveSuppliersToStorage(nextSuppliers);
  };

  const selectedDeleteSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.id === deleteSupplierId) ?? null,
    [deleteSupplierId, suppliers]
  );

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="الموردين" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">إجمالي الموردين</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{suppliers.length}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">الموردون النشطون</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{activeSuppliers}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">إجمالي الرصيد</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {totalBalance.toLocaleString()} ج.م
              </p>
            </article>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right text-lg font-semibold text-slate-700">الموردين</div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/projects-pages/Suppliers/new"
                className="rounded-full bg-brand-900 px-4 py-2 text-sm text-white transition hover:bg-brand-800"
              >
                إضافة مورد +
              </Link>
              <div className="app-search">
                <input
                  className="app-search-input h-9 w-64 px-2 text-sm outline-none"
                  placeholder="اكتب ما تريد أن تبحث عنه"
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
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-600 shadow-sm">
                <span>إظهار</span>
                <select
                  className="bg-transparent text-sm text-slate-700 outline-none"
                  defaultValue="10"
                  aria-label="عدد الصفوف"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1700px] border-separate border-spacing-0 text-right text-xs sm:text-sm">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-3 py-3 text-center sm:px-4 sm:py-4">#</th>
                    <th className="px-3 py-3 text-right sm:px-4 sm:py-4">اسم المورد</th>
                    <th className="px-3 py-3 text-center sm:px-4 sm:py-4">الهاتف</th>
                    <th className="px-3 py-3 text-center sm:px-4 sm:py-4">البريد</th>
                    <th className="px-3 py-3 text-center sm:px-4 sm:py-4">الدولة</th>
                    <th className="px-3 py-3 text-center sm:px-4 sm:py-4">المدينة</th>
                    <th className="px-3 py-3 text-center sm:px-4 sm:py-4">الرقم الضريبي</th>
                    <th className="px-3 py-3 text-center sm:px-4 sm:py-4">مدة السداد</th>
                    <th className="px-3 py-3 text-center sm:px-4 sm:py-4">الحد الائتماني</th>
                    <th className="px-3 py-3 text-center sm:px-4 sm:py-4">الرصيد الافتتاحي</th>
                    <th className="px-3 py-3 text-center sm:px-4 sm:py-4">اسم البنك</th>
                    <th className="px-3 py-3 text-center sm:px-4 sm:py-4">رقم الحساب البنكي</th>
                    <th className="px-3 py-3 text-center sm:px-4 sm:py-4">IBAN</th>
                    <th className="px-3 py-3 text-center sm:px-4 sm:py-4">الحالة</th>
                    <th className="px-3 py-3 text-center sm:px-4 sm:py-4">ملاحظات</th>
                    <th className="px-3 py-3 text-center sm:px-4 sm:py-4">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="px-3 py-10 text-center text-slate-500">
                        لا يوجد نتائج مطابقة للبحث.
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((supplier, index) => (
                      <tr key={supplier.id} className="border-b border-slate-100">
                        <td className="px-3 py-3 text-center text-slate-700 sm:px-4 sm:py-4">
                          {supplier.id}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-800 sm:px-4 sm:py-4">
                          {supplier.name}
                          <div className="mt-1 text-[11px] font-normal text-slate-500">
                            {supplier.address}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center text-slate-600 sm:px-4 sm:py-4">
                          {supplier.phone}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-600 sm:px-4 sm:py-4">
                          {supplier.email}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-600 sm:px-4 sm:py-4">
                          {supplier.country}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-600 sm:px-4 sm:py-4">
                          {supplier.city}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-600 sm:px-4 sm:py-4">
                          {supplier.taxNumber}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-700 sm:px-4 sm:py-4">
                          {supplier.paymentTermDays} يوم
                        </td>
                        <td className="px-3 py-3 text-center text-slate-700 sm:px-4 sm:py-4">
                          {supplier.creditLimit.toLocaleString()} ج.م
                        </td>
                        <td className="px-3 py-3 text-center text-slate-700 sm:px-4 sm:py-4">
                          {supplier.openingBalance.toLocaleString()} ج.م
                        </td>
                        <td className="px-3 py-3 text-center text-slate-600 sm:px-4 sm:py-4">
                          {supplier.bankName}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-600 sm:px-4 sm:py-4">
                          {supplier.bankAccountNumber}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-600 sm:px-4 sm:py-4">
                          {supplier.iban}
                        </td>
                        <td className="px-3 py-3 text-center sm:px-4 sm:py-4">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              supplier.status === "نشط"
                                ? "bg-emerald-50 text-emerald-700"
                                : supplier.status === "موقوف"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {supplier.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-slate-600 sm:px-4 sm:py-4">
                          {supplier.notes}
                        </td>
                        <td className="px-3 py-3 text-center sm:px-4 sm:py-4">
                          <button
                            type="button"
                            onClick={() => setDeleteSupplierId(supplier.id)}
                            className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100"
                          >
                            حذف
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

        <Sidebar activeLabel="الموردين" />
      </div>

      <ConfirmDeleteModal
        open={deleteSupplierId !== null}
        title="تأكيد حذف المورد"
        message={
          selectedDeleteSupplier
            ? `هل تريد حذف المورد "${selectedDeleteSupplier.name}"؟`
            : "هل تريد حذف هذا المورد؟"
        }
        onClose={() => setDeleteSupplierId(null)}
        onConfirm={() => {
          if (deleteSupplierId === null) return;
          handleDeleteSupplier(deleteSupplierId);
          setDeleteSupplierId(null);
        }}
      />
    </div>
  );
}
