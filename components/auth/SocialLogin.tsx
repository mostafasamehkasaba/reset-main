"use client";

import type { ReactNode } from "react";
import { Github, Loader2 } from "lucide-react";
import type { SocialAuthProvider } from "@/lib/auth/authService";

type SocialLoginProps = {
  activeProvider: SocialAuthProvider | null;
  disabled?: boolean;
  onSelect: (provider: SocialAuthProvider) => void;
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3.1.8 3.8 1.4l2.6-2.5C16.8 3.5 14.7 2.6 12 2.6A9.4 9.4 0 0 0 2.6 12 9.4 9.4 0 0 0 12 21.4c5.4 0 8.9-3.8 8.9-9.1 0-.6-.1-1.1-.2-1.6H12Z"
      />
      <path
        fill="#34A853"
        d="M2.6 7.8 5.8 10c.9-2.6 3.4-4.4 6.2-4.4 1.8 0 3.1.8 3.8 1.4l2.6-2.5C16.8 3.5 14.7 2.6 12 2.6A9.4 9.4 0 0 0 2.6 7.8Z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.4c2.6 0 4.8-.9 6.4-2.5l-3-2.3c-.8.6-1.9 1.1-3.4 1.1-3.8 0-5.2-2.5-5.4-3.8l-3.1 2.4A9.4 9.4 0 0 0 12 21.4Z"
      />
      <path
        fill="#4285F4"
        d="M20.9 12.3c0-.6-.1-1.1-.2-1.6H12v3.9h5.4c-.3 1.3-1.1 2.3-2.1 3l3 2.3c1.7-1.6 2.6-4 2.6-7.6Z"
      />
    </svg>
  );
}

const providers: Array<{
  id: SocialAuthProvider;
  label: string;
  icon: ReactNode;
}> = [
  { id: "google", label: "Google", icon: <GoogleIcon /> },
  { id: "github", label: "GitHub", icon: <Github className="h-4 w-4" /> },
];

export default function SocialLogin({
  activeProvider,
  disabled = false,
  onSelect,
}: SocialLoginProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            أو تابع بواسطة
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {providers.map((provider) => {
          const isActive = activeProvider === provider.id;

          return (
            <button
              key={provider.id}
              type="button"
              disabled={disabled || activeProvider !== null}
              onClick={() => onSelect(provider.id)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : provider.icon}
              <span>المتابعة عبر {provider.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
