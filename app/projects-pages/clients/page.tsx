"use client";

import Link from "next/link";
import { Copy, Eye, MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ActionDrawer from "@/components/ActionDrawer";
import ViewModeToggle from "@/components/ViewModeToggle";
import { useCollectionViewMode } from "@/hooks/useCollectionViewMode";
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
  const { viewMode, setViewMode, isTableView } = useCollectionViewMode(
    "reset-main-view-mode-clients"
  );

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

  const handleCopyClient = async (client: Client) => {
    const details = [
      `الاسم: ${client.name}`,
      `البريد: ${client.email}`,
      `الهاتف: ${client.phone}`,
      `الدولة: ${client.country}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(details);
      setOpenId(null);
    } catch {
      window.alert(details);
      setOpenId(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="العملاء" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm md:grid-cols-[1fr_auto_auto_1fr] md:items-center"
            dir="ltr"
          >
            <div className="flex justify-start">
              <Link
                href="/customers/new"
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
            <div className="flex justify-center">
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
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

          {isTableView ? (
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
                            href={`/customers/${client.id}`}
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
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                            aria-label="خيارات"
                            type="button"
                            onClick={() => setOpenId(client.id)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
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
              جاري تحميل العملاء...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
              لا توجد بيانات مطابقة للبحث الحالي.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredClients.map((client) => (
                <article
                  key={client.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/customers/${client.id}`}
                        className="text-lg font-semibold text-slate-900 hover:text-sky-700"
                      >
                        {client.name}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500">{client.email}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      #{client.id}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                      <p className="text-xs text-slate-400">الهاتف</p>
                      <p className="mt-1 text-sm font-medium text-slate-700">{client.phone}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                      <p className="text-xs text-slate-400">الدولة</p>
                      <p className="mt-1 text-sm font-medium text-slate-700">{client.country}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                      <p className="text-xs text-slate-400">الفواتير</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{client.invoices}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                      <p className="text-xs text-slate-400">المستحق</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-700">
                        {client.currency} {client.due}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/customers/${client.id}`}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      عرض
                    </Link>
                    <Link
                      href={`/customers/new?id=${client.id}`}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      تعديل
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteClientId(client.id)}
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

        <Sidebar activeLabel="العملاء" />
      </div>

      {selectedClient && openId === -1 && (
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
                href={selectedClient ? `/customers/${selectedClient.id}` : "#"}
              >
                عرض
              </a>
              <a
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-center text-slate-600 hover:bg-slate-50"
                href={
                  selectedClient
                    ? `/customers/new?id=${selectedClient.id}`
                    : "/customers/new"
                }
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

      <ActionDrawer
        open={selectedClient !== null}
        title="إجراءات العميل"
        subtitle={selectedClient?.name}
        onClose={() => setOpenId(null)}
        actions={
          selectedClient
            ? [
                {
                  id: "view",
                  label: "عرض العميل",
                  description: "افتح صفحة العميل بكامل التفاصيل والفواتير.",
                  icon: Eye,
                  href: `/customers/${selectedClient.id}`,
                },
                {
                  id: "edit",
                  label: "تعديل العميل",
                  description: "افتح نموذج تعديل بيانات العميل الحالية.",
                  icon: PencilLine,
                  href: `/customers/new?id=${selectedClient.id}`,
                },
                {
                  id: "copy",
                  label: "نسخ البيانات",
                  description: "انسخ الاسم ووسائل التواصل بسرعة إلى الحافظة.",
                  icon: Copy,
                  onClick: () => {
                    void handleCopyClient(selectedClient);
                  },
                },
                {
                  id: "delete",
                  label: "حذف العميل",
                  description: "احذف العميل نهائيًا بعد التأكيد.",
                  icon: Trash2,
                  tone: "danger" as const,
                  onClick: () => {
                    setDeleteClientId(selectedClient.id);
                    setOpenId(null);
                  },
                },
              ]
            : []
        }
      >
        {selectedClient ? (
          <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">البريد</span>
              <span className="font-medium text-slate-900">{selectedClient.email}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">الهاتف</span>
              <span className="font-medium text-slate-900">{selectedClient.phone}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">المستحق</span>
              <span className="font-semibold text-emerald-700">
                {selectedClient.currency} {selectedClient.due}
              </span>
            </div>
          </div>
        ) : null}
      </ActionDrawer>

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
