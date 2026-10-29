const Payment = require("../models/payment.model");

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
    const { bill_id, paid_by_id, amount } = req.body;

    const payment = await Payment.createPayment({
      bill_id,
      paid_by_id,
      recorded_by_id: req.user.user_id,
      amount,
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

module.exports = {
  getPayments,
  createPayment,
  deletePayment,
};
