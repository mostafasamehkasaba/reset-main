"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";
import { getErrorMessage } from "../../../lib/fetcher";
import { createPaymentMethod } from "../../../services/payment-methods";

const paymentTypes = [
  { value: "bank", label: "بنكي" },
  { value: "card", label: "بطاقة" },
  { value: "wallet", label: "محفظة رقمية" },
];

const currencyOptions = ["USD", "OMR", "SAR"];

export default function NewPaymentMethodPage() {
  const [name, setName] = useState("");
  const [methodType, setMethodType] = useState(paymentTypes[0]?.value ?? "bank");
  const [currency, setCurrency] = useState(currencyOptions[0] ?? "USD");
  const [desc, setDesc] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveMessage("");
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("يرجى إدخال اسم وسيلة الدفع.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createPaymentMethod({
        name: name.trim(),
        desc: desc.trim() || undefined,
        currency,
        type: methodType,
      });

      setSaveMessage("تم حفظ وسيلة الدفع بنجاح.");
      setName("");
      setDesc("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "تعذر حفظ وسيلة الدفع."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="وسائل الدفع" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right text-lg font-semibold text-slate-700">وسيلة دفع جديدة</div>
            <Link
              href="/projects-pages/payment-methods"
              className="rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-600"
            >
              رجوع
            </Link>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">اسم الوسيلة</label>
                <input
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">النوع</label>
                <select
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={methodType}
                  onChange={(event) => setMethodType(event.target.value)}
                >
                  {paymentTypes.map((entry) => (
                    <option key={entry.value} value={entry.value}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">العملة</label>
                <select
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                >
                  {currencyOptions.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">الوصف</label>
                <input
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={desc}
                  onChange={(event) => setDesc(event.target.value)}
                />
              </div>
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            {saveMessage ? (
              <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {saveMessage}
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-between">
              <button
                type="submit"
                className="rounded-full bg-brand-900 px-8 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
              >
                {isSubmitting ? "جارٍ الحفظ..." : "حفظ"}
              </button>
              <Link
                href="/projects-pages/payment-methods"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
              >
                إلغاء
              </Link>
            </div>
          </form>
        </main>

        <Sidebar activeLabel="وسائل الدفع" />
      </div>
    </div>
  );
}
