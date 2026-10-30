"use client";

import {
  RecentPaymentProps,
  UpcomingDueProps,
} from "@/services/dashboard.service";
import {
  formatCurrency,
  formatShortDate,
  formatTimestamp,
} from "@/utils/dashboard.helper";
import { CalendarClock, Receipt } from "lucide-react";

interface ActivityPanelProps {
  upcomingDues: UpcomingDueProps[];
  recentPayments: RecentPaymentProps[];
  isLoading: boolean;
}

// Two stacked panels: the next billing deadlines, and the latest payments.
const ActivityPanel = ({
  upcomingDues,
  recentPayments,
  isLoading,
}: ActivityPanelProps) => {
  return (
    <>
      {/* Upcoming dues */}
      <div className="w-full mx-auto p-5 bg-white border border-gray-200 rounded-xl shadow-sm font-sans">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-lg font-semibold text-neutral-800">
            Upcoming Dues
          </h3>
          <span className="flex items-center gap-1.5 text-sm text-neutral-500">
            <CalendarClock size={14} />
            {upcomingDues.length} bill{upcomingDues.length === 1 ? "" : "s"}
          </span>
        </div>

        {isLoading ? (
          <p className="text-center text-neutral-400 py-8 text-sm">
            Loading...
          </p>
        ) : upcomingDues.length === 0 ? (
          <p className="text-center text-neutral-400 py-8 text-sm">
            No bills configured yet.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {upcomingDues.map((due) => (
              <li
                key={due.bill_id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm text-neutral-800 truncate">
                    {due.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {due.cycle} · due {formatShortDate(due.due_date)} ·{" "}
                    {due.owners_affected} unit
                    {due.owners_affected === 1 ? "" : "s"}
                  </p>
                </div>
                <p className="text-right text-sm text-neutral-700 shrink-0">
                  {formatCurrency(due.amount)}
                  <span className="block text-xs text-neutral-400">
                    {formatCurrency(due.projected_amount)} projected
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent activity */}
      <div className="w-full mx-auto p-5 bg-white border border-gray-200 rounded-xl shadow-sm font-sans">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-lg font-semibold text-neutral-800">
            Recent Payments
          </h3>
          <span className="flex items-center gap-1.5 text-sm text-neutral-500">
            <Receipt size={14} />
            {recentPayments.length} record
            {recentPayments.length === 1 ? "" : "s"}
          </span>
        </div>

        {isLoading ? (
          <p className="text-center text-neutral-400 py-8 text-sm">
            Loading...
          </p>
        ) : recentPayments.length === 0 ? (
          <p className="text-center text-neutral-400 py-8 text-sm">
            No payments recorded yet.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {recentPayments.map((payment) => (
              <li
                key={payment.payment_id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm text-neutral-800 truncate">
                    {payment.bill_name}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    Unit {payment.unit_number ?? "—"} · {payment.building} ·{" "}
                    {formatTimestamp(payment.paid_at)}
                  </p>
                </div>
                <p className="text-sm text-neutral-700 shrink-0">
                  {formatCurrency(payment.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default ActivityPanel;
