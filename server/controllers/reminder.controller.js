const Reminder = require("../models/reminder.model");
const { loadCaller } = require("../middleware/rbac.middleware");

// Payment reminders.
//
// The dashboard already computes which bills hit which owners next; this
// endpoint turns that into a per-owner "you owe X by Y" list ready to be
// emailed or exported.
//
// Query params: window_days — how far ahead a due date becomes a
// reminder (default 7).
//
// Unit Owners only ever receive their own reminders.
async function getReminders(req, res) {
  try {
    const windowDays = req.query.window_days
      ? Number(req.query.window_days)
      : undefined;

    const result = await Reminder.getReminders({
      ...(Number.isFinite(windowDays) ? { windowDays } : {}),
    });

    const caller = await loadCaller(req);

    if (caller && caller.type === "Unit Owner" && caller.unit_number) {
      const unit = caller.unit_number;
      const ownReminders = (result.reminders ?? []).filter(
        (reminder) => reminder.unit_number === unit,
      );

      return res.json({
        success: true,
        ...result,
        reminders: ownReminders,
        reminder_count: ownReminders.length,
      });
    }

    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getReminders };
