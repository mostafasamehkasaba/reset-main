import Link from "next/link";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";

export default function NewPaymentMethodPage() {
  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="وسائل الدفع" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right text-lg font-semibold text-slate-700">وسيلة دفع جديدة</div>
            <Link
              href="/projects-pages/payment-methods"
              className="rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-600"
            >
              رجوع
            </Link>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">اسم الوسيلة</label>
                <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">النوع</label>
                <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option>بنكي</option>
                  <option>بطاقة</option>
                  <option>محفظة رقمية</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">العملة</label>
                <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option>USD</option>
                  <option>OMR</option>
                  <option>SAR</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">الوصف</label>
                <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button className="rounded-full bg-brand-900 px-8 py-2 text-sm text-white">حفظ</button>
              <Link
                href="/projects-pages/payment-methods"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
              >
                إلغاء
              </Link>
            </div>
          </div>
        </main>

        <Sidebar activeLabel="وسائل الدفع" />
      </div>
    </div>
  );
}
