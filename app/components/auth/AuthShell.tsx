"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import ThemeToggle from "../ThemeToggle";

export type AuthHighlight = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type AuthStat = {
  value: string;
  label: string;
};

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  sideLabel: string;
  sideTitle: string;
  sideDescription: string;
  noteTitle: string;
  noteDescription: string;
  highlights: AuthHighlight[];
  stats: AuthStat[];
  children: ReactNode;
  footer: ReactNode;
  showSide?: boolean;
};

export default function AuthShell({
  eyebrow,
  title,
  description,
  sideLabel,
  sideTitle,
  sideDescription,
  noteTitle,
  noteDescription,
  highlights,
  stats,
  children,
  footer,
  showSide = true,
}: AuthShellProps) {
  const layoutClass = showSide
    ? "grid w-full items-start gap-8 lg:grid-cols-[minmax(360px,430px)_1fr]"
    : "grid w-full items-start gap-8 lg:grid-cols-1";
  const mainClass = showSide
    ? "order-2 lg:order-1"
    : "order-1 w-full max-w-[430px] justify-self-center";

  return (
    <section
      className="relative min-h-screen overflow-hidden bg-[#f6efe6] text-slate-900"
      dir="rtl"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:72px_72px]" />
        <div className="absolute left-0 top-0 h-72 w-72 -translate-x-1/3 -translate-y-1/3 rounded-full bg-[#dca57a]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/4 translate-y-1/4 rounded-full bg-[#8fb8c9]/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-[#e4d6c4] bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1f2937] text-sm font-bold text-white">
              ف+
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">فاتورة+</p>
              <p className="text-xs text-slate-500">Workspace Access</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden items-center gap-2 rounded-full border border-[#e4d6c4] bg-white/90 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-white sm:inline-flex"
            >
              <ArrowLeft className="h-4 w-4" />
              الرئيسية
            </Link>
            <ThemeToggle
              variant="compact"
              className="border-[#e4d6c4] bg-white text-slate-700 shadow-sm hover:bg-white"
            />
          </div>
        </header>

        <div className="flex flex-1 items-center py-8 lg:py-10">
          <div className={layoutClass}>
            <main className={mainClass}>
              <div className="rounded-[2rem] border border-[#e7dccd] bg-white p-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)] sm:p-8">
                <div className="inline-flex items-center rounded-full bg-[#fff2e7] px-3 py-1 text-xs font-semibold text-[#b85c2f]">
                  {eyebrow}
                </div>

                <div className="mt-5 text-right">
                  <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-[2.4rem]">
                    {title}
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
                    {description}
                  </p>
                </div>

                <div className="mt-8">{children}</div>

                <div className="mt-8 border-t border-[#eee4d7] pt-5 text-right">{footer}</div>
              </div>
            </main>

            {showSide ? (
              <aside className="order-1 lg:order-2">
                <div className="max-w-2xl text-right">
                  <div className="inline-flex items-center rounded-full border border-[#d8c7b3] bg-[#f9f4ed] px-3 py-1 text-xs font-semibold text-[#8a5a3c]">
                    {sideLabel}
                  </div>
                  <h2 className="mt-5 text-4xl font-bold leading-[1.1] text-slate-900 sm:text-[3.2rem]">
                    {sideTitle}
                  </h2>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                    {sideDescription}
                  </p>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {stats.map((stat, index) => (
                    <div
                      key={stat.label}
                      className={`rounded-[1.5rem] border border-[#e5d8c8] px-4 py-4 shadow-sm ${
                        index === 1 ? "bg-[#1f2937] text-white" : "bg-white"
                      }`}
                    >
                      <div className="text-xl font-bold">{stat.value}</div>
                      <div
                        className={`mt-1 text-xs ${
                          index === 1 ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {highlights.map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className={`rounded-[1.75rem] border border-[#e5d8c8] p-5 ${
                          index === 0
                            ? "bg-[#fff8f1]"
                            : index === 1
                              ? "bg-white"
                              : "bg-[#f2f7f8]"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#b85c2f] shadow-sm">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900">
                              {item.title}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 rounded-[1.75rem] bg-[#1f2937] px-6 py-6 text-white shadow-[0_20px_60px_-35px_rgba(15,23,42,0.8)]">
                  <div className="text-sm font-semibold text-white">{noteTitle}</div>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                    {noteDescription}
                  </p>
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
