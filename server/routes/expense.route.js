const express = require("express");
const router = express.Router();

const expenseController = require("../controllers/expense.controller");
const { requireAuth } = require("../middleware/auth.middleware");

router.get("/", requireAuth, expenseController.getExpenses);
router.post("/", requireAuth, expenseController.createExpense);
router.delete("/:expense_id", requireAuth, expenseController.deleteExpense);

module.exports = router;
