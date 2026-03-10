"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";
import { getErrorMessage } from "../../../lib/fetcher";
import { listPaymentMethods, type PaymentMethod } from "../../../services/payment-methods";
import {
  formatPaymentMethodDate,
  formatPaymentMethodTotal,
  getPaymentMethodTypeLabel,
} from "@/lib/payment-methods/paymentMethodTypes";

function PaymentMethodViewPageContent() {
  const searchParams = useSearchParams();
  const methodIdParam = searchParams.get("id");
  const methodId = methodIdParam ? Number(methodIdParam) : Number.NaN;

  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      if (!methodIdParam || !Number.isFinite(methodId)) {
        setErrorMessage("لم يتم تحديد وسيلة الدفع.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listPaymentMethods();
        if (!active) return;

        const selected = data.find((entry) => entry.id === methodId) ?? null;
        if (!selected) {
          setErrorMessage("تعذر العثور على وسيلة الدفع المطلوبة.");
        }

        setMethod(selected);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getErrorMessage(error, "تعذر تحميل بيانات وسيلة الدفع."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadData();
    return () => {
      active = false;
    };
  }, [methodId, methodIdParam]);

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900">
      <TopNav currentLabel="وسائل الدفع" />

      <div
        className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6"
        dir="ltr"
      >
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <section className="rounded-[32px] border border-slate-200 bg-white px-5 py-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.3)] sm:px-6">
            <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
              تفاصيل الوسيلة
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {method?.name || "بيانات وسيلة الدفع"}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
              عرض مباشر لنفس البيانات المحمّلة من الباكند بدون أي تغيير في هيكلها.
            </p>
          </section>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.22)]"
                >
                  <div className="h-16 animate-pulse rounded-[22px] bg-slate-100" />
                  <div className="mt-4 h-20 animate-pulse rounded-[22px] bg-slate-100" />
                </div>
              ))}
            </section>
          ) : method ? (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.22)]">
                  <p className="text-xs font-medium tracking-[0.18em] text-slate-400">
                    النوع
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {getPaymentMethodTypeLabel(method.type)}
                  </p>
                </article>
                <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.22)]">
                  <p className="text-xs font-medium tracking-[0.18em] text-slate-400">
                    عدد الدفعات
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {method.payments}
                  </p>
                </article>
                <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.22)]">
                  <p className="text-xs font-medium tracking-[0.18em] text-slate-400">
                    الإجمالي
                  </p>
                  <p className="mt-2 text-lg font-semibold text-emerald-700">
                    {formatPaymentMethodTotal(method.total, method.currency)}
                  </p>
                </article>
                <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.22)]">
                  <p className="text-xs font-medium tracking-[0.18em] text-slate-400">
                    تاريخ الإنشاء
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatPaymentMethodDate(method.createdAt)}
                  </p>
                </article>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                    <p className="text-xs text-slate-400">اسم الوسيلة</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {method.name}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                    <p className="text-xs text-slate-400">العملة</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {method.currency}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 lg:col-span-2">
                    <p className="text-xs text-slate-400">الوصف</p>
                    <p className="mt-1 text-sm leading-7 text-slate-600">
                      {method.desc || "-"}
                    </p>
                  </div>
                </div>
              </section>
            </>
          ) : null}
        </main>

        <Sidebar activeLabel="وسائل الدفع" />
      </div>
    </div>
  );
}

function PaymentMethodViewPageFallback() {
  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="وسائل الدفع" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
            جاري تحميل بيانات وسيلة الدفع...
          </div>
        </main>

        <Sidebar activeLabel="وسائل الدفع" />
      </div>
    </div>
  );
}

export default function PaymentMethodViewPage() {
  return (
    <Suspense fallback={<PaymentMethodViewPageFallback />}>
      <PaymentMethodViewPageContent />
    </Suspense>
  );
}
