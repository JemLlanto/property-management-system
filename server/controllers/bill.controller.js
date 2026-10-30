const Bill = require("../models/bill.model");
const { recordAudit } = require("../services/audit.service");
const { parsePagination, paginationMeta } = require("../utils/pagination");

// List bills. Supports ?page=&pageSize=&search=&cycle= — omitting all of
// them returns the full list (legacy behaviour for dropdowns).
async function getBills(req, res) {
  try {
    const supportsPagination =
      req.query.page !== undefined ||
      req.query.search !== undefined ||
      req.query.cycle !== undefined;

    if (!supportsPagination) {
      const bills = await Bill.getAllBills();

      return res.json({ success: true, bills });
    }

    const { page, pageSize, skip, take } = parsePagination(req.query);

    const result = await Bill.getBillsPaginated({
      page,
      pageSize,
      skip,
      take,
      search: req.query.search,
      cycle: req.query.cycle,
    });

    return res.json({
      success: true,
      bills: result.bills,
      ...paginationMeta(result),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Create a bill
async function createBill(req, res) {
  try {
    const {
      name,
      due_date,
      amount,
      discount_percent,
      late_fee_amount,
      late_fee_type,
      late_fee_grace_days,
    } = req.body;

    const bill = await Bill.createBill({
      name,
      due_date,
      amount,
      discount_percent,
      late_fee_amount,
      late_fee_type,
      late_fee_grace_days,
    });

    await recordAudit({
      actor: req.user,
      action: "create",
      entity_type: "bill",
      entity_id: bill.bill_id,
      summary: `Bill "${bill.name}" created — ₱${Number(
        bill.amount,
      ).toFixed(2)} (${bill.due_date})`,
      after: bill,
    });

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
    const {
      name,
      due_date,
      amount,
      discount_percent,
      late_fee_amount,
      late_fee_type,
      late_fee_grace_days,
    } = req.body;

    const existing = await Bill.findById(bill_id);

    const bill = await Bill.updateBill(bill_id, {
      name,
      due_date,
      amount,
      discount_percent,
      late_fee_amount,
      late_fee_type,
      late_fee_grace_days,
    });

    await recordAudit({
      actor: req.user,
      action: "update",
      entity_type: "bill",
      entity_id: bill.bill_id,
      summary: `Bill "${bill.name}" updated`,
      before: existing,
      after: bill,
    });

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

    await recordAudit({
      actor: req.user,
      action: "delete",
      entity_type: "bill",
      entity_id: bill.bill_id,
      summary: `Bill "${bill.name}" deleted`,
      before: bill,
    });

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
