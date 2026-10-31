const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRoles, requireStaff } = require("../middleware/rbac.middleware");

// Reads are open to every role — the list is already scoped server-side
// to the caller's own unit, and standings/recent payments are per-owner.
// Writes and cross-owner reports are staff only.
router.get(
  "/",
  requireAuth,
  requireRoles("payments"),
  paymentController.getPayments,
);
router.get(
  "/unpaid",
  requireAuth,
  requireStaff,
  paymentController.getUnpaidOverview,
);
router.get(
  "/unpaid/:user_id",
  requireAuth,
  requireRoles("payments"),
  paymentController.getUnpaidBills,
);
router.get(
  "/owner/:unit_number",
  requireAuth,
  requireRoles("payments"),
  paymentController.getOwnerPayments,
);
router.get(
  "/bill/:bill_id/owners",
  requireAuth,
  requireStaff,
  paymentController.getBillOwners,
);
router.post("/", requireAuth, requireStaff, paymentController.createPayment);
router.delete(
  "/:payment_id",
  requireAuth,
  requireStaff,
  paymentController.deletePayment,
);
router.get(
  "/audit",
  requireAuth,
  requireStaff,
  paymentController.getPaymentAuditTrail,
);

module.exports = router;
