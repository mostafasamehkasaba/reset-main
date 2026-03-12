import {
  loadStoredValue,
  saveStoredValue,
  getNextNumericId,
} from "../lib/local-fallback";
import type { ProductUnit } from "../types";

const STORAGE_KEY = "product_units_data";

// Fallback to initial seeds if empty
const INITIAL_UNITS: ProductUnit[] = [
  { id: 1, name: "قطعة", isDefault: true },
  { id: 2, name: "كيلو", isDefault: false },
  { id: 3, name: "علبة", isDefault: false },
];

const normalizeUnit = (val: any): ProductUnit => ({
  id: Number(val.id) || 0,
  name: String(val.name || ""),
  isDefault: Boolean(val.isDefault),
});

export const listProductUnits = async (): Promise<ProductUnit[]> => {
  const stored = loadStoredValue<ProductUnit[]>(STORAGE_KEY, [], (val) =>
    Array.isArray(val) ? val.map(normalizeUnit) : []
  );
  if (stored.length === 0) {
    saveStoredValue(STORAGE_KEY, INITIAL_UNITS);
    return INITIAL_UNITS;
  }
  return stored;
};

export const getProductUnit = async (id: number): Promise<ProductUnit | null> => {
  const units = await listProductUnits();
  return units.find((u) => u.id === id) || null;
};

export const createProductUnit = async (data: Omit<ProductUnit, "id">): Promise<ProductUnit> => {
  const units = await listProductUnits();
  const newUnit: ProductUnit = {
    ...data,
    id: getNextNumericId(units, (u) => u.id),
  };

  if (newUnit.isDefault) {
    units.forEach((u) => (u.isDefault = false));
  }

  const updatedUnits = [...units, newUnit];
  saveStoredValue(STORAGE_KEY, updatedUnits);
  return newUnit;
};

export const updateProductUnit = async (
  id: number,
  data: Partial<Omit<ProductUnit, "id">>
): Promise<ProductUnit> => {
  const units = await listProductUnits();

  if (data.isDefault) {
    units.forEach((u) => (u.isDefault = false));
  }

  const index = units.findIndex((u) => u.id === id);
  if (index === -1) throw new Error("Unit not found");

  const updatedUnit = { ...units[index], ...data };
  units[index] = updatedUnit;

  saveStoredValue(STORAGE_KEY, units);
  return updatedUnit;
};

export const deleteProductUnit = async (unit: ProductUnit): Promise<void> => {
  const units = await listProductUnits();
  const filtered = units.filter((u) => u.id !== unit.id);
  saveStoredValue(STORAGE_KEY, filtered);
};
