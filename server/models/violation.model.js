const prisma = require("../lib/prisma");
const { buildSearchWhere, buildSortOrder } = require("../utils/pagination");

// The violation types an admin can pick from the dropdown. "Other" is
// always available and lets the admin type a custom description.
const VIOLATION_TYPES = [
  "Noise",
  "Smoking",
  "Parking",
  "Pets",
  "Trash Disposal",
  "Property Damage",
  "Common Area Misuse",
  "Unauthorized Renovation",
  "Other",
];

// How serious the violation is.
const SEVERITIES = ["Minor", "Major", "Critical"];

// The lifecycle of a violation.
const VIOLATION_STATUSES = ["Open", "Resolved"];

// Columns a client may sort the violation list by.
const VIOLATION_SORT_COLUMNS = {
  unit_number: "unit_number",
  violation_type: "violation_type",
  severity: "severity",
  status: "status",
  occurred_at: "occurred_at",
  created_at: "created_at",
};

// List all violations, newest first
async function getAllViolations() {
  return prisma.violation.findMany({
    include: {
      recordedBy: {
        select: { user_id: true, name: true, email: true },
      },
    },
    orderBy: [{ occurred_at: "desc" }, { violation_id: "desc" }],
  });
}

// A page of violations, optionally filtered by a search term (unit
// number, type, description or recorder name) and by status/severity.
// Sortable via ?sort=<column>&order=asc|desc within
// VIOLATION_SORT_COLUMNS.
async function getViolationsPaginated({
  page = 1,
  pageSize = 50,
  skip = 0,
  take = 50,
  search = "",
  status = "",
  severity = "",
  unit_number = "",
  sort = "",
  order = "desc",
} = {}) {
  const where = {
    ...(status ? { status } : {}),
    ...(severity ? { severity } : {}),
    ...(unit_number ? { unit_number: String(unit_number) } : {}),
    ...buildSearchWhere(search, {
      unit_number: "contains",
      violation_type: "contains",
      description: "contains",
      resolution_remarks: "contains",
    }),
  };

  const term = String(search ?? "").trim();

  if (term) {
    where.OR = [
      ...(where.OR ?? []),
      {
        recordedBy: {
          OR: [{ name: { contains: term } }, { email: { contains: term } }],
        },
      },
    ];
  }

  const orderBy = buildSortOrder(sort, order, VIOLATION_SORT_COLUMNS, {
    fallback: [{ occurred_at: "desc" }, { violation_id: "desc" }],
    tiebreaker: { violation_id: "desc" },
  });

  const include = {
    recordedBy: {
      select: { user_id: true, name: true, email: true },
    },
  };

  const [violations, total] = await Promise.all([
    prisma.violation.findMany({
      where,
      include,
      orderBy,
      skip,
      take,
    }),
    prisma.violation.count({ where }),
  ]);

  return { violations, total, page, pageSize };
}

function parseViolation(violation) {
  return {
    violation_id: violation.violation_id,
    unit_number: violation.unit_number,
    violation_type: violation.violation_type,
    severity: violation.severity,
    description: violation.description ?? null,
    occurred_at: violation.occurred_at,
    status: violation.status,
    resolution_remarks: violation.resolution_remarks ?? null,
    resolved_at: violation.resolved_at ?? null,
    recorded_by_id: violation.recorded_by_id ?? null,
    recorded_by_name: violation.recordedBy?.name ?? null,
    recorded_by_email: violation.recordedBy?.email ?? null,
    created_at: violation.created_at,
    updated_at: violation.updated_at,
  };
}

async function findById(violation_id) {
  const violation = await prisma.violation.findUnique({
    where: { violation_id: Number(violation_id) },
    include: {
      recordedBy: {
        select: { user_id: true, name: true, email: true },
      },
    },
  });

  return violation ? parseViolation(violation) : null;
}

// Validate and normalize the violation fields shared by create and
// update. Returns only the fields that were provided.
const validateViolationFields = (
  {
    unit_number,
    violation_type,
    severity,
    description,
    occurred_at,
    status,
    resolution_remarks,
  },
  partial = false,
) => {
  const data = {};

  if (unit_number !== undefined) {
    const unit = String(unit_number).trim();

    if (!unit) {
      throw new Error("Unit number is required");
    }

    data.unit_number = unit;
  } else if (!partial) {
    throw new Error("Unit number is required");
  }

  if (violation_type !== undefined) {
    const type = String(violation_type).trim();

    if (!VIOLATION_TYPES.includes(type)) {
      throw new Error(
        `Violation type must be one of: ${VIOLATION_TYPES.join(", ")}`,
      );
    }

    data.violation_type = type;
  } else if (!partial) {
    throw new Error("Violation type is required");
  }

  if (severity !== undefined) {
    const level = String(severity).trim();

    if (!SEVERITIES.includes(level)) {
      throw new Error(`Severity must be one of: ${SEVERITIES.join(", ")}`);
    }

    data.severity = level;
  } else if (!partial) {
    throw new Error("Severity is required");
  }

  if (description !== undefined) {
    const trimmed = String(description ?? "").trim();

    // A custom type carries no meaning on its own — the details are
    // what makes it usable.
    if (data.violation_type === "Other" && !trimmed && !partial) {
      throw new Error("Details are required when the violation type is Other");
    }

    data.description = trimmed || null;
  } else if (!partial && data.violation_type === "Other") {
    throw new Error("Details are required when the violation type is Other");
  }

  if (occurred_at !== undefined) {
    const occurred = new Date(occurred_at);

    if (Number.isNaN(occurred.getTime())) {
      throw new Error("Violation date is invalid");
    }

    data.occurred_at = occurred;
  }

  if (status !== undefined) {
    const value = String(status).trim();

    if (!VIOLATION_STATUSES.includes(value)) {
      throw new Error(
        `Status must be one of: ${VIOLATION_STATUSES.join(", ")}`,
      );
    }

    data.status = value;

    // Resolving without saying what was done leaves a dead record.
    if (value === "Resolved") {
      const remarks = String(resolution_remarks ?? "").trim();

      if (!remarks) {
        throw new Error(
          "Resolution remarks are required when marking as resolved",
        );
      }

      data.resolution_remarks = remarks;
      data.resolved_at = new Date();
    } else {
      // Re-opening clears the resolution so the fields never disagree.
      data.resolution_remarks = null;
      data.resolved_at = null;
    }
  }

  if (resolution_remarks !== undefined && status === undefined) {
    const remarks = String(resolution_remarks ?? "").trim();

    // Remarks can be typed ahead of resolving, but they are only
    // persisted once the violation actually moves to Resolved.
    if (remarks) {
      data.resolution_remarks = remarks;
    }
  }

  return data;
};

async function createViolation(fields) {
  const data = validateViolationFields(fields);

  const violation = await prisma.violation.create({
    data: {
      ...data,
      recorded_by_id: fields.recorded_by_id
        ? String(fields.recorded_by_id)
        : null,
    },
    include: {
      recordedBy: {
        select: { user_id: true, name: true, email: true },
      },
    },
  });

  return parseViolation(violation);
}

async function updateViolation(violation_id, fields) {
  const existing = await prisma.violation.findUnique({
    where: { violation_id: Number(violation_id) },
  });

  if (!existing) {
    return null;
  }

  const data = validateViolationFields(fields, true);

  if (Object.keys(data).length === 0) {
    throw new Error("At least one field is required");
  }

  const violation = await prisma.violation.update({
    where: { violation_id: Number(violation_id) },
    data,
    include: {
      recordedBy: {
        select: { user_id: true, name: true, email: true },
      },
    },
  });

  return parseViolation(violation);
}

async function deleteViolation(violation_id) {
  const existing = await prisma.violation.findUnique({
    where: { violation_id: Number(violation_id) },
  });

  if (!existing) {
    return null;
  }

  await prisma.violation.delete({
    where: { violation_id: Number(violation_id) },
  });

  return existing;
}

module.exports = {
  VIOLATION_TYPES,
  SEVERITIES,
  VIOLATION_STATUSES,
  getAllViolations,
  getViolationsPaginated,
  findById,
  createViolation,
  updateViolation,
  deleteViolation,
  parseViolation,
};
