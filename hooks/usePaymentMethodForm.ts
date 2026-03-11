"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/app/lib/fetcher";
import {
  createPaymentMethod,
  listPaymentMethods,
  updatePaymentMethod,
} from "@/app/services/payment-methods";
import {
  createPaymentMethodFormValues,
  type PaymentMethodFormValues,
} from "@/lib/payment-methods/paymentMethodTypes";
import { validatePaymentMethodForm } from "@/lib/payment-methods/paymentMethodValidation";

type UsePaymentMethodFormOptions = {
  methodId?: number | null;
};

export function usePaymentMethodForm({ methodId }: UsePaymentMethodFormOptions = {}) {
  const router = useRouter();
  const redirectTimeoutRef = useRef<number | null>(null);
  const [values, setValues] = useState<PaymentMethodFormValues>(
    createPaymentMethodFormValues()
  );
  const [isLoading, setIsLoading] = useState(Boolean(methodId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isEditMode = useMemo(
    () => Number.isFinite(methodId) && Number(methodId) > 0,
    [methodId]
  );

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isEditMode || !methodId) {
      setValues(createPaymentMethodFormValues());
      setIsLoading(false);
      setLoadError("");
      return;
    }

    let active = true;

    const loadMethod = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const methods = await listPaymentMethods();
        if (!active) return;

        const selectedMethod =
          methods.find((method) => method.id === methodId) ?? null;

        if (!selectedMethod) {
          setLoadError("تعذر العثور على وسيلة الدفع المطلوبة.");
          return;
        }

        setValues(createPaymentMethodFormValues(selectedMethod));
      } catch (error) {
        if (!active) return;
        setLoadError(getErrorMessage(error, "تعذر تحميل بيانات وسيلة الدفع."));
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadMethod();

    return () => {
      active = false;
    };
  }, [isEditMode, methodId]);

  const updateField = <K extends keyof PaymentMethodFormValues>(
    key: K,
    value: PaymentMethodFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    const validationMessage = validatePaymentMethodForm(values);
    if (validationMessage) {
      setSubmitError(validationMessage);
      setSuccessMessage("");
      return null;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSuccessMessage("");

    try {
      const payload = {
        name: values.name.trim(),
        type: values.type.trim() || undefined,
        currency: values.currency.trim() || undefined,
        desc: values.desc.trim() || undefined,
      };

      const savedMethod =
        isEditMode && methodId
          ? await updatePaymentMethod(methodId, payload)
          : await createPaymentMethod(payload);

      setValues(createPaymentMethodFormValues(savedMethod));
      setSuccessMessage(
        isEditMode
          ? "تم تحديث وسيلة الدفع بنجاح."
          : "تم حفظ وسيلة الدفع بنجاح."
      );

      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
      redirectTimeoutRef.current = window.setTimeout(() => {
        router.push("/projects-pages/payment-methods");
      }, 1200);

      return savedMethod;
    } catch (error) {
      setSubmitError(getErrorMessage(error, "تعذر حفظ وسيلة الدفع."));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    values,
    updateField,
    submit,
    isEditMode,
    isLoading,
    isSubmitting,
    loadError,
    submitError,
    successMessage,
  };
}
