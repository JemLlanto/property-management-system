const prisma = require("../lib/prisma");
const {
  computeBillStanding,
  getNextCycleDeadline,
} = require("../utils/billing");

// Notifications / reminders.
//
// The dashboard's upcoming_dues already knows which bills hit which
// owners next — this turns that raw material into a per-owner reminder
// list that an email job (or any consumer) can send out directly.
// There is deliberately no email transport here: this module only
// produces the structured "who owes what by when" payload.

// How many days ahead of a deadline a reminder becomes relevant.
const REMINDER_WINDOW_DAYS = 7;

// Build every owner's reminders as of now.
//
// For each unit owner this returns the bills that are either already
// overdue (missed cycles with the outstanding amount) or due within the
// reminder window (the running cycle's next deadline).
async function getReminders({ windowDays = REMINDER_WINDOW_DAYS } = {}) {
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

  const bills = await prisma.bill.findMany({
    orderBy: { bill_id: "asc" },
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

  const windowEnd = new Date();
  windowEnd.setDate(windowEnd.getDate() + Number(windowDays));

  const reminders = [];

  for (const owner of owners) {
    if (!owner.unit_number) continue;

    const ownerPayments = payments.filter(
      (p) =>
        p.paid_by_id === owner.unit_number &&
        (!owner.created_at ||
          new Date(p.paid_at) >= new Date(owner.created_at)),
    );

    const overdue = [];
    const upcoming = [];

    for (const bill of bills) {
      const standing = computeBillStanding({
        bill,
        owner,
        payments: ownerPayments.filter((p) => p.bill_id === bill.bill_id),
      });

      if (standing.missed_count > 0) {
        overdue.push({
          bill_id: bill.bill_id,
          name: bill.name,
          cycle: bill.due_date,
          amount_due: Number(bill.amount),
          missed_count: standing.missed_count,
          outstanding: standing.outstanding,
        });
        continue;
      }

      // Already paid ahead — nothing to remind about.
      if (standing.running_paid) continue;

      // Fully paid so far — remind only when the running cycle's
      // deadline falls inside the reminder window.
      const deadline = getNextCycleDeadline(bill.due_date);

      if (deadline && deadline <= windowEnd) {
        upcoming.push({
          bill_id: bill.bill_id,
          name: bill.name,
          cycle: bill.due_date,
          amount_due: Number(bill.amount),
          due_date: deadline.toISOString().split("T")[0],
        });
      }
    }

    // Owners with nothing overdue and nothing due soon are skipped —
    // a notification list full of "all good" entries is noise.
    if (overdue.length === 0 && upcoming.length === 0) continue;

    const total_outstanding = overdue.reduce(
      (sum, bill) => sum + bill.outstanding,
      0,
    );

    reminders.push({
      user_id: owner.user_id,
      name: owner.name,
      email: owner.email,
      unit_number: owner.unit_number,
      building: owner.building,
      has_email: Boolean(owner.email && String(owner.email).includes("@")),
      overdue_bills: overdue,
      upcoming_bills: upcoming,
      total_outstanding: Math.round(total_outstanding * 100) / 100,
    });
  }

  // Sort: biggest debt first so the most urgent reminders head the list.
  reminders.sort((a, b) => b.total_outstanding - a.total_outstanding);

  return {
    generated_at: new Date().toISOString(),
    window_days: Number(windowDays),
    reminder_count: reminders.length,
    reminders,
  };
}

module.exports = { getReminders, REMINDER_WINDOW_DAYS };
