import Sidebar from "../../components/Sidebar";
import SidebarToggle from "../../components/SidebarToggle";

export default function AboutPage() {
  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <header className="bg-brand-900 text-white shadow-sm" dir="ltr">
        <div className="flex h-14 w-full items-center justify-between px-6">
          <div className="flex items-center gap-3 text-slate-200">
            <SidebarToggle />
          </div>
          <div className="text-right text-base font-semibold">فاتورة+</div>
        </div>
      </header>

      <div className="flex w-full gap-5 px-6 py-6" dir="ltr">
        <main className="flex-1 space-y-4" dir="rtl">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right text-lg font-semibold text-slate-700">حول</div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" dir="rtl">
              <h3 className="mb-4 text-lg font-semibold text-slate-800">رخصة البرنامج</h3>
              <p className="text-sm font-semibold text-slate-700">يمكنك القيام بما يلي</p>
              <ul className="mt-2 list-disc space-y-2 pr-5 text-sm text-slate-600">
                <li>استخدام المنتج الذي اشتريته مرة واحدة فقط.</li>
                <li>تسمح لك الرخصة الشخصية باستخدام المنتج لمشروعك الشخصي أو لمشروع شركتك.</li>
              </ul>
              <p className="mt-4 text-sm font-semibold text-slate-700">لا يمكنك القيام بما يلي</p>
              <ul className="mt-2 list-disc space-y-2 pr-5 text-sm text-slate-600">
                <li>استخدام المنتج أكثر من مرة.</li>
                <li>استخدام المنتج لإنشاء أو تطوير مشاريع للعملاء أو الزبائن.</li>
                <li>إجراء تعديلات على المنتج بهدف بيعه أو إعادة توزيعه مجانًا.</li>
                <li>إعادة نشر المنتج أو توزيعه أو بيعه. ملكية المنتجات في بيكالكا تعود إلى البائع فقط.</li>
              </ul>
              <p className="mt-4 text-xs text-slate-500">
                بشرائك هذا المنتج، فأنت تشتري حق الاستخدام، وليس حق الملكية والنشر.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" dir="rtl">
              <h3 className="mb-4 text-lg font-semibold text-slate-800">ملاحظات إضافية</h3>
              <ul className="mt-2 list-disc space-y-2 pr-5 text-sm text-slate-600">
                <li>الرخصة شخصية وغير قابلة للتحويل.</li>
                <li>لا تشمل الرخصة إعادة البيع أو إعادة التوزيع.</li>
                <li>إذا احتجت استخدام المنتج في أكثر من مشروع، ستحتاج رخصة إضافية.</li>
                <li>للاستخدام التجاري الموسع أو النشر، يُفضَّل التواصل مع مالك الرخصة.</li>
              </ul>
              <p className="mt-4 text-xs text-slate-500">
                هذه المعلومات موجزة. يُرجى الرجوع إلى شروط الرخصة الكاملة عند الحاجة.
              </p>
            </div>
          </div>
        </main>

        <Sidebar activeLabel="حول" />
      </div>
    </div>
  );
}
