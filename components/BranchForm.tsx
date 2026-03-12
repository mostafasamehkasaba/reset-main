"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { getErrorMessage } from "@/app/lib/fetcher";
import {
  createBranch,
  getBranch,
  updateBranch,
} from "@/app/services/branches";
import type { Branch } from "@/app/types";
import {
  branchFormSchema,
  defaultBranchValues,
} from "@/lib/branches/branchValidation";

type BranchFormValues = z.infer<typeof branchFormSchema>;

function BranchForm({ id }: { id: number | null }) {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: defaultBranchValues,
  });

  useEffect(() => {
    if (!id) {
      reset(defaultBranchValues);
      return;
    }

    let active = true;
    const loadBranch = async () => {
      setIsProcessing(true);
      setFormError("");
      try {
        const branch = await getBranch(id);
        if (active) {
          if (branch) {
            reset(branch);
          } else {
            setFormError("تعذر العثور على بيانات الفرع.");
          }
        }
      } catch (error) {
        if (active) {
          setFormError(getErrorMessage(error, "Failed to load branch data."));
        }
      } finally {
        if (active) {
          setIsProcessing(false);
        }
      }
    };

    void loadBranch();
    return () => {
      active = false;
    };
  }, [id, reset]);

  const onSubmit = async (data: BranchFormValues) => {
    setIsProcessing(true);
    setFormError("");

    try {
      const branchData = {
        name: data.name,
        address: data.address || "",
        phone: data.phone || "",
        manager: data.manager || "",
      };

      if (id) {
        await updateBranch(id, branchData);
      } else {
        await createBranch(branchData);
      }
      router.push("/branches");
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
            الاسم
          </label>
          <input
            id="name"
            {...register("name")}
            className="block w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 placeholder:text-slate-400"
            placeholder="أدخل اسم الفرع"
          />
          {errors.name && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="manager"
            className="block text-sm font-medium text-slate-700"
          >
            المدير
          </label>
          <input
            id="manager"
            {...register("manager")}
            className="block w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 placeholder:text-slate-400"
            placeholder="اسم مدير الفرع"
          />
          {errors.manager && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">
              {errors.manager.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-slate-700"
          >
            الهاتف
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

        <div className="sm:col-span-2 space-y-2">
          <label
            htmlFor="address"
            className="block text-sm font-medium text-slate-700"
          >
            العنوان
          </label>
          <textarea
            id="address"
            {...register("address")}
            rows={3}
            className="block w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 placeholder:text-slate-400"
            placeholder="العنوان التفصيلي للفرع"
          />
          {errors.address && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.address.message}</p>
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
          {isProcessing ? "جاري الحفظ..." : "حفظ الفرع"}
        </button>
      </div>
    </form>
  );
}

export default BranchForm;
