// services/reminder.service.tsx

import Swal from "sweetalert2";
import { authFetch, options } from "./auth.service";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_TIMEOUT_MS = 20000;

// A bill an owner has already missed cycles on
export interface OverdueBillProps {
  bill_id: number;
  name: string;
  cycle: string;
  amount_due: number;
  missed_count: number;
  outstanding: number;
}

// A bill whose next deadline falls inside the reminder window
export interface UpcomingReminderBillProps {
  bill_id: number;
  name: string;
  cycle: string;
  amount_due: number;
  due_date: string;
}

// One owner's reminders — the payload an email job would consume
export interface OwnerReminderProps {
  user_id: string;
  name: string | null;
  email: string | null;
  unit_number: string;
  building: number | null;
  // False when the account has no usable email address
  has_email: boolean;
  overdue_bills: OverdueBillProps[];
  upcoming_bills: UpcomingReminderBillProps[];
  total_outstanding: number;
}

export interface RemindersResultProps {
  success: boolean;
  generated_at: string;
  window_days: number;
  reminder_count: number;
  reminders: OwnerReminderProps[];
}

// Load payment reminders. windowDays controls how far ahead a due date
// counts as "upcoming" (default 7 on the server).
export const getReminders = async (
  windowDays?: number,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<RemindersResultProps> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const query = windowDays ? `?window_days=${windowDays}` : "";

  try {
    const response = await authFetch(
      `${BASE}/reminders${query}`,
      options("GET", undefined, controller.signal),
    );

    const payload = await response.json();

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "Fetching Reminders Failed",
        text: payload.message || "Something went wrong. Please try again.",
      });

      return {
        success: false,
        generated_at: "",
        window_days: 0,
        reminder_count: 0,
        reminders: [],
      };
    }

    return {
      success: true,
      generated_at: payload.generated_at ?? "",
      window_days: payload.window_days ?? 0,
      reminder_count: payload.reminder_count ?? 0,
      reminders: payload.reminders ?? [],
    };
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
