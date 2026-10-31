const Building = require("../models/building.model");
const { recordAudit } = require("../services/audit.service");

// List all buildings
async function getBuildings(req, res) {
  try {
    const buildings = await Building.getAllBuildings();

    return res.json({ success: true, buildings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Create a building
async function createBuilding(req, res) {
  try {
    const { name, capacity } = req.body;

    if (!name || !String(name).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Building name is required" });
    }

    if (capacity === undefined || capacity === null || capacity === "") {
      return res
        .status(400)
        .json({ success: false, message: "Capacity is required" });
    }

    if (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Capacity must be a whole number greater than 0",
      });
    }

    const building = await Building.createBuilding({
      name: String(name).trim(),
      capacity: Number(capacity),
    });

    await recordAudit({
      actor: req.user,
      action: "create",
      entity_type: "building",
      entity_id: building.building_id,
      summary: `Building "${building.name}" created (capacity ${building.capacity})`,
      after: building,
    });

    return res.status(201).json({
      success: true,
      message: "Building created successfully",
      building,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// Update a building
async function updateBuilding(req, res) {
  try {
    const { building_id } = req.params;
    const { name, capacity } = req.body;

    if (name !== undefined && !String(name).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Building name cannot be empty" });
    }

    if (
      capacity !== undefined &&
      (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Capacity must be a whole number greater than 0",
      });
    }

    const building = await Building.updateBuilding(building_id, {
      name: name !== undefined ? String(name).trim() : undefined,
      capacity,
    });

    await recordAudit({
      actor: req.user,
      action: "update",
      entity_type: "building",
      entity_id: building.building_id,
      summary: `Building "${building.name}" updated`,
      before: existing,
      after: building,
    });

    return res.json({
      success: true,
      message: "Building updated successfully",
      building,
    });
  } catch (err) {
    // P2025 = record not found
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Building not found" });
    }

    return res.status(400).json({ success: false, message: err.message });
  }
}

// Delete a building
async function deleteBuilding(req, res) {
  try {
    const { building_id } = req.params;

    const existing = await Building.findById(building_id);

    const deleted = await Building.deleteBuilding(building_id);

    if (deleted === null) {
      return res
        .status(404)
        .json({ success: false, message: "Building not found" });
    }

    await recordAudit({
      actor: req.user,
      action: "delete",
      entity_type: "building",
      entity_id: building_id,
      summary: `Building "${existing?.name ?? building_id}" deleted`,
      before: existing,
    });

    return res.json({
      success: true,
      message: "Building deleted successfully",
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  getBuildings,
  createBuilding,
  updateBuilding,
  deleteBuilding,
};
