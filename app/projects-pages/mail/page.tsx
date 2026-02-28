import Sidebar from "../../components/Sidebar";
import SidebarToggle from "../../components/SidebarToggle";

export default function MailPage() {
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
            <div className="text-right text-lg font-semibold text-slate-700">البريد</div>
          </div>

          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">البريد الإلكتروني للتواصل</label>
              <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
              <p className="text-xs text-slate-500">
                سيتم استخدام هذا البريد الإلكتروني لإرسال رسائل البريد الإلكتروني. اتركه فارغًا لاستخدام بريد SMTP.
              </p>
            </div>

            {[
              { label: "مضيف SMTP", value: "" },
              { label: "مستخدم SMTP", value: "" },
              { label: "كلمة مرور SMTP", value: "" },
              { label: "منفذ SMTP", value: "" },
            ].map((field) => (
              <div key={field.label} className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">{field.label}</label>
                <input
                  type={field.label.includes("كلمة مرور") ? "password" : "text"}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" defaultChecked className="h-4 w-4" />
                تمكين TLS
              </label>
              <button className="rounded-full bg-brand-900 px-8 py-2 text-sm text-white">حفظ</button>
            </div>
          </div>
        </main>

        <Sidebar activeLabel="البريد" />
      </div>
    </div>
  );
}
