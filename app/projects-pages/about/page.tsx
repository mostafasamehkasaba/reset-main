import type { ReactNode } from "react";
import { Blocks, CircleHelp, ShieldCheck, Sparkles } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";

function InfoCard({ title, children, icon }: { title: string; children: ReactNode; icon: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">{icon}</div>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="حول" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">حول النظام</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">منصة عربية لإدارة العمل اليومي</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">هذه المنصة تجمع إدارة العملاء والموردين والمستخدمين والفواتير والإعدادات داخل واجهة عربية موحدة، مع تركيز على التنظيم العملي وسرعة الوصول للبيانات الأساسية.</p>
          </section>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">اللغة</p><p className="mt-2 text-lg font-semibold text-slate-900">واجهة عربية</p></div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">الهيكلة</p><p className="mt-2 text-lg font-semibold text-slate-900">أقسام موحدة</p></div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">التخصيص</p><p className="mt-2 text-lg font-semibold text-slate-900">إعدادات مرنة</p></div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">الغرض</p><p className="mt-2 text-lg font-semibold text-slate-900">إدارة وتشغيل</p></div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <InfoCard title="ما الذي يقدمه النظام" icon={<Blocks className="h-5 w-5" />}>
              <p>تنظيم العملاء والموردين والمستخدمين داخل صفحات موحدة وواضحة.</p>
              <p>إدارة الفواتير والملاحظات والإعدادات العامة والبريد من مكان واحد.</p>
              <p>واجهة مناسبة للاستخدام العربي مع ترتيب واضح للبيانات والإجراءات.</p>
            </InfoCard>

            <InfoCard title="الاستخدام والترخيص" icon={<ShieldCheck className="h-5 w-5" />}>
              <p>يُستخدم النظام داخل مشروع أو شركة واحدة وفق نطاق الترخيص المتفق عليه.</p>
              <p>لا يشمل ذلك إعادة البيع أو إعادة التوزيع أو النشر كمنتج مستقل.</p>
              <p>إذا احتجت استخدامه في أكثر من جهة، فالأفضل توفير ترخيص أو اتفاق إضافي.</p>
            </InfoCard>

            <InfoCard title="ملاحظات مهمة" icon={<CircleHelp className="h-5 w-5" />}>
              <p>هذه الصفحة تقدم ملخصًا سريعًا وليست بديلًا عن أي شروط أو اتفاقات كاملة.</p>
              <p>راجع إعدادات المنصة والبريد دوريًا لضمان بقاء البيانات ووسائل التواصل محدثة.</p>
            </InfoCard>

            <InfoCard title="اتجاه المنتج" icon={<Sparkles className="h-5 w-5" />}>
              <p>الهدف من التصميم الحالي هو البساطة والوضوح وسرعة الإنجاز، لا الزخرفة الزائدة.</p>
              <p>كل قسم داخل النظام يمكن تطويره بصريًا مع الحفاظ على نفس منطق التشغيل والبيانات.</p>
            </InfoCard>
          </div>
        </main>

        <Sidebar activeLabel="حول" />
      </div>
    </div>
  );
}


