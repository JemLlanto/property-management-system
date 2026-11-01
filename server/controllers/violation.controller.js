const Violation = require("../models/violation.model");
const { recordAudit } = require("../services/audit.service");
const { parsePagination, paginationMeta } = require("../utils/pagination");

// List violations. Supports ?page=&pageSize=&search=&status=&severity=&
// unit_number=&sort=&order= — omitting all of them returns the full
// list (legacy behaviour for dropdowns).
async function getViolations(req, res) {
  try {
    const supportsPagination =
      req.query.page !== undefined ||
      req.query.search !== undefined ||
      req.query.status !== undefined ||
      req.query.severity !== undefined ||
      req.query.unit_number !== undefined ||
      req.query.sort !== undefined;

    if (!supportsPagination) {
      const violations = await Violation.getAllViolations();

      return res.json({
        success: true,
        violations: violations.map(Violation.parseViolation),
      });
    }

    const { page, pageSize, skip, take } = parsePagination(req.query);

    const result = await Violation.getViolationsPaginated({
      page,
      pageSize,
      skip,
      take,
      search: req.query.search,
      status: req.query.status,
      severity: req.query.severity,
      unit_number: req.query.unit_number,
      sort: req.query.sort,
      order: req.query.order,
    });

    return res.json({
      success: true,
      violations: result.violations.map(Violation.parseViolation),
      ...paginationMeta(result),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Record a violation against a unit
async function createViolation(req, res) {
  try {
    const { unit_number, violation_type, severity, description, occurred_at } =
      req.body;

    const violation = await Violation.createViolation({
      unit_number,
      violation_type,
      severity,
      description,
      occurred_at,
      recorded_by_id: req.user.user_id,
    });

    await recordAudit({
      actor: req.user,
      action: "create",
      entity_type: "violation",
      entity_id: String(violation.violation_id),
      summary: `Violation recorded for unit ${violation.unit_number} — ${violation.violation_type} (${violation.severity})`,
      after: violation,
    });

    return res.status(201).json({
      success: true,
      message: "Violation recorded successfully",
      violation,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// Update a violation — including resolving it (resolution remarks are
// required to move a violation to Resolved)
async function updateViolation(req, res) {
  try {
    const { violation_id } = req.params;

    const before = await Violation.findById(violation_id);

    if (!before) {
      return res
        .status(404)
        .json({ success: false, message: "Violation not found" });
    }

    const {
      unit_number,
      violation_type,
      severity,
      description,
      occurred_at,
      status,
      resolution_remarks,
    } = req.body;

    const violation = await Violation.updateViolation(violation_id, {
      unit_number,
      violation_type,
      severity,
      description,
      occurred_at,
      status,
      resolution_remarks,
    });

    await recordAudit({
      actor: req.user,
      action: "update",
      entity_type: "violation",
      entity_id: String(violation.violation_id),
      summary:
        violation.status === "Resolved" && before.status !== "Resolved"
          ? `Violation resolved for unit ${violation.unit_number} — ${violation.violation_type}`
          : `Violation updated for unit ${violation.unit_number} — ${violation.violation_type}`,
      before,
      after: violation,
    });

    return res.json({
      success: true,
      message: "Violation updated successfully",
      violation,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// Delete a violation record
async function deleteViolation(req, res) {
  try {
    const { violation_id } = req.params;

    const violation = await Violation.deleteViolation(violation_id);

    if (!violation) {
      return res
        .status(404)
        .json({ success: false, message: "Violation not found" });
    }

    await recordAudit({
      actor: req.user,
      action: "delete",
      entity_type: "violation",
      entity_id: String(violation.violation_id),
      summary: `Violation deleted for unit ${violation.unit_number} — ${violation.violation_type}`,
      before: violation,
    });

    return res.json({
      success: true,
      message: "Violation deleted successfully",
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  getViolations,
  createViolation,
  updateViolation,
  deleteViolation,
};
