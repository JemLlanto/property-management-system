const express = require("express");
const router = express.Router();

const violationController = require("../controllers/violation.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRoles } = require("../middleware/rbac.middleware");

// Violations are recorded and managed by staff only — the same group
// as bills management, which the page lives under.
router.get(
  "/",
  requireAuth,
  requireRoles("violations"),
  violationController.getViolations,
);
router.post(
  "/",
  requireAuth,
  requireRoles("violations"),
  violationController.createViolation,
);
router.patch(
  "/:violation_id",
  requireAuth,
  requireRoles("violations"),
  violationController.updateViolation,
);
router.delete(
  "/:violation_id",
  requireAuth,
  requireRoles("violations"),
  violationController.deleteViolation,
);

module.exports = router;
