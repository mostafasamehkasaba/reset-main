"use client";

import Link from "next/link";
import { AlertTriangle, Boxes, Eye, MoreHorizontal, PackagePlus, PencilLine, Search, SlidersHorizontal, Tag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ActionDrawer from "@/components/ActionDrawer";
import ViewModeToggle from "@/components/ViewModeToggle";
import { useCollectionViewMode } from "@/hooks/useCollectionViewMode";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";
import { getErrorMessage } from "../../lib/fetcher";
import {
  normalizeProductStatusLabel,
  PRODUCT_TAX_MODES,
  type Product,
  type ProductTaxMode,
} from "../../lib/product-store";
import { deleteProduct, listProducts } from "../../services/products";

const FALLBACK_PRODUCT_IMAGE = "/file.svg";
const moneyFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const taxModeLabelMap: Record<ProductTaxMode, string> = Object.fromEntries(PRODUCT_TAX_MODES.map((option) => [option.value, option.label])) as Record<ProductTaxMode, string>;
const getProductImageSrc = (value: string) => value.trim() || FALLBACK_PRODUCT_IMAGE;
const formatMoney = (value: number, currency: string) => `${moneyFormatter.format(value)} ${currency}`;
const getStatusClasses = (status: Product["status"]) =>
  normalizeProductStatusLabel(status) === "متاح"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
const getTaxToneClasses = (taxMode: ProductTaxMode) => taxMode === "inclusive" ? "border-sky-200 bg-sky-50 text-sky-700" : taxMode === "none" ? "border-slate-200 bg-slate-50 text-slate-600" : "border-violet-200 bg-violet-50 text-violet-700";
const getTaxText = (product: Product) => product.taxMode === "none" ? taxModeLabelMap.none : `${taxModeLabelMap[product.taxMode]} ${product.defaultTaxRate}%`;
const getCategoryText = (product: Product) => {
  const main = product.mainCategoryName && product.mainCategoryName !== "-" ? product.mainCategoryName : "";
  const sub = product.subCategoryName && product.subCategoryName !== "-" ? product.subCategoryName : product.category && product.category !== "-" ? product.category : "";
  if (main && sub && main !== sub) return `${main} / ${sub}`;
  return main || sub || "-";
};

export default function ProductsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Product["status"]>("all");
  const [taxFilter, setTaxFilter] = useState<"all" | ProductTaxMode>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { viewMode, setViewMode, isTableView } = useCollectionViewMode("reset-main-view-mode-products");

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const data = await listProducts();
        if (active) setProducts(data);
      } catch (error) {
        if (active) setErrorMessage(getErrorMessage(error, "تعذر تحميل المنتجات."));
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery = !normalizedQuery || [product.name, product.description, product.code, product.category, product.mainCategoryName, product.subCategoryName, String(product.id), product.supplierName, product.barcode, product.unit].join(" ").toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "all" ||
        normalizeProductStatusLabel(product.status) === statusFilter;
      const matchesTax = taxFilter === "all" || product.taxMode === taxFilter;
      return matchesQuery && matchesStatus && matchesTax;
    });
  }, [products, query, statusFilter, taxFilter]);

  const selectedProduct = useMemo(() => products.find((product) => product.id === openId) ?? null, [openId, products]);
  const selectedDeleteProduct = useMemo(() => products.find((product) => product.id === deleteProductId) ?? null, [deleteProductId, products]);
  const availableProductsCount = useMemo(
    () =>
      products.filter(
        (product) => normalizeProductStatusLabel(product.status) === "متاح"
      ).length,
    [products]
  );
  const lowStockCount = useMemo(() => products.filter((product) => product.quantity <= product.reorderPoint).length, [products]);
  const averageSellingPrice = useMemo(() => products.length === 0 ? "0.00" : moneyFormatter.format(products.reduce((sum, product) => sum + product.sellingPrice, 0) / products.length), [products]);
  const hasActiveFilters = query.trim().length > 0 || statusFilter !== "all" || taxFilter !== "all";

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
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900">
      <TopNav currentLabel="المنتجات" />
      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <section className="rounded-[32px] border border-slate-200 bg-white px-5 py-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.3)] sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">مركز المنتجات</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ViewModeToggle value={viewMode} onChange={setViewMode} />
                <Link href="/products/new" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                  <PackagePlus className="h-4 w-4" />
                  منتج جديد
                </Link>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4"><p className="text-[11px] font-medium tracking-[0.18em] text-slate-400">إجمالي المنتجات</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{products.length}</p><p className="mt-1 text-sm text-slate-500">عدد السجلات المحملة من المصدر الحالي.</p></div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4"><p className="text-[11px] font-medium tracking-[0.18em] text-slate-400">المنتجات المتاحة</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{availableProductsCount}</p><p className="mt-1 text-sm text-slate-500">منتجات حالتها الحالية متاح.</p></div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4"><p className="text-[11px] font-medium tracking-[0.18em] text-slate-400">مخزون يحتاج متابعة</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{lowStockCount}</p><p className="mt-1 text-sm text-slate-500">كمية أقل من أو تساوي نقطة إعادة الطلب.</p></div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4"><p className="text-[11px] font-medium tracking-[0.18em] text-slate-400">متوسط سعر البيع</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{averageSellingPrice} {products[0]?.currency || "OMR"}</p><p className="mt-1 text-sm text-slate-500">متوسط مبسط لسعر البيع الحالي.</p></div>
            </div>
          </section>

          {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div> : null}
          {deleteError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{deleteError}</div> : null}

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">قائمة المنتجات</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">بحث وتصفية وعرض مرئي أوضح</h2>
                <p className="mt-2 text-sm text-slate-500">{isLoading ? "يتم تحميل المنتجات الآن..." : `يعرض ${filteredProducts.length} من أصل ${products.length} منتج.`}</p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">{isTableView ? "عرض جدولي" : "عرض بطاقات"}</div>
            </div>
            <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(180px,220px)_minmax(180px,220px)_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]" placeholder="ابحث بالاسم أو الكود أو المورد أو الوصف" value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <label className="relative block">
                <SlidersHorizontal className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | Product["status"])} className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]">
                  <option value="all">كل الحالات</option>
                  <option value="متاح">متاح</option>
                  <option value="غير متاح">غير متاح</option>
                </select>
              </label>
              <label className="relative block">
                <Tag className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select value={taxFilter} onChange={(event) => setTaxFilter(event.target.value as "all" | ProductTaxMode)} className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]">
                  <option value="all">كل أنواع الضريبة</option>
                  {PRODUCT_TAX_MODES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <button type="button" onClick={() => { setQuery(""); setStatusFilter("all"); setTaxFilter("all"); }} disabled={!hasActiveFilters} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50">إعادة التعيين</button>
            </div>
          </section>
          {isTableView ? (
            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">المنتجات</h3>
                  <p className="mt-1 text-sm text-slate-500">عرض منظم يوضح البيانات الأساسية والإجراءات لكل منتج.</p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">{filteredProducts.length} نتيجة</div>
              </div>
              {isLoading ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1080px] text-right">
                    <thead className="bg-slate-50/90 text-sm text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-medium">اسم المنتج</th><th className="px-4 py-4 font-medium">SKU / الكود</th><th className="px-4 py-4 font-medium">النوع</th><th className="px-4 py-4 font-medium">السعر</th><th className="px-4 py-4 font-medium">الضريبة</th><th className="px-4 py-4 font-medium">الحالة</th><th className="px-4 py-4 text-center font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>{Array.from({ length: 6 }).map((_, index) => <tr key={index} className="border-t border-slate-100">{Array.from({ length: 7 }).map((__, cell) => <td key={cell} className="px-4 py-4"><div className="h-10 animate-pulse rounded-2xl bg-slate-100" /></td>)}</tr>)}</tbody>
                  </table>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400"><Boxes className="h-6 w-6" /></div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950">لا توجد منتجات مطابقة للفلاتر الحالية</h3>
                  <p className="mt-2 text-sm text-slate-500">جرّب تغيير البحث أو إزالة التصفية، أو أضف منتجًا جديدًا إذا لم توجد بيانات بعد.</p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <button type="button" onClick={() => { setQuery(""); setStatusFilter("all"); setTaxFilter("all"); }} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">مسح الفلاتر</button>
                    <Link href="/products/new" className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">إضافة منتج</Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1080px] text-right">
                    <thead className="bg-slate-50/90 text-sm text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-medium">اسم المنتج</th><th className="px-4 py-4 font-medium">SKU / الكود</th><th className="px-4 py-4 font-medium">النوع</th><th className="px-4 py-4 font-medium">السعر</th><th className="px-4 py-4 font-medium">الضريبة</th><th className="px-4 py-4 font-medium">الحالة</th><th className="px-4 py-4 text-center font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => {
                        const lowStock = product.quantity <= product.reorderPoint;
                        const statusLabel = normalizeProductStatusLabel(product.status);
                        return (
                          <tr key={`${product.id}-${product.code}`} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                            <td className="px-5 py-4"><div className="flex items-center gap-3"><img src={getProductImageSrc(product.imageUrl)} alt={product.name} className="h-14 w-14 rounded-2xl border border-slate-200 bg-slate-50 object-contain p-1.5" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950">{product.name}</p><p className="mt-1 truncate text-xs text-slate-500">{product.supplierName && product.supplierName !== "-" ? product.supplierName : "بدون مورد محدد"}</p><p className="mt-1 line-clamp-1 text-xs text-slate-400">{product.description && product.description !== "-" ? product.description : "لا يوجد وصف إضافي."}</p></div></div></td>
                            <td className="px-4 py-4 align-top"><p className="text-sm font-semibold text-slate-900">{product.code}</p><p className="mt-1 text-xs text-slate-500">باركود: {product.barcode && product.barcode !== "-" ? product.barcode : "-"}</p></td>
                            <td className="px-4 py-4 align-top"><div className="space-y-2"><span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">{product.unit || "-"}</span><p className="text-sm text-slate-600">{getCategoryText(product)}</p></div></td>
                            <td className="px-4 py-4 align-top"><p className="text-sm font-semibold text-emerald-700">{formatMoney(product.sellingPrice, product.currency)}</p><p className="mt-1 text-xs text-slate-500">كمية: {product.quantity} | مباع: {product.sold}</p></td>
                            <td className="px-4 py-4 align-top"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getTaxToneClasses(product.taxMode)}`}>{getTaxText(product)}</span></td>
                            <td className="px-4 py-4 align-top"><div className="space-y-2"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(product.status)}`}>{statusLabel}</span><p className={`text-xs ${lowStock ? "text-amber-600" : "text-slate-500"}`}>{lowStock ? `مخزون بحاجة لمتابعة، نقطة إعادة الطلب ${product.reorderPoint}` : `أضيف في ${product.dateAdded}`}</p></div></td>
                            <td className="px-4 py-4 text-center align-top"><button className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700" aria-label={`إجراءات ${product.name}`} type="button" onClick={() => setOpenId(product.id)}><MoreHorizontal className="h-4 w-4" /></button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : isLoading ? (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.22)]"><div className="h-32 animate-pulse rounded-[22px] bg-slate-100" /><div className="mt-4 h-20 animate-pulse rounded-[22px] bg-slate-100" /></div>)}</section>
          ) : filteredProducts.length === 0 ? (
            <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-14 text-center shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400"><Boxes className="h-6 w-6" /></div><h3 className="mt-4 text-lg font-semibold text-slate-950">لا توجد بطاقات لعرضها الآن</h3><p className="mt-2 text-sm text-slate-500">لا توجد نتائج مطابقة للبحث الحالي أو للفلاتر المختارة.</p></section>
          ) : (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const lowStock = product.quantity <= product.reorderPoint;
                const statusLabel = normalizeProductStatusLabel(product.status);
                return (
                  <article key={`${product.id}-${product.code}`} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-42px_rgba(15,23,42,0.26)]">
                    <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><img src={getProductImageSrc(product.imageUrl)} alt={product.name} className="h-14 w-14 rounded-2xl border border-slate-200 bg-slate-50 object-contain p-1.5" /><div className="min-w-0"><h3 className="truncate text-lg font-semibold text-slate-950">{product.name}</h3><p className="mt-1 text-sm text-slate-500">{product.code}</p><p className="mt-1 text-xs text-slate-400">{getCategoryText(product)}</p></div></div><button type="button" onClick={() => setOpenId(product.id)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700" aria-label={`إجراءات ${product.name}`}><MoreHorizontal className="h-4 w-4" /></button></div>
                    <div className="mt-4 flex flex-wrap gap-2"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(product.status)}`}>{statusLabel}</span><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getTaxToneClasses(product.taxMode)}`}>{getTaxText(product)}</span><span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">{product.unit || "-"}</span></div>
                    <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3"><p className="text-xs text-slate-400">سعر البيع</p><p className="mt-1 text-sm font-semibold text-emerald-700">{formatMoney(product.sellingPrice, product.currency)}</p></div><div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3"><p className="text-xs text-slate-400">الكمية الحالية</p><p className="mt-1 text-sm font-semibold text-slate-900">{product.quantity}</p></div><div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3"><p className="text-xs text-slate-400">المباع</p><p className="mt-1 text-sm font-semibold text-slate-900">{product.sold}</p></div><div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3"><p className="text-xs text-slate-400">المورد</p><p className="mt-1 truncate text-sm font-medium text-slate-700">{product.supplierName && product.supplierName !== "-" ? product.supplierName : "-"}</p></div></div>
                    <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${lowStock ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>{lowStock ? <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />يحتاج متابعة مخزون. نقطة إعادة الطلب: {product.reorderPoint}</div> : `تاريخ الإضافة: ${product.dateAdded}`}</div>
                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">{product.description && product.description !== "-" ? product.description : "لا يوجد وصف إضافي لهذا المنتج."}</p>
                    <div className="mt-5 flex flex-wrap items-center gap-2"><Link href={`/products/view?id=${encodeURIComponent(product.id)}`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">عرض</Link><Link href={`/products/new?id=${encodeURIComponent(product.id)}`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">تعديل</Link><button type="button" onClick={() => setDeleteProductId(product.id)} className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100">حذف</button></div>
                  </article>
                );
              })}
            </section>
          )}
        </main>
        <Sidebar activeLabel="المنتجات" />
      </div>
      <ActionDrawer
        open={selectedProduct !== null}
        title="إجراءات المنتج"
        subtitle={selectedProduct?.name}
        onClose={() => setOpenId(null)}
        actions={
          selectedProduct
            ? [
                { id: "view", label: "عرض المنتج", description: "افتح صفحة المنتج لعرض جميع البيانات.", icon: Eye, href: `/products/view?id=${encodeURIComponent(selectedProduct.id)}` },
                { id: "edit", label: "تعديل المنتج", description: "افتح نموذج التعديل لهذا المنتج مباشرة.", icon: PencilLine, href: `/products/new?id=${encodeURIComponent(selectedProduct.id)}` },
                {
                  id: "delete",
                  label: "حذف المنتج",
                  description: "احذف المنتج نهائيًا بعد رسالة التأكيد.",
                  icon: Trash2,
                  tone: "danger" as const,
                  onClick: () => {
                    setDeleteProductId(selectedProduct.id);
                    setOpenId(null);
                  },
                },
              ]
            : []
        }
      >
        {selectedProduct ? (
          <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-3">
              <img src={getProductImageSrc(selectedProduct.imageUrl)} alt={selectedProduct.name} className="h-14 w-14 rounded-2xl border border-slate-200 bg-white object-contain p-1" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{selectedProduct.code}</p>
                <p className="mt-1 text-xs text-slate-500">{selectedProduct.supplierName}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3"><p className="text-xs text-slate-400">التصنيف</p><p className="mt-1 text-sm font-medium text-slate-900">{getCategoryText(selectedProduct)}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3"><p className="text-xs text-slate-400">سعر البيع</p><p className="mt-1 text-sm font-semibold text-emerald-700">{formatMoney(selectedProduct.sellingPrice, selectedProduct.currency)}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3"><p className="text-xs text-slate-400">الضريبة</p><p className="mt-1 text-sm font-medium text-slate-900">{getTaxText(selectedProduct)}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3"><p className="text-xs text-slate-400">الحالة</p><p className="mt-1 text-sm font-medium text-slate-900">{normalizeProductStatusLabel(selectedProduct.status)}</p></div>
            </div>
          </div>
        ) : null}
      </ActionDrawer>
      <ConfirmDeleteModal
        open={deleteProductId !== null}
        title="تأكيد حذف المنتج"
        message={selectedDeleteProduct ? `هل تريد حذف المنتج "${selectedDeleteProduct.name}"؟` : "هل تريد حذف هذا المنتج؟"}
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
