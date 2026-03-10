"use client";

import Link from "next/link";
import { Copy, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ActionDrawer from "@/components/ActionDrawer";
import ViewModeToggle from "@/components/ViewModeToggle";
import { useCollectionViewMode } from "@/hooks/useCollectionViewMode";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";
import { getErrorMessage } from "../../lib/fetcher";
import { deleteSupplier, listSuppliers } from "../../services/suppliers";
import type { Supplier } from "../../types";

export default function SuppliersPage() {
  const [query, setQuery] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [openActionSupplierId, setOpenActionSupplierId] = useState<number | null>(null);
  const [deleteSupplierId, setDeleteSupplierId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { viewMode, setViewMode, isTableView } = useCollectionViewMode(
    "reset-main-view-mode-suppliers"
  );

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listSuppliers();
        if (!active) return;
        setSuppliers(data);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getErrorMessage(error, "تعذر تحميل الموردين."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
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

  const selectedDeleteSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.id === deleteSupplierId) ?? null,
    [deleteSupplierId, suppliers]
  );
  const selectedActionSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.id === openActionSupplierId) ?? null,
    [openActionSupplierId, suppliers]
  );

  const handleDeleteSupplier = async (supplierId: number) => {
    setDeleteError("");
    setIsDeleting(true);

    try {
      await deleteSupplier(supplierId);
      setSuppliers((prev) => prev.filter((supplier) => supplier.id !== supplierId));
      setDeleteSupplierId(null);
      setOpenActionSupplierId(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error, "تعذر حذف المورد."));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopySupplier = async (supplier: Supplier) => {
    const details = [
      `الاسم: ${supplier.name}`,
      `البريد: ${supplier.email}`,
      `الهاتف: ${supplier.phone}`,
      `المدينة: ${supplier.city}`,
      `الدولة: ${supplier.country}`,
      `الرصيد: ${supplier.balance.toLocaleString()} ج.م`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(details);
    } catch {
      window.alert(details);
    } finally {
      setOpenActionSupplierId(null);
    }
  };

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

          <div
            className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:grid-cols-[1fr_auto_auto_1fr] md:items-center"
            dir="ltr"
          >
            <div className="flex flex-wrap items-center justify-start gap-2">
              <Link
                href="/projects-pages/Suppliers/new"
                className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
              >
                مورد جديد
              </Link>
            </div>
            <div className="flex justify-center">
              <div className="app-search">
                <input
                  className="app-search-input h-9 w-64 px-2 text-right text-sm outline-none"
                  placeholder="ابحث عن مورد"
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
            <div className="flex justify-center">
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
            </div>
            <div className="text-right text-lg font-semibold text-slate-700" dir="rtl">
              الموردين
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

          {isTableView ? (
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
                  {isLoading ? (
                    <tr>
                      <td colSpan={16} className="px-3 py-10 text-center text-slate-500">
                        جارٍ تحميل الموردين...
                      </td>
                    </tr>
                  ) : filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="px-3 py-10 text-center text-slate-500">
                        لا يوجد موردون مطابقون أو لا توجد بيانات من الـ API.
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((supplier) => (
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
                            onClick={() => setOpenActionSupplierId(supplier.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-[0px] text-slate-500 transition before:text-sm before:font-semibold before:tracking-[-0.18em] before:content-['...'] hover:bg-slate-50 hover:text-slate-700"
                            aria-label="خيارات المورد"
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
          ) : isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
              جاري تحميل الموردين...
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
              لا توجد بيانات مطابقة للبحث الحالي.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredSuppliers.map((supplier) => (
                <article
                  key={supplier.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{supplier.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {supplier.city}، {supplier.country}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        supplier.status === "نشط"
                          ? "bg-emerald-50 text-emerald-700"
                          : supplier.status === "موقوف"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {supplier.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                      <p className="text-xs text-slate-400">الهاتف</p>
                      <p className="mt-1 text-sm font-medium text-slate-700">{supplier.phone}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                      <p className="text-xs text-slate-400">البريد</p>
                      <p className="mt-1 text-sm font-medium text-slate-700">{supplier.email}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                      <p className="text-xs text-slate-400">مدة السداد</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {supplier.paymentTermDays} يوم
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                      <p className="text-xs text-slate-400">الرصيد</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-700">
                        {supplier.balance.toLocaleString()} ج.م
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                    <p className="text-xs text-slate-400">البنك</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">{supplier.bankName}</p>
                    <p className="mt-2 text-xs text-slate-500">{supplier.bankAccountNumber}</p>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDeleteSupplierId(supplier.id)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                    >
                      حذف
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>

        <Sidebar activeLabel="الموردين" />
      </div>

      <ActionDrawer
        open={selectedActionSupplier !== null}
        title="إجراءات المورد"
        subtitle={selectedActionSupplier?.name}
        onClose={() => setOpenActionSupplierId(null)}
        actions={
          selectedActionSupplier
            ? [
                {
                  id: "copy",
                  label: "نسخ البيانات",
                  description: "انسخ معلومات التواصل والرصيد بسرعة.",
                  icon: Copy,
                  onClick: () => {
                    void handleCopySupplier(selectedActionSupplier);
                  },
                },
                {
                  id: "delete",
                  label: "حذف المورد",
                  description: "احذف المورد نهائيًا بعد رسالة التأكيد.",
                  icon: Trash2,
                  tone: "danger" as const,
                  onClick: () => {
                    setDeleteSupplierId(selectedActionSupplier.id);
                    setOpenActionSupplierId(null);
                  },
                },
              ]
            : []
        }
      >
        {selectedActionSupplier ? (
          <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">البريد</span>
              <span className="font-medium text-slate-900">{selectedActionSupplier.email}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">الهاتف</span>
              <span className="font-medium text-slate-900">{selectedActionSupplier.phone}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">الرصيد</span>
              <span className="font-semibold text-emerald-700">
                {selectedActionSupplier.balance.toLocaleString()} ج.م
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">مدة السداد</span>
              <span className="font-medium text-slate-900">
                {selectedActionSupplier.paymentTermDays} يوم
              </span>
            </div>
          </div>
        ) : null}
      </ActionDrawer>

      <ConfirmDeleteModal
        open={deleteSupplierId !== null}
        title="تأكيد حذف المورد"
        message={
          selectedDeleteSupplier
            ? `هل تريد حذف المورد "${selectedDeleteSupplier.name}"؟`
            : "هل تريد حذف هذا المورد؟"
        }
        onClose={() => {
          if (isDeleting) return;
          setDeleteSupplierId(null);
        }}
        onConfirm={() => {
          if (deleteSupplierId === null || isDeleting) return;
          void handleDeleteSupplier(deleteSupplierId);
        }}
      />
    </div>
  );
}
