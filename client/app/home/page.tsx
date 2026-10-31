"use client";

import { checkUser } from "@/utils/auth.helper";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Banknote, TrendingUp, Users, Wallet } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/userDataSlice";
import {
  DashboardProps,
  getDashboard,
  RangePreset,
} from "@/services/dashboard.service";
import { getReminders, OwnerReminderProps } from "@/services/reminder.service";
import {
  formatCurrency,
  formatPercent,
  formatReadableDate,
  startOfRange,
  todayKey,
} from "@/utils/dashboard.helper";
import ActivityPanel from "./_components/ActivityPanel";
import ArrearsTable from "./_components/ArrearsTable";
import BreakdownList from "./_components/BreakdownList";
import DateRangePicker from "./_components/DateRangePicker";
import ExportButton from "./_components/ExportButton";
import MetricCard from "./_components/MetricCard";
import OccupancyCard from "./_components/OccupancyCard";
import RemindersPanel from "./_components/RemindersPanel";
import RevenueChart from "./_components/RevenueChart";

// Days covered by each quick preset
const RANGE_DAYS: Record<RangePreset, number> = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
  "6M": 182,
  "1Y": 365,
};

const EMPTY_DASHBOARD: DashboardProps = {
  range: { from: "", to: "", days: 0 },
  metrics: {
    total_revenue: 0,
    payment_count: 0,
    average_payment: 0,
    average_daily_revenue: 0,
    total_outstanding: 0,
    arrears_count: 0,
    unit_owners: 0,
    occupancy_rate: 0,
    total_capacity: 0,
    total_occupants: 0,
    building_count: 0,
    bill_count: 0,
    collection_rate: 0,
    total_expenses: 0,
    expense_count: 0,
    net_cash_flow: 0,
  },
  revenue_by_day: [],
  revenue_by_bill: [],
  revenue_by_building: [],
  arrears_by_bill: [],
  arrears_by_building: [],
  top_payers: [],
  owners_in_arrears: [],
  upcoming_dues: [],
  recent_payments: [],
};

const DashboardPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [data, setData] = useState<DashboardProps>(EMPTY_DASHBOARD);
  const [reminders, setReminders] = useState<OwnerReminderProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [preset, setPreset] = useState<RangePreset | "CUSTOM">("30D");
  const [from, setFrom] = useState(startOfRange(30));
  const [to, setTo] = useState(todayKey());

  const load = useCallback(async (nextFrom: string, nextTo: string) => {
    setIsLoading(true);

    try {
      const [response, reminderRes] = await Promise.all([
        getDashboard(nextFrom, nextTo),
        getReminders(7),
      ]);

      if (response.success) {
        setData({ ...EMPTY_DASHBOARD, ...response });
      }

      if (reminderRes.success) {
        setReminders(reminderRes.reminders);
      }
    } catch (err) {
      console.error("Error loading dashboard: ", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Checking user authorization, then loading the dashboard report
  useEffect(() => {
    const validateUser = async () => {
      try {
        const response = await checkUser();

        if (!response.success) {
          // Redirect to the landing page if not authenticated.
          router.push(`/`);
          return;
        }

        dispatch(setUser(response.user));

        await load(from, to);
      } catch (err) {
        console.error("Error: ", err);
      }
    };

    validateUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply a quick preset and reload
  const handlePresetChange = (next: RangePreset) => {
    const nextFrom = startOfRange(RANGE_DAYS[next] ?? 30);
    const nextTo = todayKey();

    setPreset(next);
    setFrom(nextFrom);
    setTo(nextTo);

    load(nextFrom, nextTo);
  };

  // Manual range edits switch the picker to "custom"
  const handleFromChange = (value: string) => {
    setFrom(value);
    setPreset("CUSTOM");
  };

  const handleToChange = (value: string) => {
    setTo(value);
    setPreset("CUSTOM");
  };

  const handleRefresh = () => {
    load(from, to);
  };

  const { metrics, comparison } = data;
  const userData = useAppSelector((state) => state.userData);
  const isUnitOwnerView = userData.type === "Unit Owner" || !userData.type;

  // Delta badge text vs the previous period. Null when there is no
  // meaningful comparison (e.g. no revenue in the prior window).
  const formatDelta = (percent: number | null | undefined) => {
    if (percent === null || percent === undefined) return undefined;

    const rounded = Math.round(percent * 10) / 10;
    const sign = rounded > 0 ? "↑" : rounded < 0 ? "↓" : "–";

    return `${sign} ${Math.abs(rounded)}% vs prior period`;
  };

  const revenueDelta = formatDelta(comparison?.revenue_change_percent);
  const paymentCountDelta = formatDelta(
    comparison?.payment_count_change_percent,
  );

  const ownerSummary = useMemo(() => {
    const unitNumber = userData.unit_number || "—";
    const ownerBalance =
      data.owners_in_arrears.find((owner) => owner.unit_number === unitNumber)
        ?.outstanding ?? 0;
    const recentOwnerPayments = data.recent_payments.filter(
      (payment) =>
        payment.unit_number === unitNumber ||
        payment.owner_name === (userData.name || userData.username),
    );
    const nextDue = data.upcoming_dues[0];

    return {
      unitNumber,
      ownerBalance,
      recentOwnerPayments,
      nextDue,
      buildingLabel:
        recentOwnerPayments[0]?.building ||
        (userData.building
          ? `Building ${userData.building}`
          : "Property Owner"),
    };
  }, [data, userData]);

  // Revenue per payer — ranked for the top payers list
  const topPayers = useMemo(
    () =>
      data.top_payers.map((payer, index) => ({
        name: `${
          payer.name && payer.name.trim() ? payer.name : payer.unit_number
        } (${payer.building})`,
        amount: payer.amount,
        rank: index + 1,
      })),
    [data.top_payers],
  );

  if (isUnitOwnerView) {
    return (
      <div className="pt-2 pb-10 space-y-4">
        <div className="rounded-2xl bg-linear-to-r from-sky-600 via-cyan-600 to-indigo-600 p-5 text-white shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm text-sky-100 uppercase tracking-wide">
                Welcome back
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                {userData.name || userData.email || "Unit Owner"}
              </h2>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
              <span className="font-medium">Unit</span>{" "}
              {ownerSummary.unitNumber} · {ownerSummary.buildingLabel}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Outstanding balance
            </p>
            <p className="mt-3 text-2xl font-bold text-neutral-800">
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
            <p className="mt-3 text-2xl font-bold text-emerald-600">
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
                    <p className="text-xs text-neutral-500">
                      {due.owners_affected} owner
                      {due.owners_affected === 1 ? "" : "s"}
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

          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-neutral-800">
              Account snapshot
            </h3>
            <div className="mt-4 space-y-3 text-sm text-neutral-600">
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span>Unit number</span>
                <span className="font-medium text-neutral-800">
                  {ownerSummary.unitNumber}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span>Building</span>
                <span className="font-medium text-neutral-800">
                  {ownerSummary.buildingLabel}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span>Collections in period</span>
                <span className="font-medium text-neutral-800">
                  {formatCurrency(metrics.total_revenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Reminders</span>
                <span className="font-medium text-neutral-800">
                  {reminders.length}
                </span>
              </div>
            </div>
          </div>

          <RemindersPanel
            reminders={reminders.slice(0, 4)}
            isLoading={isLoading}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-10 space-y-4">
      {/* Page heading */}
      <div className="flex flex-wrap items-end justify-between gap-3">
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
        onPresetChange={handlePresetChange}
        onFromChange={handleFromChange}
        onToChange={handleToChange}
        onRefresh={handleRefresh}
      />

      {/* Headline metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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

export default DashboardPage;
