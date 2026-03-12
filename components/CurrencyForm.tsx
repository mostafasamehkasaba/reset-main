"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { getErrorMessage } from "@/app/lib/fetcher";
import {
  createCurrency,
  getCurrency,
  updateCurrency,
} from "@/app/services/currencies";
import {
  currencyFormSchema,
  defaultCurrencyValues,
} from "@/lib/currencies/currencyValidation";

type CurrencyFormValues = z.infer<typeof currencyFormSchema>;

function CurrencyForm({ id }: { id: number | null }) {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CurrencyFormValues>({
    resolver: zodResolver(currencyFormSchema),
    defaultValues: defaultCurrencyValues,
  });

  useEffect(() => {
    if (!id) {
      reset(defaultCurrencyValues);
      return;
    }

    let active = true;
    const loadCurrency = async () => {
      setIsProcessing(true);
      setFormError("");
      try {
        const currency = await getCurrency(id);
        if (active) {
          if (currency) {
            reset({
              name: currency.name,
              symbol: currency.symbol,
              code: currency.code,
              isDefault: currency.isDefault,
            });
          } else {
            setFormError("تعذر العثور على بيانات العملة.");
          }
        }
      } catch (error) {
        if (active) {
          setFormError(getErrorMessage(error, "Failed to load currency data."));
        }
      } finally {
        if (active) {
          setIsProcessing(false);
        }
      }
    };

    void loadCurrency();
    return () => {
      active = false;
    };
  }, [id, reset]);

  const onSubmit = async (data: CurrencyFormValues) => {
    setIsProcessing(true);
    setFormError("");

    try {
      if (id) {
        await updateCurrency(id, data);
      } else {
        await createCurrency(data);
      }
      router.push("/projects-pages/currencies");
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
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            اسم العملة
          </label>
          <input
            id="name"
            {...register("name")}
            className="block w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 placeholder:text-slate-400"
            placeholder="مثال: جنيه مصري"
          />
          {errors.name && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="code" className="block text-sm font-medium text-slate-700">
            كود العملة (ISO)
          </label>
          <input
            id="code"
            {...register("code")}
            className="block w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 placeholder:text-slate-400"
            placeholder="مثال: EGP"
          />
          {errors.code && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.code.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="symbol" className="block text-sm font-medium text-slate-700">
            رمز العملة
          </label>
          <input
            id="symbol"
            {...register("symbol")}
            className="block w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 placeholder:text-slate-400"
            placeholder="مثال: LE"
          />
          {errors.symbol && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.symbol.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-3 space-x-reverse pt-8">
          <input
            id="isDefault"
            type="checkbox"
            {...register("isDefault")}
            className="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          />
          <label htmlFor="isDefault" className="text-sm font-medium text-slate-700">
            تعيين كعملة افتراضية
          </label>
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
          {isProcessing ? "جاري الحفظ..." : "حفظ العملة"}
        </button>
      </div>
    </form>
  );
}

export default CurrencyForm;
