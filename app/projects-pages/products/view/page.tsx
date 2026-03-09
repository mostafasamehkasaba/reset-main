"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";
import { getErrorMessage } from "../../../lib/fetcher";
import type { Product } from "../../../lib/product-store";
import { listProducts } from "../../../services/products";

const FALLBACK_PRODUCT_IMAGE = "/file.svg";
const getProductImageSrc = (value: string) => value.trim() || FALLBACK_PRODUCT_IMAGE;

function ProductViewPageContent() {
  const searchParams = useSearchParams();
  const productIdParam = searchParams.get("id");

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      const rawParam = productIdParam?.trim() || "";

      if (!rawParam) {
        setErrorMessage("لم يتم تحديد المنتج المطلوب.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listProducts();
        if (!active) return;

        const numericId = Number.parseInt(rawParam, 10);
        const normalizedCode = rawParam.toLowerCase();

        const selected =
          (Number.isFinite(numericId)
            ? data.find((entry) => entry.id === numericId)
            : null) ||
          data.find((entry) => entry.code.trim().toLowerCase() === normalizedCode) ||
          null;

        if (!selected) {
          setErrorMessage("تعذر العثور على المنتج المطلوب.");
        }

        setProduct(selected);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getErrorMessage(error, "تعذر تحميل بيانات المنتج."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [productIdParam]);

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="المنتجات" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right text-lg font-semibold text-slate-700">
              بيانات المنتج
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
              جاري تحميل بيانات المنتج...
            </div>
          ) : product ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <img
                  src={getProductImageSrc(product.imageUrl)}
                  alt={product.name}
                  className="h-16 w-16 rounded-lg border border-slate-200 bg-slate-50 object-contain p-1"
                />
                <div>
                  <p className="text-lg font-semibold text-slate-700">{product.name}</p>
                  <p className="text-sm text-slate-500">{product.code}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">الفئة</label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    {product.category}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">سعر البيع</label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    {product.sellingPrice} {product.currency}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">سعر الشراء</label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    {product.purchasePrice} {product.currency}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">الكمية المتاحة</label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    {product.quantity}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">المباع</label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    {product.sold}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">الحالة</label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    {product.status}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">المورد</label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    {product.supplierName}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">تاريخ الإضافة</label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    {product.dateAdded}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label className="text-sm font-semibold text-slate-700">الوصف</label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  {product.description}
                </div>
              </div>
            </div>
          ) : null}
        </main>

        <Sidebar activeLabel="المنتجات" />
      </div>
    </div>
  );
}

function ProductViewPageFallback() {
  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="المنتجات" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
            جاري تحميل بيانات المنتج...
          </div>
        </main>

        <Sidebar activeLabel="المنتجات" />
      </div>
    </div>
  );
}

export default function ProductViewPage() {
  return (
    <Suspense fallback={<ProductViewPageFallback />}>
      <ProductViewPageContent />
    </Suspense>
  );
}
