import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";

export default function MailPage() {
  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="البريد" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
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
