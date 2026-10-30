"use client";

import { checkUser } from "@/utils/auth.helper";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Banknote,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/userDataSlice";
import {
  DashboardProps,
  getDashboard,
  RangePreset,
} from "@/services/dashboard.service";
import {
  formatCurrency,
  formatPercent,
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
  const [isLoading, setIsLoading] = useState(true);
  const [preset, setPreset] = useState<RangePreset | "CUSTOM">("30D");
  const [from, setFrom] = useState(startOfRange(30));
  const [to, setTo] = useState(todayKey());

  const load = useCallback(async (nextFrom: string, nextTo: string) => {
    setIsLoading(true);

    try {
      const response = await getDashboard(nextFrom, nextTo);

      if (response.success) {
        setData({ ...EMPTY_DASHBOARD, ...response });
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

  const { metrics } = data;

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
          hint={`${metrics.payment_count} payment${metrics.payment_count === 1 ? "" : "s"} in period`}
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

      {/* Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ActivityPanel
          upcomingDues={data.upcoming_dues}
          recentPayments={data.recent_payments}
          isLoading={isLoading}
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
    </div>
  );
};

export default DashboardPage;
