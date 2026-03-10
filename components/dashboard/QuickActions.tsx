import Link from "next/link";
import { FilePlus2, PackagePlus, UserRoundPlus, type LucideIcon } from "lucide-react";

type QuickActionItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

const actions: QuickActionItem[] = [
  {
    id: "invoice",
    label: "إنشاء فاتورة",
    description: "أنشئ فاتورة جديدة وابدأ دورة التحصيل مباشرة.",
    href: "/invoices/new",
    icon: FilePlus2,
  },
  {
    id: "customer",
    label: "إضافة عميل",
    description: "أضف عميلًا جديدًا لتتبع الفواتير والمديونية.",
    href: "/customers/new",
    icon: UserRoundPlus,
  },
  {
    id: "product",
    label: "إضافة منتج",
    description: "أضف منتجًا أو خدمة جديدة لتسعير الفواتير بسرعة.",
    href: "/products/new",
    icon: PackagePlus,
  },
];

export default function QuickActions() {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.25)]">
      <div>
        <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
          الإجراءات
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">إجراءات سريعة</h2>
        <p className="mt-1 text-sm text-slate-500">اختصارات مباشرة لأهم المهام اليومية.</p>
      </div>

      <div className="mt-6 space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.id}
              href={action.href}
              className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-sky-200 hover:bg-sky-50/70"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-100 bg-white text-sky-700 transition group-hover:bg-sky-100">
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-950">{action.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </article>
  );
}
