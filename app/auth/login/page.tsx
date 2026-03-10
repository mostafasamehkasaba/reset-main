"use client";

import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { Suspense } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";

function LoginPageContent() {
  return (
    <AuthLayout
      productName="فاتورة+"
      welcomeTitle="مرحبًا بعودتك"
      welcomeMessage="سجّل دخولك للوصول إلى لوحة التحكم، متابعة العملاء والفواتير، والعودة مباشرة إلى عملك."
      logo={
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white">
          <LockKeyhole className="h-5 w-5" />
        </div>
      }
      footer={
        <p>
          لا تملك حسابًا؟{" "}
          <Link href="/auth/register" className="font-semibold text-sky-700 transition hover:text-sky-800">
            إنشاء حساب جديد
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}

function LoginPageFallback() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10" dir="rtl">
      <div className="mx-auto h-[720px] w-full max-w-[460px] rounded-[2rem] border border-slate-200 bg-white shadow-sm" />
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
