"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";
import {
  countryOptions,
  toCountryApiValue,
  type CountryApiValue,
} from "../../../lib/api-lookups";
import { getErrorMessage } from "../../../lib/fetcher";
import {
  createClient,
  getClient,
  updateClient,
  type ClientPaymentMethod,
  type ClientType,
} from "../../../services/clients";
import type { Client } from "../../../types";

type ClientFormState = {
  name: string;
  clientType: ClientType;
  phone: string;
  email: string;
  country: CountryApiValue;
  address: string;
  taxNumber: string;
  commercialRegister: string;
  creditLimit: string;
  openingBalance: string;
  paymentMethod: ClientPaymentMethod;
  notes: string;
};

const paymentMethods: Array<{ value: ClientPaymentMethod; label: string }> = [
  { value: "cash", label: "نقدي" },
  { value: "transfer", label: "تحويل بنكي" },
  { value: "card", label: "بطاقة" },
  { value: "credit", label: "آجل" },
];

const defaultCountry = countryOptions[0]?.value ?? ("Saudi Arabia" as CountryApiValue);

const initialFormState: ClientFormState = {
  name: "",
  clientType: "individual",
  phone: "",
  email: "",
  country: defaultCountry,
  address: "",
  taxNumber: "",
  commercialRegister: "",
  creditLimit: "0",
  openingBalance: "0",
  paymentMethod: "cash",
  notes: "",
};

const normalizeCountrySelection = (value: string | undefined): CountryApiValue => {
  if (!value) {
    return defaultCountry;
  }

  const normalizedValue = toCountryApiValue(value);
  const matchedCountry = countryOptions.find((country) => country.value === normalizedValue);
  return matchedCountry?.value ?? defaultCountry;
};

const normalizeClientType = (value: string | undefined): ClientType => {
  return value === "company" ? "company" : "individual";
};

const normalizePaymentMethod = (value: string | undefined): ClientPaymentMethod => {
  if (value === "bank_transfer") {
    return "transfer";
  }

  const matchedPaymentMethod = paymentMethods.find((paymentMethod) => paymentMethod.value === value);
  return matchedPaymentMethod?.value ?? "cash";
};

const mapClientToFormState = (client: Client): ClientFormState => ({
  name: client.name || "",
  clientType: normalizeClientType(client.type),
  phone: client.phone === "-" ? "" : client.phone,
  email: client.email === "-" ? "" : client.email,
  country: normalizeCountrySelection(client.country),
  address: client.address === "-" ? "" : client.address,
  taxNumber: client.taxNumber === "-" || !client.taxNumber ? "" : client.taxNumber,
  commercialRegister:
    client.commercialRegister === "-" || !client.commercialRegister
      ? ""
      : client.commercialRegister,
  creditLimit: String(client.creditLimit ?? 0),
  openingBalance: String(client.openingBalance ?? 0),
  paymentMethod: normalizePaymentMethod(client.defaultPaymentMethod),
  notes: client.internalNotes === "-" || !client.internalNotes ? "" : client.internalNotes,
});

function ClientFormPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = Number(searchParams.get("id"));
  const isEditMode = Number.isFinite(clientId) && clientId > 0;

  const [form, setForm] = useState<ClientFormState>(initialFormState);
  const [saveMessage, setSaveMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingClient, setIsLoadingClient] = useState(false);

  const pageTitle = useMemo(
    () => (isEditMode ? "تعديل العميل" : "إضافة عميل جديد"),
    [isEditMode]
  );

  const submitLabel = useMemo(
    () => (isSubmitting ? "جارٍ الحفظ..." : isEditMode ? "حفظ التعديلات" : "حفظ"),
    [isEditMode, isSubmitting]
  );

  const updateField = <K extends keyof ClientFormState>(
    key: K,
    value: ClientFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    let active = true;

    const loadClientData = async () => {
      if (!isEditMode) {
        setForm(initialFormState);
        return;
      }

      setIsLoadingClient(true);
      setErrorMessage("");
      setSaveMessage("");

      try {
        const client = await getClient(clientId);

        if (!active) {
          return;
        }

        if (!client) {
          setErrorMessage("تعذر العثور على بيانات العميل.");
          return;
        }

        setForm(mapClientToFormState(client));
      } catch (error) {
        if (!active) {
          return;
        }

        setErrorMessage(getErrorMessage(error, "تعذر تحميل بيانات العميل."));
      } finally {
        if (active) {
          setIsLoadingClient(false);
        }
      }
    };

    void loadClientData();

    return () => {
      active = false;
    };
  }, [clientId, isEditMode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveMessage("");
    setErrorMessage("");
    setIsSubmitting(true);

    const payload = {
      name: form.name.trim(),
      type: form.clientType,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      country: form.country,
      address: form.address.trim() || undefined,
      taxNumber: form.taxNumber.trim() || undefined,
      commercialRegister: form.commercialRegister.trim() || undefined,
      creditLimit: Math.max(0, Number.parseFloat(form.creditLimit) || 0),
      openingBalance: Number.parseFloat(form.openingBalance) || 0,
      defaultPaymentMethod: form.paymentMethod,
      internalNotes: form.notes.trim() || undefined,
    } as const;

    try {
      if (isEditMode) {
        const updatedClient = await updateClient(clientId, payload);
        setForm(mapClientToFormState(updatedClient));
        setSaveMessage("تم تحديث بيانات العميل بنجاح.");
      } else {
        await createClient(payload);
        setSaveMessage("تم حفظ بيانات العميل بنجاح.");
        setForm((prev) => ({
          ...initialFormState,
          country: prev.country,
          paymentMethod: prev.paymentMethod,
        }));
      }
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          isEditMode ? "تعذر تحديث بيانات العميل." : "تعذر حفظ بيانات العميل."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="العملاء" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right text-lg font-semibold text-slate-700">{pageTitle}</div>
            <button
              type="button"
              onClick={() => router.push("/projects-pages/clients")}
              className="rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-600"
            >
              رجوع
            </button>
          </div>

          {isLoadingClient ? (
            <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
              جارٍ تحميل بيانات العميل...
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h2 className="text-sm font-bold text-slate-800">معلومات أساسية</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">الاسم *</label>
                  <input
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    disabled={isLoadingClient || isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">نوع العميل</label>
                  <select
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={form.clientType}
                    onChange={(event) =>
                      updateField("clientType", event.target.value as ClientType)
                    }
                    disabled={isLoadingClient || isSubmitting}
                  >
                    <option value="individual">فرد</option>
                    <option value="company">شركة</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">الهاتف</label>
                  <input
                    type="tel"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    disabled={isLoadingClient || isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">البريد</label>
                  <input
                    type="email"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    disabled={isLoadingClient || isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">الدولة</label>
                  <select
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={form.country}
                    onChange={(event) =>
                      updateField("country", event.target.value as CountryApiValue)
                    }
                    disabled={isLoadingClient || isSubmitting}
                  >
                    {countryOptions.map((country) => (
                      <option key={country.value} value={country.value}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">العنوان</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.address}
                    onChange={(event) => updateField("address", event.target.value)}
                    disabled={isLoadingClient || isSubmitting}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h2 className="text-sm font-bold text-slate-800">معلومات مالية</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">الرقم الضريبي</label>
                  <input
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.taxNumber}
                    onChange={(event) => updateField("taxNumber", event.target.value)}
                    disabled={isLoadingClient || isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">السجل التجاري</label>
                  <input
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.commercialRegister}
                    onChange={(event) =>
                      updateField("commercialRegister", event.target.value)
                    }
                    disabled={isLoadingClient || isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">الحد الائتماني</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.creditLimit}
                    onChange={(event) => updateField("creditLimit", event.target.value)}
                    disabled={isLoadingClient || isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    الرصيد الافتتاحي
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.openingBalance}
                    onChange={(event) => updateField("openingBalance", event.target.value)}
                    disabled={isLoadingClient || isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    طريقة الدفع الافتراضية
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={form.paymentMethod}
                    onChange={(event) =>
                      updateField("paymentMethod", event.target.value as ClientPaymentMethod)
                    }
                    disabled={isLoadingClient || isSubmitting}
                  >
                    {paymentMethods.map((paymentMethod) => (
                      <option key={paymentMethod.value} value={paymentMethod.value}>
                        {paymentMethod.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h2 className="text-sm font-bold text-slate-800">إضافي</h2>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">ملاحظات</label>
                <textarea
                  rows={4}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  disabled={isLoadingClient || isSubmitting}
                />
              </div>
            </section>

            {saveMessage ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {saveMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isLoadingClient || isSubmitting}
                className="rounded-full bg-brand-900 px-8 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitLabel}
              </button>
              <Link
                href="/projects-pages/clients"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
              >
                إلغاء
              </Link>
            </div>
          </form>
        </main>

        <Sidebar activeLabel="العملاء" />
      </div>
    </div>
  );
}

export default function NewClientPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-slate-100 text-slate-800">
          <TopNav currentLabel="العملاء" />
          <div className="px-4 py-6 text-center text-sm text-slate-600">جارٍ تحميل الصفحة...</div>
        </div>
      }
    >
      <ClientFormPageInner />
    </Suspense>
  );
}
