"use client";

import type { ChangeEvent, FormEvent, RefObject } from "react";
import Link from "next/link";
import { AlertTriangle, ImagePlus, PackageSearch, Sparkles, Tag, X } from "lucide-react";
import type { MainCategory, SubCategory } from "@/app/types";
import { ProductBasicInfo } from "@/components/products/ProductBasicInfo";
import { ProductDetails } from "@/components/products/ProductDetails";
import { ProductInventory } from "@/components/products/ProductInventory";
import { ProductPricing } from "@/components/products/ProductPricing";
import {
  FALLBACK_PRODUCT_IMAGE,
  IMAGE_INPUT_ACCEPT,
  SUPPORTED_IMAGE_HINT,
  type ProductFormState,
} from "@/lib/products/productTypes";

type SupplierOption = {
  id: number;
  name: string;
};

type ProductFormProps = {
  values: ProductFormState;
  isEditMode: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  isReadingImage: boolean;
  validationMessage?: string;
  saveMessage?: string;
  loadError?: string;
  referenceError?: string;
  selectedImageName: string;
  mainCategories: MainCategory[];
  filteredSubCategories: SubCategory[];
  supplierOptions: SupplierOption[];
  unitOptions: string[];
  fileInputRef: RefObject<HTMLInputElement | null>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: <K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K]
  ) => void;
  onNameChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onGenerateCode: () => void;
  onGenerateBarcode: () => void;
  onMainCategoryChange: (value: string) => void;
  onSubCategoryChange: (value: string) => void;
  onImageButtonClick: () => void;
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onImagePreviewError: () => void;
};

const formatAmount = (value: string, currency: string) => {
  const numericValue = Number.parseFloat(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "-";
  }

  return `${numericValue.toFixed(2)} ${currency}`;
};

const summaryCardClassName =
  "rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]";

export function ProductForm({
  values,
  isEditMode,
  isLoading,
  isSubmitting,
  isReadingImage,
  validationMessage,
  saveMessage,
  loadError,
  referenceError,
  selectedImageName,
  mainCategories,
  filteredSubCategories,
  supplierOptions,
  unitOptions,
  fileInputRef,
  onSubmit,
  onFieldChange,
  onNameChange,
  onCodeChange,
  onGenerateCode,
  onGenerateBarcode,
  onMainCategoryChange,
  onSubCategoryChange,
  onImageButtonClick,
  onImageChange,
  onRemoveImage,
  onImagePreviewError,
}: ProductFormProps) {
  const isDisabled = isLoading || isSubmitting;
  const isImageActionDisabled = isDisabled || isReadingImage;
  const selectedMainCategory =
    mainCategories.find((category) => String(category.id) === values.mainCategoryId) ?? null;
  const selectedSubCategory =
    filteredSubCategories.find((category) => String(category.id) === values.subCategoryId) ??
    null;
  const resolvedCategory =
    selectedSubCategory?.name || selectedMainCategory?.name || values.category || "-";
  const quantity = Math.max(0, Number.parseInt(values.quantity, 10) || 0);
  const minStockLevel = Math.max(0, Number.parseInt(values.minStockLevel, 10) || 0);
  const reorderPoint = Math.max(minStockLevel, Number.parseInt(values.reorderPoint, 10) || 0);
  const hasImage = Boolean(values.imageUrl || selectedImageName);

  const stockLabel =
    quantity <= minStockLevel
      ? "حرج"
      : quantity <= reorderPoint
        ? "تنبيه"
        : "مستقر";

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"
      aria-busy={isLoading || isSubmitting}
    >
      <div className="space-y-4">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
                نموذج المنتج
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                {isEditMode ? "تحديث بيانات المنتج الحالية" : "إدخال بيانات المنتج الجديد"}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                نفس الحقول الحالية ستُحفظ بنفس المسار، لكن داخل واجهة أوضح وأسرع في
                الاستخدام.
              </p>
            </div>

            <Link
              href="/products"
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              رجوع للقائمة
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              جاري تجهيز بيانات المنتج وربط المراجع الحالية...
            </div>
          ) : null}

          {loadError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {loadError}
            </div>
          ) : null}

          {referenceError ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {referenceError}
            </div>
          ) : null}

          {validationMessage ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {validationMessage}
            </div>
          ) : null}

          {saveMessage ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {saveMessage}
            </div>
          ) : null}
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <ProductBasicInfo
            values={values}
            mainCategories={mainCategories}
            filteredSubCategories={filteredSubCategories}
            supplierOptions={supplierOptions}
            isDisabled={isDisabled}
            onFieldChange={onFieldChange}
            onNameChange={onNameChange}
            onCodeChange={onCodeChange}
            onGenerateCode={onGenerateCode}
            onGenerateBarcode={onGenerateBarcode}
            onMainCategoryChange={onMainCategoryChange}
            onSubCategoryChange={onSubCategoryChange}
          />

          <ProductPricing
            values={values}
            isDisabled={isDisabled}
            onFieldChange={onFieldChange}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ProductDetails
            values={values}
            unitOptions={unitOptions}
            isDisabled={isDisabled}
            onFieldChange={onFieldChange}
          />

          <ProductInventory
            values={values}
            isDisabled={isDisabled}
            onFieldChange={onFieldChange}
          />
        </div>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm leading-7 text-slate-500">
              {isEditMode
                ? "سيتم حفظ التعديلات على نفس المنتج الحالي بنفس منطق التحديث الموجود."
                : "سيتم إنشاء المنتج بنفس عقد الباكند الحالي دون أي تغيير في الحقول أو المسارات."}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/products"
                className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                إلغاء
              </Link>
              <button
                type="submit"
                disabled={isDisabled}
                className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting
                  ? isEditMode
                    ? "جارٍ حفظ التعديلات..."
                    : "جارٍ حفظ المنتج..."
                  : isEditMode
                    ? "حفظ التعديلات"
                    : "حفظ المنتج"}
              </button>
            </div>
          </div>
        </section>
      </div>

      <aside className="space-y-4">
        <section className={summaryCardClassName}>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <ImagePlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-slate-700">
                صورة المنتج
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                معاينة ورفع الصورة
              </h2>
            </div>
          </div>

          <div className="mt-5 flex h-64 items-center justify-center overflow-hidden rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-4">
            <img
              src={values.imageUrl || FALLBACK_PRODUCT_IMAGE}
              alt="صورة المنتج"
              className="max-h-full max-w-full object-contain"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                onImagePreviewError();
              }}
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_INPUT_ACCEPT}
            className="hidden"
            onChange={onImageChange}
            disabled={isImageActionDisabled}
          />

          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={onImageButtonClick}
              disabled={isImageActionDisabled}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {selectedImageName ? "تغيير صورة المنتج" : "رفع صورة المنتج"}
            </button>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-500">
              {selectedImageName || SUPPORTED_IMAGE_HINT}
            </div>

            {hasImage ? (
              <button
                type="button"
                onClick={onRemoveImage}
                disabled={isImageActionDisabled}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <X className="h-4 w-4" />
                إزالة الصورة
              </button>
            ) : null}
          </div>
        </section>

        <section className={summaryCardClassName}>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <PackageSearch className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
                ملخص سريع
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                نظرة سريعة قبل الحفظ
              </h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-xs text-slate-400">اسم المنتج</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {values.name || "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-xs text-slate-400">الكود والتصنيف</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {values.code || "-"}
              </p>
              <p className="mt-1 text-xs text-slate-500">{resolvedCategory}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="text-xs text-slate-400">سعر البيع</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {formatAmount(values.sellingPrice, values.currency)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="text-xs text-slate-400">سعر الشراء</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {formatAmount(values.purchasePrice, values.currency)}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="text-xs text-slate-400">الحالة</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {values.status || "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="text-xs text-slate-400">حالة المخزون</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{stockLabel}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-xs text-slate-400">المورد</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {values.supplierName || "-"}
              </p>
            </div>
          </div>
        </section>

        <section className={summaryCardClassName}>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-amber-700">
                إرشادات
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                نقاط سريعة قبل الحفظ
              </h2>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <Tag className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              سيُستخدم التصنيف الفرعي إن وُجد، وإلا سيُستخدم التصنيف الرئيسي كما هو معمول به
              حاليًا.
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              قيم المخزون والضريبة ستُرسل بنفس البنية الحالية دون إعادة تشكيل للبيانات.
            </div>
          </div>
        </section>
      </aside>
    </form>
  );
}
