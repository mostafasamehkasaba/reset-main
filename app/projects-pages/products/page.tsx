"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";
import { getErrorMessage } from "../../lib/fetcher";
import type { Product } from "../../lib/product-store";
import { deleteProduct, listProducts } from "../../services/products";

const FALLBACK_PRODUCT_IMAGE = "/file.svg";

const getProductImageSrc = (value: string) => value.trim() || FALLBACK_PRODUCT_IMAGE;

export default function ProductsPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listProducts();
        if (!active) return;
        setProducts(data);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getErrorMessage(error, "تعذر تحميل المنتجات."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      return products;
    }

    return products.filter((product) =>
      [
        product.name,
        product.description,
        product.code,
        product.category,
        String(product.id),
        product.supplierName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query, products]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === openId) ?? null,
    [openId, products]
  );

  const selectedDeleteProduct = useMemo(
    () => products.find((product) => product.id === deleteProductId) ?? null,
    [deleteProductId, products]
  );

  const handleDeleteProduct = async (product: Product) => {
    setDeleteError("");
    setIsDeleting(true);

    try {
      await deleteProduct(product);
      setProducts((prev) => prev.filter((entry) => entry.id !== product.id));
      setDeleteProductId(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error, "تعذر حذف المنتج."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="المنتجات" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm md:grid-cols-[1fr_auto_1fr] md:items-center"
            dir="ltr"
          >
            <div className="flex justify-start">
              <Link
                href="/projects-pages/products/new"
                className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
              >
                منتج جديد
              </Link>
            </div>
            <div className="flex justify-center">
              <div className="app-search">
                <input
                  className="app-search-input h-10 w-44 px-3 text-right text-sm outline-none"
                  placeholder="بحث"
                  dir="rtl"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="app-search-icon h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
              </div>
            </div>
            <div className="text-right text-lg font-semibold text-slate-700" dir="rtl">
              المنتجات
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {deleteError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {deleteError}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-separate border-spacing-0 text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 text-center sm:px-3 sm:py-3">#</th>
                    <th className="px-2 py-2 text-center sm:px-3 sm:py-3">الصورة</th>
                    <th className="px-2 py-2 text-right sm:px-3 sm:py-3">الاسم</th>
                    <th className="px-2 py-2 text-center sm:px-3 sm:py-3">الفئة</th>
                    <th className="px-2 py-2 text-center sm:px-3 sm:py-3">المباع</th>
                    <th className="px-2 py-2 text-center sm:px-3 sm:py-3">الوصف</th>
                    <th className="px-2 py-2 text-center sm:px-3 sm:py-3">التاريخ</th>
                    <th className="px-2 py-2 text-center sm:px-3 sm:py-3" aria-label="الإجراءات">
                      ...
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                        جاري تحميل المنتجات...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                        لا توجد منتجات من الـ API حاليا.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product, index) => (
                      <tr
                        key={`${product.id}-${product.code}`}
                        className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                      >
                        <td className="px-2 py-2 text-center text-slate-700 sm:px-3 sm:py-3">
                          {product.id}
                        </td>
                        <td className="px-2 py-2 text-center sm:px-3 sm:py-3">
                          <img
                            src={getProductImageSrc(product.imageUrl)}
                            alt={product.name}
                            className="mx-auto h-12 w-12 rounded-md border border-slate-200 bg-slate-50 object-contain p-1"
                          />
                        </td>
                        <td className="px-2 py-2 text-right font-semibold text-slate-800 sm:px-3 sm:py-3">
                          <div>{product.name}</div>
                          <div className="mt-1 text-xs font-normal text-slate-500">
                            {product.code}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center text-slate-600 sm:px-3 sm:py-3">
                          {product.category}
                        </td>
                        <td className="px-2 py-2 text-center text-slate-700 sm:px-3 sm:py-3">
                          {product.sold}
                        </td>
                        <td className="px-2 py-2 text-center text-slate-500 sm:px-3 sm:py-3">
                          {product.description}
                        </td>
                        <td className="px-2 py-2 text-center text-slate-600 sm:px-3 sm:py-3">
                          {product.dateAdded}
                        </td>
                        <td className="px-2 py-2 text-center text-slate-500 sm:px-3 sm:py-3">
                          <button
                            className="rounded-full p-1 hover:bg-slate-200"
                            aria-label="خيارات"
                            type="button"
                            onClick={() => setOpenId(product.id)}
                          >
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="currentColor"
                            >
                              <circle cx="12" cy="5" r="1.6" />
                              <circle cx="12" cy="12" r="1.6" />
                              <circle cx="12" cy="19" r="1.6" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <Sidebar activeLabel="المنتجات" />
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={getProductImageSrc(selectedProduct.imageUrl)}
                  alt={selectedProduct.name}
                  className="h-12 w-12 rounded-lg border border-slate-200 bg-slate-50 object-contain p-1"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-700">{selectedProduct.name}</p>
                  <p className="text-xs text-slate-500">{selectedProduct.code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-slate-600">الفئة</span>
                <span className="font-semibold text-slate-700">{selectedProduct.category}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-slate-600">الكمية</span>
                <span className="font-semibold text-slate-700">{selectedProduct.quantity}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-slate-600">سعر البيع</span>
                <span className="font-semibold text-emerald-700">
                  {selectedProduct.sellingPrice} {selectedProduct.currency}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-slate-600">الحالة</span>
                <span className="font-semibold text-slate-700">{selectedProduct.status}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <Link
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-center text-slate-600 hover:bg-slate-50"
                href={`/projects-pages/products/view?id=${encodeURIComponent(selectedProduct.id)}`}
              >
                عرض
              </Link>
              <Link
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-center text-slate-600 hover:bg-slate-50"
                href={`/projects-pages/products/new?id=${encodeURIComponent(selectedProduct.id)}`}
              >
                تعديل
              </Link>
              <button
                className="col-span-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 hover:bg-rose-100"
                type="button"
                onClick={() => {
                  setDeleteProductId(selectedProduct.id);
                  setOpenId(null);
                }}
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={deleteProductId !== null}
        title="تأكيد حذف المنتج"
        message={
          selectedDeleteProduct
            ? `هل تريد حذف المنتج "${selectedDeleteProduct.name}"؟`
            : "هل تريد حذف هذا المنتج؟"
        }
        onClose={() => {
          if (isDeleting) return;
          setDeleteProductId(null);
        }}
        onConfirm={() => {
          if (!selectedDeleteProduct || isDeleting) return;
          void handleDeleteProduct(selectedDeleteProduct);
        }}
      />
    </div>
  );
}
