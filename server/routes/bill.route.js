const express = require("express");
const router = express.Router();

const billController = require("../controllers/bill.controller");
const { requireAuth } = require("../middleware/auth.middleware");

router.get("/", requireAuth, billController.getBills);
router.post("/", requireAuth, billController.createBill);
router.patch("/:bill_id", requireAuth, billController.updateBill);
router.delete("/:bill_id", requireAuth, billController.deleteBill);

module.exports = router;
