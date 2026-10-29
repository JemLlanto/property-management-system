const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller");
const { requireAuth } = require("../middleware/auth.middleware");

router.get("/", requireAuth, paymentController.getPayments);
router.post("/", requireAuth, paymentController.createPayment);
router.delete("/:payment_id", requireAuth, paymentController.deletePayment);

module.exports = router;
