const prisma = require("../lib/prisma");

// Allowed billing cycles
const BILLING_CYCLES = ["Weekly", "Half-Month", "Monthly", "Quarterly"];

// List all bills
async function getAllBills() {
  return prisma.bill.findMany({
    orderBy: { bill_id: "desc" },
  });
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

const validateBillFields = ({ name, due_date, amount }, partial = false) => {
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
  findByName,
  findById,
  createBill,
  updateBill,
  deleteBill,
  BILLING_CYCLES,
};
