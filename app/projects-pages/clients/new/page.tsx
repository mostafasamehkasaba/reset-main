"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";

type ClientType = "individual" | "company";

type ClientFormState = {
  name: string;
  clientType: ClientType;
  phone: string;
  email: string;
  country: string;
  address: string;
  taxNumber: string;
  creditLimit: string;
  openingBalance: string;
  paymentMethod: string;
  notes: string;
};

const countryOptions = [
  "مصر",
  "السعودية",
  "الإمارات",
  "قطر",
  "الكويت",
  "عُمان",
  "البحرين",
  "الأردن",
  "تونس",
  "الجزائر",
];

const paymentMethods = ["نقدي", "تحويل بنكي", "بطاقة", "آجل", "شيك"];

const initialFormState: ClientFormState = {
  name: "",
  clientType: "individual",
  phone: "",
  email: "",
  country: "مصر",
  address: "",
  taxNumber: "",
  creditLimit: "0",
  openingBalance: "0",
  paymentMethod: "نقدي",
  notes: "",
};

export default function NewClientPage() {
  const [form, setForm] = useState<ClientFormState>(initialFormState);
  const [saveMessage, setSaveMessage] = useState("");

  const updateField = <K extends keyof ClientFormState>(
    key: K,
    value: ClientFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveMessage("تم حفظ بيانات العميل بنجاح.");
    setForm((prev) => ({
      ...initialFormState,
      country: prev.country,
      paymentMethod: prev.paymentMethod,
    }));
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="العملاء" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right text-lg font-semibold text-slate-700">
              إضافة عميل جديد
            </div>
            <Link
              href="/projects-pages/clients"
              className="rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-600"
            >
              رجوع
            </Link>
          </div>

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
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    نوع العميل
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={form.clientType}
                    onChange={(event) =>
                      updateField("clientType", event.target.value as ClientType)
                    }
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
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">الدولة</label>
                  <select
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={form.country}
                    onChange={(event) => updateField("country", event.target.value)}
                  >
                    {countryOptions.map((country) => (
                      <option key={country} value={country}>
                        {country}
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
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h2 className="text-sm font-bold text-slate-800">معلومات مالية</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    الرقم الضريبي
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.taxNumber}
                    onChange={(event) => updateField("taxNumber", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    الحد الائتماني
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.creditLimit}
                    onChange={(event) => updateField("creditLimit", event.target.value)}
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
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    طريقة الدفع الافتراضية
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={form.paymentMethod}
                    onChange={(event) => updateField("paymentMethod", event.target.value)}
                  >
                    {paymentMethods.map((paymentMethod) => (
                      <option key={paymentMethod} value={paymentMethod}>
                        {paymentMethod}
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
                />
              </div>
            </section>

            {saveMessage ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {saveMessage}
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="rounded-full bg-brand-900 px-8 py-2 text-sm text-white"
              >
                حفظ
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
