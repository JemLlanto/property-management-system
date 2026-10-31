"use client";

import { OwnerReminderProps } from "@/services/reminder.service";
import { formatCurrency } from "@/utils/dashboard.helper";
import { BellRing, Mail, MailWarning } from "lucide-react";

interface RemindersPanelProps {
  reminders: OwnerReminderProps[];
  isLoading: boolean;
}

// The reminder list — who owes what, and who is about to be billed.
// This is the payload a notification job would send out.
const RemindersPanel = ({ reminders, isLoading }: RemindersPanelProps) => {
  const overdueCount = reminders.filter(
    (r) => r.overdue_bills.length > 0,
  ).length;
  const upcomingCount = reminders.filter(
    (r) => r.overdue_bills.length === 0 && r.upcoming_bills.length > 0,
  ).length;

  return (
    <div className="w-full mx-auto p-2 md:p-5 bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-sm font-sans">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
          <BellRing size={18} />
          Reminders
        </h3>
        {!isLoading && reminders.length > 0 && (
          <span className="text-sm text-neutral-500">
            {overdueCount} overdue · {upcomingCount} due soon
          </span>
        )}
      </div>

      {isLoading ? (
        <p className="text-center text-neutral-400 py-8 text-sm">Loading...</p>
      ) : reminders.length === 0 ? (
        <p className="text-center text-neutral-400 py-8 text-sm">
          No reminders — nobody owes money and no bills fall due this week.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {reminders.map((reminder) => {
            const isOverdue = reminder.overdue_bills.length > 0;

            return (
              <li
                key={reminder.user_id}
                className="py-3 px-2 first:pt-0 last:pb-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate">
                      {reminder.name || reminder.unit_number}
                      <span className="text-neutral-400 font-normal">
                        {" "}
                        · Unit {reminder.unit_number}
                      </span>
                    </p>

                    <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                      {reminder.has_email ? (
                        <Mail size={12} />
                      ) : (
                        <MailWarning size={12} className="text-amber-500" />
                      )}
                      <span className="truncate">
                        {reminder.email || "No email on file"}
                      </span>
                    </p>
                  </div>

                  {reminder.total_outstanding > 0 && (
                    <p className="text-sm font-semibold text-red-600 shrink-0">
                      {formatCurrency(reminder.total_outstanding)}
                    </p>
                  )}
                </div>

                {/* What is overdue, and what is about to be due */}
                <ul className="mt-1.5 space-y-0.5">
                  {reminder.overdue_bills.map((bill) => (
                    <li
                      key={`overdue-${bill.bill_id}`}
                      className="text-xs text-red-600 flex items-center justify-between gap-2"
                    >
                      <span className="truncate">
                        {bill.name} · {bill.missed_count} cycle
                        {bill.missed_count === 1 ? "" : "s"} missed
                      </span>
                      <span className="shrink-0">
                        {formatCurrency(bill.outstanding)}
                      </span>
                    </li>
                  ))}

                  {reminder.upcoming_bills.map((bill) => (
                    <li
                      key={`upcoming-${bill.bill_id}`}
                      className="text-xs text-neutral-600 flex items-center justify-between gap-2"
                    >
                      <span className="truncate">
                        {bill.name} · due {bill.due_date}
                      </span>
                      <span className="shrink-0">
                        {formatCurrency(bill.amount_due)}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RemindersPanel;
