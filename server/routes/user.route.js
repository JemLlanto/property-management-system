const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const { requireAuth } = require("../middleware/auth.middleware");

router.get("/", requireAuth, userController.getUsers);
router.post("/", requireAuth, userController.createUser);
router.patch("/:user_id", requireAuth, userController.updateUser);
router.delete("/:user_id", requireAuth, userController.deleteUser);

module.exports = router;
