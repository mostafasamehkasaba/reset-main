import {
  countryOptions,
  toCountryApiValue,
  toSupplierStatusApiValue,
  type CountryApiValue,
  type SupplierStatusApiValue,
} from "@/app/lib/api-lookups";
import type { SupplierPayload } from "@/app/services/suppliers";
import type { Supplier } from "@/app/types";

export type SupplierFormState = {
  name: string;
  email: string;
  phone: string;
  country: CountryApiValue;
  city: string;
  address: string;
  taxNumber: string;
  paymentTermDays: 30 | 60;
  creditLimit: string;
  openingBalance: string;
  bankAccountNumber: string;
  bankName: string;
  iban: string;
  status: SupplierStatusApiValue;
  notes: string;
};

export const supplierPaymentTerms: Array<30 | 60> = [30, 60];

export const defaultSupplierCountry =
  countryOptions[0]?.value ?? ("Saudi Arabia" as CountryApiValue);

export const initialSupplierFormState: SupplierFormState = {
  name: "",
  email: "",
  phone: "",
  country: defaultSupplierCountry,
  city: "",
  address: "",
  taxNumber: "",
  paymentTermDays: 30,
  creditLimit: "0",
  openingBalance: "0",
  bankAccountNumber: "",
  bankName: "",
  iban: "",
  status: "active",
  notes: "",
};

export const normalizeSupplierCountrySelection = (
  value: string | undefined
): CountryApiValue => {
  if (!value) {
    return defaultSupplierCountry;
  }

  const normalizedValue = toCountryApiValue(value);
  const matchedCountry = countryOptions.find((country) => country.value === normalizedValue);
  return matchedCountry?.value ?? defaultSupplierCountry;
};

export const mapSupplierToFormState = (supplier: Supplier): SupplierFormState => ({
  name: supplier.name || "",
  email: supplier.email === "-" ? "" : supplier.email,
  phone: supplier.phone === "-" ? "" : supplier.phone,
  country: normalizeSupplierCountrySelection(supplier.country),
  city: supplier.city === "-" ? "" : supplier.city,
  address: supplier.address === "-" ? "" : supplier.address,
  taxNumber: supplier.taxNumber === "-" ? "" : supplier.taxNumber,
  paymentTermDays: supplier.paymentTermDays === 60 ? 60 : 30,
  creditLimit: String(supplier.creditLimit ?? 0),
  openingBalance: String(supplier.openingBalance ?? 0),
  bankAccountNumber:
    supplier.bankAccountNumber === "-" ? "" : supplier.bankAccountNumber,
  bankName: supplier.bankName === "-" ? "" : supplier.bankName,
  iban: supplier.iban === "-" ? "" : supplier.iban,
  status: toSupplierStatusApiValue(supplier.status),
  notes: supplier.notes === "-" ? "" : supplier.notes,
});

export const buildSupplierPayload = (form: SupplierFormState): SupplierPayload => ({
  name: form.name.trim(),
  email: form.email.trim() || "-",
  phone: form.phone.trim(),
  country: form.country.trim() || "-",
  city: form.city.trim() || "-",
  address: form.address.trim() || "-",
  taxNumber: form.taxNumber.trim() || "-",
  paymentTermDays: form.paymentTermDays,
  creditLimit: Math.max(0, Number.parseFloat(form.creditLimit) || 0),
  openingBalance: Math.max(0, Number.parseFloat(form.openingBalance) || 0),
  bankAccountNumber: form.bankAccountNumber.trim() || "-",
  bankName: form.bankName.trim() || "-",
  iban: form.iban.trim() || "-",
  status: form.status,
  notes: form.notes.trim() || "-",
});
