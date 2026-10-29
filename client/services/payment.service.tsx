// services/payment.service.tsx

import Swal from "sweetalert2";
import { options } from "./auth.service";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_TIMEOUT_MS = 15000;

export interface PaymentDataProps {
  payment_id: number;
  bill_id: number;
  bill_name: string | null;
  bill_due_date: string | null;
  paid_by_id: string;
  unit_number: string | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_building: number | null;
  recorded_by_id: string;
  recorded_by_name: string | null;
  recorded_by_email: string | null;
  amount: number;
  paid_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentFormDataProps {
  bill_id: number | null;
  paid_by_id: string;
  amount: number | string | null;
}

export const emptyPaymentForm: PaymentFormDataProps = {
  bill_id: null,
  paid_by_id: "",
  amount: null,
};

const errorMessage = (method: string) => {
  switch (method) {
    case "POST":
      return "Payment Recording Failed";
    case "DELETE":
      return "Payment Deletion Failed";
    default:
      return "Fetching Payments Failed";
  }
};

// Shared request helper — handles timeouts, error toasts and JSON parsing
const request = async (
  method: string,
  path: string,
  body?: object,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `${BASE}/payments${path}`,
      options(method, body, controller.signal),
    );

    const payload = await response.json();

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: errorMessage(method),
        text:
          response.status === 500
            ? "Something went wrong. Please try again."
            : payload.message || "Something went wrong. Please try again.",
      });

      return { success: false, ...payload };
    }

    return { success: true, ...payload };
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === "AbortError";

    Swal.fire({
      icon: "error",
      title: isTimeout ? "Request Timed Out" : "Network Error",
      text: isTimeout
        ? "The server took too long to respond. Please try again."
        : "Something went wrong. Please try again.",
    });

    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

// List all payments
export const getPayments = async (timeoutMs: number = DEFAULT_TIMEOUT_MS) => {
  const result = await request("GET", "", undefined, timeoutMs);

  return { success: result.success, payments: result.payments ?? [] };
};

// Record a payment
export const createPayment = async (
  formData: PaymentFormDataProps,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) =>
  request(
    "POST",
    "",
    {
      bill_id: formData.bill_id,
      paid_by_id: formData.paid_by_id,
      amount: Number(formData.amount),
    },
    timeoutMs,
  );

// Delete a payment record
export const deletePayment = async (
  paymentId: number,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => request("DELETE", `/${paymentId}`, undefined, timeoutMs);
