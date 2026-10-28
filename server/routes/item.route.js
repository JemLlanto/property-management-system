const express = require("express");
const router = express.Router();

const itemController = require("../controllers/item.controller");
const { requireAuth } = require("../middleware/auth.middleware");

router.get("/", requireAuth, itemController.getItems);
router.get("/:item_id", requireAuth, itemController.getItem);
router.post("/", requireAuth, itemController.createItem);
router.patch("/:item_id", requireAuth, itemController.updateItem);
router.delete("/:item_id", requireAuth, itemController.deleteItem);

module.exports = router;
