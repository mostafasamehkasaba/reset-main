"use client";

import { FormEvent, useMemo, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CircleAlert,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { getErrorMessage } from "@/app/lib/fetcher";
import {
  AUTH_DASHBOARD_PATH,
  getSafeAuthRedirect,
  loginWithEmail,
  requestPasswordReset,
  startSocialLogin,
  type SocialAuthProvider,
} from "@/lib/auth/authService";
import {
  hasValidationErrors,
  validateEmail,
  validateLoginValues,
  validatePassword,
  type LoginFormErrors,
  type LoginFormValues,
} from "@/lib/auth/authValidation";
import SocialLogin from "./SocialLogin";

function Field({
  label,
  hint,
  error,
  icon,
  endAdornment,
  headerAction,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  icon: ReactNode;
  endAdornment?: ReactNode;
  headerAction?: ReactNode;
}) {
  return (
    <label className="block text-right">
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
        <span>{label}</span>
        <span className="flex items-center gap-3">
          {hint ? <span className="text-xs font-medium text-slate-400">{hint}</span> : null}
          {headerAction}
        </span>
      </span>

      <span
        className={`flex min-h-12 items-center gap-3 rounded-2xl border bg-slate-50 px-3.5 transition ${
          error
            ? "border-rose-200 bg-rose-50/70"
            : "border-slate-200 focus-within:border-sky-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
        }`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
          {icon}
        </span>
        <input
          {...props}
          className={`min-w-0 flex-1 bg-transparent py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 ${
            props.dir === "ltr" ? "text-left" : "text-right"
          }`}
        />
        {endAdornment ? <span className="shrink-0">{endAdornment}</span> : null}
      </span>

      {error ? <p className="mt-2 text-xs font-medium text-rose-700">{error}</p> : null}
    </label>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [values, setValues] = useState<LoginFormValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [socialProvider, setSocialProvider] = useState<SocialAuthProvider | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");
  const [isForgotPasswordSubmitting, setIsForgotPasswordSubmitting] = useState(false);

  const nextPath = useMemo(
    () => getSafeAuthRedirect(searchParams.get("next"), AUTH_DASHBOARD_PATH),
    [searchParams]
  );

  const registrationSuccess = searchParams.get("registered") === "1";
  const isBusy = isSubmitting || socialProvider !== null;

  const updateField = (key: keyof LoginFormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setErrorMessage("");
  };

  const validateSingleField = (key: keyof LoginFormValues, value: string) => {
    const nextError = key === "email" ? validateEmail(value) : validatePassword(value);
    setErrors((current) => ({ ...current, [key]: nextError }));
    return nextError;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const nextErrors = validateLoginValues(values);
    setErrors(nextErrors);

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    setIsSubmitting(true);

    try {
      await loginWithEmail({
        email: values.email.trim(),
        password: values.password,
      });

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setForgotPasswordError("");
    setForgotPasswordSuccess("");

    const emailToUse = forgotPasswordEmail.trim();
    const emailError = validateEmail(emailToUse);
    if (emailError) {
      setForgotPasswordError(emailError);
      return;
    }

    setIsForgotPasswordSubmitting(true);

    try {
      await requestPasswordReset(emailToUse);
      setForgotPasswordSuccess(
        "إذا كان البريد الإلكتروني مسجلاً، فسيتم إرسال رابط استعادة كلمة المرور إليه."
      );
    } catch (error) {
      setForgotPasswordError(getErrorMessage(error, "تعذر بدء استعادة كلمة المرور."));
    } finally {
      setIsForgotPasswordSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: SocialAuthProvider) => {
    setErrorMessage("");
    setSocialProvider(provider);

    try {
      await startSocialLogin(provider, nextPath);
    } catch (error) {
      setSocialProvider(null);
      setErrorMessage(getErrorMessage(error, "تعذر بدء تسجيل الدخول بواسطة المزود المحدد."));
    }
  };

  return (
    <div className="space-y-5">
      {registrationSuccess ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p>تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول الآن.</p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field
          label="البريد الإلكتروني"
          icon={<Mail className="h-4.5 w-4.5" />}
          type="email"
          value={values.email}
          onChange={(event) => updateField("email", event.target.value)}
          onBlur={(event) => validateSingleField("email", event.target.value)}
          placeholder="name@example.com"
          autoComplete="email"
          dir="ltr"
          error={errors.email}
          required
        />

        <Field
          label="كلمة المرور"
          hint="8 أحرف أو أكثر"
          icon={<LockKeyhole className="h-4.5 w-4.5" />}
          type={showPassword ? "text" : "password"}
          value={values.password}
          onChange={(event) => updateField("password", event.target.value)}
          onBlur={(event) => validateSingleField("password", event.target.value)}
          autoComplete="current-password"
          dir="ltr"
          error={errors.password}
          required
          headerAction={
            <button
              type="button"
              onClick={() => {
                setIsForgotPasswordOpen((current) => !current);
                setForgotPasswordEmail((current) => current || values.email.trim());
                setForgotPasswordError("");
                setForgotPasswordSuccess("");
              }}
              className="text-xs font-semibold text-sky-700 transition hover:text-sky-800"
            >
              نسيت كلمة المرور؟
            </button>
          }
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          سيتم تحويلك إلى لوحة التحكم بعد نجاح تسجيل الدخول، مع حفظ الجلسة محليًا.
        </div>

        <button
          type="submit"
          disabled={isBusy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_-20px_rgba(2,132,199,0.6)] transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : null}
          <span>{isSubmitting ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}</span>
        </button>
      </form>

      {isForgotPasswordOpen ? (
        <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">استعادة كلمة المرور</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(false)}
              className="text-xs font-semibold text-slate-500 transition hover:text-slate-700"
            >
              إغلاق
            </button>
          </div>

          <form onSubmit={handleForgotPasswordSubmit} className="mt-4 space-y-3" noValidate>
            <Field
              label="البريد الإلكتروني"
              icon={<Mail className="h-4.5 w-4.5" />}
              type="email"
              value={forgotPasswordEmail}
              onChange={(event) => {
                setForgotPasswordEmail(event.target.value);
                setForgotPasswordError("");
                setForgotPasswordSuccess("");
              }}
              placeholder="name@example.com"
              autoComplete="email"
              dir="ltr"
              error={forgotPasswordError}
              required
            />

            {forgotPasswordSuccess ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {forgotPasswordSuccess}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isForgotPasswordSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isForgotPasswordSubmitting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : null}
              <span>{isForgotPasswordSubmitting ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}</span>
            </button>
          </form>
        </div>
      ) : null}

      <SocialLogin
        activeProvider={socialProvider}
        disabled={isSubmitting}
        onSelect={handleSocialLogin}
      />
    </div>
  );
}
