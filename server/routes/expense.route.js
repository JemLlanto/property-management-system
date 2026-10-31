const express = require("express");
const router = express.Router();

const expenseController = require("../controllers/expense.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRoles } = require("../middleware/rbac.middleware");

router.get(
  "/",
  requireAuth,
  requireRoles("expenses"),
  expenseController.getExpenses,
);
router.post(
  "/",
  requireAuth,
  requireRoles("expenses"),
  expenseController.createExpense,
);
router.delete(
  "/:expense_id",
  requireAuth,
  requireRoles("expenses"),
  expenseController.deleteExpense,
);

module.exports = router;
