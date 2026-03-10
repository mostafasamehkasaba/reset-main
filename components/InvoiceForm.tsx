import type { ReactNode } from "react";
import { invoiceWorkflow } from "@/lib/invoiceTypes";

export default function InvoiceForm({
  title,
  description,
  children,
  aside,
}: {
  title: string;
  description: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
        <div className="border-b border-slate-200 pb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            Invoice Workflow
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">{description}</p>
        </div>
        <div className="mt-5">{children}</div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            Workflow
          </h3>
          <div className="mt-4 space-y-3">
            {invoiceWorkflow.map((step, index) => (
              <div key={step.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">{step.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {aside}
      </aside>
    </section>
  );
}
