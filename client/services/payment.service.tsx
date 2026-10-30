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
  // The billing cycle this payment settles (null = lump-sum credit)
  cycle_index: number | null;
  // The amount due for that cycle at payment time
  amount_due: number | null;
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
  // Optional payment date (YYYY-MM-DD) — blank means "today". Allows
  // backdating when money was received before it was recorded.
  paid_at: string;
}

export const emptyPaymentForm: PaymentFormDataProps = {
  bill_id: null,
  paid_by_id: "",
  amount: null,
  paid_at: "",
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
  // Money still owed on this bill after value-based cycle settling
  outstanding: number;
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
  outstanding: number;
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
  outstanding: number;
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

// Query parameters accepted by the paginated payments endpoint
export interface PaymentListQueryProps {
  page?: number;
  pageSize?: number;
  search?: string;
  bill_id?: number | string;
  from?: string;
  to?: string;
}

// A page of payments, newest first, with an optional search term, bill
// filter and date range.
export const getPaymentsPaginated = async (
  query: PaymentListQueryProps = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const params = new URLSearchParams();

  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.pageSize !== undefined) {
    params.set("pageSize", String(query.pageSize));
  }
  if (query.search) params.set("search", query.search);
  if (query.bill_id) params.set("bill_id", String(query.bill_id));
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);

  const result = await request(
    "GET",
    `?${params.toString()}`,
    undefined,
    timeoutMs,
  );

  return {
    success: result.success,
    payments: (result.payments ?? []) as PaymentDataProps[],
    page: result.page ?? 1,
    pageSize: result.pageSize ?? 0,
    total: result.total ?? 0,
    total_pages: result.total_pages ?? 0,
    has_more: result.has_more ?? false,
  };
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

// Record a payment. paid_at is optional — blank means "today"; a
// YYYY-MM-DD value backdates the payment to when the money was received.
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
      ...(formData.paid_at ? { paid_at: formData.paid_at } : {}),
    },
    timeoutMs,
  );

// Delete a payment record
export const deletePayment = async (
  paymentId: number,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => request("DELETE", `/${paymentId}`, undefined, timeoutMs);
