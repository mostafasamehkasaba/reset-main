"use client";

import { FormEvent, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import SidebarToggle from "../../components/SidebarToggle";
import type { Supplier } from "../../types";

const initialSuppliers: Supplier[] = [
  {
    id: 1,
    name: "شركة الريادة للتوريد",
    email: "sales@alriyada.com",
    phone: "+20 100 123 4567",
    city: "القاهرة",
    status: "نشط",
    balance: 18500,
    orders: 14,
    joinedAt: "2025-09-12",
  },
  {
    id: 2,
    name: "مؤسسة المستقبل",
    email: "future@supplies.co",
    phone: "+20 111 765 4321",
    city: "الإسكندرية",
    status: "معلّق",
    balance: 9200,
    orders: 8,
    joinedAt: "2025-11-03",
  },
  {
    id: 3,
    name: "Delta Traders",
    email: "contact@delta-traders.com",
    phone: "+20 122 555 9090",
    city: "المنصورة",
    status: "نشط",
    balance: 27300,
    orders: 19,
    joinedAt: "2026-01-18",
  },
];

export default function SuppliersPage() {
  const [query, setQuery] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [viewSupplierId, setViewSupplierId] = useState<number | null>(null);
  const [editSupplierId, setEditSupplierId] = useState<number | null>(null);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    status: "نشط" as Supplier["status"],
  });
  const [editSupplier, setEditSupplier] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    status: "نشط" as Supplier["status"],
  });

  const filteredSuppliers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suppliers;

    return suppliers.filter((supplier) =>
      [supplier.name, supplier.email, supplier.phone, supplier.city, supplier.status]
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

  const selectedActionSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.id === openActionId) ?? null,
    [openActionId, suppliers]
  );

  const selectedViewSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.id === viewSupplierId) ?? null,
    [suppliers, viewSupplierId]
  );

  const handleAddSupplier = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newSupplier.name.trim() || !newSupplier.phone.trim()) {
      return;
    }

    const supplier: Supplier = {
      id: suppliers.length ? Math.max(...suppliers.map((item) => item.id)) + 1 : 1,
      name: newSupplier.name.trim(),
      email: newSupplier.email.trim() || "-",
      phone: newSupplier.phone.trim(),
      city: newSupplier.city.trim() || "-",
      status: newSupplier.status,
      balance: 0,
      orders: 0,
      joinedAt: new Date().toISOString().slice(0, 10),
    };

    setSuppliers((prev) => [supplier, ...prev]);
    setNewSupplier({ name: "", email: "", phone: "", city: "", status: "نشط" });
    setShowAddModal(false);
  };

  const handleDeleteSupplier = (supplierId: number) => {
    const shouldDelete = window.confirm("هل تريد حذف المورد؟");
    if (!shouldDelete) {
      return;
    }

    setSuppliers((prev) => prev.filter((supplier) => supplier.id !== supplierId));
    setOpenActionId(null);

    if (viewSupplierId === supplierId) {
      setViewSupplierId(null);
    }

    if (editSupplierId === supplierId) {
      setEditSupplierId(null);
    }
  };

  const handleStartEdit = (supplier: Supplier) => {
    setEditSupplierId(supplier.id);
    setEditSupplier({
      name: supplier.name,
      email: supplier.email === "-" ? "" : supplier.email,
      phone: supplier.phone,
      city: supplier.city === "-" ? "" : supplier.city,
      status: supplier.status,
    });
    setOpenActionId(null);
  };

  const handleUpdateSupplier = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editSupplierId || !editSupplier.name.trim() || !editSupplier.phone.trim()) {
      return;
    }

    setSuppliers((prev) =>
      prev.map((supplier) =>
        supplier.id === editSupplierId
          ? {
              ...supplier,
              name: editSupplier.name.trim(),
              email: editSupplier.email.trim() || "-",
              phone: editSupplier.phone.trim(),
              city: editSupplier.city.trim() || "-",
              status: editSupplier.status,
            }
          : supplier
      )
    );

    setEditSupplierId(null);
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
              <p className="text-sm text-slate-500">إجمالي الموردين</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{suppliers.length}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">الموردون النشطون</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{activeSuppliers}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">إجمالي الرصيد</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{totalBalance.toLocaleString()} ج.م</p>
            </article>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right text-lg font-semibold text-slate-700">الموردين</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="rounded-full bg-brand-900 px-4 py-2 text-sm text-white transition hover:bg-brand-800"
              >
                إضافة مورد +
              </button>
              <div className="flex items-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                <span className="grid h-10 w-10 place-items-center bg-emerald-500 text-white">🔍</span>
                <input
                  className="h-10 w-52 px-3 text-sm outline-none"
                  placeholder="ابحث عن مورد"
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
                    <th className="px-3 py-3 text-right">اسم المورد</th>
                    <th className="px-3 py-3 text-center">الهاتف</th>
                    <th className="px-3 py-3 text-center">البريد</th>
                    <th className="px-3 py-3 text-center">المدينة</th>
                    <th className="px-3 py-3 text-center">الحالة</th>
                    <th className="px-3 py-3 text-center">الطلبات</th>
                    <th className="px-3 py-3 text-center">الرصيد</th>
                    <th className="px-3 py-3 text-center" aria-label="الإجراءات">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                        لا يوجد نتائج مطابقة للبحث.
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((supplier, index) => (
                      <tr key={supplier.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-3 py-3 text-center text-slate-700">{supplier.id}</td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-800">{supplier.name}</td>
                        <td className="px-3 py-3 text-center text-slate-600">{supplier.phone}</td>
                        <td className="px-3 py-3 text-center text-slate-600">{supplier.email}</td>
                        <td className="px-3 py-3 text-center text-slate-600">{supplier.city}</td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              supplier.status === "نشط"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {supplier.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-slate-700">{supplier.orders}</td>
                        <td className="px-3 py-3 text-center font-semibold text-slate-800">
                          {supplier.balance.toLocaleString()} ج.م
                        </td>
                        <td className="px-3 py-3 text-center text-slate-500">
                          <button
                            type="button"
                            className="rounded-full p-1 hover:bg-slate-200"
                            aria-label="خيارات"
                            onClick={() => setOpenActionId(supplier.id)}
                          >
                            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
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
          </div>
        </main>

        <Sidebar activeLabel="الموردين" />
      </div>

      {selectedActionSupplier && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          dir="rtl"
          onClick={() => setOpenActionId(null)}
        >
          <div
            className="w-[340px] max-w-[92vw] rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">إجراءات المورد</p>
                <p className="text-xs text-slate-500">{selectedActionSupplier.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenActionId(null)}
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <button
                type="button"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50"
                onClick={() => {
                  setViewSupplierId(selectedActionSupplier.id);
                  setOpenActionId(null);
                }}
              >
                عرض
              </button>
              <button
                type="button"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50"
                onClick={() => handleStartEdit(selectedActionSupplier)}
              >
                تعديل
              </button>
              <button
                type="button"
                className="w-full rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 hover:bg-rose-100"
                onClick={() => handleDeleteSupplier(selectedActionSupplier.id)}
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedViewSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">بيانات المورد</h2>
                <p className="text-sm text-slate-500">{selectedViewSupplier.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewSupplierId(null)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">الهاتف</p>
                <p className="mt-1 font-semibold">{selectedViewSupplier.phone}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">البريد</p>
                <p className="mt-1 font-semibold">{selectedViewSupplier.email}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">المدينة</p>
                <p className="mt-1 font-semibold">{selectedViewSupplier.city}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">الحالة</p>
                <p className="mt-1 font-semibold">{selectedViewSupplier.status}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">الطلبات</p>
                <p className="mt-1 font-semibold">{selectedViewSupplier.orders}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">الرصيد</p>
                <p className="mt-1 font-semibold">{selectedViewSupplier.balance.toLocaleString()} ج.م</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {editSupplierId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">تعديل المورد</h2>
                <p className="text-sm text-slate-500">حدّث بيانات المورد ثم احفظ التعديلات.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditSupplierId(null)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSupplier} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm text-slate-600">
                  اسم المورد *
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={editSupplier.name}
                    onChange={(event) =>
                      setEditSupplier((prev) => ({ ...prev, name: event.target.value }))
                    }
                    required
                  />
                </label>

                <label className="text-sm text-slate-600">
                  الهاتف *
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={editSupplier.phone}
                    onChange={(event) =>
                      setEditSupplier((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    required
                  />
                </label>

                <label className="text-sm text-slate-600">
                  البريد الإلكتروني
                  <input
                    type="email"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={editSupplier.email}
                    onChange={(event) =>
                      setEditSupplier((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </label>

                <label className="text-sm text-slate-600">
                  المدينة
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={editSupplier.city}
                    onChange={(event) =>
                      setEditSupplier((prev) => ({ ...prev, city: event.target.value }))
                    }
                  />
                </label>

                <label className="text-sm text-slate-600 md:col-span-2">
                  الحالة
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={editSupplier.status}
                    onChange={(event) =>
                      setEditSupplier((prev) => ({
                        ...prev,
                        status: event.target.value as Supplier["status"],
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
                  onClick={() => setEditSupplierId(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-900 px-4 py-2 text-sm text-white hover:bg-brand-800"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">إضافة مورد جديد</h2>
                <p className="text-sm text-slate-500">أدخل بيانات المورد وسيُضاف مباشرة إلى القائمة.</p>
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

            <form onSubmit={handleAddSupplier} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm text-slate-600">
                  اسم المورد *
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={newSupplier.name}
                    onChange={(event) =>
                      setNewSupplier((prev) => ({ ...prev, name: event.target.value }))
                    }
                    required
                  />
                </label>

                <label className="text-sm text-slate-600">
                  الهاتف *
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={newSupplier.phone}
                    onChange={(event) =>
                      setNewSupplier((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    required
                  />
                </label>

                <label className="text-sm text-slate-600">
                  البريد الإلكتروني
                  <input
                    type="email"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={newSupplier.email}
                    onChange={(event) =>
                      setNewSupplier((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </label>

                <label className="text-sm text-slate-600">
                  المدينة
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={newSupplier.city}
                    onChange={(event) =>
                      setNewSupplier((prev) => ({ ...prev, city: event.target.value }))
                    }
                  />
                </label>

                <label className="text-sm text-slate-600 md:col-span-2">
                  الحالة
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={newSupplier.status}
                    onChange={(event) =>
                      setNewSupplier((prev) => ({
                        ...prev,
                        status: event.target.value as Supplier["status"],
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
                  حفظ المورد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
