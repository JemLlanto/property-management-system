const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRoles } = require("../middleware/rbac.middleware");

router.get("/", requireAuth, requireRoles("users"), userController.getUsers);
router.post("/", requireAuth, requireRoles("users"), userController.createUser);
router.patch(
  "/:user_id",
  requireAuth,
  requireRoles("users"),
  userController.updateUser,
);
router.delete(
  "/:user_id",
  requireAuth,
  requireRoles("users"),
  userController.deleteUser,
);

module.exports = router;
