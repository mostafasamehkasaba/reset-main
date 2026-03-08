"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../../components/Sidebar";
import ThemeToggle from "../../components/ThemeToggle";
import TopNav from "../../components/TopNav";
import { getErrorMessage } from "../../lib/fetcher";
import { emptySettings, getSettings, saveSettings, type AppSettings } from "../../services/settings";

const toolbarItems = ["B", "I", "U", "S", "•", "❐", "◉", "↺", "↻"];
const currencyOptions = ["ريال عماني", "ريال سعودي", "دولار أمريكي", "جنيه مصري"];

const inputClassName =
  "w-full rounded-md border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500";

const formatUpdatedAt = (value: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("تعذر قراءة ملف الشعار."));
    };
    reader.onerror = () => reject(new Error("تعذر قراءة ملف الشعار."));
    reader.readAsDataURL(file);
  });

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

        const hasSavedData = Boolean(
          data.updatedAt ||
            data.siteName ||
            data.siteEmail ||
            data.siteUrl ||
            data.sitePhone ||
            data.companyTagline ||
            data.logoDataUrl
        );

        setIsEditing(!hasSavedData);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getErrorMessage(error, "تعذر تحميل الإعدادات."));
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const updateField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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

  const handleStartEdit = () => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsEditing(true);
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

  const handleLogoButtonClick = () => {
    if (!isEditing || isSubmitting) return;
    fileInputRef.current?.click();
  };

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("يرجى اختيار ملف صورة صالح للشعار.");
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

  const lastUpdatedLabel = useMemo(() => formatUpdatedAt(savedSnapshot?.updatedAt ?? null), [savedSnapshot]);
  const isReadOnly = !isEditing || isSubmitting || isLoading;

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="الإعدادات" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="space-y-1 text-right">
              <div className="text-lg font-semibold text-slate-700">الإعدادات</div>
              {lastUpdatedLabel ? (
                <div className="text-xs text-slate-500">آخر حفظ: {lastUpdatedLabel}</div>
              ) : (
                <div className="text-xs text-slate-500">أدخل البيانات ثم احفظها.</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={isSubmitting || isLoading}
                    className="rounded-full bg-brand-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "جارٍ الحفظ..." : "حفظ"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                >
                  تعديل
                </button>
              )}
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 text-right text-sm font-semibold text-slate-700">
                البيانات الأساسية
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="min-w-[170px] text-right text-sm font-semibold text-slate-700">
                    اسم الموقع
                  </label>
                  <div className="flex-1">
                    <input
                      className={`${inputClassName} ${!isEditing ? "opacity-80" : "border-slate-200 bg-white"}`}
                      value={form.siteName}
                      onChange={(event) => updateField("siteName", event.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="min-w-[170px] text-right text-sm font-semibold text-slate-700">
                    رابط الموقع
                  </label>
                  <div className="flex-1">
                    <input
                      className={`${inputClassName} ${!isEditing ? "opacity-80" : "border-slate-200 bg-white"}`}
                      value={form.siteUrl}
                      onChange={(event) => updateField("siteUrl", event.target.value)}
                      disabled={isReadOnly}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="min-w-[170px] text-right text-sm font-semibold text-slate-700">
                    البريد الإلكتروني للموقع
                  </label>
                  <div className="flex-1">
                    <input
                      type="email"
                      className={`${inputClassName} ${!isEditing ? "opacity-80" : "border-slate-200 bg-white"}`}
                      value={form.siteEmail}
                      onChange={(event) => updateField("siteEmail", event.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="min-w-[170px] text-right text-sm font-semibold text-slate-700">
                    هاتف الشركة
                  </label>
                  <div className="flex-1">
                    <input
                      className={`${inputClassName} ${!isEditing ? "opacity-80" : "border-slate-200 bg-white"}`}
                      value={form.sitePhone}
                      onChange={(event) => updateField("sitePhone", event.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="min-w-[170px] text-right text-sm font-semibold text-slate-700">
                    العناصر لكل صفحة
                  </label>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="1"
                      className={`${inputClassName} ${!isEditing ? "opacity-80" : "border-slate-200 bg-white"}`}
                      value={form.itemsPerPage}
                      onChange={(event) => updateField("itemsPerPage", event.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="min-w-[170px] text-right text-sm font-semibold text-slate-700">
                    العملة الافتراضية
                  </label>
                  <select
                    className={`${inputClassName} flex-1 ${!isEditing ? "opacity-80" : "border-slate-200 bg-white"}`}
                    value={form.defaultCurrency}
                    onChange={(event) => updateField("defaultCurrency", event.target.value)}
                    disabled={isReadOnly}
                  >
                    {currencyOptions.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="min-w-[170px] text-right text-sm font-semibold text-slate-700">
                    وصف النشاط
                  </label>
                  <div className="flex-1">
                    <input
                      className={`${inputClassName} ${!isEditing ? "opacity-80" : "border-slate-200 bg-white"}`}
                      value={form.companyTagline}
                      onChange={(event) => updateField("companyTagline", event.target.value)}
                      disabled={isReadOnly}
                      placeholder="مثال: برمجة وتطوير"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="min-w-[170px] text-right text-sm font-semibold text-slate-700">
                    المظهر
                  </label>
                  <div className={`${!isEditing ? "pointer-events-none opacity-60" : ""} flex-1`}>
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
                <div className="overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
                  {form.logoDataUrl ? (
                    <img
                      src={form.logoDataUrl}
                      alt="شعار الشركة"
                      className={`h-48 w-full object-contain p-4 transition ${!isEditing ? "opacity-75" : ""}`}
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center p-4 text-center text-sm text-slate-500">
                      منطقة الشعار
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-right text-sm">
                  <div className="font-semibold text-slate-700">
                    {form.siteName || "اسم الشركة"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {form.companyTagline || "وصف النشاط"}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                    disabled={isReadOnly}
                  />

                  <button
                    type="button"
                    onClick={handleLogoButtonClick}
                    disabled={isReadOnly}
                    className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {form.logoDataUrl ? "تغيير الشعار" : "رفع شعار جديد"}
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
                    type="button"
                    disabled
                    className="rounded-md px-2 py-1 text-xs"
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 p-4 lg:grid-cols-[1fr_240px]">
                <textarea
                  rows={8}
                  className={`${inputClassName} ${!isEditing ? "opacity-80" : "border-slate-200 bg-white"}`}
                  value={form.invoiceNotes}
                  onChange={(event) => updateField("invoiceNotes", event.target.value)}
                  disabled={isReadOnly}
                />
                <div className={`rounded-md border border-slate-200 bg-slate-50 p-4 text-right text-sm transition ${!isEditing ? "opacity-80" : ""}`}>
                  {form.logoDataUrl ? (
                    <img
                      src={form.logoDataUrl}
                      alt="شعار المعاينة"
                      className="mx-auto mb-3 h-14 w-14 rounded-xl object-contain bg-white p-2 shadow-sm"
                    />
                  ) : (
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-xs font-bold text-white">
                      LOGO
                    </div>
                  )}
                  <p className="font-semibold text-slate-700">{form.siteName || "اسم الشركة"}</p>
                  <p className="text-xs text-slate-500">{form.companyTagline || "وصف النشاط"}</p>
                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <p>البريد: {form.siteEmail || "-"}</p>
                    <p>الهاتف: {form.sitePhone || "-"}</p>
                    <p>الرابط: {form.siteUrl || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
              جارٍ تحميل الإعدادات...
            </div>
          ) : null}
        </main>

        <Sidebar activeLabel="الإعدادات" />
      </div>
    </div>
  );
}
