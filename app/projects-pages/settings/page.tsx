import Sidebar from "../../components/Sidebar";
import ThemeToggle from "../../components/ThemeToggle";
import SidebarToggle from "../../components/SidebarToggle";

const toolbarItems = ["B", "I", "U", "S", "•", "❐", "◉", "↺", "↻"];

export default function SettingsPage() {
  const fields = [
    { label: "اسم الموقع", value: "شركة البرمجيات" },
    { label: "رابط الموقع", value: "https://example.com" },
    {
      label: "البريد الإلكتروني للموقع",
      value: "example@example.com",
      lock: true,
    },
    { label: "العناصر لكل صفحة", value: "20" },
  ];

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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right text-lg font-semibold text-slate-700">
              الإعدادات
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">
                إلغاء
              </button>
              <button className="rounded-full bg-brand-900 px-4 py-2 text-sm text-white">
                حفظ
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 text-right text-sm font-semibold text-slate-700">
                البيانات الأساسية
              </div>
              <div className="space-y-4">
                {fields.map((field) => (
                  <div key={field.label} className="flex flex-wrap items-center gap-4">
                    <label className="min-w-[170px] text-right text-sm font-semibold text-slate-700">
                      {field.label}
                    </label>
                    <div className="relative flex-1">
                      <input
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                        defaultValue={field.value}
                      />
                      {field.lock && (
                        <span
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          aria-hidden="true"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M7 11V8a5 5 0 0 1 10 0v3" />
                            <rect x="5" y="11" width="14" height="9" rx="2" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap items-center gap-4">
                  <label className="min-w-[170px] text-right text-sm font-semibold text-slate-700">
                    العملة الافتراضية
                  </label>
                  <select className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                    <option>ريال عماني</option>
                    <option>ريال سعودي</option>
                    <option>دولار أمريكي</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="min-w-[170px] text-right text-sm font-semibold text-slate-700">
                    المظهر
                  </label>
                  <div className="flex-1">
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 text-right text-sm font-semibold text-slate-700">
                العلامة التجارية
              </div>
              <div className="space-y-4">
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
                  منطقة الشعار
                </div>
                <div className="space-y-2 text-right text-sm">
                  <div className="font-semibold text-slate-700">شركة البرمجيات</div>
                  <div className="text-xs text-slate-500">برمجة وتطوير</div>
                  <button className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600">
                    رفع شعار جديد
                  </button>
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-right text-sm font-semibold text-slate-700">
              تفاصيل الفاتورة
            </div>
            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2 text-slate-500">
                {toolbarItems.map((item) => (
                  <button
                    key={item}
                    className="rounded-md px-2 py-1 text-xs hover:bg-slate-100"
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 p-4 lg:grid-cols-[1fr_240px]">
                <textarea
                  rows={8}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  defaultValue="أهلاً بكم، يسعدنا خدمتك. سيتم إرسال الفاتورة مع جميع التفاصيل عبر البريد الإلكتروني."
                />
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-right text-sm">
                  <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500" />
                  <p className="font-semibold text-slate-700">شركة البرمجيات</p>
                  <p className="text-xs text-slate-500">برمجة وتطوير</p>
                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <p>البريد: example@example.com</p>
                    <p>الهاتف: 123456789</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Sidebar activeLabel="الإعدادات" />
      </div>
    </div>
  );
}
