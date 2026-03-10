"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";
import { getErrorMessage } from "../../../lib/fetcher";
import {
  createProductUnit,
  listProductUnits,
  type ProductUnitOption,
} from "../../../services/product-units";

export default function ProductUnitsPage() {
  const [name, setName] = useState("");
  const [units, setUnits] = useState<ProductUnitOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listProductUnits();
        if (!active) return;
        setUnits(data);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getErrorMessage(error, "تعذر تحميل وحدات القياس."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadData();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSaveMessage("");

    if (!name.trim()) {
      setErrorMessage("أدخل اسم وحدة القياس.");
      return;
    }

    setIsSubmitting(true);

    try {
      const createdUnit = await createProductUnit(name.trim());
      setUnits((prev) => {
        const exists = prev.some(
          (unit) => unit.name.trim().toLowerCase() === createdUnit.name.trim().toLowerCase()
        );
        return exists ? prev : [...prev, createdUnit];
      });
      setSaveMessage(`تم حفظ وحدة القياس "${createdUnit.name}" بنجاح.`);
      setName("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "تعذر حفظ وحدة القياس."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="المنتجات" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right">
              <p className="text-lg font-semibold text-slate-700">وحدات القياس</p>
              <p className="text-sm text-slate-500">أضف وحدات جديدة لتظهر داخل صفحة المنتج.</p>
            </div>
            <Link
              href="/products/new"
              className="rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-600"
            >
              رجوع
            </Link>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">اسم وحدة القياس</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  placeholder="مثال: علبة / رول / باكيت"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "جارٍ الحفظ..." : "إضافة الوحدة"}
                </button>
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
          </form>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 text-right text-sm font-semibold text-slate-700">
              الوحدات المتاحة
            </div>

            {isLoading ? (
              <div className="rounded-md bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                جاري تحميل وحدات القياس...
              </div>
            ) : units.length === 0 ? (
              <div className="rounded-md bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                لا توجد وحدات قياس حتى الآن.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {units.map((unit) => (
                  <span
                    key={`${unit.id}-${unit.name}`}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      unit.isDefault
                        ? "border-slate-200 bg-slate-50 text-slate-600"
                        : "border-blue-200 bg-blue-50 text-blue-700"
                    }`}
                  >
                    {unit.name}
                  </span>
                ))}
              </div>
            )}
          </section>
        </main>

        <Sidebar activeLabel="المنتجات" />
      </div>
    </div>
  );
}
