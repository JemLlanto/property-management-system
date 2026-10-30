const prisma = require("../lib/prisma");

// List all payments with the related bill and users resolved
async function getAllPayments() {
  return prisma.payment.findMany({
    include: {
      bill: {
        select: { bill_id: true, name: true, due_date: true, amount: true },
      },
      recordedBy: {
        select: { user_id: true, name: true, email: true },
      },
    },
    orderBy: [{ paid_at: "desc" }, { payment_id: "desc" }],
  });
}

async function findById(payment_id) {
  return prisma.payment.findUnique({
    where: { payment_id: Number(payment_id) },
  });
}

// Flatten the payment for the client response.
// paid_by_id stores the payer's UNIT NUMBER (plain value, not a FK), so it
// survives the payer's account being edited or deleted. recorded_by_id is
// null once the recording account is deleted.
function parsePayment(payment) {
  return {
    payment_id: payment.payment_id,
    bill_id: payment.bill_id,
    bill_name: payment.bill?.name ?? null,
    bill_due_date: payment.bill?.due_date ?? null,
    paid_by_id: payment.paid_by_id ?? null,
    unit_number: payment.paid_by_id ?? null,
    owner_name: null,
    owner_email: null,
    owner_building: null,
    recorded_by_id: payment.recorded_by_id ?? null,
    recorded_by_name: payment.recordedBy?.name ?? null,
    recorded_by_email: payment.recordedBy?.email ?? null,
    amount: payment.amount,
    paid_at: payment.paid_at,
    created_at: payment.created_at,
    updated_at: payment.updated_at,
  };
}

// Validate and create a payment record
async function createPayment({ bill_id, paid_by_id, recorded_by_id, amount }) {
  const bill = await prisma.bill.findUnique({
    where: { bill_id: Number(bill_id) },
  });

  if (!bill) {
    throw new Error("Selected bill does not exist");
  }

  const payer = await prisma.user.findUnique({
    where: { unit_number: String(paid_by_id) },
  });

  if (!payer) {
    throw new Error("Selected unit number does not exist");
  }

  if (payer.type !== "Unit Owner") {
    throw new Error("Payments can only be recorded for unit owners");
  }

  const recorder = await prisma.user.findUnique({
    where: { user_id: String(recorded_by_id) },
  });

  if (!recorder) {
    throw new Error("Invalid recording user");
  }

  const parsed = Number(amount);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const payment = await prisma.payment.create({
    data: {
      bill_id: Number(bill_id),
      paid_by_id: String(paid_by_id),
      recorded_by_id: String(recorded_by_id),
      amount: parsed,
    },
    include: {
      bill: {
        select: { bill_id: true, name: true, due_date: true, amount: true },
      },
      recordedBy: {
        select: { user_id: true, name: true, email: true },
      },
    },
  });

  return parsePayment(payment);
}

async function deletePayment(payment_id) {
  const payment = await findById(payment_id);

  if (!payment) {
    return null;
  }

  await prisma.payment.delete({
    where: { payment_id: Number(payment_id) },
  });

  return payment;
}

// Full bill standing for an owner: every bill with how many cycles are
// completed, missed, and when the next payment becomes due. Payments are
// matched by unit number.
async function getBillStandingsForOwner(unit_number, created_at = null) {
  const paidAfter = created_at ? new Date(created_at) : null;

  const payments = await prisma.payment.findMany({
    where: {
      paid_by_id: String(unit_number),
      ...(paidAfter ? { paid_at: { gte: paidAfter } } : {}),
    },
    select: { bill_id: true },
  });

  const paidCounts = new Map();

  for (const p of payments) {
    paidCounts.set(p.bill_id, (paidCounts.get(p.bill_id) ?? 0) + 1);
  }

  const bills = await prisma.bill.findMany({
    orderBy: { bill_id: "desc" },
  });

  return bills.map((bill) => {
    const occurrences = countOccurrences(bill.due_date, created_at);
    const paid = paidCounts.get(bill.bill_id) ?? 0;

    // The next cycle completes this many days from the account creation,
    // based on the bill's cycle length.
    const next_due =
      occurrences === 0 ? getNextDueDate(bill.due_date, created_at) : null;

    return {
      bill_id: bill.bill_id,
      name: bill.name,
      due_date: bill.due_date,
      amount: bill.amount,
      occurrences,
      paid_count: Math.min(paid, occurrences),
      missed_count: Math.max(0, occurrences - paid),
      // When the in-progress cycle becomes due (null if cycles already
      // elapsed, in which case the bill is either missed or settled)
      next_due: next_due ? next_due.toISOString() : null,
      status: occurrences - paid > 0 ? "missed" : "on_track",
    };
  });
}

// Bills the owner has not fully paid since their account was created.
// Uses the same per-cycle rule as the bill details modal: a bill is unpaid
// when the owner has fewer payments than the number of cycle occurrences
// that elapsed since their created_at. Payments are matched by unit number.
async function getUnpaidBillsForOwner(unit_number, created_at = null) {
  const standings = await getBillStandingsForOwner(unit_number, created_at);

  return standings.filter((bill) => bill.missed_count > 0);
}

// Bills that are not missed yet — the cycle is still running. Shown as
// "incoming" so owners see what is coming up rather than an empty state.
async function getIncomingBillsForOwner(unit_number, created_at = null) {
  const standings = await getBillStandingsForOwner(unit_number, created_at);

  return standings.filter((bill) => bill.missed_count === 0);
}

// Every unit owner together with the bills they have not paid.
// Uses the same per-cycle rule as the bill details modal: a bill counts as
// unpaid when the owner has not paid every cycle occurrence since their
// account was created.
async function getUnpaidBillsOverview() {
  const owners = await prisma.user.findMany({
    where: { type: "Unit Owner" },
    select: {
      user_id: true,
      name: true,
      email: true,
      unit_number: true,
      building: true,
      created_at: true,
    },
    orderBy: { created_at: "desc" },
  });

  if (owners.length === 0) {
    return [];
  }

  const bills = await prisma.bill.findMany({
    orderBy: { bill_id: "desc" },
  });

  const payments = await prisma.payment.findMany({
    select: { paid_by_id: true, bill_id: true, paid_at: true },
  });

  return owners.map((owner) => {
    const paidAfter = owner.created_at ? new Date(owner.created_at) : null;

    // Count payments per bill, only those on/after the owner's created_at.
    // Payments are matched by unit number.
    const paidCounts = new Map();

    for (const p of payments) {
      if (p.paid_by_id !== owner.unit_number) continue;
      if (paidAfter && new Date(p.paid_at) < paidAfter) continue;

      paidCounts.set(p.bill_id, (paidCounts.get(p.bill_id) ?? 0) + 1);
    }

    const unpaid_bills = bills
      .filter((bill) => {
        const occurrences = countOccurrences(bill.due_date, owner.created_at);
        const paid = paidCounts.get(bill.bill_id) ?? 0;

        return paid < occurrences;
      })
      .map((bill) => ({
        bill_id: bill.bill_id,
        name: bill.name,
        due_date: bill.due_date,
        amount: bill.amount,
        paid_count: Math.min(
          paidCounts.get(bill.bill_id) ?? 0,
          countOccurrences(bill.due_date, owner.created_at),
        ),
        missed_count: Math.max(
          0,
          countOccurrences(bill.due_date, owner.created_at) -
            (paidCounts.get(bill.bill_id) ?? 0),
        ),
      }));

    const total_outstanding = unpaid_bills.reduce(
      (sum, bill) => sum + Number(bill.amount) * bill.missed_count,
      0,
    );

    return {
      user_id: owner.user_id,
      name: owner.name,
      email: owner.email,
      unit_number: owner.unit_number,
      building: owner.building,
      created_at: owner.created_at,
      unpaid_bills,
      unpaid_count: unpaid_bills.length,
      total_outstanding,
    };
  });
}

// Billing cycles are anchored to calendar deadlines rather than to the
// account creation date:
//   Weekly     → every Sunday
//   Half-Month → the 15th and the last day of the month
//   Monthly    → the last day of the month
//   Quarterly  → Mar 31, Jun 30, Sep 30, Dec 31
// The partial period containing the account creation date does NOT count —
// the first deadline is the end of the owner's first FULL period.
// E.g. created Thu Oct 29 → first weekly deadline Sun Nov 8 (the week Oct
// 29–Nov 1 is partial), first monthly deadline Nov 30 (October is partial).

// The last day of the given month (month is 0-based, like Date)
function endOfMonth(year, month) {
  return new Date(year, month + 1, 0, 23, 59, 59, 999);
}

// The first deadline for an owner created at the given date — the end of
// their first full billing period.
function getFirstDeadline(cycle, created) {
  const day = created.getDate();
  const month = created.getMonth();
  const year = created.getFullYear();
  const dow = created.getDay(); // 0 = Sunday

  switch (cycle) {
    case "Weekly": {
      // The week containing the creation date is partial unless the owner
      // was created on a Sunday. The deadline is the following Sunday.
      const daysToNextSunday = dow === 0 ? 7 : 7 - dow;
      return new Date(year, month, day + daysToNextSunday + 7, 23, 59, 59, 999);
    }
    case "Half-Month": {
      // Periods run 1–15 and 16–end of month.
      if (day === 1) return new Date(year, month, 15, 23, 59, 59, 999);
      if (day <= 15) return endOfMonth(year, month);
      if (day === 16) return endOfMonth(year, month);
      return new Date(year, month + 1, 15, 23, 59, 59, 999);
    }
    case "Monthly": {
      // The creation month is partial unless created on the 1st.
      if (day === 1) return endOfMonth(year, month);
      return endOfMonth(year, month + 1);
    }
    case "Quarterly": {
      // Quarters end Mar 31, Jun 30, Sep 30, Dec 31.
      const quarterEnd = Math.floor(month / 3) * 3 + 2;
      // Created on the first day of a quarter → that quarter ends first
      if (day === 1 && month === quarterEnd - 2) {
        return endOfMonth(year, quarterEnd);
      }
      // Otherwise the next quarter end comes first
      const nextQuarterEnd = quarterEnd + 3;
      return endOfMonth(
        nextQuarterEnd > 11 ? year + 1 : year,
        (nextQuarterEnd % 12 + 12) % 12,
      );
    }
    default:
      return endOfMonth(year, month + 1);
  }
}

// The deadline that follows the given one for the cycle
function getNextDeadline(cycle, deadline) {
  const y = deadline.getFullYear();
  const m = deadline.getMonth();
  const d = deadline.getDate();

  switch (cycle) {
    case "Weekly": {
      const next = new Date(deadline);
      next.setDate(next.getDate() + 7);
      return next;
    }
    case "Half-Month": {
      // 15th ↔ end of month
      if (d === 15) return endOfMonth(y, m);
      return new Date(y, m + 1, 15, 23, 59, 59, 999);
    }
    case "Monthly":
      return endOfMonth(y, m + 1);
    case "Quarterly": {
      // Step to the next quarter end (Mar/Jun/Sep/Dec last day)
      const quarterEnds = [2, 5, 8, 11]; // 0-based months
      const idx = quarterEnds.indexOf(m);

      if (idx === -1 || idx === 3) {
        return endOfMonth(y + 1, 2);
      }
      return endOfMonth(y, quarterEnds[idx + 1]);
    }
    default:
      return endOfMonth(y, m + 1);
  }
}

// When the currently running cycle completes — the first deadline still in
// the future. If today is the deadline, that date is returned (due today).
function getNextDueDate(cycle, created) {
  const start = created ? new Date(created) : null;

  if (!start || Number.isNaN(start.getTime())) {
    return null;
  }

  let deadline = getFirstDeadline(cycle, start);
  const now = new Date();
  const nowEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  for (let i = 0; i < 600 && deadline; i += 1) {
    if (deadline >= nowEnd) {
      return deadline;
    }
    deadline = getNextDeadline(cycle, deadline);
  }

  return null;
}

// Number of billing cycles that have fully elapsed between two dates.
// A cycle only counts once its deadline DATE has been reached — the cycle
// currently in progress is not due yet, so it cannot be missed. E.g. a
// weekly bill for an account created Thu Oct 29 has 0 occurrences on Oct
// 30; the first deadline is Sunday Nov 8, and it counts on Nov 8 itself.
function countOccurrences(cycle, fromDate, toDate = new Date()) {
  const start = fromDate ? new Date(fromDate) : null;

  if (!start || Number.isNaN(start.getTime())) {
    return 0;
  }

  const end =
    toDate && !Number.isNaN(new Date(toDate).getTime())
      ? new Date(toDate)
      : new Date();

  // Compare by calendar date: the deadline counts on its own day
  const endDate = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
    23,
    59,
    59,
    999,
  );

  let deadline = getFirstDeadline(cycle, start);
  let count = 0;

  for (let i = 0; i < 600 && deadline; i += 1) {
    if (deadline > endDate) {
      break;
    }

    count += 1;
    deadline = getNextDeadline(cycle, deadline);
  }

  return count;
}

// Per-bill breakdown for every unit owner: how many cycles have elapsed
// since the owner was created, how many of those they paid, and how many
// they missed.
async function getBillOwnersReport(bill_id) {
  const bill = await prisma.bill.findUnique({
    where: { bill_id: Number(bill_id) },
  });

  if (!bill) {
    return null;
  }

  const owners = await prisma.user.findMany({
    where: { type: "Unit Owner" },
    select: {
      user_id: true,
      name: true,
      email: true,
      unit_number: true,
      building: true,
      created_at: true,
    },
    orderBy: { unit_number: "asc" },
  });

  const payments = await prisma.payment.findMany({
    where: { bill_id: Number(bill_id) },
    select: { paid_by_id: true, paid_at: true, amount: true },
  });

  const paymentsByOwner = new Map();

  for (const payment of payments) {
    // Skip payments whose owner was deleted (paid_by_id is null)
    if (!payment.paid_by_id) continue;

    const list = paymentsByOwner.get(payment.paid_by_id) ?? [];
    list.push(payment);
    paymentsByOwner.set(payment.paid_by_id, list);
  }

  const rows = owners.map((owner) => {
    // Payments are matched by unit number
    const ownerPayments = (paymentsByOwner.get(owner.unit_number) ?? []).filter(
      (p) =>
        !owner.created_at || new Date(p.paid_at) >= new Date(owner.created_at),
    );

    const occurrences = countOccurrences(bill.due_date, owner.created_at);

    // Every payment covers one cycle occurrence
    const paid_count = Math.min(ownerPayments.length, occurrences);
    const missed_count = Math.max(0, occurrences - ownerPayments.length);

    return {
      user_id: owner.user_id,
      name: owner.name,
      email: owner.email,
      unit_number: owner.unit_number,
      building: owner.building,
      created_at: owner.created_at,
      occurrences,
      paid_count,
      missed_count,
      total_paid: ownerPayments.reduce(
        (sum, p) => sum + Number(p.amount ?? 0),
        0,
      ),
    };
  });

  // Default ordering: most misses first, then unit number
  rows.sort((a, b) => {
    if (b.missed_count !== a.missed_count) {
      return b.missed_count - a.missed_count;
    }

    return (a.unit_number ?? "").localeCompare(b.unit_number ?? "", undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  return {
    bill_id: bill.bill_id,
    bill_name: bill.name,
    due_date: bill.due_date,
    amount: bill.amount,
    owners: rows,
  };
}

module.exports = {
  getAllPayments,
  createPayment,
  deletePayment,
  parsePayment,
  getUnpaidBillsForOwner,
  getBillStandingsForOwner,
  getIncomingBillsForOwner,
  getUnpaidBillsOverview,
  getBillOwnersReport,
  countOccurrences,
  getNextDueDate,
};
