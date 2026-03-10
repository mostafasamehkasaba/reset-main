export type LoginFormValues = {
  email: string;
  password: string;
};

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (value: string) => {
  const normalized = value.trim();

  if (!normalized) {
    return "البريد الإلكتروني مطلوب.";
  }

  if (!EMAIL_PATTERN.test(normalized)) {
    return "أدخل بريدًا إلكترونيًا صالحًا.";
  }

  return "";
};

export const validatePassword = (value: string) => {
  if (!value.trim()) {
    return "كلمة المرور مطلوبة.";
  }

  if (value.length < 8) {
    return "كلمة المرور يجب أن تكون 8 أحرف أو أكثر.";
  }

  return "";
};

export const validateLoginValues = (values: LoginFormValues): LoginFormErrors => {
  const emailError = validateEmail(values.email);
  const passwordError = validatePassword(values.password);

  return {
    ...(emailError ? { email: emailError } : {}),
    ...(passwordError ? { password: passwordError } : {}),
  };
};

export const hasValidationErrors = (errors: LoginFormErrors) =>
  Object.values(errors).some((value) => typeof value === "string" && value.trim().length > 0);
