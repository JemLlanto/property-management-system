const Payment = require("../models/payment.model");
const User = require("../models/user.model");

// List all payments
async function getPayments(req, res) {
  try {
    const payments = await Payment.getAllPayments();

    return res.json({
      success: true,
      payments: payments.map(Payment.parsePayment),
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

    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      payment,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
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

    return res.json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// Bill standings for a single unit owner (used by the user details modal):
// missed bills plus incoming bills whose cycle has not completed yet
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
      return res.json({ success: true, unpaid_bills: [], incoming_bills: [] });
    }

    // Payments are matched by unit number
    const [unpaid_bills, incoming_bills] = await Promise.all([
      Payment.getUnpaidBillsForOwner(owner.unit_number, owner.created_at),
      Payment.getIncomingBillsForOwner(owner.unit_number, owner.created_at),
    ]);

    return res.json({ success: true, unpaid_bills, incoming_bills });
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
};
