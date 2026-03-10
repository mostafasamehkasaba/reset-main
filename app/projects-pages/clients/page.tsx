"use client";

import Link from "next/link";
import {
  Building2,
  Copy,
  Eye,
  Globe2,
  MoreHorizontal,
  PencilLine,
  Search,
  Trash2,
  UsersRound,
  Wallet,
} from "lucide-react";
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

const moneyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const getClientTypeLabel = (value: string | undefined) =>
  value === "company" ? "شركة" : "فرد";

const getClientTypeClasses = (value: string | undefined) =>
  value === "company"
    ? "border-violet-200 bg-violet-50 text-violet-700"
    : "border-sky-200 bg-sky-50 text-sky-700";

const getSafeText = (value: string, fallback = "-") => {
  const normalized = value.trim();
  return normalized && normalized !== "-" ? normalized : fallback;
};

const formatMoney = (value: number, currency: string) =>
  `${moneyFormatter.format(Math.max(0, value))} ${currency}`;

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

    void loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return clientsList;

    return clientsList.filter((client) =>
      [
        client.name,
        client.email,
        client.phone,
        client.country,
        client.address,
        client.taxNumber,
        client.commercialRegister,
        String(client.due),
        String(client.creditLimit ?? 0),
        client.currency,
        getClientTypeLabel(client.type),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [clientsList, query]);

  const selectedClient = useMemo(
    () => clientsList.find((client) => client.id === openId) ?? null,
    [clientsList, openId]
  );

  const selectedDeleteClient = useMemo(
    () => clientsList.find((client) => client.id === deleteClientId) ?? null,
    [clientsList, deleteClientId]
  );

  const totalOutstanding = useMemo(
    () => clientsList.reduce((sum, client) => sum + Math.max(0, client.due), 0),
    [clientsList]
  );

  const totalInvoices = useMemo(
    () => clientsList.reduce((sum, client) => sum + Math.max(0, client.invoices), 0),
    [clientsList]
  );

  const companyClientsCount = useMemo(
    () => clientsList.filter((client) => client.type === "company").length,
    [clientsList]
  );

  const countriesCount = useMemo(
    () =>
      new Set(
        clientsList
          .map((client) => getSafeText(client.country, ""))
          .filter((country) => country.length > 0)
      ).size,
    [clientsList]
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
      `النوع: ${getClientTypeLabel(client.type)}`,
      `البريد: ${getSafeText(client.email)}`,
      `الهاتف: ${getSafeText(client.phone)}`,
      `الدولة: ${getSafeText(client.country)}`,
      `المستحق: ${formatMoney(client.due, client.currency)}`,
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
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">إجمالي العملاء</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{clientsList.length}</p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">عملاء شركات</p>
              <p className="mt-2 text-2xl font-bold text-violet-700">{companyClientsCount}</p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">إجمالي الفواتير</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{totalInvoices}</p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">إجمالي المستحق</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {formatMoney(totalOutstanding, clientsList[0]?.currency || "OMR")}
              </p>
            </article>
          </section>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {deleteError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {deleteError}
            </div>
          ) : null}

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
                  إدارة العملاء
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">قائمة العملاء</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {isLoading
                    ? "يتم تحميل العملاء الآن..."
                    : `يعرض ${filteredClients.length} من أصل ${clientsList.length} عميل.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <ViewModeToggle value={viewMode} onChange={setViewMode} />
                <Link
                  href="/customers/new"
                  className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  عميل جديد
                </Link>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
                  placeholder="ابحث بالاسم أو البريد أو الهاتف أو الدولة أو النوع"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>

              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                {isTableView ? "عرض جدولي" : "عرض بالكروت"}
              </div>

              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                {countriesCount} دولة
              </div>
            </div>
          </section>

          {isTableView ? (
            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">قائمة العملاء</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    عرض منظم لبيانات العملاء مع الوصول السريع إلى الإجراءات.
                  </p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                  {filteredClients.length} نتيجة
                </div>
              </div>

              {isLoading ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-right">
                    <thead className="bg-slate-50/90 text-sm text-slate-500">
                      <tr>
                        <th className="px-4 py-4 font-medium">#</th>
                        <th className="px-4 py-4 font-medium">العميل</th>
                        <th className="px-4 py-4 font-medium">النوع</th>
                        <th className="px-4 py-4 font-medium">التواصل</th>
                        <th className="px-4 py-4 font-medium">الدولة</th>
                        <th className="px-4 py-4 font-medium">الفواتير</th>
                        <th className="px-4 py-4 font-medium">المستحق</th>
                        <th className="px-4 py-4 text-center font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <tr key={index} className="border-t border-slate-100">
                          {Array.from({ length: 8 }).map((__, cell) => (
                            <td key={cell} className="px-4 py-4">
                              <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                    <UsersRound className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950">
                    لا توجد عملاء مطابقون
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    جرّب تعديل البحث الحالي أو أضف عميلًا جديدًا.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      مسح البحث
                    </button>
                    <Link
                      href="/customers/new"
                      className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      إضافة عميل
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-right">
                    <thead className="bg-slate-50/90 text-sm text-slate-500">
                      <tr>
                        <th className="px-4 py-4 font-medium">#</th>
                        <th className="px-4 py-4 font-medium">العميل</th>
                        <th className="px-4 py-4 font-medium">النوع</th>
                        <th className="px-4 py-4 font-medium">التواصل</th>
                        <th className="px-4 py-4 font-medium">الدولة</th>
                        <th className="px-4 py-4 font-medium">الفواتير</th>
                        <th className="px-4 py-4 font-medium">المستحق</th>
                        <th className="px-4 py-4 text-center font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((client) => (
                        <tr
                          key={client.id}
                          className="border-t border-slate-100 transition hover:bg-slate-50/80"
                        >
                          <td className="px-4 py-4 text-sm font-medium text-slate-700">
                            #{client.id}
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <Link
                                href={`/customers/${client.id}`}
                                className="text-sm font-semibold text-slate-950 hover:text-sky-700"
                              >
                                {client.name}
                              </Link>
                              <p className="mt-1 text-xs text-slate-500">
                                {getSafeText(client.address, "لا يوجد عنوان مسجل")}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getClientTypeClasses(
                                client.type
                              )}`}
                            >
                              {getClientTypeLabel(client.type)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">
                            <p>{getSafeText(client.phone)}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {getSafeText(client.email, "لا يوجد بريد")}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">
                            {getSafeText(client.country)}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">{client.invoices}</td>
                          <td className="px-4 py-4 text-sm font-semibold text-emerald-700">
                            {formatMoney(client.due, client.currency)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => setOpenId(client.id)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                              aria-label={`إجراءات ${client.name}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : isLoading ? (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="h-24 animate-pulse rounded-[22px] bg-slate-100" />
                  <div className="mt-4 h-32 animate-pulse rounded-[22px] bg-slate-100" />
                </div>
              ))}
            </section>
          ) : filteredClients.length === 0 ? (
            <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                <UsersRound className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-950">
                لا توجد بطاقات لعرضها الآن
              </h3>
              <p className="mt-2 text-sm text-slate-500">لا توجد نتائج مطابقة للبحث الحالي.</p>
            </section>
          ) : (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredClients.map((client) => (
                <article
                  key={client.id}
                  className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/customers/${client.id}`}
                        className="truncate text-lg font-semibold text-slate-950 hover:text-sky-700"
                      >
                        {client.name}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500">
                        {getSafeText(client.email, "لا يوجد بريد مسجل")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenId(client.id)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                      aria-label={`إجراءات ${client.name}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getClientTypeClasses(
                        client.type
                      )}`}
                    >
                      {getClientTypeLabel(client.type)}
                    </span>
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      #{client.id}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                      <p className="text-xs text-slate-400">الهاتف</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {getSafeText(client.phone)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                      <p className="text-xs text-slate-400">الدولة</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {getSafeText(client.country)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                      <p className="text-xs text-slate-400">الفواتير</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {client.invoices}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                      <p className="text-xs text-slate-400">المستحق</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-700">
                        {formatMoney(client.due, client.currency)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </main>

        <Sidebar activeLabel="العملاء" />
      </div>

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
                  description: "انسخ معلومات التواصل والبيانات الأساسية بسرعة.",
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
              <span className="text-slate-500">النوع</span>
              <span className="font-medium text-slate-900">
                {getClientTypeLabel(selectedClient.type)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">البريد</span>
              <span className="font-medium text-slate-900">
                {getSafeText(selectedClient.email, "لا يوجد")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">الهاتف</span>
              <span className="font-medium text-slate-900">
                {getSafeText(selectedClient.phone, "لا يوجد")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">الحد الائتماني</span>
              <span className="font-medium text-slate-900">
                {formatMoney(selectedClient.creditLimit ?? 0, selectedClient.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">المستحق</span>
              <span className="font-semibold text-emerald-700">
                {formatMoney(selectedClient.due, selectedClient.currency)}
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
