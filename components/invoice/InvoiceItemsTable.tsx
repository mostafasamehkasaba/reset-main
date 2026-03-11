import { Plus, Trash2 } from "lucide-react";
import type { Product } from "@/app/lib/product-store";
import { calculateInvoiceRowTotal } from "@/lib/invoice/invoiceCalculations";
import type { InvoiceEditorItem, InvoiceEditorItemKind } from "@/lib/invoice/invoiceTypes";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatMoney = (value: number, currency: string) =>
  `${moneyFormatter.format(value)} ${currency}`;

const getProductOptionValue = (product: Product) => product.backendId ?? product.id;

type InvoiceItemsTableProps = {
  items: InvoiceEditorItem[];
  products: Product[];
  currency: string;
  productCatalogMessage?: string;
  error?: string;
  onAddProductItem: () => void;
  onAddServiceItem: () => void;
  onChangeKind: (itemId: number, kind: InvoiceEditorItemKind) => void;
  onSelectProduct: (itemId: number, productIdText: string) => void;
  onChangeField: (
    itemId: number,
    field: keyof Pick<InvoiceEditorItem, "name" | "quantity" | "price">,
    value: string | number
  ) => void;
  onRemoveItem: (itemId: number) => void;
};

export function InvoiceItemsTable({
  items,
  products,
  currency,
  productCatalogMessage,
  error,
  onAddProductItem,
  onAddServiceItem,
  onChangeKind,
  onSelectProduct,
  onChangeField,
  onRemoveItem,
}: InvoiceItemsTableProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">بنود الفاتورة</p>
          <p className="mt-1 text-sm text-slate-500">
            كل صف يحسب إجماليه تلقائيًا من الكمية والسعر.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onAddProductItem}
            disabled={products.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            إضافة منتج
          </button>
          <button
            type="button"
            onClick={onAddServiceItem}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            إضافة خدمة
          </button>
        </div>
      </div>

      {productCatalogMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {productCatalogMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_28px_80px_-48px_rgba(15,23,42,0.35)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-right">
            <thead className="bg-slate-50/90 text-sm text-slate-500">
              <tr>
                <th className="px-4 py-4 font-medium">النوع</th>
                <th className="px-4 py-4 font-medium">الوصف</th>
                <th className="px-4 py-4 text-center font-medium">الكمية</th>
                <th className="px-4 py-4 text-center font-medium">سعر الوحدة</th>
                <th className="px-4 py-4 text-center font-medium">إجمالي الصف</th>
                <th className="px-4 py-4 text-center font-medium">إزالة</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const hasValidProductSelection =
                  item.kind !== "product" ||
                  (item.productId !== null &&
                    products.some((product) => getProductOptionValue(product) === item.productId));

                return (
                <tr key={item.id} className="border-t border-slate-200/80 align-top">
                  <td className="px-4 py-4">
                    <select
                      value={item.kind}
                      onChange={(event) =>
                        onChangeKind(item.id, event.target.value as InvoiceEditorItemKind)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                    >
                      <option value="service">خدمة</option>
                      <option value="product" disabled={products.length === 0}>
                        منتج
                      </option>
                    </select>
                  </td>

                  <td className="px-4 py-4">
                    {item.kind === "product" ? (
                      <>
                        <select
                          value={hasValidProductSelection ? item.productId ?? "" : ""}
                          onChange={(event) => onSelectProduct(item.id, event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                        >
                          <option value="" disabled>
                            {products.length > 0 ? "اختر منتجًا" : "لا توجد منتجات"}
                          </option>
                          {products.map((product) => (
                            <option
                              key={`${product.code}-${product.backendId ?? product.id}`}
                              value={getProductOptionValue(product)}
                            >
                              {product.name}
                            </option>
                          ))}
                        </select>
                        {!hasValidProductSelection ? (
                          <p className="mt-2 text-xs text-rose-600">
                            {item.name.trim()
                              ? `البند الحالي (${item.name}) لم يعد مرتبطًا بمنتج صالح. اختر منتجًا من القائمة أو غيّر النوع إلى خدمة.`
                              : "هذا البند غير مرتبط بمنتج صالح. اختر منتجًا من القائمة أو غيّر النوع إلى خدمة."}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <input
                        value={item.name}
                        onChange={(event) => onChangeField(item.id, "name", event.target.value)}
                        placeholder="اسم البند أو الخدمة"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                      />
                    )}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(event) => onChangeField(item.id, "quantity", event.target.value)}
                      className="mx-auto w-24 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                    />
                  </td>

                  <td className="px-4 py-4 text-center">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(event) => onChangeField(item.id, "price", event.target.value)}
                      className="mx-auto w-32 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                    />
                  </td>

                  <td className="px-4 py-4 text-center">
                    <div className="inline-flex min-w-[132px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
                      {formatMoney(calculateInvoiceRowTotal(item), currency)}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                      aria-label="إزالة البند"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
