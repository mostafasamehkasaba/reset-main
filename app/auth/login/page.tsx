"use client";

import Link from "next/link";
import {
  CircleAlert,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthField from "../../components/auth/AuthField";
import AuthShell, {
  type AuthHighlight,
  type AuthStat,
} from "../../components/auth/AuthShell";
import { getErrorMessage } from "../../lib/fetcher";
import { login } from "../../services/auth";

const getSafeNextPath = (value: string | null) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
};

const loginHighlights: AuthHighlight[] = [
  {
    icon: ShieldCheck,
    title: "جلسة مستقرة وآمنة",
    description: "التوكن وبيانات المستخدم يتم حفظهما مباشرة بعد نجاح تسجيل الدخول.",
  },
  {
    icon: Workflow,
    title: "متصل بباقي الشاشات",
    description: "نفس الجلسة تُستخدم في الطلبات المحمية داخل الموردين والفواتير وباقي الصفحات.",
  },
  {
    icon: Sparkles,
    title: "دخول سريع بدون تشتيت",
    description: "واجهة مركزة على خطوة واحدة واضحة: الدخول ثم الانتقال فورًا إلى العمل.",
  },
];

const loginStats: AuthStat[] = [
  { value: "Token", label: "جلسة محفوظة" },
  { value: "Direct", label: "ربط API" },
  { value: "Fast", label: "انتقال سريع" },
];

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const nextPath = useMemo(
    () => getSafeNextPath(searchParams.get("next")),
    [searchParams]
  );

  const registrationSuccess = searchParams.get("registered") === "1";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="تسجيل الدخول"
      title="مرحبًا بعودتك"
      description="ادخل بيانات حسابك للوصول إلى لوحة التحكم والمتابعة من حيث توقفت."
      sideLabel="مساحة العمل"
      sideTitle="واجهة دخول بسيطة لكنها تبدو كجزء من منتج حقيقي"
      sideDescription="تم تقليل العناصر غير الضرورية والتركيز على وضوح الحقول وسرعة الوصول، مع شكل أنظف على الموبايل والديسكتوب."
      noteTitle="بعد تسجيل الدخول"
      noteDescription="سيتم حفظ الجلسة محليًا ثم تحويلك إلى الصفحة المطلوبة أو الصفحة الرئيسية بشكل تلقائي."
      highlights={loginHighlights}
      stats={loginStats}
      showSide={false}
      footer={
        <p className="text-sm text-slate-500">
          لا تملك حسابًا؟{" "}
          <Link href="/auth/register" className="font-semibold text-[#b85c2f] hover:text-[#9e4d25]">
            إنشاء حساب جديد
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        {registrationSuccess ? (
          <div className="flex items-start gap-3 rounded-[1.4rem] border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-700">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p>تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول الآن.</p>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="flex items-start gap-3 rounded-[1.4rem] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <AuthField
            label="كلمة المرور"
            icon={LockKeyhole}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
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

          <div className="rounded-[1.25rem] border border-[#eadfce] bg-[#fbf8f3] px-4 py-2.5 text-sm text-slate-500">
            يتم حفظ الجلسة في المتصفح بعد نجاح الدخول لاستخدامها في الطلبات المحمية.
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-[1.4rem] bg-[linear-gradient(135deg,#1f2937_0%,#b85c2f_100%)] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_20px_40px_-20px_rgba(184,92,47,0.55)] transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}

function LoginPageFallback() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10" dir="rtl">
      <div className="mx-auto h-[640px] w-full max-w-6xl rounded-[2rem] border border-slate-200 bg-white shadow-sm" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
