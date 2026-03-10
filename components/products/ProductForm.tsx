"use client";

import type { ChangeEvent, FormEvent, RefObject } from "react";
import Link from "next/link";
import { LoaderCircle, X } from "lucide-react";
import type { MainCategory, SubCategory } from "@/app/types";
import {
  FALLBACK_PRODUCT_IMAGE,
  IMAGE_INPUT_ACCEPT,
  SUPPORTED_IMAGE_HINT,
  type ProductFormState,
} from "@/lib/products/productTypes";
import type { Product, ProductTaxMode, ProductUnit } from "@/app/lib/product-store";
import { PRODUCT_TAX_MODES } from "@/app/lib/product-store";

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

const containerClassName =
  "rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6";
const fieldClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
const labelClassName = "space-y-2";
const labelTextClassName = "block text-sm font-medium text-slate-700";
const helperTextClassName = "text-xs text-slate-500";
const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70";
const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70";

function Feedback({
  tone,
  message,
}: {
  tone: "error" | "warning" | "success" | "info";
  message: string;
}) {
  const classes =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : tone === "info"
          ? "border-sky-200 bg-sky-50 text-sky-800"
          : "border-rose-200 bg-rose-50 text-rose-700";

  return <div className={`rounded-xl border px-4 py-3 text-sm ${classes}`}>{message}</div>;
}

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
  const hasImage = Boolean(values.imageUrl || selectedImageName);

  return (
    <form onSubmit={onSubmit} className={containerClassName} aria-busy={isLoading || isSubmitting}>
      <div className="border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            {isEditMode ? "تعديل المنتج" : "إضافة منتج"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">كل البيانات في نموذج واحد بسيط.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? <Feedback tone="info" message="جاري تجهيز بيانات المنتج..." /> : null}
        {loadError ? <Feedback tone="error" message={loadError} /> : null}
        {referenceError ? <Feedback tone="warning" message={referenceError} /> : null}
        {validationMessage ? <Feedback tone="error" message={validationMessage} /> : null}
        {saveMessage ? <Feedback tone="success" message={saveMessage} /> : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className={`${labelClassName} md:col-span-2`}>
          <span className={labelTextClassName}>
            اسم المنتج <span className="text-rose-500">*</span>
          </span>
          <input
            value={values.name}
            onChange={(event) => onNameChange(event.target.value)}
            className={fieldClassName}
            placeholder="مثال: قالب ووردبريس"
            required
            disabled={isDisabled}
          />
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>
            كود المنتج <span className="text-rose-500">*</span>
          </span>
          <div className="flex gap-2">
            <input
              value={values.code}
              onChange={(event) => onCodeChange(event.target.value)}
              className={`${fieldClassName} flex-1`}
              required
              disabled={isDisabled}
            />
            <button
              type="button"
              onClick={onGenerateCode}
              className={secondaryButtonClassName}
              disabled={isDisabled}
            >
              توليد
            </button>
          </div>
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>الباركود</span>
          <div className="flex gap-2">
            <input
              value={values.barcode}
              onChange={(event) => onFieldChange("barcode", event.target.value)}
              className={`${fieldClassName} flex-1`}
              placeholder="مثال: 6281000010012"
              disabled={isDisabled}
            />
            <button
              type="button"
              onClick={onGenerateBarcode}
              className={secondaryButtonClassName}
              disabled={isDisabled}
            >
              توليد
            </button>
          </div>
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>التصنيف الرئيسي</span>
          <select
            value={values.mainCategoryId}
            onChange={(event) => onMainCategoryChange(event.target.value)}
            className={fieldClassName}
            disabled={isDisabled}
          >
            <option value="">اختر التصنيف الرئيسي</option>
            {mainCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>التصنيف الفرعي</span>
          <select
            value={values.subCategoryId}
            onChange={(event) => onSubCategoryChange(event.target.value)}
            className={fieldClassName}
            disabled={!values.mainCategoryId || isDisabled}
          >
            <option value="">اختر التصنيف الفرعي</option>
            {filteredSubCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>المورد</span>
          <select
            value={values.supplierName}
            onChange={(event) => onFieldChange("supplierName", event.target.value)}
            className={fieldClassName}
            disabled={isDisabled}
          >
            <option value="">اختر المورد</option>
            {supplierOptions.map((supplier) => (
              <option key={supplier.id} value={supplier.name}>
                {supplier.name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>وحدة القياس</span>
          <select
            value={values.unit}
            onChange={(event) => onFieldChange("unit", event.target.value as ProductUnit)}
            className={fieldClassName}
            disabled={isDisabled}
          >
            {unitOptions.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>الحالة</span>
          <select
            value={values.status}
            onChange={(event) =>
              onFieldChange("status", event.target.value as Product["status"])
            }
            className={fieldClassName}
            disabled={isDisabled}
          >
            <option value="متاح">متاح</option>
            <option value="غير متاح">غير متاح</option>
          </select>
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>العملة</span>
          <input
            value={values.currency}
            onChange={(event) => onFieldChange("currency", event.target.value)}
            className={fieldClassName}
            disabled={isDisabled}
          />
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>سعر البيع</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.sellingPrice}
            onChange={(event) => onFieldChange("sellingPrice", event.target.value)}
            className={fieldClassName}
            placeholder="0.00"
            disabled={isDisabled}
          />
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>سعر الشراء</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.purchasePrice}
            onChange={(event) => onFieldChange("purchasePrice", event.target.value)}
            className={fieldClassName}
            placeholder="0.00"
            disabled={isDisabled}
          />
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>نوع الضريبة</span>
          <select
            value={values.taxMode}
            onChange={(event) =>
              onFieldChange("taxMode", event.target.value as ProductTaxMode)
            }
            className={fieldClassName}
            disabled={isDisabled}
          >
            {PRODUCT_TAX_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>نسبة الضريبة %</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.defaultTaxRate}
            onChange={(event) => onFieldChange("defaultTaxRate", event.target.value)}
            className={fieldClassName}
            disabled={isDisabled || values.taxMode === "none"}
          />
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>الكمية</span>
          <input
            type="number"
            min="0"
            step="1"
            value={values.quantity}
            onChange={(event) => onFieldChange("quantity", event.target.value)}
            className={fieldClassName}
            disabled={isDisabled}
          />
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>الحد الأدنى للمخزون</span>
          <input
            type="number"
            min="0"
            step="1"
            value={values.minStockLevel}
            onChange={(event) => onFieldChange("minStockLevel", event.target.value)}
            className={fieldClassName}
            disabled={isDisabled}
          />
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>حد إعادة الطلب</span>
          <input
            type="number"
            min="0"
            step="1"
            value={values.reorderPoint}
            onChange={(event) => onFieldChange("reorderPoint", event.target.value)}
            className={fieldClassName}
            disabled={isDisabled}
          />
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>تاريخ الإضافة</span>
          <input
            type="date"
            value={values.dateAdded}
            onChange={(event) => onFieldChange("dateAdded", event.target.value)}
            className={fieldClassName}
            disabled={isDisabled}
          />
        </label>

        <label className={`${labelClassName} md:col-span-2`}>
          <span className={labelTextClassName}>الوصف</span>
          <textarea
            rows={4}
            value={values.description}
            onChange={(event) => onFieldChange("description", event.target.value)}
            className={fieldClassName}
            placeholder="وصف اختياري"
            disabled={isDisabled}
          />
        </label>

        <div className="space-y-3 md:col-span-2">
          <div>
            <span className={labelTextClassName}>صورة المنتج</span>
            <p className={`mt-1 ${helperTextClassName}`}>{selectedImageName || SUPPORTED_IMAGE_HINT}</p>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-start">
            <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:w-32">
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

            <div className="flex-1 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept={IMAGE_INPUT_ACCEPT}
                className="hidden"
                onChange={onImageChange}
                disabled={isImageActionDisabled}
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onImageButtonClick}
                  disabled={isImageActionDisabled}
                  className={secondaryButtonClassName}
                >
                  {isReadingImage ? (
                    <span className="inline-flex items-center gap-2">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      جاري القراءة...
                    </span>
                  ) : selectedImageName ? (
                    "تغيير الصورة"
                  ) : (
                    "رفع صورة"
                  )}
                </button>

                {hasImage ? (
                  <button
                    type="button"
                    onClick={onRemoveImage}
                    disabled={isImageActionDisabled}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <X className="h-4 w-4" />
                    إزالة
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        <button type="submit" disabled={isDisabled} className={primaryButtonClassName}>
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              {isEditMode ? "جارٍ الحفظ..." : "جارٍ الإنشاء..."}
            </span>
          ) : isEditMode ? (
            "حفظ التعديلات"
          ) : (
            "حفظ المنتج"
          )}
        </button>

        <Link href="/products" className={secondaryButtonClassName}>
          رجوع
        </Link>
      </div>
    </form>
  );
}
