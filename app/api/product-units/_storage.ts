import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PRODUCT_UNITS } from "../../lib/product-store";

export type StoredProductUnit = {
  id: number;
  name: string;
  createdAt: string;
};

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "product-units.json");

const ensureDataFile = async () => {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, "[]", "utf8");
  }
};

const parseCollection = (raw: string): StoredProductUnit[] => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredProductUnit[]) : [];
  } catch {
    return [];
  }
};

export const listStoredProductUnits = async () => {
  await ensureDataFile();
  const raw = await readFile(dataFile, "utf8");
  return parseCollection(raw);
};

const saveStoredProductUnits = async (units: StoredProductUnit[]) => {
  await ensureDataFile();
  await writeFile(dataFile, JSON.stringify(units, null, 2), "utf8");
};

export const listAllProductUnits = async () => {
  const storedUnits = await listStoredProductUnits();
  const defaultUnits = PRODUCT_UNITS.map((name, index) => ({
    id: -(index + 1),
    name,
    createdAt: "default",
    isDefault: true,
  }));

  const normalizedDefaultKeys = new Set(defaultUnits.map((unit) => unit.name.trim().toLowerCase()));
  const customUnits = storedUnits
    .filter((unit) => !normalizedDefaultKeys.has(unit.name.trim().toLowerCase()))
    .map((unit) => ({
      ...unit,
      isDefault: false,
    }));

  return [...defaultUnits, ...customUnits];
};

export const createStoredProductUnit = async (name: string) => {
  const normalizedName = name.trim();
  const normalizedKey = normalizedName.toLowerCase();

  if (!normalizedName) {
    throw new Error("اسم وحدة القياس مطلوب.");
  }

  const allUnits = await listAllProductUnits();
  const existingUnit = allUnits.find((unit) => unit.name.trim().toLowerCase() === normalizedKey);
  if (existingUnit) {
    return existingUnit;
  }

  const storedUnits = await listStoredProductUnits();
  const nextId = storedUnits.reduce((maxId, unit) => Math.max(maxId, unit.id), 0) + 1;

  const createdUnit: StoredProductUnit = {
    id: nextId,
    name: normalizedName,
    createdAt: new Date().toISOString(),
  };

  storedUnits.unshift(createdUnit);
  await saveStoredProductUnits(storedUnits);

  return {
    ...createdUnit,
    isDefault: false,
  };
};
