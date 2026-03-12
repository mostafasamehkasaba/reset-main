"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import UnitForm from "@/components/UnitForm";
import Sidebar from "@/app/components/Sidebar";
import TopNav from "@/app/components/TopNav";

function NewUnitPageContent() {
  const searchParams = useSearchParams();
  const idQuery = searchParams.get("id");
  const id = idQuery ? Number(idQuery) : null;

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="المنتجات" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">
              {id ? "تعديل الوحدة" : "إضافة وحدة قياس جديدة"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {id
                ? "قم بتحديث بيانات وحدة القياس الحالية."
                : "املأ النموذج أدناه لإضافة وحدة قياس جديدة إلى النظام."}
            </p>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <UnitForm id={id} />
          </section>
        </main>

        <Sidebar activeLabel="المنتجات" />
      </div>
    </div>
  );
}

export default function NewUnitPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-100">تحميل...</div>}>
      <NewUnitPageContent />
    </Suspense>
  );
}
