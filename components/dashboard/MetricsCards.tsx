import type { LucideIcon } from "lucide-react";

export type MetricCardItem = {
  id: string;
  title: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: "sky" | "emerald" | "amber" | "rose" | "slate";
};

const toneClasses: Record<NonNullable<MetricCardItem["tone"]>, string> = {
  sky: "border-sky-100 bg-sky-50 text-sky-700",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  rose: "border-rose-100 bg-rose-50 text-rose-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
};

export default function MetricsCards({ items }: { items: MetricCardItem[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <article
            key={item.id}
            className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.22)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{item.title}</p>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                  {item.value}
                </p>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${toneClasses[item.tone || "slate"]}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-500">{item.hint}</p>
          </article>
        );
      })}
    </section>
  );
}
