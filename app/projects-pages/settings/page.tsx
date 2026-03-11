"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../../components/Sidebar";
import ThemeToggle from "../../components/ThemeToggle";
import TopNav from "../../components/TopNav";
import { getErrorMessage } from "../../lib/fetcher";
import { emptySettings, getSettings, saveSettings, type AppSettings } from "../../services/settings";

const currencyOptions = [
  { value: "OMR", label: "ريال عماني" },
  { value: "SAR", label: "ريال سعودي" },
  { value: "USD", label: "دولار أمريكي" },
  { value: "EGP", label: "جنيه مصري" },
  { value: "QAR", label: "ريال قطري" },
  { value: "AED", label: "درهم إماراتي" },
  { value: "KWD", label: "دينار كويتي" },
];
const fieldClassName = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const formatUpdatedAt = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("تعذر قراءة ملف الشعار.")));
    reader.onerror = () => reject(new Error("تعذر قراءة ملف الشعار."));
    reader.readAsDataURL(file);
  });

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </article>
  );
}

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<AppSettings>(emptySettings);
  const [savedSnapshot, setSavedSnapshot] = useState<AppSettings | null>(null);
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
        const data = await getSettings();
        if (!active) return;
        setForm(data);
        setSavedSnapshot(data);
        const hasSavedData = Boolean(data.updatedAt || data.siteName || data.siteEmail || data.siteUrl || data.sitePhone || data.companyTagline || data.logoDataUrl);
        setIsEditing(!hasSavedData);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getErrorMessage(error, "تعذر تحميل الإعدادات."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadData();
    return () => {
      active = false;
    };
  }, []);

  const updateField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);
    try {
      const saved = await saveSettings(form);
      setForm(saved);
      setSavedSnapshot(saved);
      setIsEditing(false);
      setSuccessMessage("تم حفظ الإعدادات بنجاح.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "تعذر حفظ الإعدادات."));
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
    setForm(emptySettings);
  };

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("يرجى اختيار صورة صالحة للشعار.");
      return;
    }
    if (file.size > 1024 * 1024 * 2) {
      setErrorMessage("حجم الشعار يجب ألا يتجاوز 2 ميجابايت.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setErrorMessage("");
      setForm((prev) => ({ ...prev, logoDataUrl: dataUrl }));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "تعذر قراءة ملف الشعار."));
    }
  };

  const isReadOnly = !isEditing || isSubmitting || isLoading;
  const lastUpdated = useMemo(() => formatUpdatedAt(savedSnapshot?.updatedAt ?? null), [savedSnapshot]);

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="الإعدادات" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">إعدادات المنصة</p>
                <h1 className="mt-2 text-xl font-semibold text-slate-950">البيانات العامة</h1>
                <p className="mt-2 text-sm text-slate-500">تحكم في بيانات المنصة والهوية وملاحظات الفواتير من شاشة واحدة واضحة.</p>
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
            <StatCard title="العملة" value={form.defaultCurrency || "-"} />
            <StatCard title="العناصر لكل صفحة" value={form.itemsPerPage || "-"} />
            <StatCard title="حالة التحرير" value={isEditing ? "وضع التعديل" : "عرض فقط"} />
          </section>

          {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div> : null}
          {successMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div> : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_360px]">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">بيانات المنصة</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">اسم المنصة<input className={fieldClassName} value={form.siteName} onChange={(event) => updateField("siteName", event.target.value)} disabled={isReadOnly} /></label>
                <label className="text-sm font-medium text-slate-700">رابط المنصة<input className={fieldClassName} value={form.siteUrl} onChange={(event) => updateField("siteUrl", event.target.value)} disabled={isReadOnly} placeholder="https://example.com" /></label>
                <label className="text-sm font-medium text-slate-700">البريد الإلكتروني<input type="email" className={fieldClassName} value={form.siteEmail} onChange={(event) => updateField("siteEmail", event.target.value)} disabled={isReadOnly} /></label>
                <label className="text-sm font-medium text-slate-700">رقم الهاتف<input type="tel" inputMode="tel" dir="rtl" className={`${fieldClassName} text-right`} value={form.sitePhone} onChange={(event) => updateField("sitePhone", event.target.value)} disabled={isReadOnly} /></label>
                <label className="text-sm font-medium text-slate-700">العناصر لكل صفحة<input type="number" min="1" className={fieldClassName} value={form.itemsPerPage} onChange={(event) => updateField("itemsPerPage", event.target.value)} disabled={isReadOnly} /></label>
                <label className="text-sm font-medium text-slate-700">العملة<select className={fieldClassName} value={form.defaultCurrency} onChange={(event) => updateField("defaultCurrency", event.target.value)} disabled={isReadOnly}>{currencyOptions.map((currency) => <option key={currency.value} value={currency.value}>{currency.label}</option>)}</select></label>
                <label className="text-sm font-medium text-slate-700 md:col-span-2">وصف النشاط<input className={fieldClassName} value={form.companyTagline} onChange={(event) => updateField("companyTagline", event.target.value)} disabled={isReadOnly} /></label>
                <div className="text-sm font-medium text-slate-700 md:col-span-2">المظهر<div className={`${isReadOnly ? "pointer-events-none opacity-60" : ""} mt-3`}><ThemeToggle /></div></div>
              </div>
            </section>

            <aside className="space-y-4">
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">الهوية</h2>
                <div className="mt-4 overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-slate-50">
                  {form.logoDataUrl ? <img src={form.logoDataUrl} alt="الشعار" className="h-48 w-full object-contain p-5" /> : <div className="flex h-48 items-center justify-center text-sm text-slate-500">لا يوجد شعار</div>}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} disabled={isReadOnly} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isReadOnly} className="mt-4 w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">{form.logoDataUrl ? "تغيير الشعار" : "رفع شعار"}</button>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">ملاحظات الفاتورة</h2>
                <textarea rows={8} className={`${fieldClassName} mt-4`} value={form.invoiceNotes} onChange={(event) => updateField("invoiceNotes", event.target.value)} disabled={isReadOnly} />
              </section>
            </aside>
          </div>
        </main>

        <Sidebar activeLabel="الإعدادات" />
      </div>
    </div>
  );
}
