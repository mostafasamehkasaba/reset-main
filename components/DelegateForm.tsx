"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { getErrorMessage } from "@/app/lib/fetcher";
import {
  createDelegate,
  getDelegate,
  updateDelegate,
} from "@/app/services/delegates";
import type { Delegate } from "@/app/types";
import {
  delegateFormSchema,
  defaultDelegateValues,
} from "@/lib/delegates/delegateValidation";

type DelegateFormValues = z.infer<typeof delegateFormSchema>;

function DelegateForm({ id }: { id: number | null }) {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DelegateFormValues>({
    resolver: zodResolver(delegateFormSchema),
    defaultValues: defaultDelegateValues,
  });

  useEffect(() => {
    if (!id) {
      reset(defaultDelegateValues);
      return;
    }

    let active = true;
    const loadDelegate = async () => {
      setIsProcessing(true);
      setFormError("");
      try {
        const delegate = await getDelegate(id);
        if (active) {
          if (delegate) {
            reset(delegate);
          } else {
            setFormError("تعذر العثور على بيانات المندوب.");
          }
        }
      } catch (error) {
        if (active) {
          setFormError(getErrorMessage(error, "Failed to load delegate data."));
        }
      } finally {
        if (active) {
          setIsProcessing(false);
        }
      }
    };

    void loadDelegate();
    return () => {
      active = false;
    };
  }, [id, reset]);

  const onSubmit = async (data: DelegateFormValues) => {
    setIsProcessing(true);
    setFormError("");

    try {
      const delegateData = {
        name: data.name,
        phone: data.phone,
        email: data.email || "",
        region: data.region,
        status: data.status,
      };

      if (id) {
        await updateDelegate(id, delegateData);
      } else {
        await createDelegate(delegateData);
      }
      router.push("/projects-pages/delegates");
    } catch (error) {
      setFormError(getErrorMessage(error, "An error occurred."));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {formError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700"
          >
            الاسم الكامل
          </label>
          <input
            id="name"
            {...register("name")}
            className="block w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 placeholder:text-slate-400"
            placeholder="أدخل اسم المندوب"
          />
          {errors.name && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-slate-700"
          >
            رقم الهاتف
          </label>
          <input
            id="phone"
            {...register("phone")}
            className="block w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 placeholder:text-slate-400"
            placeholder="01xxxxxxxxx"
          />
          {errors.phone && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700"
          >
            البريد الإلكتروني (اختياري)
          </label>
          <input
            id="email"
            {...register("email")}
            className="block w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 placeholder:text-slate-400"
            placeholder="example@mail.com"
          />
          {errors.email && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="region"
            className="block text-sm font-medium text-slate-700"
          >
            المنطقة / المحافظة
          </label>
          <input
            id="region"
            {...register("region")}
            className="block w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 placeholder:text-slate-400"
            placeholder="مثال: القاهرة"
          />
          {errors.region && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.region.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="status"
            className="block text-sm font-medium text-slate-700"
          >
            الحالة
          </label>
          <select
            id="status"
            {...register("status")}
            className="block w-full appearance-none rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
          >
            <option value="نشط">نشط</option>
            <option value="معلّق">معلّق</option>
          </select>
          {errors.status && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.status.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100" dir="ltr">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isProcessing}
          className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={isProcessing}
          className="min-w-[120px] rounded-full bg-slate-950 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {isProcessing ? "جاري الحفظ..." : "حفظ المندوب"}
        </button>
      </div>
    </form>
  );
}

export default DelegateForm;
