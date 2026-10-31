"use client";

import { Activity, Banknote, TrendingUp, Users, Wallet } from "lucide-react";
import { DashboardProps, RangePreset } from "@/services/dashboard.service";
import { OwnerReminderProps } from "@/services/reminder.service";
import { formatCurrency, formatPercent } from "@/utils/dashboard.helper";
import ActivityPanel from "./_components/ActivityPanel";
import ArrearsTable from "./_components/ArrearsTable";
import BreakdownList from "./_components/BreakdownList";
import DateRangePicker from "./_components/DateRangePicker";
import ExportButton from "./_components/ExportButton";
import MetricCard from "./_components/MetricCard";
import OccupancyCard from "./_components/OccupancyCard";
import RemindersPanel from "./_components/RemindersPanel";
import RevenueChart from "./_components/RevenueChart";

// A ranked payer row — the name already carries the building, so the
// list can render "1. Name (Building)".
export interface TopPayerRowProps {
  name: string;
  amount: number;
  rank: number;
}

interface UnitAdminViewProps {
  // The aggregated dashboard report for the selected period
  data: DashboardProps;
  // Payment reminders across all owners
  reminders: OwnerReminderProps[];
  // Ranked payers, ready for the breakdown list
  topPayers: TopPayerRowProps[];
  // Loading state for the cards and charts
  isLoading: boolean;
  // Current reporting window
  from: string;
  to: string;
  preset: RangePreset | "CUSTOM";
  // Window handlers owned by the page
  onPresetChange: (preset: RangePreset) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onRefresh: () => void;
  // Revenue delta badge text vs the previous period
  revenueDelta?: string;
}

const UnitAdminView = ({
  data,
  reminders,
  topPayers,
  isLoading,
  from,
  to,
  preset,
  onPresetChange,
  onFromChange,
  onToChange,
  onRefresh,
  revenueDelta,
}: UnitAdminViewProps) => {
  const { metrics, comparison } = data;

  // Mobile-first scaling shared with UnitOwnerView: tighter padding,
  // radii and gaps on small screens, relaxing at md. The card shells
  // themselves live in the shared dashboard components.
  return (
    <div className="pt-2 pb-5 md:pb-10 space-y-2 md:space-y-4">
      {/* Page heading */}
      <div className="flex flex-wrap items-end justify-between gap-2 md:gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800 flex items-center gap-2">
            <Activity size={22} />
            Dashboard
          </h2>
          <p className="text-sm text-neutral-500">
            {data.range.from
              ? `${data.range.from} to ${data.range.to} · ${data.range.days} day${data.range.days === 1 ? "" : "s"}`
              : "Select a period to load the report."}
          </p>
        </div>
        <ExportButton
          filename={`dashboard-${data.range.from || "report"}-to-${data.range.to || "report"}.csv`}
          headers={[
            "Date",
            "Bill",
            "Unit Number",
            "Owner",
            "Building",
            "Amount",
          ]}
          rows={data.recent_payments.map((payment) => [
            payment.paid_at,
            payment.bill_name,
            payment.unit_number ?? "",
            payment.owner_name ?? "",
            payment.building,
            payment.amount,
          ])}
          label="Export Payments"
          disabled={isLoading || data.recent_payments.length === 0}
        />
      </div>

      {/* Date range controls */}
      <DateRangePicker
        from={from}
        to={to}
        preset={preset}
        isLoading={isLoading}
        onPresetChange={onPresetChange}
        onFromChange={onFromChange}
        onToChange={onToChange}
        onRefresh={onRefresh}
      />

      {/* Headline metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-2 md:gap-4">
        <MetricCard
          title="Revenue Collected"
          value={formatCurrency(metrics.total_revenue)}
          icon={Banknote}
          accent="text-emerald-700 bg-emerald-50"
          hint={
            <span>
              {revenueDelta && (
                <span
                  className={
                    (comparison?.revenue_change_percent ?? 0) >= 0
                      ? "text-emerald-600"
                      : "text-red-500"
                  }
                >
                  {revenueDelta}{" "}
                </span>
              )}
              <span>
                {metrics.payment_count} payment
                {metrics.payment_count === 1 ? "" : "s"} in period
              </span>
            </span>
          }
          loading={isLoading}
        />
        <MetricCard
          title="Net Cash Flow"
          value={formatCurrency(metrics.net_cash_flow)}
          icon={Wallet}
          accent="text-amber-700 bg-amber-50"
          hint={`${formatCurrency(metrics.total_expenses)} expenses in period`}
          loading={isLoading}
        />
        <MetricCard
          title="Outstanding"
          value={formatCurrency(metrics.total_outstanding)}
          icon={Wallet}
          accent="text-red-600 bg-red-50"
          hint={`${metrics.arrears_count} owner${metrics.arrears_count === 1 ? "" : "s"} in arrears`}
          loading={isLoading}
        />
        <MetricCard
          title="Collection Rate"
          value={formatPercent(metrics.collection_rate)}
          icon={TrendingUp}
          accent="text-(--primary) bg-cyan-50"
          hint={`${formatCurrency(metrics.average_daily_revenue)} avg per day`}
          loading={isLoading}
        />
        <MetricCard
          title="Unit Owners"
          value={String(metrics.unit_owners)}
          icon={Users}
          accent="text-violet-700 bg-violet-50"
          hint={`${metrics.bill_count} active bill${metrics.bill_count === 1 ? "" : "s"}`}
          loading={isLoading}
        />
      </div>

      {/* Chart + occupancy */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-2 md:gap-4">
        <div className="xl:col-span-2">
          <RevenueChart data={data.revenue_by_day} isLoading={isLoading} />
        </div>
        <OccupancyCard
          occupancyRate={metrics.occupancy_rate}
          occupants={metrics.total_occupants}
          capacity={metrics.total_capacity}
          buildingCount={metrics.building_count}
          unitOwners={metrics.unit_owners}
          isLoading={isLoading}
        />
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 md:gap-4">
        <BreakdownList
          title="Revenue by Bill"
          data={data.revenue_by_bill}
          isLoading={isLoading}
          emptyText="No payments were recorded in this period."
        />
        <BreakdownList
          title="Revenue by Building"
          data={data.revenue_by_building}
          isLoading={isLoading}
          emptyText="No payments were recorded in this period."
        />
        <BreakdownList
          title="Top Payers"
          data={topPayers.map((payer) => ({
            name: `${payer.rank}. ${payer.name}`,
            amount: payer.amount,
          }))}
          isLoading={isLoading}
          emptyText="No payments were recorded in this period."
        />
      </div>

      {/* Arrears */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 md:gap-4">
        <ArrearsTable owners={data.owners_in_arrears} isLoading={isLoading} />
        <BreakdownList
          title="Arrears by Building"
          data={data.arrears_by_building}
          isLoading={isLoading}
          barClass="bg-red-500"
          emptyText="No outstanding balances — every owner is settled up."
        />
      </div>

      {/* Activity + reminders */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 md:gap-4">
        <ActivityPanel
          upcomingDues={data.upcoming_dues}
          recentPayments={data.recent_payments}
          isLoading={isLoading}
        />
        <RemindersPanel reminders={reminders} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default UnitAdminView;
