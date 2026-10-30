const express = require("express");
const router = express.Router();

const reminderController = require("../controllers/reminder.controller");
const { requireAuth } = require("../middleware/auth.middleware");

router.get("/", requireAuth, reminderController.getReminders);

module.exports = router;
