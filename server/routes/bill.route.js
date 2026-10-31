const express = require("express");
const router = express.Router();

const billController = require("../controllers/bill.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRoles } = require("../middleware/rbac.middleware");

router.get("/", requireAuth, requireRoles("bills"), billController.getBills);
router.post("/", requireAuth, requireRoles("bills"), billController.createBill);
router.patch(
  "/:bill_id",
  requireAuth,
  requireRoles("bills"),
  billController.updateBill,
);
router.delete(
  "/:bill_id",
  requireAuth,
  requireRoles("bills"),
  billController.deleteBill,
);

module.exports = router;
