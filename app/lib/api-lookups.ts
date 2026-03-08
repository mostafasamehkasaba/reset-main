import type { SupplierStatus } from "../types";

export const countryOptions = [
  { value: "Egypt", label: "مصر" },
  { value: "Saudi Arabia", label: "السعودية" },
  { value: "United Arab Emirates", label: "الإمارات" },
  { value: "Qatar", label: "قطر" },
  { value: "Kuwait", label: "الكويت" },
  { value: "Oman", label: "عُمان" },
  { value: "Bahrain", label: "البحرين" },
  { value: "Jordan", label: "الأردن" },
  { value: "Tunisia", label: "تونس" },
  { value: "Algeria", label: "الجزائر" },
] as const;

export type CountryApiValue = (typeof countryOptions)[number]["value"];

export const supplierStatusOptions = [
  { value: "active", label: "نشط" },
  { value: "inactive", label: "موقوف" },
  { value: "archived", label: "مؤرشف" },
] as const;

export type SupplierStatusApiValue = (typeof supplierStatusOptions)[number]["value"];

const normalizeLookupKey = (value: string) => value.trim().toLowerCase();

const countryValueByKey: Record<string, CountryApiValue> = {
  "مصر": "Egypt",
  egypt: "Egypt",
  "arab republic of egypt": "Egypt",
  eg: "Egypt",
  "السعودية": "Saudi Arabia",
  "المملكة العربية السعودية": "Saudi Arabia",
  "saudi arabia": "Saudi Arabia",
  ksa: "Saudi Arabia",
  sa: "Saudi Arabia",
  "الإمارات": "United Arab Emirates",
  "الامارات": "United Arab Emirates",
  "الإمارات العربية المتحدة": "United Arab Emirates",
  "الامارات العربية المتحدة": "United Arab Emirates",
  "united arab emirates": "United Arab Emirates",
  uae: "United Arab Emirates",
  ae: "United Arab Emirates",
  "قطر": "Qatar",
  qatar: "Qatar",
  qa: "Qatar",
  "الكويت": "Kuwait",
  kuwait: "Kuwait",
  kw: "Kuwait",
  "عمان": "Oman",
  "عُمان": "Oman",
  oman: "Oman",
  om: "Oman",
  "البحرين": "Bahrain",
  bahrain: "Bahrain",
  bh: "Bahrain",
  "الأردن": "Jordan",
  "الاردن": "Jordan",
  jordan: "Jordan",
  jo: "Jordan",
  "تونس": "Tunisia",
  tunisia: "Tunisia",
  tn: "Tunisia",
  "الجزائر": "Algeria",
  algeria: "Algeria",
  dz: "Algeria",
};

const countryLabelByValue = Object.fromEntries(
  countryOptions.map((option) => [option.value, option.label])
) as Record<CountryApiValue, string>;

const supplierStatusValueByKey: Record<string, SupplierStatusApiValue> = {
  "نشط": "active",
  active: "active",
  enabled: "active",
  "موقوف": "inactive",
  inactive: "inactive",
  stopped: "inactive",
  suspended: "inactive",
  "مؤرشف": "archived",
  archived: "archived",
  archive: "archived",
};

const supplierStatusLabelByValue = Object.fromEntries(
  supplierStatusOptions.map((option) => [option.value, option.label])
) as Record<SupplierStatusApiValue, SupplierStatus>;

export const toCountryApiValue = (value: string) => {
  const normalized = normalizeLookupKey(value);
  return countryValueByKey[normalized] ?? value.trim();
};

export const getCountryLabel = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) {
    return "-";
  }

  const normalizedValue = toCountryApiValue(value);

  return (
    countryLabelByValue[normalizedValue as CountryApiValue] ??
    value.trim()
  );
};

export const toSupplierStatusApiValue = (value: unknown): SupplierStatusApiValue => {
  if (typeof value === "boolean") {
    return value ? "active" : "inactive";
  }

  if (typeof value !== "string" || !value.trim()) {
    return "active";
  }

  return supplierStatusValueByKey[normalizeLookupKey(value)] ?? "active";
};

export const getSupplierStatusLabel = (value: unknown): SupplierStatus => {
  return supplierStatusLabelByValue[toSupplierStatusApiValue(value)];
};
