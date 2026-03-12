import {
  loadStoredValue,
  saveStoredValue,
  getNextNumericId,
} from "../lib/local-fallback";
import type { Currency } from "../types";

const STORAGE_KEY = "currencies_data";

const normalizeCurrency = (val: any): Currency => ({
  id: Number(val.id) || 0,
  name: String(val.name || ""),
  symbol: String(val.symbol || ""),
  code: String(val.code || ""),
  isDefault: Boolean(val.isDefault),
});

export const listCurrencies = async (): Promise<Currency[]> => {
  return loadStoredValue<Currency[]>(STORAGE_KEY, [], (val) => 
    Array.isArray(val) ? val.map(normalizeCurrency) : []
  );
};

export const getCurrency = async (id: number): Promise<Currency | null> => {
  const currencies = await listCurrencies();
  return currencies.find((c) => c.id === id) || null;
};

export const createCurrency = async (data: Omit<Currency, "id">): Promise<Currency> => {
  const currencies = await listCurrencies();
  const newCurrency: Currency = {
    ...data,
    id: getNextNumericId(currencies, (c) => c.id),
  };

  if (newCurrency.isDefault) {
    currencies.forEach((c) => (c.isDefault = false));
  }

  const updatedCurrencies = [...currencies, newCurrency];
  saveStoredValue(STORAGE_KEY, updatedCurrencies);
  return newCurrency;
};

export const updateCurrency = async (
  id: number,
  data: Partial<Omit<Currency, "id">>
): Promise<Currency> => {
  const currencies = await listCurrencies();
  
  if (data.isDefault) {
    currencies.forEach((c) => (c.isDefault = false));
  }

  const index = currencies.findIndex((c) => c.id === id);
  if (index === -1) throw new Error("Currency not found");

  const updatedCurrency = { ...currencies[index], ...data };
  currencies[index] = updatedCurrency;
  
  saveStoredValue(STORAGE_KEY, currencies);
  return updatedCurrency;
};

export const deleteCurrency = async (currency: Currency): Promise<void> => {
  const currencies = await listCurrencies();
  const filtered = currencies.filter((c) => c.id !== currency.id);
  saveStoredValue(STORAGE_KEY, filtered);
};
