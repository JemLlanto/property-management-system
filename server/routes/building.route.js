const express = require("express");
const router = express.Router();

const buildingController = require("../controllers/building.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRoles } = require("../middleware/rbac.middleware");

router.get(
  "/",
  requireAuth,
  requireRoles("buildings"),
  buildingController.getBuildings,
);
router.post(
  "/",
  requireAuth,
  requireRoles("buildings"),
  buildingController.createBuilding,
);
router.patch(
  "/:building_id",
  requireAuth,
  requireRoles("buildings"),
  buildingController.updateBuilding,
);
router.delete(
  "/:building_id",
  requireAuth,
  requireRoles("buildings"),
  buildingController.deleteBuilding,
);

module.exports = router;
