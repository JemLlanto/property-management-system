const Expense = require("../models/expense.model");
const { recordAudit } = require("../services/audit.service");
const { parsePagination, paginationMeta } = require("../utils/pagination");

// List expenses. Supports ?page=&pageSize=&search=&sort=&order= —
// omitting all of them returns the full list (legacy behaviour).
async function getExpenses(req, res) {
  try {
    const supportsPagination =
      req.query.page !== undefined ||
      req.query.search !== undefined ||
      req.query.sort !== undefined;

    if (!supportsPagination) {
      const expenses = await Expense.getAllExpenses();

      return res.json({
        success: true,
        expenses: expenses.map(Expense.parseExpense),
      });
    }

    const { page, pageSize, skip, take } = parsePagination(req.query);

    const result = await Expense.getExpensesPaginated({
      page,
      pageSize,
      skip,
      take,
      search: req.query.search,
      sort: req.query.sort,
      order: req.query.order,
    });

    return res.json({
      success: true,
      expenses: result.expenses.map(Expense.parseExpense),
      ...paginationMeta(result),
    });
  } catch (err) {
    console.log("err: ", err);

    return res.status(500).json({ success: false, message: err.message });
  }
}

async function createExpense(req, res) {
  try {
    const { reason, amount, description, occurred_at } = req.body;

    const expense = await Expense.createExpense({
      reason,
      amount,
      description,
      occurred_at,
      recorded_by_id: req.user.user_id,
    });

    await recordAudit({
      actor: req.user,
      action: "create",
      entity_type: "expense",
      entity_id: String(expense.expense_id),
      summary: `Expense recorded — ${expense.reason} · ₱${Number(expense.amount).toFixed(2)}`,
      after: expense,
    });

    return res.status(201).json({
      success: true,
      message: "Expense recorded successfully",
      expense,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function deleteExpense(req, res) {
  try {
    const { expense_id } = req.params;
    const expense = await Expense.deleteExpense(expense_id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    await recordAudit({
      actor: req.user,
      action: "delete",
      entity_type: "expense",
      entity_id: String(expense_id),
      summary: `Expense deleted — ${expense.reason} · ₱${Number(expense.amount).toFixed(2)}`,
      before: expense,
    });

    return res.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  getExpenses,
  createExpense,
  deleteExpense,
};
