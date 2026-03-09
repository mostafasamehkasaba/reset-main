"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";
import { type Product } from "../../../lib/product-store";
import { getErrorMessage } from "../../../lib/fetcher";
import { loadStoredValue, saveStoredValue } from "../../../lib/local-fallback";
import { listClients } from "../../../services/clients";
import {
  createInvoice,
  listInvoices,
  type InvoicePaymentStatus,
} from "../../../services/invoices";
import { listProducts } from "../../../services/products";
import { emptySettings, getSettings, type AppSettings } from "../../../services/settings";
import type { Client, Invoice } from "../../../types";

type InvoiceItemType = "product" | "service";
type DiscountType = "percent" | "amount";
type PaymentMethod = "cash" | "transfer" | "card" | "credit";
type PaymentStatus = "مسودة" | "مدفوعة" | "غير مدفوعة" | "مدفوعة جزئيا" | "ملغاة";

type InvoiceItem = {
  id: number;
  itemType: InvoiceItemType;
  productId: number | null;
  name: string;
  price: number;
  quantity: number;
  discountType: DiscountType;
  discountValue: number;
  taxRate: number;
};

type LineTotals = {
  base: number;
  discount: number;
  tax: number;
  total: number;
};

type StoredInvoiceDraft = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  partialPaidAmount: string;
  defaultTaxRate: string;
  notes: string;
  currency: string;
  selectedClientId: number | null;
  clientSearch: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  lineItems: InvoiceItem[];
  nextLineId: number;
};

const INVOICE_SEQUENCE_KEY = "reset-main-invoice-sequence-v1";
const INVOICE_DRAFTS_STORAGE_KEY = "reset-main-invoice-drafts-v1";
const todayDate = () => new Date().toISOString().slice(0, 10);

const formatInvoiceNumber = (sequence: number) =>
  `INV-${String(Math.max(1, sequence)).padStart(4, "0")}`;

const toPositiveNumber = (value: string, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, parsed);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asText = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const asFiniteNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const toDateInputValue = (value: string, fallback = "") => {
  const text = value.trim();
  if (!text || text === "-") {
    return fallback;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const prefixedDate = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (prefixedDate?.[1]) {
    return prefixedDate[1];
  }

  const parsedDate = new Date(text);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().slice(0, 10);
  }

  return fallback;
};

const isPaymentMethodValue = (value: unknown): value is PaymentMethod =>
  value === "cash" || value === "transfer" || value === "card" || value === "credit";

const normalizePaymentStatus = (value: string): PaymentStatus => {
  const normalized = value.trim().toLowerCase();

  if (normalized === "paid" || normalized === "مدفوعة") {
    return "مدفوعة";
  }

  if (normalized === "unpaid" || normalized === "غير مدفوعة" || normalized === "pending") {
    return "غير مدفوعة";
  }

  if (
    normalized === "partial" ||
    normalized === "partially_paid" ||
    normalized === "مدفوعة جزئيا" ||
    normalized === "مدفوعة جزئيًا"
  ) {
    return "مدفوعة جزئيا";
  }

  if (normalized === "cancelled" || normalized === "canceled" || normalized === "ملغاة") {
    return "ملغاة";
  }

  return "مسودة";
};

const normalizeStoredLineItems = (value: unknown): InvoiceItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry, index) => {
      if (!isRecord(entry)) {
        return null;
      }

      const itemType: InvoiceItemType = entry.itemType === "product" ? "product" : "service";
      const discountType: DiscountType = entry.discountType === "amount" ? "amount" : "percent";

      const productIdValue = asFiniteNumber(entry.productId, Number.NaN);
      const productId = Number.isFinite(productIdValue) ? Math.trunc(productIdValue) : null;

      return {
        id: Math.max(1, Math.trunc(asFiniteNumber(entry.id, index + 1))),
        itemType,
        productId,
        name: asText(entry.name, ""),
        price: Math.max(0, asFiniteNumber(entry.price, 0)),
        quantity: Math.max(1, Math.trunc(asFiniteNumber(entry.quantity, 1))),
        discountType,
        discountValue: Math.max(0, asFiniteNumber(entry.discountValue, 0)),
        taxRate: Math.max(0, asFiniteNumber(entry.taxRate, 0)),
      };
    })
    .filter((entry): entry is InvoiceItem => entry !== null);
};

const getNextLineId = (items: InvoiceItem[]) =>
  items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;

const buildSummaryFallbackItems = (invoice: Invoice): InvoiceItem[] => {
  const safeTotal = Math.max(0, invoice.total);
  const safeDiscount = Math.max(0, invoice.discount);

  return [
    {
      id: 1,
      itemType: "service",
      productId: null,
      name: `فاتورة ${invoice.id}`,
      price: safeTotal + safeDiscount,
      quantity: 1,
      discountType: safeDiscount > 0 ? "amount" : "percent",
      discountValue: safeDiscount > 0 ? safeDiscount : 0,
      taxRate: 0,
    },
  ];
};

const loadInvoiceDrafts = () =>
  loadStoredValue<Record<string, unknown>>(INVOICE_DRAFTS_STORAGE_KEY, {}, (value) => {
    if (!isRecord(value)) {
      return {};
    }

    return value;
  });

const getStoredInvoiceDraft = (invoiceId: string): StoredInvoiceDraft | null => {
  if (!invoiceId) {
    return null;
  }

  const drafts = loadInvoiceDrafts();
  const rawDraft = drafts[invoiceId];
  if (!isRecord(rawDraft)) {
    return null;
  }

  const paymentMethod = isPaymentMethodValue(rawDraft.paymentMethod)
    ? rawDraft.paymentMethod
    : "cash";
  const paymentStatus = normalizePaymentStatus(asText(rawDraft.paymentStatus, "مسودة"));
  const lineItems = normalizeStoredLineItems(rawDraft.lineItems);

  return {
    invoiceNumber: asText(rawDraft.invoiceNumber, invoiceId),
    issueDate: toDateInputValue(asText(rawDraft.issueDate, todayDate()), todayDate()),
    dueDate: toDateInputValue(asText(rawDraft.dueDate, ""), ""),
    paymentMethod,
    paymentStatus,
    partialPaidAmount: asText(rawDraft.partialPaidAmount, "0"),
    defaultTaxRate: asText(rawDraft.defaultTaxRate, "15"),
    notes: asText(rawDraft.notes, ""),
    currency: asText(rawDraft.currency, "OMR"),
    selectedClientId:
      typeof rawDraft.selectedClientId === "number" && Number.isFinite(rawDraft.selectedClientId)
        ? Math.trunc(rawDraft.selectedClientId)
        : null,
    clientSearch: asText(rawDraft.clientSearch, ""),
    clientEmail: asText(rawDraft.clientEmail, ""),
    clientPhone: asText(rawDraft.clientPhone, ""),
    clientAddress: asText(rawDraft.clientAddress, ""),
    lineItems,
    nextLineId: Math.max(
      2,
      Math.trunc(asFiniteNumber(rawDraft.nextLineId, getNextLineId(lineItems)))
    ),
  };
};

const saveInvoiceDraft = (invoiceId: string, draft: StoredInvoiceDraft) => {
  if (!invoiceId.trim()) {
    return;
  }

  const drafts = loadInvoiceDrafts();
  drafts[invoiceId] = draft;
  saveStoredValue(INVOICE_DRAFTS_STORAGE_KEY, drafts);
};

const calculateLineTotals = (item: InvoiceItem): LineTotals => {
  const safePrice = Math.max(0, item.price);
  const safeQuantity = Math.max(1, item.quantity);
  const base = safePrice * safeQuantity;

  const rawDiscount =
    item.discountType === "percent"
      ? (base * Math.max(0, item.discountValue)) / 100
      : Math.max(0, item.discountValue);
  const discount = Math.min(base, rawDiscount);
  const taxable = Math.max(0, base - discount);
  const tax = (taxable * Math.max(0, item.taxRate)) / 100;

  return {
    base,
    discount,
    tax,
    total: taxable + tax,
  };
};

const makeProductRow = (
  id: number,
  products: Product[],
  defaultTaxRate: number
): InvoiceItem => {
  const firstProduct = products[0];
  if (!firstProduct) {
    return {
      id,
      itemType: "product",
      productId: null,
      name: "",
      price: 0,
      quantity: 1,
      discountType: "percent",
      discountValue: 0,
      taxRate: defaultTaxRate,
    };
  }

  return {
    id,
    itemType: "product",
    productId: firstProduct.id,
    name: firstProduct.name,
    price: firstProduct.sellingPrice,
    quantity: 1,
    discountType: "percent",
    discountValue: 0,
    taxRate:
      firstProduct.taxMode === "none" ? 0 : Math.max(0, firstProduct.defaultTaxRate),
  };
};

const makeServiceRow = (id: number, defaultTaxRate: number): InvoiceItem => ({
  id,
  itemType: "service",
  productId: null,
  name: "",
  price: 0,
  quantity: 1,
  discountType: "percent",
  discountValue: 0,
  taxRate: defaultTaxRate,
});

const paymentMethods: Array<{ value: PaymentMethod; label: string }> = [
  { value: "cash", label: "نقدي" },
  { value: "transfer", label: "تحويل" },
  { value: "card", label: "شبكة" },
  { value: "credit", label: "آجل" },
];

const paymentStatuses: PaymentStatus[] = [
  "مسودة",
  "مدفوعة",
  "غير مدفوعة",
  "مدفوعة جزئيا",
  "ملغاة",
];

const paymentStatusApiMap: Record<PaymentStatus, InvoicePaymentStatus> = {
  مسودة: "draft",
  مدفوعة: "paid",
  "غير مدفوعة": "unpaid",
  "مدفوعة جزئيا": "partial",
  ملغاة: "cancelled",
};

const currencies: Array<{ code: string; label: string }> = [
  { code: "OMR", label: "ريال عماني" },
  { code: "SAR", label: "ريال سعودي" },
  { code: "USD", label: "دولار" },
  { code: "QAR", label: "ريال قطري" },
];

const formatMoney = (value: number) => value.toFixed(2);

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export default function NewInvoicePage() {
  const [invoiceIdParam, setInvoiceIdParam] = useState("");
  const [isRouteReady, setIsRouteReady] = useState(false);
  const isEditMode = invoiceIdParam.length > 0;

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [companySettings, setCompanySettings] = useState<AppSettings>(emptySettings);
  const [currency, setCurrency] = useState("OMR");
  const [issueDate, setIssueDate] = useState(todayDate());
  const [dueDate, setDueDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("مسودة");
  const [partialPaidAmount, setPartialPaidAmount] = useState("0");
  const [defaultTaxRate, setDefaultTaxRate] = useState("15");
  const [notes, setNotes] = useState("");
  const [invoiceSequence, setInvoiceSequence] = useState(1);
  const [invoiceNumber, setInvoiceNumber] = useState("INV-0001");
  const [nextLineId, setNextLineId] = useState(1);
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([
    makeServiceRow(1, 15),
  ]);
  const [deleteRowId, setDeleteRowId] = useState<number | null>(null);
  const [showClientMenu, setShowClientMenu] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [purchaseOrderFile, setPurchaseOrderFile] = useState<File | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [editNotice, setEditNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const nextInvoiceId = new URLSearchParams(window.location.search).get("id")?.trim() || "";
    setInvoiceIdParam(nextInvoiceId);
    setIsRouteReady(true);
  }, []);

  useEffect(() => {
    if (!isRouteReady) {
      return;
    }

    let active = true;

    const loadData = async () => {
      setLoadError("");
      setEditNotice("");
      setSaveMessage("");
      setSaveError("");
      setValidationMessage("");
      setContractFile(null);
      setDesignFile(null);
      setPurchaseOrderFile(null);

      try {
        const [productsData, clientsData, settingsData] = await Promise.all([
          listProducts(),
          listClients(),
          getSettings().catch(() => emptySettings),
        ]);
        if (!active) return;

        const parsedDefaultTaxRate = toPositiveNumber(defaultTaxRate, 0);
        const defaultRow =
          productsData.length > 0
            ? makeProductRow(1, productsData, parsedDefaultTaxRate)
            : makeServiceRow(1, parsedDefaultTaxRate);

        setAvailableProducts(productsData);
        setClientsList(clientsData);
        setCompanySettings(settingsData);
        setNotes(settingsData.invoiceNotes || "");

        if (isEditMode) {
          const draft = getStoredInvoiceDraft(invoiceIdParam);
          if (draft) {
            const draftItems = draft.lineItems.length > 0 ? draft.lineItems : [defaultRow];
            setInvoiceNumber(draft.invoiceNumber || invoiceIdParam);
            setIssueDate(toDateInputValue(draft.issueDate, todayDate()));
            setDueDate(toDateInputValue(draft.dueDate, ""));
            setPaymentMethod(draft.paymentMethod);
            setPaymentStatus(draft.paymentStatus);
            setPartialPaidAmount(draft.partialPaidAmount);
            setDefaultTaxRate(draft.defaultTaxRate);
            setNotes(draft.notes);
            setCurrency(draft.currency || "OMR");
            setSelectedClientId(draft.selectedClientId);
            setClientSearch(draft.clientSearch);
            setClientEmail(draft.clientEmail);
            setClientPhone(draft.clientPhone);
            setClientAddress(draft.clientAddress);
            setLineItems(draftItems);
            setNextLineId(Math.max(draft.nextLineId, getNextLineId(draftItems)));
            return;
          }

          let invoicesData: Invoice[] = [];
          try {
            invoicesData = await listInvoices();
          } catch {
            invoicesData = [];
          }
          if (!active) return;

          const invoiceData = invoicesData.find((entry) => entry.id === invoiceIdParam) ?? null;
          if (!invoiceData) {
            setLoadError("تعذر العثور على الفاتورة المطلوبة للتعديل.");
            setInvoiceNumber(invoiceIdParam);
            setIssueDate(todayDate());
            setDueDate("");
            setPaymentMethod("cash");
            setPaymentStatus("مسودة");
            setPartialPaidAmount("0");
            setCurrency("OMR");
            setSelectedClientId(null);
            setClientSearch("");
            setClientEmail("");
            setClientPhone("");
            setClientAddress("");
            setLineItems([defaultRow]);
            setNextLineId(2);
            return;
          }

          const normalizedClientName = invoiceData.client.trim().toLowerCase();
          const matchedClient = normalizedClientName
            ? clientsData.find((client) => client.name.trim().toLowerCase() === normalizedClientName) ??
              clientsData.find((client) =>
                client.name.trim().toLowerCase().includes(normalizedClientName)
              ) ??
              null
            : null;

          const mappedStatus = normalizePaymentStatus(invoiceData.status);
          const reconstructedItems = buildSummaryFallbackItems(invoiceData);

          setInvoiceNumber(invoiceData.id);
          setIssueDate(toDateInputValue(invoiceData.date, todayDate()));
          setDueDate(toDateInputValue(invoiceData.dueDate, ""));
          setPaymentMethod(toDateInputValue(invoiceData.dueDate, "") ? "credit" : "cash");
          setPaymentStatus(mappedStatus);
          setPartialPaidAmount(
            mappedStatus === "مدفوعة جزئيا" ? String(Math.max(0, invoiceData.paid)) : "0"
          );
          setCurrency(invoiceData.currency || "OMR");

          if (matchedClient) {
            setSelectedClientId(matchedClient.id);
            setClientSearch(matchedClient.name);
            setClientEmail(matchedClient.email);
            setClientPhone(matchedClient.phone);
            setClientAddress(matchedClient.address);
          } else {
            setSelectedClientId(null);
            setClientSearch(invoiceData.client === "-" ? "" : invoiceData.client);
            setClientEmail("");
            setClientPhone("");
            setClientAddress("");
          }

          setLineItems(reconstructedItems);
          setNextLineId(getNextLineId(reconstructedItems));
          setEditNotice(
            "تم تحميل البيانات الأساسية فقط. بنود الفاتورة الأصلية غير متاحة لهذه الفاتورة."
          );
          return;
        }

        setPaymentMethod("cash");
        setPaymentStatus("مسودة");
        setPartialPaidAmount("0");
        setIssueDate(todayDate());
        setDueDate("");
        setCurrency("OMR");
        setSelectedClientId(null);
        setClientSearch("");
        setClientEmail("");
        setClientPhone("");
        setClientAddress("");
        setLineItems([defaultRow]);
        setNextLineId(2);

        const storedSequence = Number.parseInt(
          window.localStorage.getItem(INVOICE_SEQUENCE_KEY) ?? "0",
          10
        );
        const safeSequence = Number.isFinite(storedSequence) ? Math.max(0, storedSequence) : 0;
        const newSequence = safeSequence + 1;
        setInvoiceSequence(newSequence);
        setInvoiceNumber(formatInvoiceNumber(newSequence));
      } catch (error) {
        if (!active) return;
        setLoadError(getErrorMessage(error, "تعذر تحميل البيانات المرتبطة بالفاتورة."));
        setEditNotice("");
        setAvailableProducts([]);
        setClientsList([]);
        setCompanySettings(emptySettings);
        const defaultRow = makeServiceRow(1, toPositiveNumber(defaultTaxRate, 0));
        setIssueDate(todayDate());
        setDueDate("");
        setPaymentMethod("cash");
        setPaymentStatus("مسودة");
        setPartialPaidAmount("0");
        setCurrency("OMR");
        setSelectedClientId(null);
        setClientSearch("");
        setClientEmail("");
        setClientPhone("");
        setClientAddress("");
        setNotes("");
        setLineItems([defaultRow]);
        setNextLineId(2);
        if (isEditMode) {
          setInvoiceNumber(invoiceIdParam || "INV-0001");
        }
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [invoiceIdParam, isEditMode, isRouteReady]);

  const selectedClient = useMemo(
    () => clientsList.find((client) => client.id === selectedClientId) ?? null,
    [selectedClientId, clientsList]
  );

  const filteredClients = useMemo(() => {
    const query = clientSearch.trim();
    if (!query) {
      return clientsList;
    }
    return clientsList.filter((client) => {
      return (
        client.name.includes(query) ||
        client.email.includes(query) ||
        client.phone.includes(query)
      );
    });
  }, [clientSearch, clientsList]);

  const summary = useMemo(() => {
    return lineItems.reduce(
      (totals, item) => {
        const line = calculateLineTotals(item);
        return {
          subtotal: totals.subtotal + line.base,
          discount: totals.discount + line.discount,
          tax: totals.tax + line.tax,
          grandTotal: totals.grandTotal + line.total,
        };
      },
      { subtotal: 0, discount: 0, tax: 0, grandTotal: 0 }
    );
  }, [lineItems]);

  const paidAmount = useMemo(() => {
    if (paymentStatus === "مدفوعة") {
      return summary.grandTotal;
    }

    if (paymentStatus === "مدفوعة جزئيا") {
      return Math.min(summary.grandTotal, toPositiveNumber(partialPaidAmount, 0));
    }

    return 0;
  }, [partialPaidAmount, paymentStatus, summary.grandTotal]);

  const paymentStatusApiValue = paymentStatusApiMap[paymentStatus];

  const selectedDeleteRow = useMemo(
    () => lineItems.find((item) => item.id === deleteRowId) ?? null,
    [lineItems, deleteRowId]
  );

  const isOverdue =
    dueDate !== "" &&
    dueDate < todayDate() &&
    paymentStatus !== "مدفوعة" &&
    paymentStatus !== "ملغاة";

  const selectClient = (clientId: number) => {
    const client = clientsList.find((entry) => entry.id === clientId);
    if (!client) {
      return;
    }
    setSelectedClientId(client.id);
    setClientSearch(client.name);
    setClientEmail(client.email);
    setClientPhone(client.phone);
    setClientAddress(client.address);
    setCurrency(client.currency);
    setShowClientMenu(false);
  };

  const addProductRow = () => {
    if (availableProducts.length === 0) {
      setValidationMessage("لا توجد منتجات مضافة بعد. أضف منتجًا أولًا أو استخدم خدمة.");
      return;
    }

    const row = makeProductRow(
      nextLineId,
      availableProducts,
      toPositiveNumber(defaultTaxRate, 0)
    );
    setLineItems((current) => [...current, row]);
    setNextLineId((current) => current + 1);
  };

  const addServiceRow = () => {
    const row = makeServiceRow(nextLineId, toPositiveNumber(defaultTaxRate, 0));
    setLineItems((current) => [...current, row]);
    setNextLineId((current) => current + 1);
  };

  const updateRow = (rowId: number, updater: (row: InvoiceItem) => InvoiceItem) => {
    setLineItems((current) => current.map((row) => (row.id === rowId ? updater(row) : row)));
  };

  const removeRow = (rowId: number) => {
    setLineItems((current) => {
      if (current.length === 1) {
        return current;
      }
      return current.filter((row) => row.id !== rowId);
    });
  };

  const handleProductSelection = (rowId: number, productIdText: string) => {
    const productId = Number.parseInt(productIdText, 10);
    if (!Number.isFinite(productId)) {
      return;
    }
    const product = availableProducts.find((entry) => entry.id === productId);
    if (!product) {
      return;
    }

    updateRow(rowId, (row) => ({
      ...row,
      productId: product.id,
      name: product.name,
      price: product.sellingPrice,
      taxRate: product.taxMode === "none" ? 0 : Math.max(0, product.defaultTaxRate),
    }));
  };

  const resetForNextInvoice = () => {
    const nextSequence = invoiceSequence + 1;
    setInvoiceSequence(nextSequence);
    setInvoiceNumber(formatInvoiceNumber(nextSequence));
    window.localStorage.setItem(INVOICE_SEQUENCE_KEY, String(nextSequence));
    setPaymentStatus("مسودة");
    setPartialPaidAmount("0");
    setPaymentMethod("cash");
    setIssueDate(todayDate());
    setDueDate("");
    setNotes("");
    setSelectedClientId(null);
    setClientSearch("");
    setClientEmail("");
    setClientPhone("");
    setClientAddress("");
    setContractFile(null);
    setDesignFile(null);
    setPurchaseOrderFile(null);
    setLineItems([
      availableProducts.length > 0
        ? makeProductRow(1, availableProducts, toPositiveNumber(defaultTaxRate, 0))
        : makeServiceRow(1, toPositiveNumber(defaultTaxRate, 0)),
    ]);
    setNextLineId(2);
  };

  const buildDraftSnapshot = (): StoredInvoiceDraft => {
    const sanitizedItems = lineItems.map((item) => ({
      ...item,
      id: Math.max(1, Math.trunc(item.id)),
      name: item.name.trim(),
      price: Math.max(0, item.price),
      quantity: Math.max(1, Math.trunc(item.quantity)),
      discountValue: Math.max(0, item.discountValue),
      taxRate: Math.max(0, item.taxRate),
      productId:
        item.itemType === "product" && typeof item.productId === "number"
          ? Math.trunc(item.productId)
          : null,
    }));

    return {
      invoiceNumber,
      issueDate,
      dueDate,
      paymentMethod,
      paymentStatus,
      partialPaidAmount,
      defaultTaxRate,
      notes,
      currency,
      selectedClientId,
      clientSearch,
      clientEmail,
      clientPhone,
      clientAddress,
      lineItems: sanitizedItems,
      nextLineId: Math.max(nextLineId, getNextLineId(sanitizedItems)),
    };
  };

  const buildPrintableDocument = (mode: "print" | "pdf") => {
    const dueText = dueDate || "-";
    const printableLogo = companySettings.logoDataUrl || `${window.location.origin}/globe.svg`;
    const companyName = companySettings.siteName || "فاتورة+";
    const companyTagline = companySettings.companyTagline || "تصميم فاتورة رسمي";
    const itemsHtml = lineItems
      .map((item) => {
        const line = calculateLineTotals(item);
        const discountLabel =
          item.discountType === "percent"
            ? `${item.discountValue.toFixed(2)}%`
            : `${formatMoney(item.discountValue)} ${currency}`;
        return `
          <tr>
            <td>${escapeHtml(item.name || "بدون اسم")}</td>
            <td>${item.quantity}</td>
            <td>${formatMoney(item.price)}</td>
            <td>${discountLabel}</td>
            <td>${item.taxRate.toFixed(2)}%</td>
            <td>${formatMoney(line.total)}</td>
          </tr>
        `;
      })
      .join("");

    const attachments = [contractFile, designFile, purchaseOrderFile]
      .filter((file): file is File => file !== null)
      .map((file) => `<li>${escapeHtml(file.name)}</li>`)
      .join("");

    const attachmentSection =
      attachments.length > 0 ? `<h4>المرفقات</h4><ul>${attachments}</ul>` : "";

    return `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>${mode === "pdf" ? "PDF" : "Print"} - ${escapeHtml(invoiceNumber)}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
      .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
      .logoWrap { display: flex; align-items: center; gap: 10px; }
      .logoWrap img { width: 44px; height: 44px; border-radius: 10px; background: #f1f5f9; padding: 8px; }
      .badge { padding: 6px 12px; border-radius: 9999px; background: #eef2ff; border: 1px solid #c7d2fe; }
      .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 12px; }
      .muted { color: #64748b; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: right; font-size: 13px; }
      th { background: #f8fafc; }
      .summary { margin-top: 10px; width: 280px; margin-inline-start: auto; }
      .summary div { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
      .summary div:last-child { border-bottom: 0; font-weight: bold; color: #166534; }
      ul { margin: 8px 0 0; padding: 0 18px 0 0; }
      h4 { margin: 12px 0 6px; font-size: 13px; }
    </style>
  </head>
  <body>
    <div class="head">
      <div class="logoWrap">
        <img src="${printableLogo}" alt="Logo" />
        <div>
          <div style="font-weight:700;">${escapeHtml(companyName)}</div>
          <div class="muted">${escapeHtml(companyTagline)}</div>
        </div>
      </div>
      <div class="badge">${escapeHtml(invoiceNumber)}</div>
    </div>

    <div class="card">
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">
        <div>
          <div class="muted">العميل</div>
          <div>${escapeHtml(selectedClient?.name ?? "غير محدد")}</div>
        </div>
        <div>
          <div class="muted">البريد</div>
          <div>${escapeHtml(clientEmail || "-")}</div>
        </div>
        <div>
          <div class="muted">الهاتف</div>
          <div>${escapeHtml(clientPhone || "-")}</div>
        </div>
        <div>
          <div class="muted">حالة الدفع</div>
          <div>${escapeHtml(paymentStatus)}</div>
        </div>
        <div>
          <div class="muted">تاريخ الإصدار</div>
          <div>${escapeHtml(issueDate)}</div>
        </div>
        <div>
          <div class="muted">الاستحقاق</div>
          <div>${escapeHtml(dueText)}</div>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>البند</th>
          <th>الكمية</th>
          <th>السعر</th>
          <th>الخصم</th>
          <th>الضريبة</th>
          <th>الإجمالي</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <div class="summary">
      <div><span>الإجمالي</span><span>${formatMoney(summary.subtotal)} ${currency}</span></div>
      <div><span>الخصم</span><span>${formatMoney(summary.discount)} ${currency}</span></div>
      <div><span>الضريبة</span><span>${formatMoney(summary.tax)} ${currency}</span></div>
      <div><span>الإجمالي النهائي</span><span>${formatMoney(summary.grandTotal)} ${currency}</span></div>
    </div>

    <div class="card" style="margin-top:10px;">
      <div class="muted">ملاحظات</div>
      <div>${escapeHtml(notes || "-")}</div>
      ${attachmentSection}
    </div>
  </body>
</html>`;
  };

  const openPrintWindow = (mode: "print" | "pdf") => {
    const popup = window.open("", "_blank", "width=1100,height=800");
    if (!popup) {
      setValidationMessage("تعذر فتح نافذة الطباعة. تأكد من السماح بالنوافذ المنبثقة.");
      return;
    }

    popup.document.open();
    popup.document.write(buildPrintableDocument(mode));
    popup.document.close();
    popup.focus();
    window.setTimeout(() => {
      popup.print();
      if (mode === "print") {
        popup.close();
      }
    }, 250);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationMessage("");
    setSaveMessage("");
    setSaveError("");

    if (!selectedClient) {
      setValidationMessage("يجب اختيار العميل من القائمة.");
      return;
    }
    if (!issueDate) {
      setValidationMessage("حدد تاريخ الفاتورة.");
      return;
    }
    if (lineItems.length === 0) {
      setValidationMessage("أضف منتجًا أو خدمة واحدة على الأقل.");
      return;
    }
    if (lineItems.some((item) => !item.name.trim())) {
      setValidationMessage("كل سطر يجب أن يحتوي على اسم منتج أو خدمة.");
      return;
    }
    if (
      lineItems.some(
        (item) => item.itemType === "product" && !Number.isInteger(item.productId ?? Number.NaN)
      )
    ) {
      setValidationMessage("اختر منتجًا صالحًا لكل سطر منتج، أو غيّر السطر إلى خدمة.");
      return;
    }
    if (paymentMethod === "credit" && !dueDate) {
      setValidationMessage("حدد تاريخ الاستحقاق لأن طريقة الدفع آجل.");
      return;
    }
    if (paymentStatus === "مدفوعة جزئيا") {
      if (paidAmount <= 0) {
        setValidationMessage("حدد مبلغًا مدفوعًا أكبر من صفر للحالة مدفوعة جزئيا.");
        return;
      }

      if (paidAmount >= summary.grandTotal) {
        setValidationMessage("المبلغ المدفوع جزئيًا يجب أن يكون أقل من إجمالي الفاتورة.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const savedInvoice = await createInvoice({
        invoiceNumber,
        issueDate,
        dueDate: dueDate || undefined,
        status: paymentStatusApiValue,
        currency,
        paymentMethod,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim(),
        clientAddress: clientAddress.trim(),
        notes: notes.trim(),
        paidAmount,
        totals: {
          subtotal: summary.subtotal,
          discount: summary.discount,
          tax: summary.tax,
          total: summary.grandTotal,
        },
        items: lineItems.map((item) => ({
          itemType: item.itemType,
          ...(item.itemType === "product" && typeof item.productId === "number"
            ? { productId: item.productId }
            : {}),
          name: item.name.trim(),
          price: item.price,
          quantity: item.quantity,
          discountType: item.discountType,
          discountValue: item.discountValue,
          taxRate: item.taxRate,
        })),
      });

      const savedNumber = savedInvoice?.id || invoiceNumber;
      saveInvoiceDraft(savedNumber, buildDraftSnapshot());

      if (isEditMode) {
        setInvoiceNumber(savedNumber);
        setSaveMessage(`تم حفظ تعديلات الفاتورة ${savedNumber} بنجاح.`);
      } else {
        setSaveMessage(`تم حفظ الفاتورة ${savedNumber} بنجاح.`);
        resetForNextInvoice();
      }
    } catch (error) {
      setSaveError(getErrorMessage(error, "تعذر حفظ الفاتورة."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-100 text-slate-800">
      <TopNav currentLabel="الفواتير" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right">
              <p className="text-lg font-semibold text-slate-700">
                {isEditMode ? "تعديل فاتورة" : "فاتورة جديدة"}
              </p>
              <p className="text-xs text-slate-500">
                {isEditMode ? "رقم الفاتورة" : "رقم تلقائي"}: {invoiceNumber}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openPrintWindow("print")}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                طباعة
              </button>
              <button
                type="button"
                onClick={() => openPrintWindow("pdf")}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                تحميل PDF
              </button>
              <Link
                href="/projects-pages/invoices"
                className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600"
              >
                رجوع
              </Link>
            </div>
          </div>

          {loadError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {loadError}
            </div>
          ) : null}

          {editNotice ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {editNotice}
            </div>
          ) : null}

          <form
            onSubmit={onSubmit}
            className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]"
          >
            <aside className="min-w-0 space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">رقم الفاتورة</label>
                <input
                  readOnly
                  value={invoiceNumber}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">العملة</label>
                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {currencies.map((entry) => (
                    <option key={entry.code} value={entry.code}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">تاريخ الإصدار</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(event) => setIssueDate(event.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">طريقة الدفع</label>
                <select
                  value={paymentMethod}
                  onChange={(event) => {
                    const value = event.target.value as PaymentMethod;
                    setPaymentMethod(value);
                  }}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">تاريخ الاستحقاق</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className={`w-full rounded-md border px-3 py-2 text-sm ${
                    isOverdue ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-200"
                  }`}
                />
                {isOverdue ? (
                  <p className="text-xs font-semibold text-rose-700">
                    تنبيه: تاريخ الاستحقاق متأخر.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">حالة الدفع</label>
                <select
                  value={paymentStatus}
                  onChange={(event) => {
                    const nextStatus = event.target.value as PaymentStatus;
                    setPaymentStatus(nextStatus);
                    if (nextStatus !== "مدفوعة جزئيا") {
                      setPartialPaidAmount("0");
                    }
                  }}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {paymentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {paymentStatus === "مدفوعة جزئيا" ? (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">المبلغ المدفوع</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={partialPaidAmount}
                    onChange={(event) => setPartialPaidAmount(event.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    أدخل مبلغًا أقل من إجمالي الفاتورة: {formatMoney(summary.grandTotal)} {currency}
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  ضريبة افتراضية للسطر الجديد (%)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={defaultTaxRate}
                  onChange={(event) => setDefaultTaxRate(event.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </aside>

            <section className="min-w-0 space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-lg bg-white shadow-sm">
                      <img
                        src={companySettings.logoDataUrl || "/globe.svg"}
                        alt="شعار"
                        className="h-7 w-7 object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {companySettings.siteName || "فاتورة+"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {companySettings.companyTagline || "تصميم فاتورة رسمي بالشعار"}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                    {invoiceNumber}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    اختيار العميل (بحث سريع)
                  </label>
                  <div className="relative">
                    <input
                      value={clientSearch}
                      onFocus={() => setShowClientMenu(true)}
                      onChange={(event) => {
                        setClientSearch(event.target.value);
                        setShowClientMenu(true);
                      }}
                      onBlur={() => {
                        window.setTimeout(() => {
                          setShowClientMenu(false);
                          if (selectedClient && clientSearch !== selectedClient.name) {
                            setClientSearch(selectedClient.name);
                          }
                        }, 150);
                      }}
                      className="app-search-input w-full px-3 py-2 text-sm"
                      placeholder="ابحث باسم العميل أو الهاتف"
                    />
                    {showClientMenu ? (
                      <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
                        {filteredClients.length > 0 ? (
                          filteredClients.map((client) => (
                            <button
                              key={client.id}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => selectClient(client.id)}
                              className="w-full border-b border-slate-100 px-3 py-2 text-right text-sm hover:bg-slate-50"
                            >
                              <p className="font-semibold text-slate-700">{client.name}</p>
                              <p className="text-xs text-slate-500">
                                {client.phone} - {client.email}
                              </p>
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-2 text-sm text-slate-500">لا توجد نتائج.</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">البريد الإلكتروني</label>
                  <input
                    value={clientEmail}
                    onChange={(event) => setClientEmail(event.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    placeholder="example@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">الهاتف</label>
                  <input
                    value={clientPhone}
                    onChange={(event) => setClientPhone(event.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    placeholder="+966 5x xxx xxxx"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">العنوان</label>
                  <input
                    value={clientAddress}
                    onChange={(event) => setClientAddress(event.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    placeholder="عنوان العميل"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-700">المنتجات والخدمات</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addProductRow}
                    disabled={availableProducts.length === 0}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    إضافة منتج
                  </button>
                  <button
                    type="button"
                    onClick={addServiceRow}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    إضافة خدمة
                  </button>
                </div>
              </div>

              {availableProducts.length === 0 ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  لا توجد منتجات مرتبطة حاليًا، لذلك ستنشأ الفاتورة كبنود خدمات فقط حتى تضيف منتجًا.
                </div>
              ) : null}

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-right text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-2 py-2">النوع</th>
                        <th className="px-2 py-2">المنتج / الخدمة</th>
                        <th className="px-2 py-2 text-center">السعر</th>
                        <th className="px-2 py-2 text-center">الكمية</th>
                        <th className="px-2 py-2 text-center">الخصم</th>
                        <th className="px-2 py-2 text-center">قيمة الخصم</th>
                        <th className="px-2 py-2 text-center">الضريبة %</th>
                        <th className="px-2 py-2 text-center">الإجمالي</th>
                        <th className="px-2 py-2 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((row) => {
                        const lineTotals = calculateLineTotals(row);
                        return (
                          <tr key={row.id} className="border-t border-slate-200">
                            <td className="px-2 py-2">
                              <select
                                value={row.itemType}
                                onChange={(event) => {
                                  const value = event.target.value as InvoiceItemType;
                                  if (value === "product") {
                                    updateRow(row.id, () =>
                                      makeProductRow(
                                        row.id,
                                        availableProducts,
                                        toPositiveNumber(defaultTaxRate, 0)
                                      )
                                    );
                                    return;
                                  }
                                  updateRow(row.id, () =>
                                    makeServiceRow(row.id, toPositiveNumber(defaultTaxRate, 0))
                                  );
                                }}
                                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1"
                              >
                                <option value="product" disabled={availableProducts.length === 0}>
                                  منتج
                                </option>
                                <option value="service">خدمة</option>
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              {row.itemType === "product" ? (
                                <select
                                  value={row.productId ?? ""}
                                  onChange={(event) =>
                                    handleProductSelection(row.id, event.target.value)
                                  }
                                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1"
                                >
                                  {availableProducts.length > 0 ? (
                                    availableProducts.map((product) => (
                                      <option key={product.id} value={product.id}>
                                        {product.name}
                                      </option>
                                    ))
                                  ) : (
                                    <option value="">لا توجد منتجات</option>
                                  )}
                                </select>
                              ) : (
                                <input
                                  value={row.name}
                                  onChange={(event) =>
                                    updateRow(row.id, (current) => ({
                                      ...current,
                                      name: event.target.value,
                                    }))
                                  }
                                  className="w-full rounded-md border border-slate-200 px-2 py-1"
                                  placeholder="وصف الخدمة"
                                />
                              )}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={row.price}
                                onChange={(event) =>
                                  updateRow(row.id, (current) => ({
                                    ...current,
                                    price: toPositiveNumber(event.target.value, 0),
                                  }))
                                }
                                className="w-24 rounded-md border border-slate-200 px-2 py-1 text-center"
                              />
                            </td>
                            <td className="px-2 py-2 text-center">
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={row.quantity}
                                onChange={(event) =>
                                  updateRow(row.id, (current) => ({
                                    ...current,
                                    quantity: Math.max(
                                      1,
                                      Number.parseInt(event.target.value || "1", 10) || 1
                                    ),
                                  }))
                                }
                                className="w-20 rounded-md border border-slate-200 px-2 py-1 text-center"
                              />
                            </td>
                            <td className="px-2 py-2 text-center">
                              <select
                                value={row.discountType}
                                onChange={(event) =>
                                  updateRow(row.id, (current) => ({
                                    ...current,
                                    discountType: event.target.value as DiscountType,
                                  }))
                                }
                                className="rounded-md border border-slate-200 bg-white px-2 py-1"
                              >
                                <option value="percent">%</option>
                                <option value="amount">رقم</option>
                              </select>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={row.discountValue}
                                onChange={(event) =>
                                  updateRow(row.id, (current) => ({
                                    ...current,
                                    discountValue: toPositiveNumber(event.target.value, 0),
                                  }))
                                }
                                className="w-24 rounded-md border border-slate-200 px-2 py-1 text-center"
                              />
                            </td>
                            <td className="px-2 py-2 text-center">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={row.taxRate}
                                onChange={(event) =>
                                  updateRow(row.id, (current) => ({
                                    ...current,
                                    taxRate: toPositiveNumber(event.target.value, 0),
                                  }))
                                }
                                className="w-20 rounded-md border border-slate-200 px-2 py-1 text-center"
                              />
                            </td>
                            <td className="px-2 py-2 text-center font-semibold text-slate-700">
                              {formatMoney(lineTotals.total)}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => setDeleteRowId(row.id)}
                                className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700"
                              >
                                حذف
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">ملاحظات</label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    placeholder="أضف ملاحظات إضافية للفاتورة"
                  />

                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-700">المرفقات</p>
                    <div className="mt-2 space-y-2 text-sm">
                      <div>
                        <label className="mb-1 block text-slate-600">عقد</label>
                        <input
                          type="file"
                          onChange={(event) =>
                            setContractFile(event.target.files?.[0] ?? null)
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-slate-600">تصميم</label>
                        <input
                          type="file"
                          onChange={(event) => setDesignFile(event.target.files?.[0] ?? null)}
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-slate-600">أمر شراء</label>
                        <input
                          type="file"
                          onChange={(event) =>
                            setPurchaseOrderFile(event.target.files?.[0] ?? null)
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 py-2">
                    <span className="text-slate-600">الإجمالي</span>
                    <span className="font-semibold text-slate-700">
                      {formatMoney(summary.subtotal)} {currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 py-2">
                    <span className="text-slate-600">إجمالي الخصم</span>
                    <span className="font-semibold text-slate-700">
                      {formatMoney(summary.discount)} {currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 py-2">
                    <span className="text-slate-600">إجمالي الضريبة</span>
                    <span className="font-semibold text-slate-700">
                      {formatMoney(summary.tax)} {currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-700">الإجمالي النهائي</span>
                    <span className="font-bold text-emerald-700">
                      {formatMoney(summary.grandTotal)} {currency}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    زر تحميل PDF يفتح نافذة الطباعة مباشرة لتصدير الفاتورة بصيغة PDF.
                  </p>
                </div>
              </div>

              {validationMessage ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {validationMessage}
                </div>
              ) : null}

              {saveError ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {saveError}
                </div>
              ) : null}

              {saveMessage ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {saveMessage}
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="rounded-full bg-brand-900 px-8 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "جارٍ الحفظ..." : isEditMode ? "حفظ التعديلات" : "حفظ الفاتورة"}
                </button>
                <Link
                  href="/projects-pages/invoices"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
                >
                  إلغاء
                </Link>
              </div>
            </section>
          </form>
        </main>

        <Sidebar activeLabel="الفواتير" />
      </div>

      <ConfirmDeleteModal
        open={deleteRowId !== null}
        title="تأكيد حذف السطر"
        message={
          selectedDeleteRow
            ? `هل تريد حذف "${selectedDeleteRow.name || "هذا السطر"}" من الفاتورة؟`
            : "هل تريد حذف هذا السطر من الفاتورة؟"
        }
        onClose={() => setDeleteRowId(null)}
        onConfirm={() => {
          if (deleteRowId === null) return;
          removeRow(deleteRowId);
          setDeleteRowId(null);
        }}
      />
    </div>
  );
}
