"use client";

import { checkUser } from "@/utils/auth.helper";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/userDataSlice";
import {
  DashboardProps,
  getDashboard,
  RangePreset,
} from "@/services/dashboard.service";
import { getReminders, OwnerReminderProps } from "@/services/reminder.service";
import {
  getUnpaidBills,
  getOwnerPayments,
  IncomingBillProps,
  PaymentDataProps,
  UnpaidBillProps,
} from "@/services/payment.service";
import { startOfRange, todayKey } from "@/utils/dashboard.helper";
import UnitOwnerView from "./UnitOwnerView";
import UnitAdminView from "./UnitAdminView";

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
  const [missedBills, setMissedBills] = useState<UnpaidBillProps[]>([]);
  const [paidAheadBills, setPaidAheadBills] = useState<IncomingBillProps[]>([]);
  const [ownerPayments, setOwnerPayments] = useState<PaymentDataProps[]>([]);
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

        // Missed bills are computed server-side from the owner's
        // created_at anchor, so payments made before an adjusted
        // creation date are never counted against the current cycles.
        if (response.user?.user_id || response.user?.id) {
          const missedRes = await getUnpaidBills(
            response.user.user_id ?? response.user.id,
          );

          if (missedRes.success) {
            setMissedBills(missedRes.unpaid_bills);
            setPaidAheadBills(missedRes.paid_ahead_bills);
          }
        }

        // Owner-scoped recent payments — excludes anything recorded
        // before the owner's (possibly adjusted) creation date.
        if (response.user?.unit_number) {
          const ownerPaymentsRes = await getOwnerPayments(
            response.user.unit_number,
            8,
          );

          if (ownerPaymentsRes.success) {
            setOwnerPayments(ownerPaymentsRes.payments);
          }
        }

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
    // Owner-scoped list — already filtered by the server against the
    // owner's creation date.
    const recentOwnerPayments = ownerPayments;
    const nextDue = data.upcoming_dues[0];

    return {
      unitNumber,
      ownerBalance,
      recentOwnerPayments,
      nextDue,
      buildingLabel:
        data.recent_payments.find(
          (payment) => payment.unit_number === unitNumber,
        )?.building ||
        (userData.building
          ? `Building ${userData.building}`
          : "Property Owner"),
    };
  }, [data, userData, ownerPayments]);

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
      <UnitOwnerView
        userName={userData.name}
        userEmail={userData.email}
        ownerSummary={ownerSummary}
        data={data}
        missedBills={missedBills}
        paidAheadBills={paidAheadBills}
      />
    );
  }

  return (
    <UnitAdminView
      data={data}
      reminders={reminders}
      topPayers={topPayers}
      isLoading={isLoading}
      from={from}
      to={to}
      preset={preset}
      onPresetChange={handlePresetChange}
      onFromChange={handleFromChange}
      onToChange={handleToChange}
      onRefresh={handleRefresh}
      revenueDelta={revenueDelta}
    />
  );
};

export default DashboardPage;
