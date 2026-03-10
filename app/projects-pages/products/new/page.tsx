"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";
import { ProductForm } from "@/components/products/ProductForm";
import { getErrorMessage } from "../../../lib/fetcher";
import { listCategories } from "../../../services/categories";
import {
  createProductCode,
  PRODUCT_UNITS,
  type ProductUnit,
} from "../../../lib/product-store";
import { listProductUnits } from "../../../services/product-units";
import { createProduct, listProducts, updateProduct } from "../../../services/products";
import { listSuppliers } from "../../../services/suppliers";
import type { MainCategory, SubCategory, Supplier } from "../../../types";
import {
  FALLBACK_PRODUCT_IMAGE,
  MAX_IMAGE_SIZE_BYTES,
  buildProductFormStateFromProduct,
  createBarcode,
  createInitialProductFormState,
  hasAcceptedImageExtension,
  type ProductFormState,
} from "@/lib/products/productTypes";
import { validateProductForm } from "@/lib/products/productValidation";

export default function NewProductPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(createInitialProductFormState);
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [selectedImageName, setSelectedImageName] = useState("");
  const [productIdParam, setProductIdParam] = useState("");
  const [isRouteReady, setIsRouteReady] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");
  const [referenceError, setReferenceError] = useState("");
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [unitOptions, setUnitOptions] = useState<string[]>(PRODUCT_UNITS);
  const isEditMode = productIdParam.length > 0;

  const revokePreviewObjectUrl = () => {
    if (previewObjectUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }

    previewObjectUrlRef.current = null;
  };

  const updateField = <K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetImageSelection = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    revokePreviewObjectUrl();
    setIsReadingImage(false);
    setSelectedImageName("");

    setForm((prev) => ({
      ...prev,
      imageUrl: "",
      imageFile: null,
    }));
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      code: isCodeManuallyEdited ? prev.code : createProductCode(value),
    }));
  };

  const handleCodeChange = (value: string) => {
    setIsCodeManuallyEdited(true);
    updateField("code", value);
  };

  const handleGenerateCode = () => {
    updateField("code", createProductCode(form.name));
    setIsCodeManuallyEdited(false);
  };

  const handleGenerateBarcode = () => {
    updateField("barcode", createBarcode());
  };

  const handleMainCategoryChange = (value: string) => {
    updateField("mainCategoryId", value);
    updateField("subCategoryId", "");
    updateField("category", "");
  };

  const handleSubCategoryChange = (value: string) => {
    updateField("subCategoryId", value);
    const selectedSub =
      filteredSubCategories.find((category) => String(category.id) === value) ?? null;
    updateField("category", selectedSub?.name || "");
  };

  const handleImageButtonClick = () => {
    if (isSubmitting || isReadingImage) {
      return;
    }

    fileInputRef.current?.click();
  };

  useEffect(() => {
    const nextProductId = new URLSearchParams(window.location.search).get("id")?.trim() || "";
    setProductIdParam(nextProductId);
    setIsRouteReady(true);
  }, []);

  useEffect(() => {
    return () => {
      revokePreviewObjectUrl();
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadReferences = async () => {
      setReferenceError("");

      const [categoriesResult, suppliersResult, unitsResult] = await Promise.allSettled([
        listCategories(),
        listSuppliers(),
        listProductUnits(),
      ]);

      if (!active) {
        return;
      }

      const errors: string[] = [];

      if (categoriesResult.status === "fulfilled") {
        setMainCategories(categoriesResult.value.mainCategories);
        setSubCategories(categoriesResult.value.subCategories);
      } else {
        errors.push(getErrorMessage(categoriesResult.reason, "تعذر تحميل التصنيفات."));
      }

      if (suppliersResult.status === "fulfilled") {
        setSuppliers(suppliersResult.value);
      } else {
        errors.push(getErrorMessage(suppliersResult.reason, "تعذر تحميل الموردين."));
      }

      if (unitsResult.status === "fulfilled") {
        setUnitOptions(
          Array.from(
            new Set([
              ...PRODUCT_UNITS,
              ...unitsResult.value.map((unit) => unit.name.trim()).filter(Boolean),
            ])
          )
        );
      } else {
        errors.push(getErrorMessage(unitsResult.reason, "تعذر تحميل وحدات القياس."));
      }

      if (errors.length > 0) {
        setReferenceError(errors.join(" "));
      }
    };

    void loadReferences();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isRouteReady || !isEditMode) {
      return;
    }

    let active = true;

    const loadProduct = async () => {
      setLoadError("");
      setValidationMessage("");

      try {
        const products = await listProducts();
        if (!active) {
          return;
        }

        const matchedProduct =
          products.find((product) => String(product.id) === productIdParam) ?? null;

        if (!matchedProduct) {
          setLoadError("تعذر العثور على المنتج المطلوب للتعديل.");
          return;
        }

        revokePreviewObjectUrl();
        setEditingProductId(matchedProduct.id);
        setIsCodeManuallyEdited(true);
        setSelectedImageName(
          matchedProduct.imageUrl && matchedProduct.imageUrl !== FALLBACK_PRODUCT_IMAGE
            ? "صورة حالية"
            : ""
        );
        setForm(buildProductFormStateFromProduct(matchedProduct));
      } catch (error) {
        if (!active) {
          return;
        }

        setLoadError(getErrorMessage(error, "تعذر تحميل بيانات المنتج."));
      }
    };

    void loadProduct();

    return () => {
      active = false;
    };
  }, [isEditMode, isRouteReady, productIdParam]);

  const filteredSubCategories = useMemo(() => {
    const mainCategoryId = Number.parseInt(form.mainCategoryId, 10);

    if (!Number.isFinite(mainCategoryId)) {
      return [];
    }

    return subCategories.filter((category) => category.mainCategoryId === mainCategoryId);
  }, [form.mainCategoryId, subCategories]);

  const normalizedUnitOptions = useMemo(
    () =>
      Array.from(
        new Set([...unitOptions, form.unit.trim()].filter((entry) => entry && entry.trim()))
      ),
    [form.unit, unitOptions]
  );

  const normalizedSupplierOptions = useMemo(() => {
    const supplierEntries = suppliers.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
    }));

    if (
      form.supplierName.trim() &&
      !supplierEntries.some(
        (supplier) => supplier.name.trim().toLowerCase() === form.supplierName.trim().toLowerCase()
      )
    ) {
      supplierEntries.unshift({
        id: -1,
        name: form.supplierName.trim(),
      });
    }

    return supplierEntries;
  }, [form.supplierName, suppliers]);

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSaveMessage("");
    setValidationMessage("");

    const isValidImageFile =
      file.type.startsWith("image/") ||
      (!file.type && hasAcceptedImageExtension(file.name)) ||
      hasAcceptedImageExtension(file.name);

    if (!isValidImageFile) {
      setValidationMessage("يرجى اختيار ملف صورة صالح بامتداد مدعوم.");
      resetImageSelection();
      return;
    }

    if (file.size === 0) {
      setValidationMessage("ملف الصورة فارغ. اختر صورة أخرى.");
      resetImageSelection();
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setValidationMessage("حجم صورة المنتج يجب ألا يتجاوز 10 ميجابايت.");
      resetImageSelection();
      return;
    }

    setIsReadingImage(true);

    try {
      revokePreviewObjectUrl();
      const previewUrl = URL.createObjectURL(file);
      previewObjectUrlRef.current = previewUrl;

      setForm((prev) => ({
        ...prev,
        imageUrl: previewUrl,
        imageFile: file,
      }));
      setSelectedImageName(file.name);
    } finally {
      setIsReadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setValidationMessage("");
    resetImageSelection();
  };

  const handleImagePreviewError = () => {
    setValidationMessage(
      form.imageFile
        ? "تم اختيار الصورة، لكن المتصفح الحالي لا يدعم معاينتها. سيتم حفظها إذا قبلها الخادم."
        : "تعذر عرض صورة المنتج الحالية."
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationMessage("");
    setSaveMessage("");

    const nextValidationMessage = validateProductForm({
      values: form,
      isEditMode,
      editingProductId,
    });

    if (nextValidationMessage) {
      setValidationMessage(nextValidationMessage);
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
      const selectedMainCategory =
        mainCategories.find((category) => String(category.id) === form.mainCategoryId) ?? null;
      const selectedSubCategory =
        filteredSubCategories.find((category) => String(category.id) === form.subCategoryId) ??
        null;
      const normalizedCategory =
        selectedSubCategory?.name || selectedMainCategory?.name || form.category.trim() || "-";

      const productPayload = {
        code: form.code.trim(),
        name: form.name.trim(),
        category: normalizedCategory,
        mainCategoryId: selectedMainCategory?.id ?? null,
        mainCategoryName: selectedMainCategory?.name || "-",
        subCategoryId: selectedSubCategory?.id ?? null,
        subCategoryName: selectedSubCategory?.name || "-",
        sellingPrice: Math.max(0, Number.parseFloat(form.sellingPrice) || 0),
        purchasePrice: Math.max(0, Number.parseFloat(form.purchasePrice) || 0),
        defaultTaxRate: taxRate,
        quantity,
        minStockLevel,
        reorderPoint,
        description: form.description.trim() || "-",
        imageUrl: form.imageUrl || FALLBACK_PRODUCT_IMAGE,
        imageFile: form.imageFile,
        dateAdded: form.dateAdded,
        status: form.status,
        currency: form.currency,
        unit: form.unit as ProductUnit,
        supplierName: form.supplierName.trim() || "-",
        barcode: form.barcode.trim() || createBarcode(),
        taxMode: form.taxMode,
      };

      const savedProduct = isEditMode
        ? await updateProduct(editingProductId ?? 0, productPayload)
        : await createProduct(productPayload);

      revokePreviewObjectUrl();

      if (isEditMode) {
        setSaveMessage(`تم حفظ تعديلات المنتج بنجاح: ${savedProduct.name} (${savedProduct.code})`);
        setSelectedImageName(
          savedProduct.imageUrl && savedProduct.imageUrl !== FALLBACK_PRODUCT_IMAGE
            ? "صورة حالية"
            : ""
        );
        setForm(buildProductFormStateFromProduct(savedProduct));
      } else {
        setSaveMessage(`تم حفظ المنتج بنجاح: ${savedProduct.name} (${savedProduct.code})`);
        setForm((prev) => ({
          ...createInitialProductFormState(),
          currency: prev.currency,
        }));
        setIsCodeManuallyEdited(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setSelectedImageName("");
      }
    } catch (error) {
      setValidationMessage(getErrorMessage(error, "تعذر حفظ المنتج."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormLoading = !isRouteReady || (isEditMode && !editingProductId && !loadError);

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900">
      <TopNav currentLabel="المنتجات" />

      <div
        className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6"
        dir="ltr"
      >
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <section className="rounded-[32px] border border-slate-200 bg-white px-5 py-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.3)] sm:px-6">
            <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">المنتجات</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {isEditMode ? "تعديل المنتج" : "إضافة منتج جديد"}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
              أعيد تنظيم النموذج إلى سكاشن أوضح وأسرع في المسح البصري، مع الحفاظ على نفس
              حقول الباكند، ونفس آلية الحفظ، ونفس علاقات المنتج مع التصنيفات والموردين
              والمخزون.
            </p>
          </section>

          <ProductForm
            values={form}
            isEditMode={isEditMode}
            isLoading={isFormLoading}
            isSubmitting={isSubmitting}
            isReadingImage={isReadingImage}
            validationMessage={validationMessage}
            saveMessage={saveMessage}
            loadError={loadError}
            referenceError={referenceError}
            selectedImageName={selectedImageName}
            mainCategories={mainCategories}
            filteredSubCategories={filteredSubCategories}
            supplierOptions={normalizedSupplierOptions}
            unitOptions={normalizedUnitOptions}
            fileInputRef={fileInputRef}
            onSubmit={handleSubmit}
            onFieldChange={updateField}
            onNameChange={handleNameChange}
            onCodeChange={handleCodeChange}
            onGenerateCode={handleGenerateCode}
            onGenerateBarcode={handleGenerateBarcode}
            onMainCategoryChange={handleMainCategoryChange}
            onSubCategoryChange={handleSubCategoryChange}
            onImageButtonClick={handleImageButtonClick}
            onImageChange={handleImageChange}
            onRemoveImage={handleRemoveImage}
            onImagePreviewError={handleImagePreviewError}
          />
        </main>

        <Sidebar activeLabel="المنتجات" />
      </div>
    </div>
  );
}
