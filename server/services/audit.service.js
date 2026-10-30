const prisma = require("../lib/prisma");

// Append-only audit trail. Logs are never updated or deleted — a record of
// edits is worthless if the actor can rewrite it, so this module exposes
// no update or delete operations on purpose.
//
// `actor` is the authenticated user from req.user ({ user_id, email });
// `before`/`after` are the entity snapshots. Deletes pass only `before`,
// creates pass only `after`.

// Fields that must never land in the log — password hashes and refresh
// tokens have no forensic value and are a liability if the log leaks.
const REDACTED_KEYS = ["password", "refresh_tokens"];

function sanitize(state) {
  if (!state || typeof state !== "object") return state ?? null;

  const clean = {};

  for (const [key, value] of Object.entries(state)) {
    if (REDACTED_KEYS.includes(key)) {
      clean[key] = "[redacted]";
      continue;
    }

    // Decimal values arrive as Prisma Decimal objects — flatten them so
    // JSON.stringify cannot throw on BigInt/Decimal internals.
    clean[key] =
      typeof value === "object" && value !== null && !(value instanceof Date)
        ? String(value)
        : value;
  }

  return clean;
}

async function recordAudit({
  actor,
  action,
  entity_type,
  entity_id,
  summary,
  before,
  after,
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        actor_id: actor?.user_id ?? null,
        actor_name: actor?.name ?? actor?.email ?? null,
        action,
        entity_type,
        entity_id: entity_id != null ? String(entity_id) : null,
        summary: summary ? String(summary).slice(0, 255) : null,
        before_state: before === undefined ? undefined : sanitize(before),
        after_state: after === undefined ? undefined : sanitize(after),
      },
    });
  } catch (err) {
    // An audit failure must never break the business operation — but it
    // should be loud, because a silent gap in the trail is a compliance
    // hole.
    console.error("AUDIT LOG WRITE FAILED:", err.message);
    return null;
  }
}

// List audit entries, newest first, with simple pagination.
// Query params: page (1-based), pageSize (max 100), entity_type, actor_id.
async function getAuditLogs({
  page = 1,
  pageSize = 50,
  entity_type = null,
  actor_id = null,
} = {}) {
  const size = Math.min(Math.max(Number(pageSize) || 50, 1), 100);
  const current = Math.max(Number(page) || 1, 1);

  const where = {
    ...(entity_type ? { entity_type } : {}),
    ...(actor_id ? { actor_id } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { audit_id: "desc" },
      skip: (current - 1) * size,
      take: size,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    page: current,
    pageSize: size,
    total,
    total_pages: Math.ceil(total / size),
  };
}

module.exports = { recordAudit, getAuditLogs };
