export const FALLBACK_CURRENCY = "OMR";

export const normalizeCurrencyCode = (value: any): string => {
  if (typeof value !== "string") {
    if (value && typeof value.toString === "function") {
      value = value.toString();
    } else {
      return FALLBACK_CURRENCY;
    }
  }

  const trimmed = (value as string).trim();
  if (!trimmed) return FALLBACK_CURRENCY;

  const normalized = trimmed.toUpperCase();

  if (normalized.length === 3 && /^[A-Z]{3}$/.test(normalized)) {
    return normalized;
  }

  const v = trimmed.toLowerCase();

  if (v.includes("سعود")) return "SAR";
  if (v.includes("دولار") || v.includes("امريك")) return "USD";
  if (v.includes("جنيه") || v.includes("مصري")) return "EGP";
  if (v.includes("قطر")) return "QAR";
  if (v.includes("عمان") || v.includes("عُمان")) return "OMR";
  if (v.includes("درهم") || v.includes("امارات") || v.includes("إمارات")) return "AED";
  if (v.includes("كويت")) return "KWD";
  if (v.includes("بحرين")) return "BHD";
  if (v.includes("اردن") || v.includes("أردن")) return "JOD";
  if (v.includes("عراق")) return "IQD";

  return normalized || FALLBACK_CURRENCY;
};
