"use client";

import Link from "next/link";
import {
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthField from "../../components/auth/AuthField";
import AuthShell, {
  type AuthHighlight,
  type AuthStat,
} from "../../components/auth/AuthShell";
import { getErrorMessage } from "../../lib/fetcher";
import { register } from "../../services/auth";

const getSafeNextPath = (value: string | null) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
};

const registerHighlights: AuthHighlight[] = [
  {
    icon: UserRoundPlus,
    title: "تسجيل مباشر من نفس الواجهة",
    description: "لا حاجة لأي خطوة إضافية قبل بدء استخدام النظام.",
  },
  {
    icon: ShieldCheck,
    title: "تحقق واضح من كلمة المرور",
    description: "حالة التطابق تظهر فورًا داخل النموذج بدل اكتشاف الخطأ بعد الإرسال.",
  },
  {
    icon: Sparkles,
    title: "تحويل ذكي بعد التسجيل",
    description: "إذا أعاد الخادم token يتم الدخول مباشرة، وإلا يتم نقلك إلى شاشة الدخول.",
  },
];

const registerStats: AuthStat[] = [
  { value: "Name", label: "هوية الحساب" },
  { value: "Match", label: "تطابق المرور" },
  { value: "Auto", label: "دخول أو تحويل" },
];

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  const nextPath = useMemo(
    () => getSafeNextPath(searchParams.get("next")),
    [searchParams]
  );

  const hasConfirmation = passwordConfirmation.length > 0;
  const passwordsMatch = hasConfirmation && password === passwordConfirmation;
  const passwordsMismatch = hasConfirmation && password !== passwordConfirmation;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (password !== passwordConfirmation) {
      setErrorMessage("تأكيد كلمة المرور غير مطابق.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });

      if (result.token) {
        router.replace(nextPath);
      } else {
        const params = new URLSearchParams();
        params.set("registered", "1");
        params.set("next", nextPath);
        router.replace(`/auth/login?${params.toString()}`);
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "تعذر إنشاء الحساب."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="إنشاء حساب"
      title="ابدأ حسابك في دقائق"
      description="املأ البيانات الأساسية فقط، ثم أكمل العمل من داخل لوحة التحكم مباشرة."
      sideLabel="تهيئة سريعة"
      sideTitle="تصميم أنظف للتسجيل مع تركيز أكبر على الوضوح"
      sideDescription="تم ترتيب النموذج بحيث يكون سهل القراءة وسريع الإدخال، مع رسالة تطابق فورية لكلمة المرور."
      noteTitle="بعد إنشاء الحساب"
      noteDescription="يعتمد المسار التالي على استجابة الخادم: دخول مباشر أو تحويل تلقائي إلى صفحة تسجيل الدخول."
      highlights={registerHighlights}
      stats={registerStats}
      footer={
        <p className="text-sm text-slate-500">
          لديك حساب بالفعل؟{" "}
          <Link href="/auth/login" className="font-semibold text-[#b85c2f] hover:text-[#9e4d25]">
            تسجيل الدخول
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        {errorMessage ? (
          <div className="flex items-start gap-3 rounded-[1.4rem] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField
              label="الاسم"
              icon={UserRound}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="الاسم الكامل"
              autoComplete="name"
              required
            />

            <AuthField
              label="البريد الإلكتروني"
              icon={Mail}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              dir="ltr"
              required
            />
          </div>

          <AuthField
            label="كلمة المرور"
            icon={KeyRound}
            hint="8 أحرف أو أكثر"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            dir="ltr"
            required
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-[#f1e6dc] hover:text-[#9e4d25]"
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          <AuthField
            label="تأكيد كلمة المرور"
            icon={ShieldCheck}
            type={showPasswordConfirmation ? "text" : "password"}
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            autoComplete="new-password"
            dir="ltr"
            required
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPasswordConfirmation((current) => !current)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-[#f1e6dc] hover:text-[#9e4d25]"
                aria-label={
                  showPasswordConfirmation ? "إخفاء تأكيد كلمة المرور" : "إظهار تأكيد كلمة المرور"
                }
              >
                {showPasswordConfirmation ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
          />

          <div
            className={`rounded-[1.25rem] border px-4 py-2.5 text-sm ${
              passwordsMismatch
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : passwordsMatch
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-[#eadfce] bg-[#fbf8f3] text-slate-500"
            }`}
          >
            <div className="flex items-start gap-3">
              {passwordsMismatch ? (
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              ) : passwordsMatch ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              )}
              <p>
                {passwordsMismatch
                  ? "كلمتا المرور غير متطابقتين حتى الآن."
                  : passwordsMatch
                    ? "كلمتا المرور متطابقتان وجاهزتان للإرسال."
                    : "اكتب نفس كلمة المرور في الحقلين لإكمال التسجيل."}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-[1.4rem] bg-[linear-gradient(135deg,#1f2937_0%,#b85c2f_100%)] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_20px_40px_-20px_rgba(184,92,47,0.55)] transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}

function RegisterPageFallback() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10" dir="rtl">
      <div className="mx-auto h-[700px] w-full max-w-6xl rounded-[2rem] border border-slate-200 bg-white shadow-sm" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}
