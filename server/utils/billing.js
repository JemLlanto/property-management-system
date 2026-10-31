// Pure billing math shared by the payment model and the dashboard model.
//
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
        ((nextQuarterEnd % 12) + 12) % 12,
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

// The next calendar deadline for a cycle, independent of any account.
// The deadlines are anchored to the calendar (Sundays, the 15th and the last
// day of the month, quarter ends), so every owner sees the same cycle
// boundaries once their first partial period is behind them.
function getNextCycleDeadline(cycle, from = new Date()) {
  const year = from.getFullYear();
  const month = from.getMonth();
  const day = from.getDate();

  // The end of today — a deadline that falls today still counts.
  const endOfToday = new Date(year, month, day, 23, 59, 59, 999);

  switch (cycle) {
    case "Weekly": {
      // Every Sunday. Today counts when it is a Sunday.
      const offset = (7 - from.getDay()) % 7;
      return new Date(year, month, day + offset, 23, 59, 59, 999);
    }
    case "Half-Month": {
      // The 15th and the last day of the month.
      const mid = new Date(year, month, 15, 23, 59, 59, 999);

      if (mid >= endOfToday) return mid;

      const last = endOfMonth(year, month);

      if (last >= endOfToday) return last;

      return new Date(year, month + 1, 15, 23, 59, 59, 999);
    }
    case "Monthly": {
      // The last day of the month.
      const last = endOfMonth(year, month);

      if (last >= endOfToday) return last;

      return endOfMonth(year, month + 1);
    }
    case "Quarterly": {
      // Mar 31, Jun 30, Sep 30, Dec 31.
      const quarterEnds = [2, 5, 8, 11]; // 0-based months

      for (const qMonth of quarterEnds) {
        const end = endOfMonth(year, qMonth);

        if (end >= endOfToday) return end;
      }

      return endOfMonth(year + 1, 2);
    }
    default:
      return endOfMonth(year, month + 1);
  }
}

// Number of billing cycles that have fully elapsed between two dates.
// A cycle only counts once its deadline DATE has been reached — the cycle
// currently in progress is not due yet, so it cannot be missed. E.g. a
// weekly bill for an account created Thu Oct 29 has 0 occurrences on Oct
// 30; the first deadline is Sunday Nov 8, and it counts on Nov 8 itself.
function countOccurrences(cycle, fromDate, toDate = new Date()) {
  return enumerateCycles(cycle, fromDate, toDate).length;
}

// Every elapsed billing cycle for an owner, oldest first, as
// { index, deadline }. Index 0 is the owner's first full billing period.
function enumerateCycles(cycle, fromDate, toDate = new Date()) {
  const start = fromDate ? new Date(fromDate) : null;

  if (!start || Number.isNaN(start.getTime())) {
    return [];
  }

  const end = new Date(toDate);
  const endDate = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
    23,
    59,
    59,
    999,
  );

  const cycles = [];
  let deadline = getFirstDeadline(cycle, start);

  for (
    let index = 0;
    index < 600 && deadline && deadline <= endDate;
    index += 1
  ) {
    cycles.push({ index, deadline: new Date(deadline) });
    deadline = getNextDeadline(cycle, deadline);
  }

  return cycles;
}

// The billing cycle currently in progress — the first deadline still in
// the future for this owner, as { index, deadline }. Index continues the
// numbering of enumerateCycles, so a standing that combines elapsed and
// running cycles stays consistent.
//
// Returns null when the owner has no creation date to anchor cycles to.
function enumerateRunningCycle(cycle, fromDate, asOf = new Date()) {
  const elapsed = enumerateCycles(cycle, fromDate, asOf);
  const last = elapsed[elapsed.length - 1];

  // No elapsed cycles yet: the first deadline IS the running cycle
  // (it has not passed, so the period is still open).
  const deadline = last ? getNextDeadline(cycle, last.deadline) : getFirstDeadline(cycle, new Date(fromDate));

  if (!deadline) return null;

  return { index: elapsed.length, deadline };
}

// Centavos of slack when comparing money — floating point sums like
// 0.1 + 0.2 must not read as "not yet paid".
const EPSILON = 0.005;

// Decide which billing cycle each payment settles. Payments with an
// explicit cycle_index keep it; legacy payments (cycle_index null —
// recorded before cycles were tracked) are allocated chronologically to
// the first cycle not yet fully covered, so overpayments cascade forward
// to settle later cycles.
function allocatePaymentsToCycles(cycles, payments, amountDue) {
  const covered = new Map(cycles.map((c) => [c.index, 0]));
  const assignment = new Map(); // payment_id -> cycle_index | null

  const pinned = payments.filter((p) => p.cycle_index != null);
  const legacy = payments
    .filter((p) => p.cycle_index == null)
    .sort((a, b) => new Date(a.paid_at) - new Date(b.paid_at));

  for (const p of pinned) {
    if (covered.has(p.cycle_index)) {
      covered.set(p.cycle_index, covered.get(p.cycle_index) + Number(p.amount));
      assignment.set(p.payment_id, p.cycle_index);
    } else {
      // Points at a cycle that no longer exists (e.g. the bill's cycle
      // changed) — treat it as an unassigned lump sum.
      assignment.set(p.payment_id, null);
    }
  }

  for (const p of legacy) {
    // Fill the oldest cycle first; once it is settled the remainder
    // cascades to the next, and surplus past the last elapsed cycle is
    // counted as overpayment.
    let remainder = Number(p.amount);
    let firstCycle = null;

    for (const cycle of cycles) {
      if (remainder <= EPSILON) break;

      const balance = cycleBalance(amountDue, covered.get(cycle.index));

      if (balance <= EPSILON) continue;

      const applied = Math.min(remainder, balance);
      covered.set(cycle.index, covered.get(cycle.index) + applied);
      remainder -= applied;

      // A payment can span several cycles — it is recorded against the
      // first one it settles.
      if (firstCycle === null) firstCycle = cycle.index;
    }

    assignment.set(p.payment_id, firstCycle);
  }

  return { covered, assignment };
}

// How much is still owed for a single cycle given everything paid to it.
function cycleBalance(amountDue, paid) {
  return Math.max(0, Number(amountDue) - Number(paid ?? 0));
}

// The amount a single cycle actually costs, after the bill's discount.
//
// A bill's `amount` is the list price. `discount_percent` reduces every
// cycle of that bill by the given percentage, so 10 means 10% off.
function cyclePrice(bill) {
  const amount = Number(bill.amount ?? 0);
  const discount = Number(bill.discount_percent ?? 0);

  if (!discount) return amount;

  const discounted = amount * (1 - discount / 100);

  // Round to centavos — money, not percentages.
  return Math.round(discounted * 100) / 100;
}

// The late fee for one missed cycle of a bill.
//
// `late_fee_type` is "fixed" (a flat amount) or "percent" (a percentage
// of the discounted cycle price). `late_fee_grace_days` is the number of
// days after the cycle deadline during which no fee is charged — a fee
// only applies once the grace period has elapsed.
function lateFeeFor(bill, cycleDeadline, asOf = new Date()) {
  const feeType = bill.late_fee_type === "percent" ? "percent" : "fixed";
  const graceDays = Number(bill.late_fee_grace_days ?? 0);
  const rawFee = Number(bill.late_fee_amount ?? 0);

  if (!rawFee || graceDays < 0) return 0;

  // The fee starts once the deadline plus the grace period has passed.
  const chargeFrom = new Date(cycleDeadline);
  chargeFrom.setDate(chargeFrom.getDate() + graceDays);

  const endOfChargeDay = new Date(
    chargeFrom.getFullYear(),
    chargeFrom.getMonth(),
    chargeFrom.getDate(),
    23,
    59,
    59,
    999,
  );

  if (asOf < endOfChargeDay) return 0;

  if (feeType === "percent") {
    return Math.round(cyclePrice(bill) * (rawFee / 100) * 100) / 100;
  }

  return Math.round(rawFee * 100) / 100;
}

// The standing of one owner on one bill.
//
// Cycles are settled by VALUE, not by payment count: a ₱50 payment
// against a ₱1,000 bill leaves that cycle unpaid. This is what makes
// partial payments report arrears correctly instead of silently marking a
// cycle as settled.
//
// `asOf` is the moment the standing is evaluated at — the cycles that had
// elapsed by then are the ones that can be missed. It defaults to now.
//
// ADVANCE PAYMENTS: money paid for a cycle that has not come due yet is
// an advance. The surplus left after every elapsed cycle is settled is
// carried as `credit`, and that credit is applied to the running cycle.
// So an owner who paid a full cycle in advance has a running cycle that
// is already settled — it is not "incoming", and they do not get billed
// for it again.
//
// Returns the number of elapsed cycles, how many of them are fully paid,
// how many are still owed, the outstanding amount (including late fees),
// and the advance credit not yet consumed by an elapsed cycle.
function computeBillStanding({ bill, owner, payments, asOf = new Date() }) {
  const amountDue = cyclePrice(bill);
  const cycles = enumerateCycles(bill.due_date, owner.created_at, asOf);
  const { covered } = allocatePaymentsToCycles(cycles, payments, amountDue);

  let paid_count = 0;
  let missed_count = 0;
  let outstanding = 0;
  let late_fees = 0;

  for (const cycle of cycles) {
    const balance = cycleBalance(amountDue, covered.get(cycle.index));

    if (balance <= EPSILON) {
      paid_count += 1;
      continue;
    }

    missed_count += 1;

    // A late fee is charged per missed cycle, once the grace period has
    // elapsed. It is added on top of the unpaid cycle amount.
    const fee = lateFeeFor(bill, cycle.deadline, asOf);

    outstanding += balance + fee;
    late_fees += fee;
  }

  // Money paid beyond what the elapsed cycles required. This is the
  // owner's advance credit — it pays for the running cycle next.
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  const committed = cycles.reduce(
    (sum, cycle) =>
      sum + Math.min(Number(covered.get(cycle.index) ?? 0), amountDue),
    0,
  );

  const credit = Math.max(0, totalPaid - committed);

  // The cycle currently running. It is not yet due, so it can never be
  // "missed" — but advance credit may already have settled it.
  const running = enumerateRunningCycle(bill.due_date, owner.created_at, asOf);

  let running_paid = false;
  let running_credit = 0;

  if (running) {
    // Credit covers the running cycle when there is enough of it left.
    running_credit = Math.min(credit, amountDue);
    running_paid = running_credit + EPSILON >= amountDue;
  }

  // Credit that goes beyond the running cycle is still unspent credit
  // (it will cover the cycle after that).
  const remaining_credit = Math.max(0, credit - running_credit);

  return {
    occurrences: cycles.length,
    paid_count,
    missed_count,
    outstanding: Math.round(outstanding * 100) / 100,
    late_fees: Math.round(late_fees * 100) / 100,
    // Advance credit available to settle the running cycle
    credit: Math.round(credit * 100) / 100,
    // The running (not yet due) cycle and whether credit has settled it
    running_cycle: running,
    running_paid,
    running_credit: Math.round(running_credit * 100) / 100,
    // Credit still unspent after the running cycle
    remaining_credit: Math.round(remaining_credit * 100) / 100,
    // Backwards-compatible alias
    overpaid: Math.round(remaining_credit * 100) / 100,
    cycles,
    covered,
  };
}

module.exports = {
  EPSILON,
  endOfMonth,
  getFirstDeadline,
  getNextDeadline,
  getNextDueDate,
  getNextCycleDeadline,
  countOccurrences,
  enumerateCycles,
  enumerateRunningCycle,
  allocatePaymentsToCycles,
  cycleBalance,
  cyclePrice,
  lateFeeFor,
  computeBillStanding,
};
