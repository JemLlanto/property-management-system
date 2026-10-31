const prisma = require("../lib/prisma");
const { buildSearchWhere, buildSortOrder } = require("../utils/pagination");

// Columns a client may sort the expense list by. recorded_by_name lives
// on a to-one relation, so it maps through that.
const EXPENSE_SORT_COLUMNS = {
  reason: "reason",
  amount: "amount",
  occurred_at: "occurred_at",
  recorded_by_name: { relation: "recordedBy", field: "name" },
};

// List all expenses with the recording user resolved
async function getAllExpenses() {
  return prisma.expense.findMany({
    include: {
      recordedBy: {
        select: { user_id: true, name: true, email: true },
      },
    },
    orderBy: [{ occurred_at: "desc" }, { expense_id: "desc" }],
  });
}

// A page of expenses, newest first, optionally filtered by a search
// term (reason, description or recorder name). Sortable via
// ?sort=<column>&order=asc|desc within EXPENSE_SORT_COLUMNS.
async function getExpensesPaginated({
  page = 1,
  pageSize = 50,
  skip = 0,
  take = 50,
  search = "",
  sort = "",
  order = "desc",
} = {}) {
  const where = buildSearchWhere(search, {
    reason: "contains",
    description: "contains",
  });

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

  const orderBy = buildSortOrder(sort, order, EXPENSE_SORT_COLUMNS, {
    fallback: [{ occurred_at: "desc" }, { expense_id: "desc" }],
    tiebreaker: { expense_id: "desc" },
  });

  const include = {
    recordedBy: {
      select: { user_id: true, name: true, email: true },
    },
  };

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include,
      orderBy,
      skip,
      take,
    }),
    prisma.expense.count({ where }),
  ]);

  return { expenses, total, page, pageSize };
}

function parseExpense(expense) {
  return {
    expense_id: expense.expense_id,
    reason: expense.reason,
    amount: Number(expense.amount ?? 0),
    description: expense.description ?? null,
    occurred_at: expense.occurred_at,
    recorded_by_id: expense.recorded_by_id ?? null,
    recorded_by_name: expense.recordedBy?.name ?? null,
    recorded_by_email: expense.recordedBy?.email ?? null,
    created_at: expense.created_at,
    updated_at: expense.updated_at,
  };
}

async function createExpense({
  reason,
  amount,
  description,
  occurred_at,
  recorded_by_id,
}) {
  const trimmedReason = String(reason ?? "").trim();
  if (!trimmedReason) {
    throw new Error("Expense reason is required");
  }

  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  let occurredAt = new Date();

  if (occurred_at) {
    occurredAt = new Date(occurred_at);
    if (Number.isNaN(occurredAt.getTime())) {
      throw new Error("Expense date is invalid");
    }
  }

  if (recorded_by_id) {
    const recorder = await prisma.user.findUnique({
      where: { user_id: String(recorded_by_id) },
    });

    if (!recorder) {
      throw new Error("Invalid recording user");
    }
  }

  const expense = await prisma.expense.create({
    data: {
      reason: trimmedReason,
      amount: parsedAmount,
      description: description ? String(description).trim() || null : null,
      occurred_at: occurredAt,
      recorded_by_id: recorded_by_id ? String(recorded_by_id) : null,
    },
    include: {
      recordedBy: {
        select: { user_id: true, name: true, email: true },
      },
    },
  });

  return parseExpense(expense);
}

async function deleteExpense(expense_id) {
  const existing = await prisma.expense.findUnique({
    where: { expense_id: Number(expense_id) },
  });

  if (!existing) {
    return null;
  }

  await prisma.expense.delete({
    where: { expense_id: Number(expense_id) },
  });

  return existing;
}

module.exports = {
  getAllExpenses,
  getExpensesPaginated,
  createExpense,
  deleteExpense,
  parseExpense,
};
