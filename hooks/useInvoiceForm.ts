"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/app/lib/product-store";
import { getErrorMessage } from "@/app/lib/fetcher";
import { listClients } from "@/app/services/clients";
import {
  createInvoice,
  getInvoiceDetails,
  type InvoiceDetails,
} from "@/app/services/invoices";
import { listProducts } from "@/app/services/products";
import {
  emptySettings,
  getSettings,
  type AppSettings,
} from "@/app/services/settings";
import type { Client } from "@/app/types";
import {
  calculateInvoiceTotals,
  deriveTaxRateFromTotals,
} from "@/lib/invoice/invoiceCalculations";
import {
  createEmptyInvoiceItem,
  createInvoiceItemFromProduct,
  invoiceEditorCurrencyOptions,
  type InvoiceEditorCustomer,
  type InvoiceEditorDraft,
  type InvoiceEditorFormState,
  type InvoiceEditorItem,
  type InvoiceEditorItemKind,
  type InvoiceEditorPaymentMethod,
  type InvoiceEditorStatus,
  type InvoiceEditorValidationErrors,
} from "@/lib/invoice/invoiceTypes";

const INVOICE_SEQUENCE_KEY = "reset-main-invoice-sequence-v1";
const INVOICE_DRAFTS_STORAGE_KEY = "reset-main-invoice-drafts-v2";
const NEW_DRAFT_KEY = "__new__";
const FALLBACK_CURRENCY = "OMR";
const SUPPORTED_CURRENCIES = invoiceEditorCurrencyOptions.map((opt) => opt.code);

type EditInvoiceBaseline = {
  clientId: number | null;
  clientName: string;
  due: number;
};

type InvoiceDetailField =
  | "issueDate"
  | "dueDate"
  | "currency"
  | "paymentMethod"
  | "status"
  | "taxRate"
  | "discount"
  | "partialPaidAmount"
  | "notes";

export type UseInvoiceFormResult = {
  form: InvoiceEditorFormState;
  totals: ReturnType<typeof calculateInvoiceTotals>;
  isEditMode: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  isSavingDraft: boolean;
  loadError: string;
  productCatalogMessage: string;
  saveMessage: string;
  saveError: string;
  validationErrors: InvoiceEditorValidationErrors;
  clients: Client[];
  products: Product[];
  settings: AppSettings;
  selectedClient: Client | null;
  clientCredit: {
    creditLimit: number;
    currentDue: number;
    projectedDue: number;
    remainingCredit: number;
    exceeded: boolean;
    currency: string;
  };
  updateCustomerField: <K extends keyof Omit<InvoiceEditorCustomer, "selectedClientId">>(
    field: K,
    value: InvoiceEditorCustomer[K]
  ) => void;
  updateDetailField: (field: InvoiceDetailField, value: string | number) => void;
  selectClient: (clientIdText: string) => void;
  addProductItem: () => void;
  addServiceItem: () => void;
  changeItemKind: (itemId: number, kind: InvoiceEditorItemKind) => void;
  chooseProductForItem: (itemId: number, productIdText: string) => void;
  updateItemField: (
    itemId: number,
    field: keyof Pick<InvoiceEditorItem, "name" | "quantity" | "price">,
    value: string | number
  ) => void;
  removeItem: (itemId: number) => void;
  saveDraft: () => Promise<void>;
  submit: () => Promise<void>;
};

const todayDate = () => new Date().toISOString().slice(0, 10);

const getInvoiceProductServerId = (product: Product) =>
  typeof product.backendId === "number" &&
  Number.isFinite(product.backendId) &&
  product.backendId > 0
    ? Math.trunc(product.backendId)
    : null;

const getInvoiceProductSelectionValue = (product: Product) =>
  getInvoiceProductServerId(product) ?? product.id;

const findInvoiceProductBySelection = (products: Product[], productId: number | null) => {
  if (productId === null) {
    return null;
  }

  return (
    products.find((entry) => getInvoiceProductServerId(entry) === productId) ??
    products.find(
      (entry) =>
        getInvoiceProductServerId(entry) === null && getInvoiceProductSelectionValue(entry) === productId
    ) ??
    null
  );
};

const getFirstInvoiceProduct = (products: Product[]) =>
  products[0] ?? null;

const formatInvoiceNumber = (sequence: number) =>
  `INV-${String(Math.max(1, sequence)).padStart(4, "0")}`;

const extractInvoiceSequence = (value: string) => {
  const match = value.match(/(\d+)/g);
  if (!match) {
    return 0;
  }

  const parsed = Number.parseInt(match.join(""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toText = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const toPositiveNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, value);
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }

  return fallback;
};

const toInteger = (value: unknown, fallback = 0) =>
  Math.max(0, Math.trunc(toPositiveNumber(value, fallback)));

const normalizeRecipientType = (
  value: unknown
): InvoiceEditorCustomer["recipientType"] =>
  toText(value, "").trim().toLowerCase() === "company" ? "company" : "individual";

const normalizeOptionalText = (value: unknown) => {
  const normalized = toText(value, "").trim();
  return !normalized || normalized === "-" ? "" : normalized;
};

const toDateInputValue = (value: unknown, fallback = "") => {
  const normalized = toText(value, "").trim();
  if (!normalized || normalized === "-") {
    return fallback;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const isoDate = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDate?.[1]) {
    return isoDate[1];
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toISOString().slice(0, 10);
};

const normalizeCurrencyCode = (value: string) => {
  const trimmed = value.trim().toUpperCase();
  if (SUPPORTED_CURRENCIES.includes(trimmed)) {
    return trimmed;
  }

  if (value.includes("سعود")) {
    return "SAR";
  }

  if (value.includes("دولار")) {
    return "USD";
  }

  if (value.includes("جنيه") || value.includes("مصري")) {
    return "EGP";
  }

  if (value.includes("قطر")) {
    return "QAR";
  }

  return trimmed || FALLBACK_CURRENCY;
};

const normalizePaymentMethod = (value: unknown): InvoiceEditorPaymentMethod => {
  const normalized = toText(value, "").trim().toLowerCase();

  if (normalized === "transfer") return "transfer";
  if (normalized === "card") return "card";
  if (normalized === "credit") return "credit";
  return "cash";
};

const normalizeStatus = (value: unknown): InvoiceEditorStatus => {
  const normalized = toText(value, "").trim().toLowerCase();

  if (
    normalized === "paid" ||
    normalized === "مدفوعة"
  ) {
    return "paid";
  }

  if (
    normalized === "partial" ||
    normalized === "partially_paid" ||
    normalized === "partial_paid" ||
    normalized === "مدفوعة جزئيا" ||
    normalized === "مدفوعة جزئيًا"
  ) {
    return "partial";
  }

  if (
    normalized === "unpaid" ||
    normalized === "غير مدفوعة" ||
    normalized === "pending"
  ) {
    return "unpaid";
  }

  if (
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "ملغاة"
  ) {
    return "cancelled";
  }

  return "draft";
};

const normalizeItemKind = (value: unknown): InvoiceEditorItemKind =>
  toText(value, "").trim().toLowerCase() === "product" ? "product" : "service";

const getDefaultForm = (
  invoiceNumber: string,
  currency: string,
  notes: string
): InvoiceEditorFormState => ({
  invoiceNumber,
  issueDate: todayDate(),
  dueDate: "",
  currency,
  paymentMethod: "cash",
  status: "draft",
  taxRate: 15,
  discount: 0,
  partialPaidAmount: 0,
  notes,
  customer: {
    selectedClientId: null,
    recipientType: "individual",
    name: "",
    email: "",
    phone: "",
    address: "",
    taxNumber: "",
    commercialRegister: "",
  },
  items: [createEmptyInvoiceItem(1)],
});

const buildCustomerFromClient = (client: Client): InvoiceEditorCustomer => ({
  selectedClientId: client.id,
  recipientType: normalizeRecipientType(client.type),
  name: normalizeOptionalText(client.name),
  email: normalizeOptionalText(client.email),
  phone: normalizeOptionalText(client.phone),
  address: normalizeOptionalText(client.address),
  taxNumber: normalizeOptionalText(client.taxNumber),
  commercialRegister: normalizeOptionalText(client.commercialRegister),
});

const mergeCustomerWithClient = (
  customer: InvoiceEditorCustomer,
  client: Client | null
): InvoiceEditorCustomer => {
  if (!client) {
    return customer;
  }

  const customerFromClient = buildCustomerFromClient(client);

  return {
    ...customerFromClient,
    selectedClientId: customer.selectedClientId ?? customerFromClient.selectedClientId,
    recipientType: normalizeRecipientType(
      customer.recipientType || customerFromClient.recipientType
    ),
    name: customer.name || customerFromClient.name,
    email: customer.email || customerFromClient.email,
    phone: customer.phone || customerFromClient.phone,
    address: customer.address || customerFromClient.address,
    taxNumber: customer.taxNumber || customerFromClient.taxNumber,
    commercialRegister:
      customer.commercialRegister || customerFromClient.commercialRegister,
  };
};

const findMatchingClient = (
  clients: Client[],
  clientId: number | null,
  clientName: string
) => {
  if (clientId !== null) {
    return clients.find((client) => client.id === clientId) ?? null;
  }

  const normalizedClientName = clientName.trim().toLowerCase();
  if (!normalizedClientName) {
    return null;
  }

  return (
    clients.find((client) => client.name.trim().toLowerCase() === normalizedClientName) ??
    clients.find((client) =>
      client.name.trim().toLowerCase().includes(normalizedClientName)
    ) ??
    null
  );
};

const getDraftKey = (invoiceId: string) => (invoiceId.trim() ? invoiceId.trim() : NEW_DRAFT_KEY);

const readLastInvoiceSequence = () => {
  if (typeof window === "undefined") {
    return 0;
  }

  const stored = Number.parseInt(window.localStorage.getItem(INVOICE_SEQUENCE_KEY) ?? "0", 10);
  return Number.isFinite(stored) ? Math.max(0, stored) : 0;
};

const persistLastInvoiceSequence = (sequence: number) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(INVOICE_SEQUENCE_KEY, String(Math.max(0, Math.trunc(sequence))));
};

const readDraftStore = () => {
  if (typeof window === "undefined") {
    return {} as Record<string, InvoiceEditorDraft>;
  }

  try {
    const raw = window.localStorage.getItem(INVOICE_DRAFTS_STORAGE_KEY);
    if (!raw) {
      return {} as Record<string, InvoiceEditorDraft>;
    }

    const parsed = JSON.parse(raw);
    return isRecord(parsed) ? (parsed as Record<string, InvoiceEditorDraft>) : {};
  } catch {
    return {} as Record<string, InvoiceEditorDraft>;
  }
};

const sanitizeDraftItem = (value: unknown, index: number): InvoiceEditorItem => {
  const record = isRecord(value) ? value : {};
  const kind = normalizeItemKind(record.kind);
  const productIdValue = toInteger(record.productId, 0);
  return {
    id: Math.max(1, toInteger(record.id, index + 1)),
    kind,
    productId: kind === "product" && productIdValue > 0 ? productIdValue : null,
    name: toText(record.name, ""),
    quantity: Math.max(1, toInteger(record.quantity, 1)),
    price: toPositiveNumber(record.price, 0),
  };
};

const normalizeDraft = (value: unknown): InvoiceEditorDraft | null => {
  if (!isRecord(value) || !isRecord(value.form) || !isRecord(value.form.customer)) {
    return null;
  }

  const formRecord = value.form;
  const customerRecord = formRecord.customer as Record<string, unknown>;
  const items = Array.isArray(formRecord.items)
    ? formRecord.items.map((item, index) => sanitizeDraftItem(item, index))
    : [];
  const safeItems = items.length > 0 ? items : [createEmptyInvoiceItem(1)];

  return {
    savedAt: toText(value.savedAt, new Date().toISOString()),
    sequence: Math.max(1, toInteger(value.sequence, 1)),
    nextItemId: Math.max(2, toInteger(value.nextItemId, safeItems.length + 1)),
    form: {
      invoiceNumber: toText(formRecord.invoiceNumber, formatInvoiceNumber(1)),
      issueDate: toDateInputValue(formRecord.issueDate, todayDate()),
      dueDate: toDateInputValue(formRecord.dueDate, ""),
      currency: normalizeCurrencyCode(toText(formRecord.currency, FALLBACK_CURRENCY)),
      paymentMethod: normalizePaymentMethod(formRecord.paymentMethod),
      status: normalizeStatus(formRecord.status),
      taxRate: toPositiveNumber(formRecord.taxRate, 15),
      discount: toPositiveNumber(formRecord.discount, 0),
      partialPaidAmount: toPositiveNumber(formRecord.partialPaidAmount, 0),
      notes: toText(formRecord.notes, ""),
      customer: {
        selectedClientId:
          typeof customerRecord.selectedClientId === "number" &&
          Number.isFinite(customerRecord.selectedClientId)
            ? Math.trunc(customerRecord.selectedClientId)
            : null,
        recipientType: normalizeRecipientType(customerRecord.recipientType),
        name: toText(customerRecord.name, ""),
        email: toText(customerRecord.email, ""),
        phone: toText(customerRecord.phone, ""),
        address: toText(customerRecord.address, ""),
        taxNumber: normalizeOptionalText(customerRecord.taxNumber),
        commercialRegister: normalizeOptionalText(customerRecord.commercialRegister),
      },
      items: safeItems,
    },
  };
};

const loadDraft = (invoiceId: string) => {
  const store = readDraftStore();
  return normalizeDraft(store[getDraftKey(invoiceId)]);
};

const saveDraftToStorage = (invoiceId: string, draft: InvoiceEditorDraft) => {
  if (typeof window === "undefined") {
    return;
  }

  const store = readDraftStore();
  store[getDraftKey(invoiceId)] = draft;
  window.localStorage.setItem(INVOICE_DRAFTS_STORAGE_KEY, JSON.stringify(store));
};

const removeDraftFromStorage = (invoiceId: string) => {
  if (typeof window === "undefined") {
    return;
  }

  const store = readDraftStore();
  delete store[getDraftKey(invoiceId)];
  window.localStorage.setItem(INVOICE_DRAFTS_STORAGE_KEY, JSON.stringify(store));
};

const getNextItemId = (items: InvoiceEditorItem[]) =>
  items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;

const hydrateFormFromInvoice = (
  invoice: InvoiceDetails,
  defaultCurrency: string,
  defaultNotes: string,
  matchedClient: Client | null
) => {
  const items: InvoiceEditorItem[] =
    invoice.items.length > 0
      ? invoice.items.map((item, index) => ({
          id: index + 1,
          kind: item.itemType === "product" ? "product" : "service",
          productId:
            item.itemType === "product" && typeof item.productId === "number"
              ? item.productId
              : null,
          name: item.name,
          quantity: Math.max(1, item.quantity),
          price: Math.max(0, item.price),
        }))
      : [createEmptyInvoiceItem(1)];

  return {
    invoiceNumber: invoice.id || formatInvoiceNumber(invoice.num || 1),
    issueDate: toDateInputValue(invoice.issueDate, todayDate()),
    dueDate: toDateInputValue(invoice.dueDate, ""),
    currency: normalizeCurrencyCode(invoice.currency || defaultCurrency),
    paymentMethod: normalizePaymentMethod(invoice.paymentMethod),
    status: normalizeStatus(invoice.status),
    taxRate: deriveTaxRateFromTotals(invoice.totals.subtotal, invoice.totals.tax),
    discount: Math.max(0, invoice.totals.discount),
    partialPaidAmount: normalizeStatus(invoice.status) === "partial" ? invoice.paidAmount : 0,
    notes: invoice.notes || defaultNotes,
    customer: mergeCustomerWithClient(
      {
        selectedClientId: invoice.clientId ?? matchedClient?.id ?? null,
        recipientType: normalizeRecipientType(matchedClient?.type),
        name: normalizeOptionalText(invoice.clientName),
        email: normalizeOptionalText(invoice.clientEmail),
        phone: normalizeOptionalText(invoice.clientPhone),
        address: normalizeOptionalText(invoice.clientAddress),
        taxNumber: "",
        commercialRegister: "",
      },
      matchedClient
    ),
    items,
  } satisfies InvoiceEditorFormState;
};

const getClientOutstanding = (client: Client | null) =>
  client ? Math.max(0, client.due || client.stats.due || 0) : 0;

export function useInvoiceForm(invoiceId: string): UseInvoiceFormResult {
  const router = useRouter();
  const redirectTimeoutRef = useRef<number | null>(null);
  const isEditMode = invoiceId.trim().length > 0;
  const [form, setForm] = useState<InvoiceEditorFormState>(() =>
    getDefaultForm(formatInvoiceNumber(1), FALLBACK_CURRENCY, emptySettings.invoiceNotes)
  );
  const [sequence, setSequence] = useState(1);
  const [nextItemId, setNextItemId] = useState(2);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<AppSettings>(emptySettings);
  const [editBaseline, setEditBaseline] = useState<EditInvoiceBaseline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [productCatalogMessage, setProductCatalogMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [validationErrors, setValidationErrors] = useState<InvoiceEditorValidationErrors>({});

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setLoadError("");
      setProductCatalogMessage("");
      setSaveMessage("");
      setSaveError("");
      setValidationErrors({});
      setEditBaseline(null);

      const [productsResult, clientsResult, settingsResult] = await Promise.allSettled([
        listProducts(),
        listClients(),
        getSettings(),
      ]);

      if (!active) {
        return;
      }

      const nextProducts = productsResult.status === "fulfilled" ? productsResult.value : [];
      const nextClients = clientsResult.status === "fulfilled" ? clientsResult.value : [];
      const nextSettings = settingsResult.status === "fulfilled" ? settingsResult.value : emptySettings;
      const defaultCurrency = normalizeCurrencyCode(nextSettings.defaultCurrency);
      const defaultNotes = nextSettings.invoiceNotes || emptySettings.invoiceNotes;
      const nextSequence = readLastInvoiceSequence() + 1;

      setProducts(nextProducts);
      setClients(nextClients);
      setSettings(nextSettings);

      if (productsResult.status === "rejected") {
        setProductCatalogMessage(
          getErrorMessage(
            productsResult.reason,
            "تعذر تحميل قائمة المنتجات. ما زال بإمكانك إضافة بنود خدمات يدويًا."
          )
        );
      }

      if (clientsResult.status === "rejected") {
        setLoadError(
          getErrorMessage(
            clientsResult.reason,
            "تعذر تحميل العملاء. يمكنك مراجعة البيانات، لكن الحفظ يحتاج عميلًا صالحًا."
          )
        );
      }

      if (isEditMode) {
        const [invoiceDetails, draft] = await Promise.all([
          getInvoiceDetails(invoiceId).catch(() => null),
          Promise.resolve(loadDraft(invoiceId)),
        ]);

        if (!active) {
          return;
        }

        if (!invoiceDetails && !draft) {
          setForm(getDefaultForm(invoiceId || formatInvoiceNumber(nextSequence), defaultCurrency, defaultNotes));
          setSequence(extractInvoiceSequence(invoiceId) || nextSequence);
          setNextItemId(2);
          setLoadError("تعذر العثور على الفاتورة المطلوبة للتعديل.");
          setIsLoading(false);
          return;
        }

        const matchedClient = invoiceDetails
          ? findMatchingClient(
              nextClients,
              invoiceDetails.clientId ?? null,
              invoiceDetails.clientName
            )
          : null;

        const hydratedForm = draft?.form
          ? {
              ...draft.form,
              customer: mergeCustomerWithClient(draft.form.customer, matchedClient),
            }
          : hydrateFormFromInvoice(
              invoiceDetails!,
              defaultCurrency,
              defaultNotes,
              matchedClient
            );

        setForm(hydratedForm);
        setSequence(
          draft?.sequence ||
            extractInvoiceSequence(hydratedForm.invoiceNumber) ||
            extractInvoiceSequence(invoiceId) ||
            nextSequence
        );
        setNextItemId(Math.max(draft?.nextItemId || 2, getNextItemId(hydratedForm.items)));

        if (invoiceDetails) {
          setEditBaseline({
            clientId: invoiceDetails.clientId,
            clientName: invoiceDetails.clientName,
            due: Math.max(0, invoiceDetails.totals.due),
          });
        }

        setIsLoading(false);
        return;
      }

      const draft = loadDraft("");

      if (draft) {
        const draftSequence = Math.max(draft.sequence || 1, nextSequence);
        const draftInvoiceNumber = formatInvoiceNumber(draftSequence);
        const matchedClient = findMatchingClient(
          nextClients,
          draft.form.customer.selectedClientId ?? null,
          draft.form.customer.name
        );
        setForm({
          ...draft.form,
          customer: mergeCustomerWithClient(draft.form.customer, matchedClient),
          invoiceNumber: isEditMode ? draft.form.invoiceNumber : draftInvoiceNumber,
          currency: draft.form.currency || defaultCurrency,
          notes: draft.form.notes || defaultNotes,
        });
        setSequence(draftSequence);
        setNextItemId(Math.max(draft.nextItemId, getNextItemId(draft.form.items)));
        setIsLoading(false);
        return;
      }

      const invoiceNumber = formatInvoiceNumber(nextSequence);
      setForm(getDefaultForm(invoiceNumber, defaultCurrency, defaultNotes));
      setSequence(nextSequence);
      setNextItemId(2);
      setIsLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [invoiceId, isEditMode]);

  const selectedClient = useMemo(
    () =>
      form.customer.selectedClientId !== null
        ? clients.find((client) => client.id === form.customer.selectedClientId) ?? null
        : null,
    [clients, form.customer.selectedClientId]
  );

  const totals = useMemo(
    () =>
      calculateInvoiceTotals({
        items: form.items,
        taxRate: form.taxRate,
        discount: form.discount,
        status: form.status,
        partialPaidAmount: form.partialPaidAmount,
      }),
    [form.discount, form.items, form.partialPaidAmount, form.status, form.taxRate]
  );

  const currentClientDue = useMemo(() => {
    if (!selectedClient) {
      return 0;
    }

    const currentOutstanding = getClientOutstanding(selectedClient);
    if (!editBaseline) {
      return currentOutstanding;
    }

    const sameClient =
      (editBaseline.clientId !== null && selectedClient.id === editBaseline.clientId) ||
      (editBaseline.clientId === null &&
        selectedClient.name.trim().toLowerCase() ===
          editBaseline.clientName.trim().toLowerCase());

    return sameClient ? Math.max(0, currentOutstanding - editBaseline.due) : currentOutstanding;
  }, [editBaseline, selectedClient]);

  const clientCreditLimit = Math.max(0, selectedClient?.creditLimit ?? 0);
  const projectedDue = currentClientDue + totals.due;
  const remainingCredit = Math.max(0, clientCreditLimit - currentClientDue);
  const isCreditExceeded = Boolean(selectedClient) && totals.due > 0 && projectedDue > clientCreditLimit;

  const clearFeedback = () => {
    setSaveMessage("");
    setSaveError("");
  };

  const updateCustomerField: UseInvoiceFormResult["updateCustomerField"] = (field, value) => {
    clearFeedback();
    setValidationErrors((current) => ({
      ...current,
      customer: undefined,
      taxNumber: undefined,
      commercialRegister: undefined,
      general: undefined,
    }));
    setForm((current) => ({
      ...current,
      customer: {
        ...current.customer,
        [field]: value,
      },
    }));
  };

  const updateDetailField: UseInvoiceFormResult["updateDetailField"] = (field, value) => {
    clearFeedback();
    setValidationErrors((current) => ({
      ...current,
      dueDate: field === "dueDate" || field === "paymentMethod" ? undefined : current.dueDate,
      payment:
        field === "status" || field === "partialPaidAmount" ? undefined : current.payment,
      discount: field === "discount" ? undefined : current.discount,
      general: undefined,
    }));

    setForm((current) => {
      if (field === "taxRate" || field === "discount" || field === "partialPaidAmount") {
        return {
          ...current,
          [field]: toPositiveNumber(value, 0),
        };
      }

      if (field === "paymentMethod") {
        const paymentMethod = normalizePaymentMethod(value);
        return {
          ...current,
          paymentMethod,
          dueDate: paymentMethod === "credit" ? current.dueDate : current.dueDate,
        };
      }

      if (field === "status") {
        const status = normalizeStatus(value);
        return {
          ...current,
          status,
          partialPaidAmount: status === "partial" ? current.partialPaidAmount : 0,
        };
      }

      return {
        ...current,
        [field]: typeof value === "string" ? value : String(value),
      };
    });
  };

  const selectClient = (clientIdText: string) => {
    clearFeedback();
    setValidationErrors((current) => ({
      ...current,
      customer: undefined,
      creditLimit: undefined,
      taxNumber: undefined,
      commercialRegister: undefined,
      general: undefined,
    }));

    const clientId = Number.parseInt(clientIdText, 10);
    if (!Number.isFinite(clientId)) {
      setForm((current) => ({
        ...current,
        customer: {
          selectedClientId: null,
          recipientType: "individual",
          name: "",
          email: "",
          phone: "",
          address: "",
          taxNumber: "",
          commercialRegister: "",
        },
      }));
      return;
    }

    const client = clients.find((entry) => entry.id === clientId);
    if (!client) {
      return;
    }

    setForm((current) => {
      const normalizedClientCurrency = normalizeCurrencyCode(client.currency || "");
      const isSupported = SUPPORTED_CURRENCIES.includes(normalizedClientCurrency);

      return {
        ...current,
        currency: isSupported ? normalizedClientCurrency : current.currency,
        customer: buildCustomerFromClient(client),
      };
    });
  };

  const addProductItem = () => {
    clearFeedback();
    setValidationErrors((current) => ({ ...current, items: undefined, general: undefined }));

    const firstProduct = getFirstInvoiceProduct(products);
    if (!firstProduct) {
      setValidationErrors((current) => ({
        ...current,
        items: "لا توجد منتجات متاحة حاليًا. أضف بند خدمة أو انتظر تحميل قائمة المنتجات.",
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      items: [...current.items, createInvoiceItemFromProduct(nextItemId, firstProduct)],
    }));
    setNextItemId((current) => current + 1);
  };

  const addServiceItem = () => {
    clearFeedback();
    setValidationErrors((current) => ({ ...current, items: undefined, general: undefined }));
    setForm((current) => ({
      ...current,
      items: [...current.items, createEmptyInvoiceItem(nextItemId)],
    }));
    setNextItemId((current) => current + 1);
  };

  const changeItemKind = (itemId: number, kind: InvoiceEditorItemKind) => {
    clearFeedback();
    setValidationErrors((current) => ({ ...current, items: undefined, general: undefined }));

    if (kind === "product" && products.length === 0) {
      setValidationErrors((current) => ({
        ...current,
        items: "لا توجد منتجات متاحة الآن. استخدم بند خدمة أو أعد تحميل الصفحة.",
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const firstProduct = getFirstInvoiceProduct(products);
        if (kind === "product" && firstProduct) {
          return createInvoiceItemFromProduct(item.id, firstProduct);
        }

        return createEmptyInvoiceItem(item.id);
      }),
    }));
  };

  const chooseProductForItem = (itemId: number, productIdText: string) => {
    clearFeedback();
    setValidationErrors((current) => ({ ...current, items: undefined, general: undefined }));
    const productId = Number.parseInt(productIdText, 10);
    if (!Number.isFinite(productId)) {
      return;
    }

    const product = products.find(
      (entry) => getInvoiceProductSelectionValue(entry) === productId
    );
    if (!product) {
      setValidationErrors((current) => ({
        ...current,
        items: "اختر منتجًا صالحًا من القائمة.",
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId ? createInvoiceItemFromProduct(itemId, product) : item
      ),
    }));
  };

  const updateItemField: UseInvoiceFormResult["updateItemField"] = (itemId, field, value) => {
    clearFeedback();
    setValidationErrors((current) => ({ ...current, items: undefined, general: undefined }));

    setForm((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        if (field === "name") {
          return {
            ...item,
            name: String(value),
          };
        }

        if (field === "quantity") {
          return {
            ...item,
            quantity: Math.max(1, Math.trunc(toPositiveNumber(value, 1))),
          };
        }

        return {
          ...item,
          price: toPositiveNumber(value, 0),
        };
      }),
    }));
  };

  const removeItem = (itemId: number) => {
    clearFeedback();
    setValidationErrors((current) => ({ ...current, items: undefined, general: undefined }));
    setForm((current) => {
      if (current.items.length === 1) {
        return current;
      }

      return {
        ...current,
        items: current.items.filter((item) => item.id !== itemId),
      };
    });
  };

  const buildDraftSnapshot = (): InvoiceEditorDraft => ({
    savedAt: new Date().toISOString(),
    sequence,
    nextItemId: Math.max(nextItemId, getNextItemId(form.items)),
    form,
  });

  const saveDraft = async () => {
    clearFeedback();
    setIsSavingDraft(true);

    try {
      saveDraftToStorage(invoiceId, buildDraftSnapshot());
      setSaveMessage(
        isEditMode
          ? `تم حفظ مسودة الفاتورة ${form.invoiceNumber} محليًا.`
          : `تم حفظ المسودة ${form.invoiceNumber} محليًا.`
      );
    } catch {
      setSaveError("تعذر حفظ المسودة محليًا. تحقق من سعة التخزين في المتصفح.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const validateForm = () => {
    const errors: InvoiceEditorValidationErrors = {};
    const invoiceCurrency = normalizeCurrencyCode(form.currency);

    if (form.customer.selectedClientId === null || !form.customer.name.trim()) {
      errors.customer = "اختر عميلًا صالحًا قبل حفظ الفاتورة.";
    }

    if (form.customer.recipientType === "company") {
      if (!form.customer.taxNumber.trim()) {
        errors.taxNumber = "أدخل الرقم الضريبي لجهة الفاتورة.";
      }

      if (!form.customer.commercialRegister.trim()) {
        errors.commercialRegister = "أدخل السجل التجاري لجهة الفاتورة.";
      }
    }

    if (!form.issueDate) {
      errors.issueDate = "حدد تاريخ إصدار الفاتورة.";
    }

    if (form.paymentMethod === "credit" && !form.dueDate) {
      errors.dueDate = "حدد تاريخ الاستحقاق لأن طريقة الدفع آجل.";
    }

    if (form.items.length === 0) {
      errors.items = "أضف بندًا واحدًا على الأقل.";
    }

    if (
      !errors.items &&
      form.items.some((item) => !item.name.trim() || item.quantity <= 0 || item.price < 0)
    ) {
      errors.items = "أكمل اسم البند والكمية والسعر لكل الصفوف قبل الحفظ.";
    }

    if (!errors.items) {
      const invalidProductItem = form.items.find((item) => {
        if (item.kind !== "product") {
          return false;
        }

        const selectedProduct = findInvoiceProductBySelection(products, item.productId);
        return item.productId === null || !selectedProduct;
      });

      if (invalidProductItem) {
        const itemLabel = invalidProductItem.name.trim() || `البند رقم ${invalidProductItem.id}`;
        errors.items = `البند "${itemLabel}" غير مرتبط بمنتج صالح. اختر منتجًا من القائمة أو غيّر نوعه إلى خدمة.`;
      }
    }

    if (
      selectedClient?.currency &&
      normalizeCurrencyCode(selectedClient.currency) !== invoiceCurrency
    ) {
      errors.general = `عملة الفاتورة (${invoiceCurrency}) لا تطابق عملة العميل (${normalizeCurrencyCode(
        selectedClient.currency
      )}).`;
    }

    if (!errors.items) {
      const mismatchedProduct = form.items.find((item) => {
        if (item.kind !== "product") {
          return false;
        }

        const selectedProduct = findInvoiceProductBySelection(products, item.productId);
        if (!selectedProduct) {
          return false;
        }

        return normalizeCurrencyCode(selectedProduct.currency) !== invoiceCurrency;
      });

      if (mismatchedProduct) {
        const selectedProduct = findInvoiceProductBySelection(products, mismatchedProduct.productId);
        if (selectedProduct) {
          errors.items = `عملة المنتج "${selectedProduct.name}" (${normalizeCurrencyCode(
            selectedProduct.currency
          )}) لا تطابق عملة الفاتورة (${invoiceCurrency}).`;
        }
      }
    }

    if (form.discount > totals.subtotal + totals.tax) {
      errors.discount = "الخصم لا يمكن أن يتجاوز قيمة الفاتورة قبل التحصيل.";
    }

    if (form.status === "partial") {
      if (totals.paid <= 0) {
        errors.payment = "أدخل مبلغًا مدفوعًا أكبر من صفر للحالة مدفوعة جزئيا.";
      } else if (totals.paid >= totals.total) {
        errors.payment = "المبلغ المدفوع جزئيًا يجب أن يكون أقل من إجمالي الفاتورة.";
      }
    }

    if (selectedClient && isCreditExceeded) {
      errors.creditLimit = `الحد الائتماني المتاح للعميل لا يكفي. المتاح الآن ${remainingCredit.toFixed(
        2
      )} ${selectedClient.currency || form.currency}.`;
    }

    return errors;
  };

  const submit = async () => {
    clearFeedback();
    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const savedInvoice = await createInvoice({
        invoiceNumber: form.invoiceNumber,
        issueDate: form.issueDate,
        dueDate: form.dueDate || undefined,
        status: form.status,
        currency: form.currency,
        paymentMethod: form.paymentMethod,
        clientId: form.customer.selectedClientId!,
        clientName: form.customer.name.trim(),
        clientEmail: form.customer.email.trim(),
        clientPhone: form.customer.phone.trim(),
        clientAddress: form.customer.address.trim(),
        notes: form.notes.trim(),
        paidAmount: totals.paid,
        totals: {
          subtotal: totals.subtotal,
          discount: totals.discount,
          tax: totals.tax,
          total: totals.total,
        },
        items: form.items.map((item) => {
          const selectedProduct =
            item.kind === "product"
              ? findInvoiceProductBySelection(products, item.productId)
              : null;
          const selectedProductServerId =
            selectedProduct && item.kind === "product"
              ? getInvoiceProductServerId(selectedProduct)
              : null;
          const requestItemType =
            item.kind === "product" && selectedProductServerId !== null ? "product" : "service";

          return {
            itemType: requestItemType,
            ...(requestItemType === "product" && selectedProductServerId !== null
              ? { productId: selectedProductServerId }
              : {}),
            name: item.name.trim(),
            price: item.price,
            quantity: item.quantity,
            discountType: "amount" as const,
            discountValue: 0,
            taxRate: form.taxRate,
          };
        }),
      });

      const savedInvoiceNumber = savedInvoice?.id || form.invoiceNumber;
      removeDraftFromStorage(invoiceId);

      const refreshedClients = await listClients().catch(() => null);
      if (refreshedClients) {
        setClients(refreshedClients);
      }

      if (isEditMode) {
        setEditBaseline({
          clientId: form.customer.selectedClientId,
          clientName: form.customer.name,
          due: totals.due,
        });
        setForm((current) => ({
          ...current,
          invoiceNumber: savedInvoiceNumber,
        }));
        setSaveMessage(`تم حفظ تعديلات الفاتورة ${savedInvoiceNumber} بنجاح.`);
        if (redirectTimeoutRef.current !== null) {
          window.clearTimeout(redirectTimeoutRef.current);
        }
        redirectTimeoutRef.current = window.setTimeout(() => {
          router.push("/invoices");
        }, 1200);
      } else {
        persistLastInvoiceSequence(sequence);
        const nextSequence = sequence + 1;
        const nextInvoiceNumber = formatInvoiceNumber(nextSequence);
        setSequence(nextSequence);
        setNextItemId(2);
        setForm(
          getDefaultForm(
            nextInvoiceNumber,
            settings.defaultCurrency ? normalizeCurrencyCode(settings.defaultCurrency) : form.currency,
            settings.invoiceNotes || emptySettings.invoiceNotes
          )
        );
        setSaveMessage(`تم حفظ الفاتورة ${savedInvoiceNumber} بنجاح.`);
      }
    } catch (error) {
      setSaveError(getErrorMessage(error, "تعذر حفظ الفاتورة."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    totals,
    isEditMode,
    isLoading,
    isSubmitting,
    isSavingDraft,
    loadError,
    productCatalogMessage,
    saveMessage,
    saveError,
    validationErrors,
    clients,
    products,
    settings,
    selectedClient,
    clientCredit: {
      creditLimit: clientCreditLimit,
      currentDue: currentClientDue,
      projectedDue,
      remainingCredit,
      exceeded: isCreditExceeded,
      currency: selectedClient?.currency || form.currency,
    },
    updateCustomerField,
    updateDetailField,
    selectClient,
    addProductItem,
    addServiceItem,
    changeItemKind,
    chooseProductForItem,
    updateItemField,
    removeItem,
    saveDraft,
    submit,
  };
}
