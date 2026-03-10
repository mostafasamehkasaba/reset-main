import Link from "next/link";
import { Barcode, FolderTree, Package2, Plus, Truck } from "lucide-react";
import type { MainCategory, SubCategory } from "@/app/types";
import type { ProductFormState } from "@/lib/products/productTypes";

type SupplierOption = {
  id: number;
  name: string;
};

type ProductBasicInfoProps = {
  values: ProductFormState;
  mainCategories: MainCategory[];
  filteredSubCategories: SubCategory[];
  supplierOptions: SupplierOption[];
  isDisabled: boolean;
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
};

const fieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const actionButtonClassName =
  "inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70";

const addLinkClassName =
  "inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700";

export function ProductBasicInfo({
  values,
  mainCategories,
  filteredSubCategories,
  supplierOptions,
  isDisabled,
  onFieldChange,
  onNameChange,
  onCodeChange,
  onGenerateCode,
  onGenerateBarcode,
  onMainCategoryChange,
  onSubCategoryChange,
}: ProductBasicInfoProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
          <Package2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
            المعلومات الأساسية
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            هوية المنتج وربطه بالتصنيفات
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            أدخل الاسم والكود والباركود، ثم اربط المنتج بالتصنيف والمورد المناسبين.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <label className="space-y-2 xl:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
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

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            كود المنتج <span className="text-rose-500">*</span>
          </span>
          <div className="flex flex-wrap gap-2">
            <input
              value={values.code}
              onChange={(event) => onCodeChange(event.target.value)}
              className={`${fieldClassName} min-w-[220px] flex-1`}
              required
              disabled={isDisabled}
            />
            <button
              type="button"
              onClick={onGenerateCode}
              className={actionButtonClassName}
              disabled={isDisabled}
            >
              توليد تلقائي
            </button>
          </div>
        </label>

        <label className="space-y-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Barcode className="h-4 w-4 text-slate-400" />
            الباركود
          </span>
          <div className="flex flex-wrap gap-2">
            <input
              value={values.barcode}
              onChange={(event) => onFieldChange("barcode", event.target.value)}
              className={`${fieldClassName} min-w-[220px] flex-1`}
              placeholder="مثال: 6281000010012"
              disabled={isDisabled}
            />
            <button
              type="button"
              onClick={onGenerateBarcode}
              className={actionButtonClassName}
              disabled={isDisabled}
            >
              توليد
            </button>
          </div>
        </label>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FolderTree className="h-4 w-4 text-slate-400" />
            التصنيف الرئيسي
          </span>
          <div className="flex gap-2">
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
            <Link
              href="/projects-pages/categories/main"
              className={addLinkClassName}
              aria-label="إدارة التصنيفات الرئيسية"
            >
              <Plus className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FolderTree className="h-4 w-4 text-slate-400" />
            التصنيف الفرعي
          </span>
          <div className="flex gap-2">
            <select
              value={values.subCategoryId}
              onChange={(event) => onSubCategoryChange(event.target.value)}
              disabled={!values.mainCategoryId || isDisabled}
              className={fieldClassName}
            >
              <option value="">اختر التصنيف الفرعي</option>
              {filteredSubCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Link
              href="/projects-pages/categories/sub"
              className={addLinkClassName}
              aria-label="إدارة التصنيفات الفرعية"
            >
              <Plus className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="space-y-2 xl:col-span-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Truck className="h-4 w-4 text-slate-400" />
            المورد
          </span>
          <div className="flex gap-2">
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
            <Link
              href="/projects-pages/Suppliers/new"
              className={addLinkClassName}
              aria-label="إضافة مورد جديد"
            >
              <Plus className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
