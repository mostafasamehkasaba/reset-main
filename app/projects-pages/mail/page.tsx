"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";
import { getErrorMessage } from "../../lib/fetcher";
import { emptyMailSettings, getMailSettings, saveMailSettings, type MailSettings } from "../../services/mail-settings";

const fieldClassName = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const formatUpdatedAt = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </article>
  );
}

export default function MailPage() {
  const [form, setForm] = useState<MailSettings>(emptyMailSettings);
  const [savedSnapshot, setSavedSnapshot] = useState<MailSettings | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const data = await getMailSettings();
        if (!active) return;
        setForm(data);
        setSavedSnapshot(data);
        const hasSavedData = Boolean(data.updatedAt || data.contactEmail || data.smtpHost || data.smtpUsername || data.smtpPassword);
        setIsEditing(!hasSavedData);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getErrorMessage(error, "تعذر تحميل إعدادات البريد."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadData();
    return () => {
      active = false;
    };
  }, []);

  const updateField = <K extends keyof MailSettings>(key: K, value: MailSettings[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);
    try {
      const saved = await saveMailSettings(form);
      setForm(saved);
      setSavedSnapshot(saved);
      setIsEditing(false);
      setSuccessMessage("تم حفظ إعدادات البريد بنجاح.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "تعذر حفظ إعدادات البريد."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setErrorMessage("");
    setSuccessMessage("");
    if (savedSnapshot) {
      setForm(savedSnapshot);
      setIsEditing(false);
      return;
    }
    setForm(emptyMailSettings);
  };

  const isReadOnly = !isEditing || isSubmitting || isLoading;
  const lastUpdated = useMemo(() => formatUpdatedAt(savedSnapshot?.updatedAt ?? null), [savedSnapshot]);
  const configState = form.contactEmail && form.smtpHost && form.smtpUsername ? "جاهز مبدئيًا" : "يحتاج استكمال";

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="البريد" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">إعدادات البريد</p>
                <h1 className="mt-2 text-xl font-semibold text-slate-950">التواصل والإرسال</h1>
                <p className="mt-2 text-sm text-slate-500">اضبط بريد التواصل وخادم SMTP وحالة التشفير من شاشة واحدة مباشرة.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {isEditing ? (
                  <>
                    <button type="button" onClick={handleCancelEdit} disabled={isSubmitting} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">إلغاء</button>
                    <button type="button" onClick={() => void handleSave()} disabled={isSubmitting || isLoading} className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">{isSubmitting ? "جارٍ الحفظ..." : "حفظ"}</button>
                  </>
                ) : (
                  <button type="button" onClick={() => { setErrorMessage(""); setSuccessMessage(""); setIsEditing(true); }} className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">تعديل</button>
                )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="آخر تحديث" value={lastUpdated} />
            <StatCard title="حالة الإعداد" value={configState} />
            <StatCard title="المنفذ" value={form.smtpPort || "-"} />
            <StatCard title="TLS" value={form.tlsEnabled ? "مفعّل" : "متوقف"} />
          </section>

          {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div> : null}
          {successMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div> : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_340px]">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">بيانات الإرسال</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700 md:col-span-2">بريد التواصل<input type="email" className={fieldClassName} value={form.contactEmail} onChange={(event) => updateField("contactEmail", event.target.value)} disabled={isReadOnly} /></label>
                <label className="text-sm font-medium text-slate-700">خادم SMTP<input className={fieldClassName} value={form.smtpHost} onChange={(event) => updateField("smtpHost", event.target.value)} disabled={isReadOnly} placeholder="smtp.example.com" /></label>
                <label className="text-sm font-medium text-slate-700">المنفذ<input type="number" min="1" max="65535" className={fieldClassName} value={form.smtpPort} onChange={(event) => updateField("smtpPort", event.target.value)} disabled={isReadOnly} /></label>
                <label className="text-sm font-medium text-slate-700">اسم المستخدم<input className={fieldClassName} value={form.smtpUsername} onChange={(event) => updateField("smtpUsername", event.target.value)} disabled={isReadOnly} /></label>
                <label className="text-sm font-medium text-slate-700">كلمة المرور<input type="password" className={fieldClassName} value={form.smtpPassword} onChange={(event) => updateField("smtpPassword", event.target.value)} disabled={isReadOnly} /></label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:col-span-2">
                  <div className="flex items-center justify-between gap-4">
                    <div><p className="text-sm font-semibold text-slate-900">تفعيل TLS</p><p className="mt-1 text-xs text-slate-500">فعّل التشفير عند استخدام خادم SMTP الخارجي.</p></div>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.tlsEnabled} onChange={(event) => updateField("tlsEnabled", event.target.checked)} disabled={isReadOnly} className="h-4 w-4" />TLS</label>
                  </div>
                </div>
              </div>
            </section>

            <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">ملخص سريع</h2>
              <div className="mt-4 space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">البريد</span><span className="font-medium text-slate-900">{form.contactEmail || "-"}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">الخادم</span><span className="font-medium text-slate-900">{form.smtpHost || "-"}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">المستخدم</span><span className="font-medium text-slate-900">{form.smtpUsername || "-"}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">TLS</span><span className="font-medium text-slate-900">{form.tlsEnabled ? "مفعّل" : "متوقف"}</span></div>
              </div>
            </aside>
          </div>
        </main>

        <Sidebar activeLabel="البريد" />
      </div>
    </div>
  );
}
