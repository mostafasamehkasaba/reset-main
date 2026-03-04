import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";

export default function PaymentMethodViewPage() {
  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="وسائل الدفع" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right text-lg font-semibold text-slate-700">بيانات وسيلة الدفع</div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">الاسم</label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">البنك الوطني</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">النوع</label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">بنكي</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">المجموع</label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">OMR 20</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">الوصف</label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">أحمد 1233456789</div>
              </div>
            </div>
          </div>
        </main>

        <Sidebar activeLabel="وسائل الدفع" />
      </div>
    </div>
  );
}
