import Swal from "sweetalert2";
import { authFetch, options } from "./auth.service";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_TIMEOUT_MS = 15000;

export const EXPENSE_REASONS = [
  "Maintenance",
  "Cleaning",
  "Security",
  "Utilities",
  "Repairs",
  "Gardening",
  "Supplies",
  "Admin / Misc.",
];

export interface ExpenseDataProps {
  expense_id: number;
  reason: string;
  amount: number;
  description: string | null;
  occurred_at: string;
  recorded_by_id: string | null;
  recorded_by_name: string | null;
  recorded_by_email: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseFormDataProps {
  reason: string;
  custom_reason: string;
  amount: number | string | null;
  description: string;
  occurred_at: string;
}

export const emptyExpenseForm: ExpenseFormDataProps = {
  reason: "",
  custom_reason: "",
  amount: null,
  description: "",
  occurred_at: "",
};

const errorMessage = (method: string) => {
  switch (method) {
    case "POST":
      return "Expense Creation Failed";
    case "DELETE":
      return "Expense Deletion Failed";
    default:
      return "Fetching Expenses Failed";
  }
};

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
      `${BASE}/expenses${path}`,
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

export const getExpenses = async (timeoutMs: number = DEFAULT_TIMEOUT_MS) => {
  const result = await request("GET", "", undefined, timeoutMs);
  return { success: result.success, expenses: result.expenses ?? [] };
};

// Query parameters accepted by the paginated expenses endpoint
export interface ExpenseListQueryProps {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}

// A page of expenses, newest first, with an optional search term.
export const getExpensesPaginated = async (
  query: ExpenseListQueryProps = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const params = new URLSearchParams();

  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.pageSize !== undefined) {
    params.set("pageSize", String(query.pageSize));
  }
  if (query.search) params.set("search", query.search);
  if (query.sort) params.set("sort", query.sort);
  if (query.order) params.set("order", query.order);

  const result = await request(
    "GET",
    `?${params.toString()}`,
    undefined,
    timeoutMs,
  );

  return {
    success: result.success,
    expenses: (result.expenses ?? []) as ExpenseDataProps[],
    page: result.page ?? 1,
    pageSize: result.pageSize ?? 0,
    total: result.total ?? 0,
    total_pages: result.total_pages ?? 0,
    has_more: result.has_more ?? false,
  };
};

export const createExpense = async (
  formData: ExpenseFormDataProps,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const resolvedReason =
    String(formData.custom_reason ?? "").trim() || formData.reason;

  return request(
    "POST",
    "",
    {
      reason: resolvedReason,
      amount: Number(formData.amount),
      description: formData.description?.trim() || null,
      ...(formData.occurred_at ? { occurred_at: formData.occurred_at } : {}),
    },
    timeoutMs,
  );
};

export const deleteExpense = async (
  expenseId: number,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => request("DELETE", `/${expenseId}`, undefined, timeoutMs);
