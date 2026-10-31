"use client";

import { DashboardProps, UpcomingDueProps } from "@/services/dashboard.service";
import {
  IncomingBillProps,
  PaymentDataProps,
  UnpaidBillProps,
} from "@/services/payment.service";
import { formatCurrency, formatReadableDate } from "@/utils/dashboard.helper";

// The pieces of the owner dashboard this view renders. Everything is
// passed in so the component stays presentational — the home page owns
// the data loading.
export interface UnitOwnerSummaryProps {
  unitNumber: string;
  ownerBalance: number;
  buildingLabel: string;
  recentOwnerPayments: PaymentDataProps[];
  nextDue?: UpcomingDueProps;
}

interface UnitOwnerViewProps {
  // The signed-in owner's identity
  userName: string;
  userEmail: string;
  // The computed owner summary (balance, unit, building, payments)
  ownerSummary: UnitOwnerSummaryProps;
  // Dashboard data for the upcoming dues list
  data: DashboardProps;
  // Bills the owner has missed (cycle-level detail)
  missedBills: UnpaidBillProps[];
  // Bills the owner has already settled ahead by advance credit
  paidAheadBills: IncomingBillProps[];
}

const UnitOwnerView = ({
  userName,
  userEmail,
  ownerSummary,
  data,
  missedBills,
  paidAheadBills,
}: UnitOwnerViewProps) => {
  return (
    <div className="pt-2 pb-10 space-y-4">
      <div className="rounded-2xl bg-linear-to-r from-(--primary)/80 via-(--primary) to-(--primary_hover) p-5 text-white shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-sky-100 uppercase tracking-wide">
              Welcome back
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              {userName || userEmail || "Unit Owner"}
            </h2>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
            <span className="font-medium">Unit</span> {ownerSummary.unitNumber}{" "}
            · {ownerSummary.buildingLabel}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Outstanding balance
          </p>
          <p
            className={`mt-3 text-2xl font-bold ${ownerSummary.ownerBalance > 0 ? "text-red-600" : "text-emerald-600"}`}
          >
            {formatCurrency(ownerSummary.ownerBalance)}
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Current amount due for your unit
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Next due
          </p>
          <p className="mt-3 text-2xl font-bold text-neutral-800">
            {ownerSummary.nextDue
              ? formatCurrency(ownerSummary.nextDue.amount)
              : "₱0.00"}
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            {ownerSummary.nextDue
              ? `${ownerSummary.nextDue.name} · ${formatReadableDate(ownerSummary.nextDue.due_date)}`
              : "No bill scheduled"}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Last payment
          </p>
          <p className="mt-3 text-2xl font-bold text-neutral-800">
            {ownerSummary.recentOwnerPayments[0]
              ? formatCurrency(ownerSummary.recentOwnerPayments[0].amount)
              : "₱0.00"}
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            {ownerSummary.recentOwnerPayments[0]
              ? `${ownerSummary.recentOwnerPayments[0].bill_name} · ${formatReadableDate(ownerSummary.recentOwnerPayments[0].paid_at)}`
              : "No recent payment recorded"}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Status
          </p>
          <p
            className={`mt-3 text-2xl font-bold ${ownerSummary.ownerBalance > 0 ? "text-red-600" : "text-emerald-600"}`}
          >
            {ownerSummary.ownerBalance > 0 ? "Due" : "Current"}
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            {ownerSummary.ownerBalance > 0
              ? "Please settle your outstanding balance"
              : "Your account is up to date"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-800">
            Upcoming dues
          </h3>
          <div className="mt-4 space-y-3">
            {data.upcoming_dues.slice(0, 4).map((due) => (
              <div
                key={due.bill_id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-neutral-800">{due.name}</p>
                  <p className="text-sm text-neutral-500">
                    {formatReadableDate(due.due_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-neutral-800">
                    {formatCurrency(due.amount)}
                  </p>
                </div>
              </div>
            ))}
            {data.upcoming_dues.length === 0 && (
              <p className="text-sm text-neutral-500">
                No upcoming dues available.
              </p>
            )}
          </div>
        </div>

        {/* Dynamic panel: Missed Bills when any exist, otherwise
              Advance Payments when the owner has settled ahead */}
        {missedBills.length > 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-neutral-800">
              Missed Bills
            </h3>
            <div className="mt-4 space-y-3">
              {missedBills.map((bill) => (
                <div
                  key={bill.bill_id}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-neutral-800">{bill.name}</p>
                    <p className="text-sm text-neutral-500">
                      {bill.missed_count} cycle
                      {bill.missed_count === 1 ? "" : "s"} missed ·{" "}
                      {formatCurrency(bill.amount)} per cycle
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">
                      {formatCurrency(bill.outstanding)}
                    </p>
                    <p className="text-xs text-neutral-500">outstanding</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : paidAheadBills.length > 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-neutral-800">
              Advance Payments
            </h3>
            <div className="mt-4 space-y-3">
              {paidAheadBills.map((bill) => {
                // The running cycle is already settled by credit, and
                // remaining credit may cover additional cycles ahead.
                const extraCycles = bill.amount
                  ? Math.floor((bill.remaining_credit ?? 0) / bill.amount)
                  : 0;
                const cyclesAhead = 1 + extraCycles;

                return (
                  <div
                    key={bill.bill_id}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-neutral-800">
                        {bill.name}
                      </p>
                      <p className="text-sm text-neutral-500">
                        Paid up to {cyclesAhead} cycle
                        {cyclesAhead === 1 ? "" : "s"} ahead
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">
                        {formatCurrency(bill.credit ?? 0)}
                      </p>
                      <p className="text-xs text-neutral-500">advance credit</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-neutral-800">
              Account Standing
            </h3>
            <p className="mt-4 text-sm text-neutral-500">
              No missed bills and no advance payments recorded.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm xl:col-span-2">
          <h3 className="text-lg font-semibold text-neutral-800">
            Recent payments
          </h3>
          <div className="mt-4 space-y-3">
            {ownerSummary.recentOwnerPayments.slice(0, 4).map((payment) => (
              <div
                key={payment.payment_id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-neutral-800">
                    {payment.bill_name}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {formatReadableDate(payment.paid_at)}
                  </p>
                </div>
                <p className="font-semibold text-emerald-600">
                  {formatCurrency(payment.amount)}
                </p>
              </div>
            ))}
            {ownerSummary.recentOwnerPayments.length === 0 && (
              <p className="text-sm text-neutral-500">
                No payments recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitOwnerView;
