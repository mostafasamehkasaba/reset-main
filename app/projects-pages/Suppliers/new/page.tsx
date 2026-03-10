"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";
import {
  countryOptions,
  supplierStatusOptions,
  type CountryApiValue,
  type SupplierStatusApiValue,
} from "../../../lib/api-lookups";
import { getErrorMessage } from "../../../lib/fetcher";
import { createSupplier } from "../../../services/suppliers";

type SupplierFormState = {
  name: string;
  email: string;
  phone: string;
  country: CountryApiValue;
  city: string;
  address: string;
  taxNumber: string;
  paymentTermDays: 30 | 60;
  creditLimit: string;
  openingBalance: string;
  bankAccountNumber: string;
  bankName: string;
  iban: string;
  status: SupplierStatusApiValue;
  notes: string;
};

const paymentTerms: Array<30 | 60> = [30, 60];

const initialFormState: SupplierFormState = {
  name: "",
  email: "",
  phone: "",
  country: countryOptions[0].value,
  city: "",
  address: "",
  taxNumber: "",
  paymentTermDays: 30,
  creditLimit: "0",
  openingBalance: "0",
  bankAccountNumber: "",
  bankName: "",
  iban: "",
  status: supplierStatusOptions[0].value,
  notes: "",
};

export default function NewSupplierPage() {
  const router = useRouter();
  const [form, setForm] = useState<SupplierFormState>(initialFormState);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof SupplierFormState>(
    key: K,
    value: SupplierFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!form.name.trim() || !form.phone.trim()) {
      setErrorMessage("يرجى إدخال اسم المورد والهاتف على الأقل.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createSupplier({
        name: form.name.trim(),
        email: form.email.trim() || "-",
        phone: form.phone.trim(),
        country: form.country.trim() || "-",
        city: form.city.trim() || "-",
        address: form.address.trim() || "-",
        taxNumber: form.taxNumber.trim() || "-",
        paymentTermDays: form.paymentTermDays,
        creditLimit: Math.max(0, Number.parseFloat(form.creditLimit) || 0),
        openingBalance: Math.max(0, Number.parseFloat(form.openingBalance) || 0),
        bankAccountNumber: form.bankAccountNumber.trim() || "-",
        bankName: form.bankName.trim() || "-",
        iban: form.iban.trim() || "-",
        status: form.status,
        notes: form.notes.trim() || "-",
      });

      router.push("/projects-pages/Suppliers");
      router.refresh();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "تعذر حفظ المورد."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="الموردين" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right text-lg font-semibold text-slate-700">
              إضافة مورد جديد
            </div>
            <Link
              href="/projects-pages/Suppliers"
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
                  <label className="text-sm font-semibold text-slate-700">اسم المورد *</label>
                  <input
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">الهاتف *</label>
                  <input
                    type="tel"
                    inputMode="tel"
                    dir="rtl"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-right text-sm"
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
                    onChange={(event) =>
                      updateField("country", event.target.value as CountryApiValue)
                    }
                  >
                    {countryOptions.map((country) => (
                      <option key={country.value} value={country.value}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">المدينة</label>
                  <input
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.city}
                    onChange={(event) => updateField("city", event.target.value)}
                    placeholder="مثال: القاهرة"
                  />
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">العنوان</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.address}
                    onChange={(event) => updateField("address", event.target.value)}
                    placeholder="العنوان الكامل"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h2 className="text-sm font-bold text-slate-800">معلومات مالية</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    الرقم الضريبي للمورد
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.taxNumber}
                    onChange={(event) => updateField("taxNumber", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">مدة السداد</label>
                  <select
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={form.paymentTermDays}
                    onChange={(event) =>
                      updateField(
                        "paymentTermDays",
                        Number(event.target.value) as SupplierFormState["paymentTermDays"]
                      )
                    }
                  >
                    {paymentTerms.map((term) => (
                      <option key={term} value={term}>
                        {term} يوم
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    حد ائتماني للمورد
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
                    min="0"
                    step="0.01"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.openingBalance}
                    onChange={(event) => updateField("openingBalance", event.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h2 className="text-sm font-bold text-slate-800">بيانات البنك</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    رقم الحساب البنكي
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.bankAccountNumber}
                    onChange={(event) => updateField("bankAccountNumber", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">اسم البنك</label>
                  <input
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.bankName}
                    onChange={(event) => updateField("bankName", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">IBAN</label>
                  <input
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.iban}
                    onChange={(event) => updateField("iban", event.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h2 className="text-sm font-bold text-slate-800">إضافي</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">الحالة</label>
                  <select
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={form.status}
                    onChange={(event) =>
                      updateField("status", event.target.value as SupplierStatusApiValue)
                    }
                  >
                    {supplierStatusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">ملاحظات</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.notes}
                    onChange={(event) => updateField("notes", event.target.value)}
                    placeholder="ملاحظات إضافية عن المورد"
                  />
                </div>
              </div>
            </section>

            {errorMessage ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-brand-900 px-8 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "جارٍ حفظ المورد..." : "حفظ المورد"}
              </button>
              <Link
                href="/projects-pages/Suppliers"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
              >
                إلغاء
              </Link>
            </div>
          </form>
        </main>

        <Sidebar activeLabel="الموردين" />
      </div>
    </div>
  );
}
