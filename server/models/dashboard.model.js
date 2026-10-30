const prisma = require("../lib/prisma");
const Payment = require("./payment.model");
const { computeBillStanding } = require("../utils/billing");

// Default window when the client does not send a range: the last 30 days
// up to and including today.
const DEFAULT_RANGE_DAYS = 30;

// Parse a YYYY-MM-DD string into a local Date at the start of that day.
// Returns null for anything unparseable.
function parseDateOnly(value, endOfDay = false) {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);

  const date = endOfDay
    ? new Date(year, month, day, 23, 59, 59, 999)
    : new Date(year, month, day, 0, 0, 0, 0);

  if (Number.isNaN(date.getTime())) return null;

  // Guard against overflow (e.g. "2024-02-31" rolling into March)
  if (date.getFullYear() !== year || date.getMonth() !== month) return null;

  return date;
}

// Resolve the reporting window. Falls back to the last 30 days when the
// range is missing or invalid, and swaps the bounds if they arrive
// reversed so the report is always usable.
function resolveRange(from, to) {
  const parsedEnd = parseDateOnly(to, true) ?? new Date();
  let start = parseDateOnly(from, false);

  if (!start) {
    start = new Date(parsedEnd);
    start.setDate(start.getDate() - (DEFAULT_RANGE_DAYS - 1));
    start.setHours(0, 0, 0, 0);
  }

  // Reversed bounds — swap them instead of returning an empty window
  if (start > parsedEnd) {
    const end = new Date(start);
    start = new Date(parsedEnd);
    start.setHours(0, 0, 0, 0);

    return { start, end };
  }

  return { start, end: parsedEnd };
}

// Local YYYY-MM-DD key for a Date (avoids the UTC shift of toISOString)
function dayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Every calendar day in the window, as YYYY-MM-DD keys
function enumerateDays(start, end) {
  const days = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= end && days.length < 1000) {
    days.push(dayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

// Aggregate the whole property-management picture for the dashboard.
// Everything is derived in one pass over the payments so the client only
// needs a single request.
//
// The same length window shifted back one period is computed alongside, so
// the client can show "revenue ↑12% vs prior period" without a second
// request.
async function getDashboardSummary(from, to) {
  const { start, end } = resolveRange(from, to);

  // Mirror window immediately before the selected one, same length.
  const spanMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - spanMs);

  const [payments, bills, owners, buildings] = await Promise.all([
    prisma.payment.findMany({
      include: {
        bill: {
          select: { bill_id: true, name: true, due_date: true, amount: true },
        },
      },
      orderBy: [{ paid_at: "asc" }, { payment_id: "asc" }],
    }),    prisma.bill.findMany({
      orderBy: { bill_id: "asc" },
    }),
    prisma.user.findMany({
      where: { type: "Unit Owner" },
      select: {
        user_id: true,
        name: true,
        email: true,
        unit_number: true,
        building: true,
        created_at: true,
      },
    }),
    prisma.building.findMany({
      orderBy: { building_id: "asc" },
    }),
  ]);

  const days = enumerateDays(start, end);
  const inRange = payments.filter((p) => {
    const paidAt = new Date(p.paid_at);

    return paidAt >= start && paidAt <= end;
  });

  // Lookup maps so the aggregation below stays linear
  const ownersByUnit = new Map(
    owners.filter((o) => o.unit_number).map((o) => [o.unit_number, o]),
  );
  const buildingsById = new Map(buildings.map((b) => [b.building_id, b.name]));
  const buildingNameFor = (buildingId) =>
    buildingsById.get(buildingId) ?? "Unassigned";

  // ---------- Revenue ----------
  const revenueByDay = new Map(days.map((d) => [d, 0]));
  const revenueByBill = new Map();
  const revenueByBuilding = new Map();
  const revenueByPayer = new Map();

  let totalRevenue = 0;

  for (const payment of inRange) {
    const amount = Number(payment.amount ?? 0);

    totalRevenue += amount;

    const key = dayKey(new Date(payment.paid_at));
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + amount);

    const billName = payment.bill?.name ?? "Unknown Bill";
    revenueByBill.set(billName, (revenueByBill.get(billName) ?? 0) + amount);

    // Payments carry the payer's unit number — resolve their building
    const owner = ownersByUnit.get(payment.paid_by_id);
    const buildingName = buildingNameFor(owner?.building);

    revenueByBuilding.set(
      buildingName,
      (revenueByBuilding.get(buildingName) ?? 0) + amount,
    );

    const payerKey = payment.paid_by_id ?? "Unknown";
    revenueByPayer.set(payerKey, (revenueByPayer.get(payerKey) ?? 0) + amount);
  }

  // Average daily revenue — only counting days inside the window
  const averageDailyRevenue = days.length ? totalRevenue / days.length : 0;

  // ---------- Outstanding (arrears) ----------
  // Uses the same value-based cycle rule as the payment model: a cycle is
  // settled when payments cover the full amount due — a partial payment
  // leaves the remainder outstanding instead of marking the cycle paid.
  const arrearsByBill = new Map();
  const arrearsByBuilding = new Map();
  const arrearsByOwner = new Map();

  // Group payments per unit number once, so the per-owner pass below is
  // not a nested scan over every payment.
  const paymentsByUnit = new Map();

  for (const p of payments) {
    if (!p.paid_by_id) continue;

    const list = paymentsByUnit.get(p.paid_by_id) ?? [];
    list.push(p);
    paymentsByUnit.set(p.paid_by_id, list);
  }

  let totalOutstanding = 0;
  let ownersInArrears = 0;

  for (const owner of owners) {
    if (!owner.unit_number) continue;

    const ownerPayments = (paymentsByUnit.get(owner.unit_number) ?? []).filter(
      (p) =>
        !owner.created_at || new Date(p.paid_at) >= new Date(owner.created_at),
    );

    let ownerOutstanding = 0;

    for (const bill of bills) {
      const { outstanding } = computeBillStanding({
        bill,
        owner,
        payments: ownerPayments.filter((p) => p.bill_id === bill.bill_id),
      });

      if (outstanding <= 0) continue;

      ownerOutstanding += outstanding;

      arrearsByBill.set(
        bill.name,
        (arrearsByBill.get(bill.name) ?? 0) + outstanding,
      );
    }

    if (ownerOutstanding > 0) {
      ownerOutstanding = Math.round(ownerOutstanding * 100) / 100;
      ownersInArrears += 1;

      totalOutstanding += ownerOutstanding;

      const buildingName = buildingNameFor(owner.building);

      arrearsByBuilding.set(
        buildingName,
        (arrearsByBuilding.get(buildingName) ?? 0) + ownerOutstanding,
      );

      arrearsByOwner.set(owner.unit_number, {
        unit_number: owner.unit_number,
        name: owner.name,
        email: owner.email,
        building: buildingName,
        outstanding: ownerOutstanding,
      });
    }
  }

  // ---------- Occupancy ----------
  // Derived from the users table so the count is self-correcting — a
  // denormalised counter can drift (e.g. when an owner's building is null
  // the counter misses them), but this always matches reality.
  const unitOwners = owners.length;
  const totalCapacity = buildings.reduce(
    (sum, b) => sum + (b.capacity ?? 0),
    0,
  );
  const totalOccupants = owners.filter((o) => o.building != null).length;
  const occupancyRate = totalCapacity
    ? (totalOccupants / totalCapacity) * 100
    : 0;

  // ---------- Upcoming dues ----------
  // The next deadline for each bill plus how many owners it hits
  const upcomingDues = bills
    .map((bill) => {
      const deadline = Payment.getNextCycleDeadline(bill.due_date);
      const ownersAffected = owners.filter((owner) => {
        if (!owner.unit_number) return false;

        const occurrences = Payment.countOccurrences(
          bill.due_date,
          owner.created_at,
          deadline,
        );

        return occurrences > 0;
      }).length;

      return {
        bill_id: bill.bill_id,
        name: bill.name,
        cycle: bill.due_date,
        amount: Number(bill.amount ?? 0),
        due_date: dayKey(deadline),
        owners_affected: ownersAffected,
        projected_amount: Number(bill.amount ?? 0) * ownersAffected,
      };
    })
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  // ---------- Recent activity ----------
  const recentPayments = [...payments]
    .sort((a, b) => {
      const diff = new Date(b.paid_at) - new Date(a.paid_at);

      return diff !== 0 ? diff : b.payment_id - a.payment_id;
    })
    .slice(0, 8)
    .map((payment) => {
      const owner = ownersByUnit.get(payment.paid_by_id);

      return {
        payment_id: payment.payment_id,
        bill_name: payment.bill?.name ?? "Unknown Bill",
        unit_number: payment.paid_by_id,
        owner_name: owner?.name ?? null,
        building: buildingNameFor(owner?.building),
        amount: Number(payment.amount ?? 0),
        paid_at: payment.paid_at,
      };
    });

  const toSortedMap = (map) =>
    [...map.entries()]
      .map(([name, amount]) => ({ name, amount: Number(amount) }))
      .sort((a, b) => b.amount - a.amount);

  // ---------- Comparison with the previous period ----------
  // Revenue and payment count for the mirror window that came right
  // before the selected one, with percentage deltas. Arrears cannot be
  // compared historically without replaying cycle deadlines per window,
  // so it is intentionally left out.
  const previousRevenue = payments
    .filter((p) => {
      const paidAt = new Date(p.paid_at);
      return paidAt >= prevStart && paidAt <= prevEnd;
    })
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

  const previousPaymentCount = payments.filter((p) => {
    const paidAt = new Date(p.paid_at);
    return paidAt >= prevStart && paidAt <= prevEnd;
  }).length;

  const percentDelta = (current, previous) =>
    previous > 0 ? ((current - previous) / previous) * 100 : null;

  const comparison = {
    previous: {
      from: dayKey(prevStart),
      to: dayKey(prevEnd),
      total_revenue: Math.round(previousRevenue * 100) / 100,
      payment_count: previousPaymentCount,
    },
    revenue_change_percent: percentDelta(totalRevenue, previousRevenue),
    payment_count_change_percent: percentDelta(
      inRange.length,
      previousPaymentCount,
    ),
  };

  return {
    range: {
      from: dayKey(start),
      to: dayKey(end),
      days: days.length,
    },
    comparison,
    metrics: {
      total_revenue: totalRevenue,
      payment_count: inRange.length,
      average_payment: inRange.length ? totalRevenue / inRange.length : 0,
      average_daily_revenue: averageDailyRevenue,
      total_outstanding: totalOutstanding,
      arrears_count: ownersInArrears,
      unit_owners: unitOwners,
      occupancy_rate: occupancyRate,
      total_capacity: totalCapacity,
      total_occupants: totalOccupants,
      building_count: buildings.length,
      bill_count: bills.length,
      collection_rate:
        totalRevenue + totalOutstanding > 0
          ? (totalRevenue / (totalRevenue + totalOutstanding)) * 100
          : 0,
    },
    revenue_by_day: days.map((day) => ({
      date: day,
      amount: revenueByDay.get(day) ?? 0,
    })),
    revenue_by_bill: toSortedMap(revenueByBill),
    revenue_by_building: toSortedMap(revenueByBuilding),
    arrears_by_bill: toSortedMap(arrearsByBill),
    arrears_by_building: toSortedMap(arrearsByBuilding),
    top_payers: [...revenueByPayer.entries()]
      .map(([unit_number, amount]) => ({
        unit_number,
        name: ownersByUnit.get(unit_number)?.name ?? null,
        building: buildingNameFor(ownersByUnit.get(unit_number)?.building),
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8),
    owners_in_arrears: [...arrearsByOwner.values()].sort(
      (a, b) => b.outstanding - a.outstanding,
    ),
    upcoming_dues: upcomingDues,
    recent_payments: recentPayments,
  };
}

module.exports = {
  getDashboardSummary,
  resolveRange,
  parseDateOnly,
  enumerateDays,
};
