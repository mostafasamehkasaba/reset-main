"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";
import { getErrorMessage } from "../../lib/fetcher";
import {
  emptyMailSettings,
  getMailSettings,
  saveMailSettings,
  type MailSettings,
} from "../../services/mail-settings";

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

        const hasSavedData = Boolean(
          data.updatedAt ||
            data.contactEmail ||
            data.smtpHost ||
            data.smtpUsername ||
            data.smtpPassword
        );

        setIsEditing(!hasSavedData);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getErrorMessage(error, "تعذر تحميل إعدادات البريد."));
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

  const updateField = <K extends keyof MailSettings>(key: K, value: MailSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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

    setForm(emptyMailSettings);
  };

  const lastUpdatedLabel = useMemo(
    () => formatUpdatedAt(savedSnapshot?.updatedAt ?? null),
    [savedSnapshot]
  );
  const isReadOnly = !isEditing || isSubmitting || isLoading;

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="البريد" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="space-y-1 text-right">
              <div className="text-lg font-semibold text-slate-700">البريد</div>
              {lastUpdatedLabel ? (
                <div className="text-xs text-slate-500">آخر حفظ: {lastUpdatedLabel}</div>
              ) : (
                <div className="text-xs text-slate-500">أدخل إعدادات البريد ثم احفظها.</div>
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

          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                البريد الإلكتروني للتواصل
              </label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(event) => updateField("contactEmail", event.target.value)}
                disabled={isReadOnly}
                className={`${inputClassName} ${!isEditing ? "opacity-80" : "border-slate-200 bg-white"}`}
              />
              <p className="text-xs text-slate-500">
                سيتم استخدام هذا البريد لإرسال الرسائل والتنبيهات إلى العملاء.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">مضيف SMTP</label>
                <input
                  value={form.smtpHost}
                  onChange={(event) => updateField("smtpHost", event.target.value)}
                  disabled={isReadOnly}
                  className={`${inputClassName} ${!isEditing ? "opacity-80" : "border-slate-200 bg-white"}`}
                  placeholder="smtp.example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">منفذ SMTP</label>
                <input
                  type="number"
                  min="1"
                  max="65535"
                  value={form.smtpPort}
                  onChange={(event) => updateField("smtpPort", event.target.value)}
                  disabled={isReadOnly}
                  className={`${inputClassName} ${!isEditing ? "opacity-80" : "border-slate-200 bg-white"}`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">مستخدم SMTP</label>
                <input
                  value={form.smtpUsername}
                  onChange={(event) => updateField("smtpUsername", event.target.value)}
                  disabled={isReadOnly}
                  className={`${inputClassName} ${!isEditing ? "opacity-80" : "border-slate-200 bg-white"}`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">كلمة مرور SMTP</label>
                <input
                  type="password"
                  value={form.smtpPassword}
                  onChange={(event) => updateField("smtpPassword", event.target.value)}
                  disabled={isReadOnly}
                  className={`${inputClassName} ${!isEditing ? "opacity-80" : "border-slate-200 bg-white"}`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">تمكين TLS</p>
                <p className="text-xs text-slate-500">
                  فعّل التشفير عند استخدام خادم SMTP الخارجي.
                </p>
              </div>

              <label className={`flex items-center gap-2 text-sm ${isReadOnly ? "opacity-70" : "text-slate-700"}`}>
                <input
                  type="checkbox"
                  checked={form.tlsEnabled}
                  onChange={(event) => updateField("tlsEnabled", event.target.checked)}
                  disabled={isReadOnly}
                  className="h-4 w-4"
                />
                TLS
              </label>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
              جارٍ تحميل إعدادات البريد...
            </div>
          ) : null}
        </main>

        <Sidebar activeLabel="البريد" />
      </div>
    </div>
  );
}
