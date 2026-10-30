const Reminder = require("../models/reminder.model");

// Payment reminders.
//
// The dashboard already computes which bills hit which owners next; this
// endpoint turns that into a per-owner "you owe X by Y" list ready to be
// emailed or exported.
//
// Query params: window_days — how far ahead a due date becomes a
// reminder (default 7).
async function getReminders(req, res) {
  try {
    const windowDays = req.query.window_days
      ? Number(req.query.window_days)
      : undefined;

    const result = await Reminder.getReminders({
      ...(Number.isFinite(windowDays) ? { windowDays } : {}),
    });

    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getReminders };
