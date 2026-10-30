const prisma = require("../lib/prisma");
const { buildSearchWhere } = require("../utils/pagination");
const {
  EPSILON,
  endOfMonth,
  getFirstDeadline,
  getNextDeadline,
  getNextDueDate,
  getNextCycleDeadline,
  countOccurrences,
  enumerateCycles,
  allocatePaymentsToCycles,
  cycleBalance,
  cyclePrice,
  lateFeeFor,
  computeBillStanding,
} = require("../utils/billing");

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

// A page of payments, newest first, optionally filtered by a search
// term (unit number, bill name or recorder name) and a date range.
// The search runs against stored values only — the bill name filter is
// resolved through the relation.
async function getPaymentsPaginated({
  page = 1,
  pageSize = 50,
  skip = 0,
  take = 50,
  search = "",
  bill_id = null,
  from = null,
  to = null,
} = {}) {
  const where = {
    ...(bill_id ? { bill_id: Number(bill_id) } : {}),
    ...(from || to
      ? {
          paid_at: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
    ...buildSearchWhere(search, { paid_by_id: "contains" }),
  };

  // Bill name and recorder name live on relations, so they need their
  // own OR arm merged into the search.
  const term = String(search ?? "").trim();

  if (term) {
    where.OR = [
      ...(where.OR ?? []),
      { bill: { name: { contains: term } } },
      {
        recordedBy: {
          OR: [{ name: { contains: term } }, { email: { contains: term } }],
        },
      },
    ];
  }

  const include = {
    bill: {
      select: { bill_id: true, name: true, due_date: true, amount: true },
    },
    recordedBy: {
      select: { user_id: true, name: true, email: true },
    },
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include,
      orderBy: [{ paid_at: "desc" }, { payment_id: "desc" }],
      skip,
      take,
    }),
    prisma.payment.count({ where }),
  ]);

  return { payments, total, page, pageSize };
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
    cycle_index: payment.cycle_index ?? null,
    amount_due: payment.amount_due ?? null,
    paid_at: payment.paid_at,
    created_at: payment.created_at,
    updated_at: payment.updated_at,
  };
}

// Validate and create a payment record.
// Accepts an optional paid_at (backdating) and an optional cycle_index —
// when omitted, the payment auto-allocates to the oldest unsettled cycle.
async function createPayment({
  bill_id,
  paid_by_id,
  recorded_by_id,
  amount,
  paid_at,
  cycle_index,
}) {
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

  // Backdating support: the payment date must fall inside the owner's
  // lifetime on the account and cannot be in the future.
  let paidAt = new Date();

  if (paid_at) {
    paidAt = new Date(paid_at);

    if (Number.isNaN(paidAt.getTime())) {
      throw new Error("Payment date is invalid");
    }

    const endOfPaidDay = new Date(
      paidAt.getFullYear(),
      paidAt.getMonth(),
      paidAt.getDate(),
      23,
      59,
      59,
      999,
    );

    if (endOfPaidDay > new Date()) {
      throw new Error("Payment date cannot be in the future");
    }

    if (payer.created_at && paidAt < new Date(payer.created_at)) {
      throw new Error(
        "Payment date cannot be before the owner's account was created",
      );
    }
  }

  // Work out which cycle this payment settles.
  const cycles = enumerateCycles(bill.due_date, payer.created_at, paidAt);
  const amountDue = cyclePrice(bill);
  let resolvedCycleIndex = null;

  if (cycles.length > 0) {
    if (
      cycle_index !== undefined &&
      cycle_index !== null &&
      cycle_index !== ""
    ) {
      const requested = Number(cycle_index);
      const match = cycles.find((c) => c.index === requested);

      if (!match) {
        throw new Error("Cycle does not exist for the chosen payment date");
      }

      resolvedCycleIndex = requested;
    } else {
      // Auto-allocate to the oldest cycle not yet fully covered.
      const ownerPayments = await prisma.payment.findMany({
        where: {
          paid_by_id: String(paid_by_id),
          bill_id: Number(bill_id),
          paid_at: { lte: paidAt },
        },
        select: {
          payment_id: true,
          amount: true,
          cycle_index: true,
          paid_at: true,
        },
      });

      const { covered } = allocatePaymentsToCycles(
        cycles,
        ownerPayments,
        amountDue,
      );

      const target = cycles.find(
        (c) => (covered.get(c.index) ?? 0) + 0.005 < amountDue,
      );

      resolvedCycleIndex = target ? target.index : null;
    }
  }

  const payment = await prisma.payment.create({
    data: {
      bill_id: Number(bill_id),
      paid_by_id: String(paid_by_id),
      recorded_by_id: String(recorded_by_id),
      amount: parsed,
      cycle_index: resolvedCycleIndex,
      amount_due: resolvedCycleIndex != null ? amountDue : null,
      paid_at: paidAt,
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
// matched by unit number and settled by VALUE — partial payments leave the
// cycle outstanding until the full amount is covered.
async function getBillStandingsForOwner(
  unit_number,
  created_at = null,
  asOf = new Date(),
) {
  const paidAfter = created_at ? new Date(created_at) : null;

  const payments = await prisma.payment.findMany({
    where: {
      paid_by_id: String(unit_number),
      ...(paidAfter ? { paid_at: { gte: paidAfter } } : {}),
    },
    select: {
      payment_id: true,
      bill_id: true,
      amount: true,
      cycle_index: true,
      paid_at: true,
    },
  });

  const bills = await prisma.bill.findMany({
    orderBy: { bill_id: "desc" },
  });

  return bills.map((bill) => {
    const standing = computeBillStanding({
      bill,
      owner: { created_at },
      payments: payments.filter((p) => p.bill_id === bill.bill_id),
      asOf,
    });

    const next_due =
      standing.occurrences === 0
        ? getNextDueDate(bill.due_date, created_at)
        : null;

    return {
      bill_id: bill.bill_id,
      name: bill.name,
      due_date: bill.due_date,
      amount: cyclePrice(bill),
      occurrences: standing.occurrences,
      paid_count: standing.paid_count,
      missed_count: standing.missed_count,
      outstanding: standing.outstanding,
      late_fees: standing.late_fees,
      // When the in-progress cycle becomes due (null if cycles already
      // elapsed, in which case the bill is either missed or settled)
      next_due: next_due ? next_due.toISOString() : null,
      status: standing.missed_count > 0 ? "missed" : "on_track",
    };
  });
}

// Bills the owner has not fully paid since their account was created.
// Cycles are settled by value, so a partially paid cycle still counts as
// unpaid. Payments are matched by unit number.
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
// Cycles are settled by value — a bill is unpaid when the money received
// since the owner's created_at does not cover every elapsed cycle.
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
    select: {
      paid_by_id: true,
      bill_id: true,
      amount: true,
      cycle_index: true,
      paid_at: true,
    },
  });

  return owners.map((owner) => {
    const ownerPayments = payments.filter(
      (p) =>
        p.paid_by_id === owner.unit_number &&
        (!owner.created_at ||
          new Date(p.paid_at) >= new Date(owner.created_at)),
    );

    const unpaid_bills = bills
      .map((bill) => {
        const standing = computeBillStanding({
          bill,
          owner,
          payments: ownerPayments.filter((p) => p.bill_id === bill.bill_id),
        });

        return { bill, standing };
      })
      .filter(({ standing }) => standing.missed_count > 0)
      .map(({ bill, standing }) => ({
        bill_id: bill.bill_id,
        name: bill.name,
        due_date: bill.due_date,
        amount: cyclePrice(bill),
        paid_count: standing.paid_count,
        missed_count: standing.missed_count,
        outstanding: standing.outstanding,
        late_fees: standing.late_fees,
      }));

    const total_outstanding = unpaid_bills.reduce(
      (sum, bill) => sum + Number(bill.outstanding ?? 0),
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
      total_outstanding: Math.round(total_outstanding * 100) / 100,
    };
  });
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
    select: {
      paid_by_id: true,
      paid_at: true,
      amount: true,
      cycle_index: true,
      payment_id: true,
    },
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

    // Cycles are settled by VALUE — a partial payment leaves the cycle
    // outstanding instead of counting as a fully paid cycle.
    const standing = computeBillStanding({
      bill,
      owner,
      payments: ownerPayments,
    });

    return {
      user_id: owner.user_id,
      name: owner.name,
      email: owner.email,
      unit_number: owner.unit_number,
      building: owner.building,
      created_at: owner.created_at,
      occurrences: standing.occurrences,
      paid_count: standing.paid_count,
      missed_count: standing.missed_count,
      outstanding: standing.outstanding,
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
    amount: cyclePrice(bill),
    owners: rows,
  };
}

module.exports = {
  getAllPayments,
  getPaymentsPaginated,
  createPayment,
  deletePayment,
  parsePayment,
  getUnpaidBillsForOwner,
  getBillStandingsForOwner,
  getIncomingBillsForOwner,
  getUnpaidBillsOverview,
  getBillOwnersReport,
  // Re-exported so the dashboard model can keep using Payment.countOccurrences
  // and Payment.getNextCycleDeadline without importing the util directly.
  countOccurrences,
  getNextDueDate,
  getFirstDeadline,
  getNextDeadline,
  endOfMonth,
  getNextCycleDeadline,
};
