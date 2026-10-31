const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboard.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRoles } = require("../middleware/rbac.middleware");

router.get(
  "/",
  requireAuth,
  requireRoles("dashboard"),
  dashboardController.getDashboard,
);

module.exports = router;
