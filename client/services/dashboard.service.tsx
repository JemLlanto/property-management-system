// services/dashboard.service.tsx

import Swal from "sweetalert2";
import { options } from "./auth.service";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_TIMEOUT_MS = 20000;

// A named slice of the chart/table data
export interface NamedAmountProps {
  name: string;
  amount: number;
}

// Revenue (or arrears) for one calendar day
export interface DailyAmountProps {
  date: string;
  amount: number;
}

// A unit owner with money still owed
export interface ArrearsOwnerProps {
  unit_number: string;
  name: string | null;
  email: string | null;
  building: string;
  outstanding: number;
}

// A payer ranked by how much they paid in the period
export interface TopPayerProps {
  unit_number: string;
  name: string | null;
  building: string;
  amount: number;
}

// The next deadline for a bill and how many owners it hits
export interface UpcomingDueProps {
  bill_id: number;
  name: string;
  cycle: string;
  amount: number;
  due_date: string;
  owners_affected: number;
  projected_amount: number;
}

// One of the most recent payments, for the activity feed
export interface RecentPaymentProps {
  payment_id: number;
  bill_name: string;
  unit_number: string | null;
  owner_name: string | null;
  building: string;
  amount: number;
  paid_at: string;
}

export interface DashboardMetricsProps {
  total_revenue: number;
  payment_count: number;
  average_payment: number;
  average_daily_revenue: number;
  total_outstanding: number;
  arrears_count: number;
  unit_owners: number;
  occupancy_rate: number;
  total_capacity: number;
  total_occupants: number;
  building_count: number;
  bill_count: number;
  collection_rate: number;
}

export interface DashboardRangeProps {
  from: string;
  to: string;
  days: number;
}

export interface DashboardProps {
  range: DashboardRangeProps;
  metrics: DashboardMetricsProps;
  revenue_by_day: DailyAmountProps[];
  revenue_by_bill: NamedAmountProps[];
  revenue_by_building: NamedAmountProps[];
  arrears_by_bill: NamedAmountProps[];
  arrears_by_building: NamedAmountProps[];
  top_payers: TopPayerProps[];
  owners_in_arrears: ArrearsOwnerProps[];
  upcoming_dues: UpcomingDueProps[];
  recent_payments: RecentPaymentProps[];
}

// Preset ranges offered next to the custom date inputs
export const RANGE_PRESETS = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "6M", days: 182 },
  { label: "1Y", days: 365 },
] as const;

export type RangePreset = (typeof RANGE_PRESETS)[number]["label"];

// Load the aggregated dashboard report for a date range.
// Both bounds are optional — the server falls back to the last 30 days.
export const getDashboard = async (
  from?: string,
  to?: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const params = new URLSearchParams();

  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const query = params.toString();

  try {
    const response = await fetch(
      `${BASE}/dashboard${query ? `?${query}` : ""}`,
      options("GET", undefined, controller.signal),
    );

    const payload = await response.json();

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "Fetching Dashboard Failed",
        text:
          response.status === 500
            ? "Something went wrong. Please try again."
            : payload.message || "Something went wrong. Please try again.",
      });

      return { success: false };
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
