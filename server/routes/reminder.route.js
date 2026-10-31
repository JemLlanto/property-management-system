const express = require("express");
const router = express.Router();

const reminderController = require("../controllers/reminder.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRoles } = require("../middleware/rbac.middleware");

router.get(
  "/",
  requireAuth,
  requireRoles("reminders"),
  reminderController.getReminders,
);

module.exports = router;
