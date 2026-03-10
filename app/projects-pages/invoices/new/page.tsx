"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InvoiceForm } from "@/components/invoice/InvoiceForm";
import { useInvoiceForm } from "@/hooks/useInvoiceForm";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";

function NewInvoicePageContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("id")?.trim() || "";
  const invoiceFormState = useInvoiceForm(invoiceId);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-100 text-slate-800">
      <TopNav currentLabel="الفواتير" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1" dir="rtl">
          <InvoiceForm state={invoiceFormState} />
        </main>

        <Sidebar activeLabel="الفواتير" />
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100" />}>
      <NewInvoicePageContent />
    </Suspense>
  );
}
