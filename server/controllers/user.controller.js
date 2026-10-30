const User = require("../models/user.model");
const Building = require("../models/building.model");
const { recordAudit } = require("../services/audit.service");

// Normalises the building reference coming from the client
function parseBuilding(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const buildingId = Number(value);

  if (!Number.isInteger(buildingId) || buildingId <= 0) {
    throw new Error("Invalid building");
  }

  return buildingId;
}

// List all users (any authenticated user can view; tighten with role checks
// later if needed)
async function getUsers(req, res) {
  try {
    const users = await User.getAllUsers();

    return res.json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Create a user from the user-management page.
// - email: optional. When name AND email are blank, the unit number becomes
//   the username and the password.
// - type: "Unit Owner" (default) | "Admin" | "Super Admin"
// - unit_number: required for Unit Owner
// - name: optional
// A temporary password is generated server-side and returned once so the
// admin can hand it to the new user.
async function createUser(req, res) {
  try {
    const { email, type, name, unit_number, building } = req.body;

    const hasEmail = Boolean(email && String(email).trim());
    const hasName = Boolean(name && String(name).trim());

    // Name without email is not allowed (the account would be uninvitable),
    // but both blank is fine — the unit number takes over as the username.
    if (hasName && !hasEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required when a name is provided",
      });
    }

    const userType = type || "Unit Owner";

    if (!User.USER_TYPES.includes(userType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user type" });
    }

    if (userType === "Unit Owner" && !unit_number) {
      return res.status(400).json({
        success: false,
        message: "Unit number is required for Unit Owner accounts",
      });
    }

    // Unit numbers must be unique
    if (unit_number) {
      try {
        await User.assertUnitNumberAvailable(unit_number);
      } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
    }

    // Unit Owners must be assigned to a building
    let buildingId = null;

    try {
      buildingId = parseBuilding(building);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (userType === "Unit Owner" && !buildingId) {
      return res.status(400).json({
        success: false,
        message: "Building is required for Unit Owner accounts",
      });
    }

    // Make sure the building exists and still has room
    if (buildingId) {
      try {
        await Building.findOccupiable(buildingId);
      } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
    }

    const { user, tempPassword } = await User.createUserByAdmin({
      email: hasEmail ? String(email).trim().toLowerCase() : undefined,
      type: userType,
      name,
      unit_number,
      building: buildingId,
    });

    // Count the new occupant against the building
    if (buildingId) {
      await Building.adjustOccupants(buildingId, 1);
    }

    await recordAudit({
      actor: req.user,
      action: "create",
      entity_type: "user",
      entity_id: user.user_id,
      summary: `User "${user.name ?? user.email}" created (${user.type})`,
      after: user,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
      tempPassword,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// Update an existing user
async function updateUser(req, res) {
  try {
    const { user_id } = req.params;
    const { email, type, name, unit_number, building } = req.body;

    if (type !== undefined && !User.USER_TYPES.includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user type" });
    }

    if (
      (type === "Unit Owner" || (type === undefined && unit_number)) &&
      (unit_number === undefined || !String(unit_number).trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Unit number is required for Unit Owner accounts",
      });
    }

    // Unit numbers must stay unique
    if (unit_number !== undefined && unit_number) {
      try {
        await User.assertUnitNumberAvailable(unit_number, user_id);
      } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
    }

    const existing = await User.findById(user_id);

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    let buildingId;

    try {
      buildingId = parseBuilding(building);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // Validate the target building before switching occupants over
    if (buildingId && buildingId !== existing.building) {
      try {
        await Building.findOccupiable(buildingId);
      } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
    }

    const user = await User.updateUser(user_id, {
      email:
        email !== undefined ? String(email).trim().toLowerCase() : undefined,
      type,
      name,
      unit_number,
      building: building !== undefined ? buildingId : undefined,
    });

    // Keep the occupant counts in sync when the building changes
    const previousBuilding = existing.building ?? null;
    const nextBuilding = building !== undefined ? buildingId : previousBuilding;

    if (previousBuilding !== nextBuilding) {
      if (previousBuilding) {
        await Building.adjustOccupants(previousBuilding, -1);
      }
      if (nextBuilding) {
        await Building.adjustOccupants(nextBuilding, 1);
      }
    }

    await recordAudit({
      actor: req.user,
      action: "update",
      entity_type: "user",
      entity_id: user_id,
      summary: `User "${user.name ?? user.email}" updated`,
      before: existing,
      after: user,
    });

    return res.json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (err) {
    const status = err.code === "P2025" ? 404 : 400;

    return res.status(status).json({ success: false, message: err.message });
  }
}

// Delete a user. Users cannot delete their own account.
async function deleteUser(req, res) {
  try {
    const { user_id } = req.params;

    const existing = await User.findById(user_id);

    const deleted = await User.deleteUser(user_id, req.user.user_id);

    if (deleted === null) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Free up the building slot
    if (existing && existing.building) {
      await Building.adjustOccupants(existing.building, -1);
    }

    await recordAudit({
      actor: req.user,
      action: "delete",
      entity_type: "user",
      entity_id: user_id,
      summary: `User "${
        existing?.name ?? existing?.email ?? user_id
      }" deleted`,
      before: existing,
    });

    return res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = { getUsers, createUser, updateUser, deleteUser };
