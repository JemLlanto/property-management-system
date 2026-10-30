const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const {
  register,
  login,
  refresh,
  logout,
  me,
  changePassword,
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/change-password", requireAuth, changePassword);
router.get("/me", requireAuth, me);

module.exports = router;
