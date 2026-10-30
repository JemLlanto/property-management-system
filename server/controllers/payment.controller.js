const Payment = require("../models/payment.model");
const User = require("../models/user.model");
const { recordAudit, getAuditLogs } = require("../services/audit.service");
const { parsePagination, paginationMeta } = require("../utils/pagination");

// List payments. Supports ?page=&pageSize=&search=&bill_id=&from=&to= —
// omitting all of them returns the full list (legacy behaviour).
async function getPayments(req, res) {
  try {
    const supportsPagination =
      req.query.page !== undefined ||
      req.query.search !== undefined ||
      req.query.bill_id !== undefined ||
      req.query.from !== undefined ||
      req.query.to !== undefined ||
      req.query.sort !== undefined;

    if (!supportsPagination) {
      const payments = await Payment.getAllPayments();

      return res.json({
        success: true,
        payments: payments.map(Payment.parsePayment),
      });
    }

    const { page, pageSize, skip, take } = parsePagination(req.query);

    const result = await Payment.getPaymentsPaginated({
      page,
      pageSize,
      skip,
      take,
      search: req.query.search,
      bill_id: req.query.bill_id,
      from: req.query.from,
      to: req.query.to,
      sort: req.query.sort,
      order: req.query.order,
    });

    return res.json({
      success: true,
      payments: result.payments.map(Payment.parsePayment),
      ...paginationMeta(result),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Record a payment
async function createPayment(req, res) {
  try {
    const { bill_id, paid_by_id, amount, paid_at, cycle_index } = req.body;

    const payment = await Payment.createPayment({
      bill_id,
      paid_by_id,
      recorded_by_id: req.user.user_id,
      amount,
      paid_at,
      cycle_index,
    });

    await recordAudit({
      actor: req.user,
      action: "create",
      entity_type: "payment",
      entity_id: payment.payment_id,
      summary: `Payment recorded for unit ${paid_by_id} — ₱${Number(
        amount,
      ).toFixed(2)} (${payment.bill_name ?? "bill"})`,
      after: payment,
    });

    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      payment,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// Append-only trail of payment creates and deletes — money moves must
// always be reconstructable, including who did it and when.
async function getPaymentAuditTrail(req, res) {
  try {
    const { page, pageSize, entity_type, actor_id } = req.query;

    const result = await getAuditLogs({
      page,
      pageSize,
      entity_type,
      actor_id,
    });

    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
// Delete a payment record
async function deletePayment(req, res) {
  try {
    const { payment_id } = req.params;

    const payment = await Payment.deletePayment(payment_id);

    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    await recordAudit({
      actor: req.user,
      action: "delete",
      entity_type: "payment",
      entity_id: payment_id,
      summary: `Payment deleted for unit ${payment.paid_by_id ?? "—"} — ₱${Number(
        payment.amount,
      ).toFixed(2)}`,
      before: payment,
    });

    return res.json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// Bill standings for a single unit owner (used by the user details modal):
// missed bills, incoming bills whose cycle has not completed yet, and
// bills already settled ahead by advance payments.
async function getUnpaidBills(req, res) {
  try {
    const { user_id } = req.params;

    const owner = await User.findById(user_id);

    if (!owner) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!owner.unit_number) {
      return res.json({
        success: true,
        unpaid_bills: [],
        incoming_bills: [],
        paid_ahead_bills: [],
      });
    }

    // Payments are matched by unit number. The standings carry the
    // status of every bill, so paid-ahead is just a filter on them.
    const [unpaid_bills, incoming_bills, all_standings] = await Promise.all([
      Payment.getUnpaidBillsForOwner(owner.unit_number, owner.created_at),
      Payment.getIncomingBillsForOwner(owner.unit_number, owner.created_at),
      Payment.getBillStandingsForOwner(owner.unit_number, owner.created_at),
    ]);

    // Bills whose running cycle has been settled by advance credit.
    const paid_ahead_bills = all_standings.filter(
      (bill) => bill.missed_count === 0 && bill.running_paid,
    );

    return res.json({
      success: true,
      unpaid_bills,
      incoming_bills,
      paid_ahead_bills,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// Overview of every unit owner with their unpaid bills
async function getUnpaidOverview(req, res) {
  try {
    const owners = await Payment.getUnpaidBillsOverview();

    return res.json({ success: true, owners });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Per-bill breakdown of every unit owner's payment standing (missed cycles)
async function getBillOwners(req, res) {
  try {
    const { bill_id } = req.params;

    const report = await Payment.getBillOwnersReport(bill_id);

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Bill not found" });
    }

    return res.json({ success: true, ...report });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  getPayments,
  createPayment,
  deletePayment,
  getUnpaidBills,
  getUnpaidOverview,
  getBillOwners,
  getPaymentAuditTrail,
};
