// services/payment.service.tsx

import Swal from "sweetalert2";
import { authFetch, options } from "./auth.service";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_TIMEOUT_MS = 15000;

export interface PaymentDataProps {
  payment_id: number;
  bill_id: number;
  bill_name: string | null;
  bill_due_date: string | null;
  // The payer's unit number, stored directly on the payment. Owner name,
  // email, and building are resolved on the client from the unit owners list.
  paid_by_id: string | null;
  unit_number: string | null;
  recorded_by_id: string | null;
  recorded_by_name: string | null;
  recorded_by_email: string | null;
  amount: number;
  paid_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentFormDataProps {
  // Bill id — kept as number | string | null so the form can hold the raw
  // select value before it is parsed
  bill_id: number | string | null;
  // The payer's UNIT NUMBER — stored directly on the payment
  paid_by_id: string;
  amount: number | string | null;
}

export const emptyPaymentForm: PaymentFormDataProps = {
  bill_id: null,
  paid_by_id: "",
  amount: null,
};

// A bill the owner has not fully paid since their account was created
export interface UnpaidBillProps {
  bill_id: number;
  name: string;
  due_date: string;
  amount: number;
  occurrences: number;
  paid_count: number;
  missed_count: number;
}

// A bill whose current cycle has not completed yet — nothing is missed,
// the next payment just is not due yet
export interface IncomingBillProps {
  bill_id: number;
  name: string;
  due_date: string;
  amount: number;
  occurrences: number;
  paid_count: number;
  missed_count: number;
  // ISO date when the running cycle completes and payment becomes due
  next_due: string | null;
}

// Unit owner with their unpaid bills (used by the user details modal)
export interface OwnerUnpaidBillsProps {
  user_id: string;
  name: string | null;
  email: string | null;
  unit_number: string | null;
  building: number | null;
  created_at: string;
  unpaid_bills: UnpaidBillProps[];
  unpaid_count: number;
  total_outstanding: number;
}

// A unit owner's standing on a single bill (cycle occurrences vs payments)
export interface BillOwnerRowProps {
  user_id: string;
  name: string | null;
  email: string | null;
  unit_number: string | null;
  building: number | null;
  created_at: string;
  occurrences: number;
  paid_count: number;
  missed_count: number;
  total_paid: number;
}

export interface BillOwnersReportProps {
  bill_id: number;
  bill_name: string;
  due_date: string;
  amount: number;
  owners: BillOwnerRowProps[];
}

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
    const response = await authFetch(
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

// Bill standings for a single unit owner: missed plus incoming bills
export const getUnpaidBills = async (
  userId: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const result = await request(
    "GET",
    `/unpaid/${userId}`,
    undefined,
    timeoutMs,
  );

  return {
    success: result.success,
    unpaid_bills: (result.unpaid_bills ?? []) as UnpaidBillProps[],
    incoming_bills: (result.incoming_bills ?? []) as IncomingBillProps[],
  };
};

// Overview of every unit owner with their unpaid bills
export const getUnpaidOverview = async (
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const result = await request("GET", "/unpaid", undefined, timeoutMs);

  return {
    success: result.success,
    owners: (result.owners ?? []) as OwnerUnpaidBillsProps[],
  };
};

// Per-bill breakdown of every unit owner's payment standing
export const getBillOwnersReport = async (
  billId: number,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const result = await request(
    "GET",
    `/bill/${billId}/owners`,
    undefined,
    timeoutMs,
  );

  return {
    success: result.success,
    report: result as unknown as BillOwnersReportProps,
  };
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
