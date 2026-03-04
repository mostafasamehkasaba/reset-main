import type { Supplier, SupplierStatus } from "../types";

export const SUPPLIER_STORAGE_KEY = "reset-main-suppliers-v2";

export const SUPPLIER_STATUSES: SupplierStatus[] = ["نشط", "موقوف", "مؤرشف"];

export const PAYMENT_TERMS: Array<30 | 60> = [30, 60];

export const defaultSuppliers: Supplier[] = [
  {
    id: 1,
    name: "شركة الريادة للتوريد",
    email: "sales@alriyada.com",
    phone: "+20 100 123 4567",
    country: "مصر",
    city: "القاهرة",
    address: "القاهرة، مدينة نصر، شارع مكرم عبيد 24",
    taxNumber: "302-998-552",
    paymentTermDays: 30,
    creditLimit: 120000,
    openingBalance: 5000,
    bankAccountNumber: "001245887912",
    bankName: "البنك الأهلي المصري",
    iban: "EG1200010001245887912001",
    status: "نشط",
    notes: "مورد رئيسي للأجهزة وقطع الغيار.",
    balance: 18500,
    orders: 14,
    joinedAt: "2025-09-12",
  },
  {
    id: 2,
    name: "مؤسسة المستقبل",
    email: "future@supplies.co",
    phone: "+20 111 765 4321",
    country: "مصر",
    city: "الإسكندرية",
    address: "الإسكندرية، سموحة، شارع فوزي معاذ 11",
    taxNumber: "405-661-120",
    paymentTermDays: 60,
    creditLimit: 50000,
    openingBalance: 3000,
    bankAccountNumber: "889912345600",
    bankName: "QNB",
    iban: "EG2900180008899123456003",
    status: "موقوف",
    notes: "الحساب موقوف مؤقتا لحين مراجعة الشروط.",
    balance: 9200,
    orders: 8,
    joinedAt: "2025-11-03",
  },
  {
    id: 3,
    name: "Delta Traders",
    email: "contact@delta-traders.com",
    phone: "+20 122 555 9090",
    country: "مصر",
    city: "المنصورة",
    address: "المنصورة، حي الجامعة، برج النيل 6",
    taxNumber: "512-447-330",
    paymentTermDays: 30,
    creditLimit: 80000,
    openingBalance: 0,
    bankAccountNumber: "550023400189",
    bankName: "CIB",
    iban: "EG5702115500234001890",
    status: "مؤرشف",
    notes: "أرشفة المورد بعد انتهاء التعاقد.",
    balance: 27300,
    orders: 19,
    joinedAt: "2026-01-18",
  },
];

const asPositiveNumber = (value: unknown, fallback = 0) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return numeric < 0 ? 0 : numeric;
};

const asText = (value: unknown, fallback = "") => {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return normalized || fallback;
};

const asPaymentTerm = (value: unknown): 30 | 60 => {
  return value === 60 ? 60 : 30;
};

const asSupplierStatus = (value: unknown): SupplierStatus => {
  if (value === "موقوف") return "موقوف";
  if (value === "مؤرشف") return "مؤرشف";
  return "نشط";
};

const sanitizeSupplier = (raw: Partial<Supplier>, index: number): Supplier => {
  return {
    id: Math.floor(asPositiveNumber(raw.id, index + 1)),
    name: asText(raw.name, `مورد ${index + 1}`),
    email: asText(raw.email, "-"),
    phone: asText(raw.phone, "-"),
    country: asText(raw.country, "-"),
    city: asText(raw.city, "-"),
    address: asText(raw.address, "-"),
    taxNumber: asText(raw.taxNumber, "-"),
    paymentTermDays: asPaymentTerm(raw.paymentTermDays),
    creditLimit: asPositiveNumber(raw.creditLimit, 0),
    openingBalance: asPositiveNumber(raw.openingBalance, 0),
    bankAccountNumber: asText(raw.bankAccountNumber, "-"),
    bankName: asText(raw.bankName, "-"),
    iban: asText(raw.iban, "-"),
    status: asSupplierStatus(raw.status),
    notes: asText(raw.notes, "-"),
    balance: asPositiveNumber(raw.balance, 0),
    orders: Math.floor(asPositiveNumber(raw.orders, 0)),
    joinedAt: asText(raw.joinedAt, new Date().toISOString().slice(0, 10)),
  };
};

export const loadSuppliersFromStorage = (): Supplier[] => {
  if (typeof window === "undefined") return defaultSuppliers;

  try {
    const raw = window.localStorage.getItem(SUPPLIER_STORAGE_KEY);
    if (!raw) return defaultSuppliers;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultSuppliers;
    return parsed.map((item, index) => sanitizeSupplier(item as Partial<Supplier>, index));
  } catch {
    return defaultSuppliers;
  }
};

export const saveSuppliersToStorage = (suppliers: Supplier[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SUPPLIER_STORAGE_KEY, JSON.stringify(suppliers));
};
