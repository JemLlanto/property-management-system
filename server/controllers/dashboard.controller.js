const Dashboard = require("../models/dashboard.model");
const { loadCaller } = require("../middleware/rbac.middleware");

// Aggregated dashboard report for the selected date range.
// Query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD
//
// Unit Owners get their own slice of the report: the summary figures
// stay company-wide, but the lists that name other owners (top payers,
// owners in arrears, recent payments) are filtered down to their unit so
// they cannot see anyone else's activity.
async function getDashboard(req, res) {
  try {
    const { from, to } = req.query;

    const summary = await Dashboard.getDashboardSummary(from, to);

    const caller = await loadCaller(req);

    if (caller && caller.type === "Unit Owner" && caller.unit_number) {
      const unit = caller.unit_number;
      const matchesUnit = (row) => row?.unit_number === unit;

      return res.json({
        success: true,
        ...summary,
        top_payers: (summary.top_payers ?? []).filter(matchesUnit),
        owners_in_arrears: (summary.owners_in_arrears ?? []).filter(
          matchesUnit,
        ),
        recent_payments: (summary.recent_payments ?? []).filter(matchesUnit),
      });
    }

    return res.json({ success: true, ...summary });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getDashboard,
};
