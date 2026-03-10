import {
  BadgeDollarSign,
  FileText,
  type LucideIcon,
  UserPlus,
} from "lucide-react";

export type RecentActivityItem = {
  id: string;
  type: "invoice_created" | "payment_received" | "customer_added";
  title: string;
  description: string;
  timestampLabel: string;
};

const activityIconMap: Record<RecentActivityItem["type"], LucideIcon> = {
  invoice_created: FileText,
  payment_received: BadgeDollarSign,
  customer_added: UserPlus,
};

const activityToneMap: Record<RecentActivityItem["type"], string> = {
  invoice_created: "border-sky-100 bg-sky-50 text-sky-700",
  payment_received: "border-emerald-100 bg-emerald-50 text-emerald-700",
  customer_added: "border-violet-100 bg-violet-50 text-violet-700",
};

export default function RecentActivity({ items }: { items: RecentActivityItem[] }) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.24)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
            النشاط
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">النشاط الأخير</h2>
          <p className="mt-1 text-sm text-slate-500">
            آخر التغييرات المهمة على الفواتير والعملاء والتحصيل.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          {items.length} أحدث العناصر
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {items.length > 0 ? (
          items.map((item) => {
            const Icon = activityIconMap[item.type];

            return (
              <div
                key={item.id}
                className="flex items-start gap-4 rounded-[22px] border border-slate-100 bg-slate-50/80 p-4 transition hover:border-slate-200 hover:bg-white"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${activityToneMap[item.type]}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                    <span className="text-xs font-medium text-slate-400">{item.timestampLabel}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            لا يوجد نشاط حديث حتى الآن.
          </div>
        )}
      </div>
    </article>
  );
}
