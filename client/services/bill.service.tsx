// services/bill.service.tsx

import Swal from "sweetalert2";
import { authFetch, options } from "./auth.service";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_TIMEOUT_MS = 15000;

export interface BillDataProps {
  bill_id: number;
  name: string;
  due_date: string;
  amount: number;
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
}

export const emptyBillForm: BillFormDataProps = {
  name: "",
  due_date: "",
  amount: null,
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
    },
    timeoutMs,
  );

// Update a bill
export const updateBill = async (
  billId: number,
  formData: Partial<BillFormDataProps>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const body: { name?: string; due_date?: string; amount?: number } = {};

  if (formData.name !== undefined) body.name = formData.name;
  if (formData.due_date !== undefined && formData.due_date !== "") {
    body.due_date = formData.due_date;
  }
  if (formData.amount !== undefined && formData.amount !== null) {
    body.amount = Number(formData.amount);
  }

  return request("PATCH", `/${billId}`, body, timeoutMs);
};

// Delete a bill
export const deleteBill = async (
  billId: number,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => request("DELETE", `/${billId}`, undefined, timeoutMs);
