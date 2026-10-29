const Bill = require("../models/bill.model");

// List all bills
async function getBills(req, res) {
  try {
    const bills = await Bill.getAllBills();

    return res.json({ success: true, bills });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Create a bill
async function createBill(req, res) {
  try {
    const { name, due_date, amount } = req.body;

    const bill = await Bill.createBill({ name, due_date, amount });

    return res.status(201).json({
      success: true,
      message: "Bill created successfully",
      bill,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// Update a bill
async function updateBill(req, res) {
  try {
    const { bill_id } = req.params;
    const { name, due_date, amount } = req.body;

    const bill = await Bill.updateBill(bill_id, { name, due_date, amount });

    return res.json({
      success: true,
      message: "Bill updated successfully",
      bill,
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Bill not found" });
    }

    return res.status(400).json({ success: false, message: err.message });
  }
}

// Delete a bill
async function deleteBill(req, res) {
  try {
    const { bill_id } = req.params;

    const bill = await Bill.deleteBill(bill_id);

    if (!bill) {
      return res
        .status(404)
        .json({ success: false, message: "Bill not found" });
    }

    return res.json({
      success: true,
      message: "Bill deleted successfully",
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  getBills,
  createBill,
  updateBill,
  deleteBill,
};
