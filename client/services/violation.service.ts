// services/violation.service.ts

import Swal from "sweetalert2";
import { authFetch, options } from "./auth.service";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_TIMEOUT_MS = 15000;

// The violation types an admin can pick. "Other" lets them type a
// custom description instead.
export const VIOLATION_TYPES = [
  "Noise",
  "Smoking",
  "Parking",
  "Pets",
  "Trash Disposal",
  "Property Damage",
  "Common Area Misuse",
  "Unauthorized Renovation",
  "Other",
] as const;

export type ViolationType = (typeof VIOLATION_TYPES)[number];

// How serious the violation is.
export const SEVERITIES = ["Minor", "Major", "Critical"] as const;

export type Severity = (typeof SEVERITIES)[number];

// The lifecycle of a violation.
export const VIOLATION_STATUSES = ["Open", "Resolved"] as const;

export type ViolationStatus = (typeof VIOLATION_STATUSES)[number];

export interface ViolationDataProps {
  violation_id: number;
  unit_number: string;
  violation_type: string;
  severity: string;
  description: string | null;
  occurred_at: string;
  status: string;
  resolution_remarks: string | null;
  resolved_at: string | null;
  recorded_by_id: string | null;
  recorded_by_name: string | null;
  recorded_by_email: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ViolationFormDataProps {
  unit_number: string;
  violation_type: string;
  severity: Severity;
  description: string;
  occurred_at: string;
  status: ViolationStatus;
  resolution_remarks: string;
}

export const emptyViolationForm: ViolationFormDataProps = {
  unit_number: "",
  violation_type: "",
  severity: "Minor",
  description: "",
  occurred_at: "",
  status: "Open",
  resolution_remarks: "",
};

const errorMessage = (method: string) => {
  switch (method) {
    case "POST":
      return "Violation Creation Failed";
    case "PATCH":
    case "PUT":
      return "Violation Update Failed";
    case "DELETE":
      return "Violation Deletion Failed";
    default:
      return "Fetching Violations Failed";
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
      `${BASE}/violations${path}`,
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

// Query parameters accepted by the paginated violations endpoint
export interface ViolationListQueryProps {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  severity?: string;
  unit_number?: string;
  sort?: string;
  order?: "asc" | "desc";
}

// A page of violations, newest first, with optional filters
export const getViolationsPaginated = async (
  query: ViolationListQueryProps = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const params = new URLSearchParams();

  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.pageSize !== undefined) {
    params.set("pageSize", String(query.pageSize));
  }
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.severity) params.set("severity", query.severity);
  if (query.unit_number) params.set("unit_number", query.unit_number);
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
    violations: (result.violations ?? []) as ViolationDataProps[],
    page: result.page ?? 1,
    pageSize: result.pageSize ?? 0,
    total: result.total ?? 0,
    total_pages: result.total_pages ?? 0,
    has_more: result.has_more ?? false,
  };
};

// Record a violation against a unit
export const createViolation = async (
  formData: ViolationFormDataProps,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) =>
  request(
    "POST",
    "",
    {
      unit_number: formData.unit_number,
      violation_type: formData.violation_type,
      severity: formData.severity,
      description: formData.description.trim() || null,
      status: formData.status,
      resolution_remarks: formData.resolution_remarks.trim() || null,
      ...(formData.occurred_at ? { occurred_at: formData.occurred_at } : {}),
    },
    timeoutMs,
  );

// Update a violation — including resolving it
export const updateViolation = async (
  violationId: number,
  formData: ViolationFormDataProps,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) =>
  request(
    "PATCH",
    `/${violationId}`,
    {
      unit_number: formData.unit_number,
      violation_type: formData.violation_type,
      severity: formData.severity,
      description: formData.description.trim() || null,
      status: formData.status,
      resolution_remarks: formData.resolution_remarks.trim() || null,
      ...(formData.occurred_at ? { occurred_at: formData.occurred_at } : {}),
    },
    timeoutMs,
  );

// Delete a violation record
export const deleteViolation = async (
  violationId: number,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => request("DELETE", `/${violationId}`, undefined, timeoutMs);
