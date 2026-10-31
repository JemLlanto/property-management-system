const { getAuditLogs } = require("../services/audit.service");

// The append-only activity trail. Every bill, payment, user and building
// mutation is recorded with the actor, the action and the before/after
// state — so a deleted payment or an edited bill can always be
// reconstructed.
async function getAuditTrail(req, res) {
  try {
    const { page, pageSize, entity_type, actor_id, search } = req.query;

    const result = await getAuditLogs({
      page,
      pageSize,
      entity_type,
      actor_id,
      search,
    });

    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getAuditTrail };
