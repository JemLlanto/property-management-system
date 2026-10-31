const express = require("express");
const router = express.Router();

const auditController = require("../controllers/audit.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRoles } = require("../middleware/rbac.middleware");

router.get(
  "/",
  requireAuth,
  requireRoles("audit"),
  auditController.getAuditTrail,
);

module.exports = router;
