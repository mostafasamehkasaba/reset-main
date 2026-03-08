"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";
import { getErrorMessage } from "../../lib/fetcher";
import { deleteClient, listClients } from "../../services/clients";
import type { Client } from "../../types";

export default function ClientsPage() {
  const [query, setQuery] = useState("");
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [deleteClientId, setDeleteClientId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listClients();
        if (!active) return;
        setClientsList(data);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getErrorMessage(error, "تعذر تحميل العملاء."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clientsList;
    return clientsList.filter(
      (client) =>
        [
          client.name,
          client.email,
          client.phone,
          client.country,
          String(client.due),
          client.currency,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
    );
  }, [query, clientsList]);
  const selectedClient = useMemo(
    () => clientsList.find((client) => client.id === openId) ?? null,
    [openId, clientsList]
  );
  const selectedDeleteClient = useMemo(
    () => clientsList.find((client) => client.id === deleteClientId) ?? null,
    [deleteClientId, clientsList]
  );

  const handleDeleteClient = async (clientId: number) => {
    setDeleteError("");
    setIsDeleting(true);

    try {
      await deleteClient(clientId);
      setClientsList((prev) => prev.filter((client) => client.id !== clientId));
      setDeleteClientId(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error, "تعذر حذف العميل."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="العملاء" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm md:grid-cols-[1fr_auto_1fr] md:items-center"
            dir="ltr"
          >
            <div className="flex justify-start">
              <Link
                href="/projects-pages/clients/new"
                className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
              >
                عميل جديد
              </Link>
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
            <div className="text-right text-lg font-semibold text-slate-700" dir="rtl">
              العملاء
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

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-0 text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">#</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-right">الاسم</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">البريد الإلكتروني</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">الهاتف</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">الدولة</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">الفواتير</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">المستحق</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center" aria-label="الإجراءات">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                        جارٍ تحميل العملاء...
                      </td>
                    </tr>
                  ) : filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                        لا توجد عملاء من الـ API حاليًا.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client, index) => (
                      <tr key={client.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-700">
                          {client.id}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-right font-semibold text-slate-800">
                          <Link
                            href={`/projects-pages/clients/${client.id}`}
                            className="hover:text-brand-800"
                          >
                            {client.name}
                          </Link>
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-600">
                          {client.email}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-600">
                          {client.phone}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-600">
                          {client.country}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-700">
                          {client.invoices}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center font-semibold text-emerald-700">
                          {client.currency} {client.due}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-500">
                          <button
                            className="rounded-full p-1 hover:bg-slate-200"
                            aria-label="خيارات"
                            type="button"
                            onClick={() => setOpenId(client.id)}
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
          </div>
        </main>

        <Sidebar activeLabel="العملاء" />
      </div>

      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">إجراءات العميل</p>
                <p className="text-xs text-slate-500">{selectedClient.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <a
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-center text-slate-600 hover:bg-slate-50"
                href={selectedClient ? `/projects-pages/clients/${selectedClient.id}` : "#"}
              >
                عرض
              </a>
              <a
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-center text-slate-600 hover:bg-slate-50"
                href="/projects-pages/clients/new"
              >
                تعديل
              </a>
              <button
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50"
                type="button"
                onClick={() => alert("تم نسخ بيانات العميل (واجهة فقط)")}
              >
                نسخ
              </button>
              <button
                className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 hover:bg-rose-100"
                type="button"
                onClick={() => {
                  setDeleteClientId(selectedClient.id);
                  setOpenId(null);
                }}
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={deleteClientId !== null}
        title="تأكيد حذف العميل"
        message={
          selectedDeleteClient
            ? `هل تريد حذف العميل "${selectedDeleteClient.name}"؟`
            : "هل تريد حذف هذا العميل؟"
        }
        isProcessing={isDeleting}
        onClose={() => {
          if (isDeleting) return;
          setDeleteClientId(null);
        }}
        onConfirm={() => {
          if (deleteClientId === null || isDeleting) return;
          void handleDeleteClient(deleteClientId);
        }}
      />
    </div>
  );
}
