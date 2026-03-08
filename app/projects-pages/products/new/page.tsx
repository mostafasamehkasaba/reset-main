"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";
import {
  createProductCode,
  PRODUCT_TAX_MODES,
  PRODUCT_UNITS,
  type Product,
  type ProductTaxMode,
  type ProductUnit,
} from "../../../lib/product-store";
import { getErrorMessage } from "../../../lib/fetcher";
import { createProduct } from "../../../services/products";

type ProductFormState = {
  name: string;
  code: string;
  barcode: string;
  category: string;
  imageUrl: string;
  sellingPrice: string;
  purchasePrice: string;
  quantity: string;
  unit: ProductUnit;
  minStockLevel: string;
  reorderPoint: string;
  taxMode: ProductTaxMode;
  defaultTaxRate: string;
  supplierName: string;
  currency: string;
  dateAdded: string;
  status: Product["status"];
  description: string;
};

const todayDate = () => new Date().toISOString().slice(0, 10);
const createBarcode = () => Date.now().toString().slice(-12).padStart(12, "0");
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("تعذر قراءة ملف صورة المنتج."));
    };
    reader.onerror = () => reject(new Error("تعذر قراءة ملف صورة المنتج."));
    reader.readAsDataURL(file);
  });

const createInitialState = (): ProductFormState => ({
  name: "",
  code: createProductCode(""),
  barcode: createBarcode(),
  category: "",
  imageUrl: "",
  sellingPrice: "0",
  purchasePrice: "0",
  quantity: "1",
  unit: "قطعة",
  minStockLevel: "2",
  reorderPoint: "5",
  taxMode: "rate",
  defaultTaxRate: "15",
  supplierName: "",
  currency: "OMR",
  dateAdded: todayDate(),
  status: "متاح",
  description: "",
});

export default function NewProductPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<ProductFormState>(createInitialState);
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageName, setSelectedImageName] = useState("");

  const imagePreview = form.imageUrl.trim() || "/file.svg";

  const updateField = <K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      code: isCodeManuallyEdited ? prev.code : createProductCode(value),
    }));
  };

  const handleImageButtonClick = () => {
    if (isSubmitting) return;
    fileInputRef.current?.click();
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setSaveMessage("");

    if (!file.type.startsWith("image/")) {
      setValidationMessage("يرجى اختيار ملف صورة صالح للمنتج.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setValidationMessage("حجم صورة المنتج يجب ألا يتجاوز 2 ميجابايت.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setValidationMessage("");
      setSelectedImageName(file.name);
      setForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch (error) {
      setValidationMessage(getErrorMessage(error, "تعذر قراءة صورة المنتج."));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImageName("");
    setValidationMessage("");
    setForm((prev) => ({ ...prev, imageUrl: "" }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationMessage("");
    setSaveMessage("");

    if (!form.name.trim()) {
      setValidationMessage("يرجى إدخال اسم المنتج.");
      return;
    }

    if (!form.code.trim()) {
      setValidationMessage("يرجى إدخال كود المنتج.");
      return;
    }

    setIsSubmitting(true);

    try {
      const quantity = Math.max(0, Number.parseInt(form.quantity, 10) || 0);
      const minStockLevel = Math.max(0, Number.parseInt(form.minStockLevel, 10) || 0);
      const reorderInput = Math.max(0, Number.parseInt(form.reorderPoint, 10) || 0);
      const reorderPoint = Math.max(minStockLevel, reorderInput);
      const taxRate =
        form.taxMode === "none"
          ? 0
          : Math.max(0, Number.parseFloat(form.defaultTaxRate) || 0);

      const savedProduct = await createProduct({
        code: form.code.trim(),
        name: form.name.trim(),
        category: form.category.trim() || "-",
        sellingPrice: Math.max(0, Number.parseFloat(form.sellingPrice) || 0),
        purchasePrice: Math.max(0, Number.parseFloat(form.purchasePrice) || 0),
        defaultTaxRate: taxRate,
        quantity,
        minStockLevel,
        reorderPoint,
        description: form.description.trim() || "-",
        imageUrl: form.imageUrl.trim() || "/file.svg",
        dateAdded: form.dateAdded,
        status: form.status,
        currency: form.currency,
        unit: form.unit,
        supplierName: form.supplierName.trim() || "-",
        barcode: form.barcode.trim() || createBarcode(),
        taxMode: form.taxMode,
      });

      setSaveMessage(`تم حفظ المنتج بنجاح: ${savedProduct.name} (${savedProduct.code})`);
      setForm((prev) => ({
        ...createInitialState(),
        currency: prev.currency,
      }));
      setIsCodeManuallyEdited(false);
      setSelectedImageName("");
    } catch (error) {
      setValidationMessage(getErrorMessage(error, "تعذر حفظ المنتج."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="المنتجات" />

      <div
        className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6"
        dir="ltr"
      >
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right text-lg font-semibold text-slate-700">
              إضافة منتج جديد
            </div>
            <Link
              href="/projects-pages/products"
              className="rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-600"
            >
              رجوع
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">العملة</label>
                <select
                  value={form.currency}
                  onChange={(event) => updateField("currency", event.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="OMR">ريال عماني</option>
                  <option value="SAR">ريال سعودي</option>
                  <option value="USD">دولار</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">تاريخ الإضافة</label>
                <input
                  type="date"
                  value={form.dateAdded}
                  onChange={(event) => updateField("dateAdded", event.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">الحالة</label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    updateField("status", event.target.value as Product["status"])
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="متاح">متاح</option>
                  <option value="غير متاح">غير متاح</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">صورة المنتج</label>
                <img
                  src={imagePreview}
                  alt="صورة المنتج"
                  className="h-28 w-full rounded-md border border-slate-200 bg-slate-50 object-contain p-3"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={handleImageButtonClick}
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {selectedImageName ? "تغيير صورة المنتج" : "رفع صورة المنتج"}
                </button>
                <div className="text-xs text-slate-500">
                  {selectedImageName || "JPG, PNG, WEBP حتى 2MB"}
                </div>
                {form.imageUrl ? (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    إزالة الصورة
                  </button>
                ) : null}
                <input
                  type="hidden"
                  value={form.imageUrl}
                  onChange={(event) => updateField("imageUrl", event.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  placeholder="رابط الصورة (اختياري)"
                />
              </div>
            </aside>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">اسم المنتج</label>
                  <input
                    value={form.name}
                    onChange={(event) => handleNameChange(event.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    placeholder="مثال: قالب ووردبريس"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">كود المنتج</label>
                  <div className="flex gap-2">
                    <input
                      value={form.code}
                      onChange={(event) => {
                        setIsCodeManuallyEdited(true);
                        updateField("code", event.target.value);
                      }}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        updateField("code", createProductCode(form.name));
                        setIsCodeManuallyEdited(false);
                      }}
                      className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                    >
                      توليد تلقائي
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">الباركود</label>
                  <div className="flex gap-2">
                    <input
                      value={form.barcode}
                      onChange={(event) => updateField("barcode", event.target.value)}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                      placeholder="مثال: 6281000010012"
                    />
                    <button
                      type="button"
                      onClick={() => updateField("barcode", createBarcode())}
                      className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                    >
                      توليد
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">الفئة</label>
                  <input
                    value={form.category}
                    onChange={(event) => updateField("category", event.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    placeholder="مثال: تصميم"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">سعر البيع</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sellingPrice}
                    onChange={(event) => updateField("sellingPrice", event.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    سعر الشراء (تكلفة المنتج)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.purchasePrice}
                    onChange={(event) => updateField("purchasePrice", event.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">الكمية المتاحة</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.quantity}
                    onChange={(event) => updateField("quantity", event.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">وحدة القياس</label>
                  <select
                    value={form.unit}
                    onChange={(event) => updateField("unit", event.target.value as ProductUnit)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    {PRODUCT_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="product-stock-alert mt-5 rounded-lg border p-3">
                <h3 className="product-stock-alert__title text-sm font-bold">تنبيه المخزون</h3>
                <p className="product-stock-alert__desc mt-1 text-xs">
                  عند وصول الكمية الحالية إلى حد إعادة الطلب أو أقل، سيظهر تنبيه في لوحة
                  البيانات.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      الحد الأدنى للمخزون
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.minStockLevel}
                      onChange={(event) => updateField("minStockLevel", event.target.value)}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      حد إعادة الطلب
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.reorderPoint}
                      onChange={(event) => updateField("reorderPoint", event.target.value)}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <h3 className="text-sm font-bold text-slate-800">الضريبة الافتراضية</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">نوع الضريبة</label>
                    <select
                      value={form.taxMode}
                      onChange={(event) =>
                        updateField("taxMode", event.target.value as ProductTaxMode)
                      }
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      {PRODUCT_TAX_MODES.map((mode) => (
                        <option key={mode.value} value={mode.value}>
                          {mode.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">نسبة الضريبة %</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.defaultTaxRate}
                      disabled={form.taxMode === "none"}
                      onChange={(event) => updateField("defaultTaxRate", event.target.value)}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <label className="text-sm font-semibold text-slate-700">اسم المورد</label>
                <input
                  value={form.supplierName}
                  onChange={(event) => updateField("supplierName", event.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  placeholder="اكتب اسم المورد"
                />
              </div>

              <div className="mt-4 space-y-2">
                <label className="text-sm font-semibold text-slate-700">الوصف</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  placeholder="وصف اختياري للمنتج"
                />
              </div>

              {validationMessage ? (
                <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {validationMessage}
                </div>
              ) : null}

              {saveMessage ? (
                <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {saveMessage}
                </div>
              ) : null}

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-brand-900 px-8 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "جارٍ حفظ المنتج..." : "حفظ المنتج"}
                </button>
                <Link
                  href="/projects-pages/products"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
                >
                  إلغاء
                </Link>
              </div>
            </section>
          </form>
        </main>

        <Sidebar activeLabel="المنتجات" />
      </div>
    </div>
  );
}
