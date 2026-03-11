"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Building2,
  CreditCard,
  FileText,
  Globe2,
  Landmark,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  UserRound,
  Wallet,
} from "lucide-react";
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
  currency: string;
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

const currencyOptions = [
  { value: "OMR", label: "ريال عماني" },
  { value: "SAR", label: "ريال سعودي" },
  { value: "USD", label: "دولار أمريكي" },
  { value: "EGP", label: "جنيه مصري" },
  { value: "QAR", label: "ريال قطري" },
] as const;

const defaultCountry = countryOptions[0]?.value ?? ("Saudi Arabia" as CountryApiValue);

const initialFormState: ClientFormState = {
  name: "",
  clientType: "individual",
  phone: "",
  email: "",
  country: defaultCountry,
  currency: "OMR",
  address: "",
  taxNumber: "",
  commercialRegister: "",
  creditLimit: "0",
  openingBalance: "0",
  paymentMethod: "cash",
  notes: "",
};

const fieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

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
  currency: client.currency || "OMR",
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

const getClientTypeLabel = (value: ClientType) => (value === "company" ? "شركة" : "فرد");

function SectionCard({
  title,
  description,
  icon,
  children,
  className = "",
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="flex items-start gap-3 border-b border-slate-200 pb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Feedback({
  tone,
  message,
}: {
  tone: "error" | "success" | "info";
  message: string;
}) {
  const classes =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "info"
        ? "border-sky-200 bg-sky-50 text-sky-800"
        : "border-rose-200 bg-rose-50 text-rose-700";

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${classes}`}>{message}</div>;
}

function ClientFormPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = Number(searchParams.get("id"));
  const isEditMode = Number.isFinite(clientId) && clientId > 0;
  const redirectTimeoutRef = useRef<number | null>(null);

  const [form, setForm] = useState<ClientFormState>(initialFormState);
  const [saveMessage, setSaveMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingClient, setIsLoadingClient] = useState(false);

  const pageTitle = useMemo(
    () => (isEditMode ? "تعديل العميل" : "إضافة عميل جديد"),
    [isEditMode]
  );

  const pageDescription = useMemo(
    () =>
      isEditMode
        ? "حدّث بيانات العميل الحالية مع الحفاظ على نفس منطق الحفظ."
        : "أضف عميلًا جديدًا داخل نموذج منظم وواضح.",
    [isEditMode]
  );

  const submitLabel = useMemo(
    () => (isSubmitting ? "جارٍ الحفظ..." : isEditMode ? "حفظ التعديلات" : "حفظ العميل"),
    [isEditMode, isSubmitting]
  );

  const selectedPaymentMethodLabel = useMemo(
    () => paymentMethods.find((item) => item.value === form.paymentMethod)?.label ?? "نقدي",
    [form.paymentMethod]
  );

  const updateField = <K extends keyof ClientFormState>(
    key: K,
    value: ClientFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

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
        if (!active) return;

        if (!client) {
          setErrorMessage("تعذر العثور على بيانات العميل.");
          return;
        }

        setForm(mapClientToFormState(client));
      } catch (error) {
        if (!active) return;
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
      currency: form.currency,
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
        if (redirectTimeoutRef.current !== null) {
          window.clearTimeout(redirectTimeoutRef.current);
        }
        redirectTimeoutRef.current = window.setTimeout(() => {
          router.push("/customers");
        }, 1200);
      } else {
        await createClient(payload);
        setSaveMessage("تم حفظ بيانات العميل بنجاح.");
        setForm((prev) => ({
          ...initialFormState,
          country: prev.country,
          currency: prev.currency,
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
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">العملاء</p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-950">{pageTitle}</h1>
                <p className="mt-2 text-sm text-slate-500">{pageDescription}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                  {getClientTypeLabel(form.clientType)}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                  {form.country}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                  {form.currency}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                  {selectedPaymentMethodLabel}
                </span>
                <Link
                  href="/customers"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  رجوع
                </Link>
              </div>
            </div>
          </section>

          {isLoadingClient ? (
            <Feedback tone="info" message="جارٍ تحميل بيانات العميل..." />
          ) : null}

          {saveMessage ? <Feedback tone="success" message={saveMessage} /> : null}
          {errorMessage ? <Feedback tone="error" message={errorMessage} /> : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
              <SectionCard
                title="معلومات أساسية"
                description="بيانات التواصل والتعريف الأساسية للعميل."
                icon={<UserRound className="h-5 w-5" />}
                className="h-full"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Wallet className="h-4 w-4 text-slate-400" />
                      العملة
                    </span>
                    <select
                      className={fieldClassName}
                      value={form.currency}
                      onChange={(event) => updateField("currency", event.target.value)}
                      disabled={isLoadingClient || isSubmitting}
                    >
                      {currencyOptions.map((currency) => (
                        <option key={currency.value} value={currency.value}>
                          {currency.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-semibold text-slate-700">الاسم *</span>
                    <input
                      className={fieldClassName}
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      disabled={isLoadingClient || isSubmitting}
                      required
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      نوع العميل
                    </span>
                    <select
                      className={fieldClassName}
                      value={form.clientType}
                      onChange={(event) =>
                        updateField("clientType", event.target.value as ClientType)
                      }
                      disabled={isLoadingClient || isSubmitting}
                    >
                      <option value="individual">فرد</option>
                      <option value="company">شركة</option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Phone className="h-4 w-4 text-slate-400" />
                      الهاتف
                    </span>
                    <input
                      type="tel"
                      inputMode="tel"
                      dir="rtl"
                      className={`${fieldClassName} text-right`}
                      value={form.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      disabled={isLoadingClient || isSubmitting}
                      required
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Mail className="h-4 w-4 text-slate-400" />
                      البريد الإلكتروني
                    </span>
                    <input
                      type="email"
                      className={fieldClassName}
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      disabled={isLoadingClient || isSubmitting}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Globe2 className="h-4 w-4 text-slate-400" />
                      الدولة
                    </span>
                    <select
                      className={fieldClassName}
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
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      العنوان
                    </span>
                    <textarea
                      rows={4}
                      className={fieldClassName}
                      value={form.address}
                      onChange={(event) => updateField("address", event.target.value)}
                      disabled={isLoadingClient || isSubmitting}
                    />
                  </label>
                </div>
              </SectionCard>

              <SectionCard
                title="الفوترة والائتمان"
                description="البيانات المالية الافتراضية المستخدمة مع العميل."
                icon={<Wallet className="h-5 w-5" />}
                className="h-full"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <ReceiptText className="h-4 w-4 text-slate-400" />
                      الرقم الضريبي
                    </span>
                    <input
                      className={fieldClassName}
                      value={form.taxNumber}
                      onChange={(event) => updateField("taxNumber", event.target.value)}
                      disabled={isLoadingClient || isSubmitting}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Landmark className="h-4 w-4 text-slate-400" />
                      السجل التجاري
                    </span>
                    <input
                      className={fieldClassName}
                      value={form.commercialRegister}
                      onChange={(event) =>
                        updateField("commercialRegister", event.target.value)
                      }
                      disabled={isLoadingClient || isSubmitting}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Wallet className="h-4 w-4 text-slate-400" />
                      الحد الائتماني
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={fieldClassName}
                      value={form.creditLimit}
                      onChange={(event) => updateField("creditLimit", event.target.value)}
                      disabled={isLoadingClient || isSubmitting}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <CreditCard className="h-4 w-4 text-slate-400" />
                      الرصيد الافتتاحي
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      className={fieldClassName}
                      value={form.openingBalance}
                      onChange={(event) => updateField("openingBalance", event.target.value)}
                      disabled={isLoadingClient || isSubmitting}
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <CreditCard className="h-4 w-4 text-slate-400" />
                      طريقة الدفع الافتراضية
                    </span>
                    <select
                      className={fieldClassName}
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
                  </label>
                </div>
              </SectionCard>
            </div>

            <SectionCard
              title="ملاحظات إضافية"
              description="أي معلومات داخلية تساعد فريقك على التعامل مع العميل."
              icon={<FileText className="h-5 w-5" />}
            >
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">ملاحظات</span>
                <textarea
                  rows={5}
                  className={fieldClassName}
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  disabled={isLoadingClient || isSubmitting}
                />
              </label>
            </SectionCard>

            <div className="flex flex-wrap items-center justify-end gap-3 rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <Link
                href="/customers"
                className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                إلغاء
              </Link>
              <button
                type="submit"
                disabled={isLoadingClient || isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {submitLabel}
              </button>
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
