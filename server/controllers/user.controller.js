const User = require("../models/user.model");

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
// - type: "Unit Owner" (default) | "Admin" | "Super Admin"
// - unit_number: required only when type is "Unit Owner"
// - name: optional
// A temporary password is generated server-side and returned once so the
// admin can hand it to the new user.
async function createUser(req, res) {
  try {
    const { email, type, name, unit_number } = req.body;

    if (!email || !String(email).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
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

    const { user, tempPassword } = await User.createUserByAdmin({
      email: String(email).trim().toLowerCase(),
      type: userType,
      name,
      unit_number,
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
    const { email, type, name, unit_number } = req.body;

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

    const user = await User.updateUser(user_id, {
      email:
        email !== undefined ? String(email).trim().toLowerCase() : undefined,
      type,
      name,
      unit_number,
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

    const deleted = await User.deleteUser(user_id, req.user.user_id);

    if (deleted === null) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = { getUsers, createUser, updateUser, deleteUser };
