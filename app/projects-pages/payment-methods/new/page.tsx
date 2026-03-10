"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";
import { PaymentMethodForm } from "@/components/payment-methods/PaymentMethodForm";
import { usePaymentMethodForm } from "@/hooks/usePaymentMethodForm";

export default function NewPaymentMethodPage() {
  const [methodId, setMethodId] = useState<number | null>(null);
  const [isRouteReady, setIsRouteReady] = useState(false);

  useEffect(() => {
    const rawValue =
      new URLSearchParams(window.location.search).get("id")?.trim() || "";
    const parsedValue = Number.parseInt(rawValue, 10);

    setMethodId(Number.isFinite(parsedValue) ? parsedValue : null);
    setIsRouteReady(true);
  }, []);

  const form = usePaymentMethodForm({
    methodId: isRouteReady ? methodId : null,
  });

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
              وسائل الدفع
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {form.isEditMode ? "تعديل وسيلة الدفع" : "إضافة وسيلة دفع جديدة"}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
              حافظت هذه الصفحة على نفس الحقول المتصلة حاليًا بالباكند، مع تنظيم أوضح للفورم ووضع تعديل مباشر عند فتح الصفحة بمعرّف الوسيلة.
            </p>
          </section>

          <PaymentMethodForm
            values={form.values}
            isEditMode={form.isEditMode}
            isLoading={!isRouteReady || form.isLoading}
            isSubmitting={form.isSubmitting}
            loadError={form.loadError}
            submitError={form.submitError}
            successMessage={form.successMessage}
            onChange={form.updateField}
            onSubmit={form.submit}
          />
        </main>

        <Sidebar activeLabel="وسائل الدفع" />
      </div>
    </div>
  );
}
