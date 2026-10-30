const prisma = require("../lib/prisma");
const { buildSearchWhere } = require("../utils/pagination");

// Allowed billing cycles
const BILLING_CYCLES = ["Weekly", "Half-Month", "Monthly", "Quarterly"];

// How a late fee is calculated
const LATE_FEE_TYPES = ["fixed", "percent"];

// List all bills
async function getAllBills() {
  return prisma.bill.findMany({
    orderBy: { bill_id: "desc" },
  });
}

// A page of bills, optionally filtered by a search term (name) and a
// minimum amount.
async function getBillsPaginated({
  page = 1,
  pageSize = 50,
  skip = 0,
  take = 50,
  search = "",
  cycle = "",
} = {}) {
  const where = {
    ...(cycle ? { due_date: cycle } : {}),
    ...buildSearchWhere(search, { name: "contains" }),
  };

  const [bills, total] = await Promise.all([
    prisma.bill.findMany({
      where,
      orderBy: { bill_id: "desc" },
      skip,
      take,
    }),
    prisma.bill.count({ where }),
  ]);

  return { bills, total, page, pageSize };
}

async function findByName(name, excludeId = null) {
  return prisma.bill.findFirst({
    where: {
      name,
      ...(excludeId !== null ? { bill_id: { not: Number(excludeId) } } : {}),
    },
  });
}

// Find a bill by its id — used to capture the "before" state for the
// audit trail before an update overwrites it.
async function findById(bill_id) {
  return prisma.bill.findUnique({
    where: { bill_id: Number(bill_id) },
  });
}

const validateBillFields = (
  {
    name,
    due_date,
    amount,
    discount_percent,
    late_fee_amount,
    late_fee_type,
    late_fee_grace_days,
  },
  partial = false,
) => {
  const data = {};

  if (name !== undefined) {
    if (!String(name).trim()) {
      throw new Error("Bill name is required");
    }
    data.name = String(name).trim();
  } else if (!partial) {
    throw new Error("Bill name is required");
  }

  if (due_date !== undefined) {
    const cycle = String(due_date).trim();

    if (!BILLING_CYCLES.includes(cycle)) {
      throw new Error(`Due date must be one of: ${BILLING_CYCLES.join(", ")}`);
    }

    data.due_date = cycle;
  } else if (!partial) {
    throw new Error("Due date is required");
  }

  if (amount !== undefined) {
    const parsed = Number(amount);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    data.amount = parsed;
  } else if (!partial) {
    throw new Error("Amount is required");
  }

  // Discount — a percentage off the list price for every cycle
  if (discount_percent !== undefined) {
    const parsed = Number(discount_percent);

    if (!Number.isFinite(parsed) || parsed < 0 || parsed >= 100) {
      throw new Error("Discount must be a percentage between 0 and 99.99");
    }

    data.discount_percent = parsed;
  }

  // Late fee — fixed amount or percentage of the cycle price
  if (late_fee_amount !== undefined) {
    const parsed = Number(late_fee_amount);

    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new Error("Late fee cannot be negative");
    }

    data.late_fee_amount = parsed;
  }

  if (late_fee_type !== undefined) {
    const type = String(late_fee_type).trim().toLowerCase();

    if (!LATE_FEE_TYPES.includes(type)) {
      throw new Error(
        `Late fee type must be one of: ${LATE_FEE_TYPES.join(", ")}`,
      );
    }

    data.late_fee_type = type;
  }

  if (late_fee_grace_days !== undefined) {
    const parsed = Number(late_fee_grace_days);

    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new Error(
        "Late fee grace days must be a whole number of 0 or more",
      );
    }

    data.late_fee_grace_days = parsed;
  }

  return data;
};

async function createBill(fields) {
  const data = validateBillFields(fields);

  const existing = await findByName(data.name);

  if (existing) {
    throw new Error("A bill with this name already exists");
  }

  return prisma.bill.create({ data });
}

async function updateBill(bill_id, fields) {
  const data = validateBillFields(fields, true);

  if (Object.keys(data).length === 0) {
    throw new Error("At least one field is required");
  }

  if (data.name !== undefined) {
    const existing = await findByName(data.name, bill_id);

    if (existing) {
      throw new Error("A bill with this name already exists");
    }
  }

  return prisma.bill.update({
    where: { bill_id: Number(bill_id) },
    data,
  });
}

async function deleteBill(bill_id) {
  const bill = await prisma.bill.findUnique({
    where: { bill_id: Number(bill_id) },
  });

  if (!bill) {
    return null;
  }

  await prisma.bill.delete({
    where: { bill_id: Number(bill_id) },
  });

  return bill;
}

module.exports = {
  getAllBills,
  getBillsPaginated,
  findByName,
  findById,
  createBill,
  updateBill,
  deleteBill,
  BILLING_CYCLES,
  LATE_FEE_TYPES,
};
