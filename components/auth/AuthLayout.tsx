import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

type AuthLayoutProps = {
  logo?: ReactNode;
  productName: string;
  welcomeTitle: string;
  welcomeMessage: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AuthLayout({
  logo,
  productName,
  welcomeTitle,
  welcomeMessage,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900" dir="rtl">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:72px_72px]" />
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-100 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/4 translate-y-1/4 rounded-full bg-slate-200 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-[460px]">
          <div className="mb-6 flex items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              الرئيسية
            </Link>

            <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Secure Access
            </span>
          </div>

          <div className="mb-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-[0_20px_40px_-28px_rgba(15,23,42,0.35)]">
              {logo ?? (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-lg font-semibold text-white">
                  ف+
                </div>
              )}
            </div>

            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">
              {productName}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.2rem]">
              {welcomeTitle}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
              {welcomeMessage}
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.28)] sm:p-7">
            {children}
          </div>

          {footer ? <div className="mt-6 text-center text-sm text-slate-500">{footer}</div> : null}
        </div>
      </div>
    </section>
  );
}
