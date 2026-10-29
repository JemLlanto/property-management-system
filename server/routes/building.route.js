const express = require("express");
const router = express.Router();

const buildingController = require("../controllers/building.controller");
const { requireAuth } = require("../middleware/auth.middleware");

router.get("/", requireAuth, buildingController.getBuildings);
router.post("/", requireAuth, buildingController.createBuilding);
router.patch("/:building_id", requireAuth, buildingController.updateBuilding);
router.delete("/:building_id", requireAuth, buildingController.deleteBuilding);

module.exports = router;
