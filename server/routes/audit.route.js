const express = require("express");
const router = express.Router();

const auditController = require("../controllers/audit.controller");
const { requireAuth } = require("../middleware/auth.middleware");

router.get("/", requireAuth, auditController.getAuditTrail);

module.exports = router;
