const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller");
const { requireAuth } = require("../middleware/auth.middleware");

router.get("/", requireAuth, paymentController.getPayments);
router.get("/unpaid", requireAuth, paymentController.getUnpaidOverview);
router.get("/unpaid/:user_id", requireAuth, paymentController.getUnpaidBills);
router.get(
  "/bill/:bill_id/owners",
  requireAuth,
  paymentController.getBillOwners,
);
router.post("/", requireAuth, paymentController.createPayment);
router.delete("/:payment_id", requireAuth, paymentController.deletePayment);
router.get("/audit", requireAuth, paymentController.getPaymentAuditTrail);

module.exports = router;
