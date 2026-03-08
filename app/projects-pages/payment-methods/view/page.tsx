"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";
import { getErrorMessage } from "../../../lib/fetcher";
import { listPaymentMethods, type PaymentMethod } from "../../../services/payment-methods";

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

    loadData();
    return () => {
      active = false;
    };
  }, [methodId, methodIdParam]);

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="وسائل الدفع" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right text-lg font-semibold text-slate-700">بيانات وسيلة الدفع</div>
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
              جاري تحميل بيانات وسيلة الدفع...
            </div>
          ) : method ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">الاسم</label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    {method.name}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">النوع</label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    {method.type || "-"}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">المجموع</label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    {method.currency} {method.total}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">الوصف</label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    {method.desc}
                  </div>
                </div>
              </div>
            </div>
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
