"use client";

import Link from "next/link";
import { Copy, MoreHorizontal, Search, Trash2, Truck } from "lucide-react";
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

const moneyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatMoney = (value: number) => `${moneyFormatter.format(Math.max(0, value))} ج.م`;
const safeText = (value: string, fallback = "-") => {
  const normalized = value.trim();
  return normalized && normalized !== "-" ? normalized : fallback;
};

const getStatusClassName = (value: Supplier["status"]) => {
  if (value === "نشط") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value === "موقوف") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
};

function StatCard({ title, value, tone = "default" }: { title: string; value: string | number; tone?: "default" | "success" | "accent" }) {
  const toneClass = tone === "success" ? "text-emerald-700" : tone === "accent" ? "text-sky-700" : "text-slate-900";
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</p>
    </article>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-left font-medium text-slate-900">{value}</span>
    </div>
  );
}

export default function SuppliersPage() {
  const [query, setQuery] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [openActionSupplierId, setOpenActionSupplierId] = useState<number | null>(null);
  const [deleteSupplierId, setDeleteSupplierId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { viewMode, setViewMode, isTableView } = useCollectionViewMode("reset-main-view-mode-suppliers");

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

    void loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredSuppliers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return suppliers;
    return suppliers.filter((supplier) => [supplier.name, supplier.email, supplier.phone, supplier.country, supplier.city, supplier.address, supplier.taxNumber, supplier.bankName, supplier.bankAccountNumber, supplier.iban, String(supplier.balance), String(supplier.creditLimit), supplier.status].join(" ").toLowerCase().includes(normalizedQuery));
  }, [query, suppliers]);

  const totalBalance = useMemo(() => suppliers.reduce((sum, supplier) => sum + supplier.balance, 0), [suppliers]);
  const activeSuppliers = useMemo(() => suppliers.filter((supplier) => supplier.status === "نشط").length, [suppliers]);
  const countriesCount = useMemo(() => new Set(suppliers.map((supplier) => safeText(supplier.country, "")).filter(Boolean)).size, [suppliers]);
  const totalOrders = useMemo(() => suppliers.reduce((sum, supplier) => sum + Math.max(0, supplier.orders), 0), [suppliers]);
  const selectedActionSupplier = useMemo(() => suppliers.find((supplier) => supplier.id === openActionSupplierId) ?? null, [openActionSupplierId, suppliers]);
  const selectedDeleteSupplier = useMemo(() => suppliers.find((supplier) => supplier.id === deleteSupplierId) ?? null, [deleteSupplierId, suppliers]);

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
    const details = [`الاسم: ${supplier.name}`, `البريد: ${safeText(supplier.email)}`, `الهاتف: ${safeText(supplier.phone)}`, `المدينة: ${safeText(supplier.city)}`, `الدولة: ${safeText(supplier.country)}`, `الرصيد: ${formatMoney(supplier.balance)}`].join("\n");
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
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="إجمالي الموردين" value={suppliers.length} />
            <StatCard title="الموردون النشطون" value={activeSuppliers} tone="success" />
            <StatCard title="الدول" value={countriesCount} tone="accent" />
            <StatCard title="إجمالي الرصيد" value={formatMoney(totalBalance)} />
          </section>

          {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div> : null}
          {deleteError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{deleteError}</div> : null}

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">إدارة الموردين</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">قائمة الموردين</h2>
                <p className="mt-2 text-sm text-slate-500">{isLoading ? "يتم تحميل الموردين الآن..." : `يعرض ${filteredSuppliers.length} من أصل ${suppliers.length} مورد.`}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ViewModeToggle value={viewMode} onChange={setViewMode} />
                <Link href="/projects-pages/Suppliers/new" className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">مورد جديد</Link>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]" placeholder="ابحث بالاسم أو الهاتف أو البريد أو المدينة أو البنك" value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">{isTableView ? "عرض جدولي" : "عرض بالكروت"}</div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">{filteredSuppliers.length} نتيجة</div>
            </div>
          </section>

          {isTableView ? (
            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h3 className="text-lg font-semibold text-slate-950">قائمة الموردين</h3>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">{totalOrders} طلب</div>
              </div>

              {isLoading ? (
                <div className="px-6 py-12 text-center text-sm text-slate-500">جارٍ تحميل الموردين...</div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="px-6 py-14 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400"><Truck className="h-6 w-6" /></div><p className="mt-4 text-sm text-slate-500">لا توجد نتائج مطابقة.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-right">
                    <thead className="bg-slate-50/90 text-sm text-slate-500">
                      <tr>
                        <th className="px-4 py-4 font-medium">#</th>
                        <th className="px-4 py-4 font-medium">المورد</th>
                        <th className="px-4 py-4 font-medium">التواصل</th>
                        <th className="px-4 py-4 font-medium">الموقع</th>
                        <th className="px-4 py-4 font-medium">السداد والائتمان</th>
                        <th className="px-4 py-4 font-medium">الرصيد</th>
                        <th className="px-4 py-4 font-medium">الحالة</th>
                        <th className="px-4 py-4 text-center font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSuppliers.map((supplier) => (
                        <tr key={supplier.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                          <td className="px-4 py-4 text-sm font-medium text-slate-700">#{supplier.id}</td>
                          <td className="px-4 py-4"><p className="text-sm font-semibold text-slate-950">{supplier.name}</p><p className="mt-1 text-sm text-slate-500">{safeText(supplier.address)}</p></td>
                          <td className="px-4 py-4 text-sm text-slate-600"><p>{safeText(supplier.phone)}</p><p className="mt-1 text-slate-500">{safeText(supplier.email)}</p></td>
                          <td className="px-4 py-4 text-sm text-slate-600"><p>{safeText(supplier.city)}</p><p className="mt-1 text-slate-500">{safeText(supplier.country)}</p></td>
                          <td className="px-4 py-4 text-sm text-slate-600"><p>{supplier.paymentTermDays} يوم</p><p className="mt-1 text-slate-500">حد {formatMoney(supplier.creditLimit)}</p></td>
                          <td className="px-4 py-4"><p className="text-sm font-semibold text-emerald-700">{formatMoney(supplier.balance)}</p><p className="mt-1 text-xs text-slate-500">افتتاحي {formatMoney(supplier.openingBalance)}</p></td>
                          <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClassName(supplier.status)}`}>{supplier.status}</span></td>
                          <td className="px-4 py-4 text-center"><button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700" onClick={() => setOpenActionSupplierId(supplier.id)} aria-label="إجراءات المورد"><MoreHorizontal className="h-4 w-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : isLoading ? (
            <div className="rounded-[28px] border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">جارٍ تحميل الموردين...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">لا توجد بيانات مطابقة للبحث الحالي.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredSuppliers.map((supplier) => (
                <article key={supplier.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-slate-950">{supplier.name}</h3><p className="mt-1 text-sm text-slate-500">{safeText(supplier.city)}, {safeText(supplier.country)}</p></div><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClassName(supplier.status)}`}>{supplier.status}</span></div>
                  <div className="mt-4 grid gap-3"><div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"><p className="text-xs text-slate-400">الهاتف</p><p className="mt-1 text-sm font-medium text-slate-800">{safeText(supplier.phone)}</p></div><div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"><p className="text-xs text-slate-400">البنك</p><p className="mt-1 text-sm font-medium text-slate-800">{safeText(supplier.bankName)}</p></div></div>
                  <div className="mt-4 flex flex-wrap items-center gap-2"><span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">{supplier.paymentTermDays} يوم</span><span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{formatMoney(supplier.balance)}</span></div>
                  <div className="mt-5 flex items-center justify-between gap-3"><div className="text-sm text-slate-500">#{supplier.id}</div><button type="button" onClick={() => setOpenActionSupplierId(supplier.id)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"><MoreHorizontal className="h-4 w-4" />الإجراءات</button></div>
                </article>
              ))}
            </div>
          )}
        </main>

        <Sidebar activeLabel="الموردين" />
      </div>

      <ActionDrawer open={selectedActionSupplier !== null} title="إجراءات المورد" subtitle={selectedActionSupplier?.name} onClose={() => setOpenActionSupplierId(null)} actions={selectedActionSupplier ? [{ id: "copy", label: "نسخ البيانات", description: "انسخ بيانات التواصل والرصيد بسرعة.", icon: Copy, onClick: () => { void handleCopySupplier(selectedActionSupplier); } }, { id: "delete", label: "حذف المورد", description: "احذف المورد نهائيًا بعد رسالة التأكيد.", icon: Trash2, tone: "danger" as const, onClick: () => { setDeleteSupplierId(selectedActionSupplier.id); setOpenActionSupplierId(null); } }] : []}>
        {selectedActionSupplier ? <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4"><DetailRow label="البريد" value={safeText(selectedActionSupplier.email)} /><DetailRow label="الهاتف" value={safeText(selectedActionSupplier.phone)} /><DetailRow label="الموقع" value={`${safeText(selectedActionSupplier.city)} - ${safeText(selectedActionSupplier.country)}`} /><DetailRow label="الرصيد" value={formatMoney(selectedActionSupplier.balance)} /></div> : null}
      </ActionDrawer>

      <ConfirmDeleteModal open={deleteSupplierId !== null} title="تأكيد حذف المورد" message={selectedDeleteSupplier ? `هل تريد حذف المورد "${selectedDeleteSupplier.name}"؟` : "هل تريد حذف هذا المورد؟"} isProcessing={isDeleting} onClose={() => { if (isDeleting) return; setDeleteSupplierId(null); }} onConfirm={() => { if (deleteSupplierId === null || isDeleting) return; void handleDeleteSupplier(deleteSupplierId); }} />
    </div>
  );
}
