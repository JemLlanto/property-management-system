const Dashboard = require("../models/dashboard.model");

// Aggregated dashboard report for the selected date range.
// Query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD
async function getDashboard(req, res) {
  try {
    const { from, to } = req.query;

    const summary = await Dashboard.getDashboardSummary(from, to);

    return res.json({ success: true, ...summary });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getDashboard,
};
