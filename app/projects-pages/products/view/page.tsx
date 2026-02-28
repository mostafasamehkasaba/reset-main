import Sidebar from "../../../components/Sidebar";
import SidebarToggle from "../../../components/SidebarToggle";

export default function ProductViewPage() {
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
            <div className="text-right text-lg font-semibold text-slate-700">
              بيانات المنتج
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">اسم المنتج</label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  قالب ووردبريس
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">الفئة</label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  تصميم
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">السعر</label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  USD 20
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">الكمية المباعة</label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">1</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <label className="text-sm font-semibold text-slate-700">الوصف</label>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                لا يوجد
              </div>
            </div>
          </div>
        </main>

        <Sidebar activeLabel="المنتجات" />
      </div>
    </div>
  );
}
