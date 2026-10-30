// services/bill.service.tsx

import Swal from "sweetalert2";
import { authFetch, options } from "./auth.service";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_TIMEOUT_MS = 15000;

export interface BillDataProps {
  bill_id: number;
  name: string;
  due_date: string;
  // List price per cycle, before the discount
  amount: number;
  // Percentage off the list price for every cycle (0–99.99)
  discount_percent: number;
  // Late fee charged per missed cycle once the grace period elapses
  late_fee_amount: number;
  // "fixed" (flat amount) | "percent" (of the discounted cycle price)
  late_fee_type: "fixed" | "percent";
  // Days after the cycle deadline before the fee applies
  late_fee_grace_days: number;
  created_at?: string;
  updated_at?: string;
}

// Billing cycle options for the Due Date dropdown
export const BILLING_CYCLES = [
  "Weekly",
  "Half-Month",
  "Monthly",
  "Quarterly",
] as const;

export type BillingCycle = (typeof BILLING_CYCLES)[number];

export interface BillFormDataProps {
  name: string;
  due_date: string;
  amount: number | string | null;
  discount_percent: number | string | null;
  late_fee_amount: number | string | null;
  late_fee_type: "fixed" | "percent";
  late_fee_grace_days: number | string | null;
}

export const emptyBillForm: BillFormDataProps = {
  name: "",
  due_date: "",
  amount: null,
  discount_percent: 0,
  late_fee_amount: 0,
  late_fee_type: "fixed",
  late_fee_grace_days: 0,
};

const errorMessage = (method: string) => {
  switch (method) {
    case "POST":
      return "Bill Creation Failed";
    case "PATCH":
    case "PUT":
      return "Bill Update Failed";
    case "DELETE":
      return "Bill Deletion Failed";
    default:
      return "Fetching Bills Failed";
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
      `${BASE}/bills${path}`,
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

// List all bills
export const getBills = async (timeoutMs: number = DEFAULT_TIMEOUT_MS) => {
  const result = await request("GET", "", undefined, timeoutMs);

  return { success: result.success, bills: result.bills ?? [] };
};

// Query parameters accepted by the paginated bills endpoint
export interface BillListQueryProps {
  page?: number;
  pageSize?: number;
  search?: string;
  cycle?: string;
}

// A page of bills, with an optional search term and cycle filter.
export const getBillsPaginated = async (
  query: BillListQueryProps = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const params = new URLSearchParams();

  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.pageSize !== undefined) {
    params.set("pageSize", String(query.pageSize));
  }
  if (query.search) params.set("search", query.search);
  if (query.cycle) params.set("cycle", query.cycle);

  const result = await request(
    "GET",
    `?${params.toString()}`,
    undefined,
    timeoutMs,
  );

  return {
    success: result.success,
    bills: (result.bills ?? []) as BillDataProps[],
    page: result.page ?? 1,
    pageSize: result.pageSize ?? 0,
    total: result.total ?? 0,
    total_pages: result.total_pages ?? 0,
    has_more: result.has_more ?? false,
  };
};

// Create a bill
export const createBill = async (
  formData: BillFormDataProps,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) =>
  request(
    "POST",
    "",
    {
      name: formData.name,
      due_date: formData.due_date,
      amount: Number(formData.amount),
      discount_percent: Number(formData.discount_percent ?? 0),
      late_fee_amount: Number(formData.late_fee_amount ?? 0),
      late_fee_type: formData.late_fee_type,
      late_fee_grace_days: Number(formData.late_fee_grace_days ?? 0),
    },
    timeoutMs,
  );

// Update a bill
export const updateBill = async (
  billId: number,
  formData: Partial<BillFormDataProps>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const body: {
    name?: string;
    due_date?: string;
    amount?: number;
    discount_percent?: number;
    late_fee_amount?: number;
    late_fee_type?: "fixed" | "percent";
    late_fee_grace_days?: number;
  } = {};

  if (formData.name !== undefined) body.name = formData.name;
  if (formData.due_date !== undefined && formData.due_date !== "") {
    body.due_date = formData.due_date;
  }
  if (formData.amount !== undefined && formData.amount !== null) {
    body.amount = Number(formData.amount);
  }
  if (
    formData.discount_percent !== undefined &&
    formData.discount_percent !== null
  ) {
    body.discount_percent = Number(formData.discount_percent);
  }
  if (
    formData.late_fee_amount !== undefined &&
    formData.late_fee_amount !== null
  ) {
    body.late_fee_amount = Number(formData.late_fee_amount);
  }
  if (formData.late_fee_type !== undefined) {
    body.late_fee_type = formData.late_fee_type;
  }
  if (
    formData.late_fee_grace_days !== undefined &&
    formData.late_fee_grace_days !== null
  ) {
    body.late_fee_grace_days = Number(formData.late_fee_grace_days);
  }

  return request("PATCH", `/${billId}`, body, timeoutMs);
};

// Delete a bill
export const deleteBill = async (
  billId: number,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => request("DELETE", `/${billId}`, undefined, timeoutMs);
