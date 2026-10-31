const User = require("../models/user.model");

// Role Based Access Control.
//
// The access token only carries the user id, so the role has to be
// resolved from the database on each request. The user record is cached
// on the request so several middlewares do not query it twice.
//
// ROLES
//   "Unit Owner"  → may reach the dashboard, their own payments and
//                    the settings pages only.
//   "Admin"       → may reach every management screen, but not the
//                    Super Admin screens.
//   "Super Admin" → may reach everything.
//
// The policy is defined per route group so a new route has to declare
// its own access explicitly — anything not listed here is denied to
// Unit Owners but open to staff.

const ROLES = {
  UNIT_OWNER: "Unit Owner",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

// Which roles may reach which route group.
const ROUTE_ACCESS = {
  dashboard: [ROLES.UNIT_OWNER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  payments: [ROLES.UNIT_OWNER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  reminders: [ROLES.UNIT_OWNER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  settings: [ROLES.UNIT_OWNER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  bills: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  buildings: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  expenses: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  users: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  audit: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
};

// Resolve the caller's role from the database and cache it on the
// request. The auth middleware has already verified the token, so the
// user id in it is trustworthy.
async function loadCaller(req) {
  if (req.caller) return req.caller;

  const user = await User.findById(req.user.user_id);

  if (!user) return null;

  const caller = {
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    type: user.type,
    unit_number: user.unit_number ?? null,
  };

  req.caller = caller;

  return caller;
}

// Restrict a route group to the roles listed in ROUTE_ACCESS. Unit
// Owners are blocked from management routes; staff keep their access.
function requireRoles(group) {
  const allowed = ROUTE_ACCESS[group];

  return async (req, res, next) => {
    try {
      if (!allowed) {
        // Unknown group — fail closed rather than opening a hole.
        return res
          .status(403)
          .json({ success: false, message: "Access denied" });
      }

      const caller = await loadCaller(req);

      if (!caller) {
        return res
          .status(401)
          .json({ success: false, message: "User not found" });
      }

      if (!allowed.includes(caller.type)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this resource",
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };
}

// Convenience helpers for the common cases.
const allowUnitOwners = (group) => requireRoles(group);
const staffOnly = (group) => requireRoles(group);

// Restrict a route to an explicit list of roles rather than a named
// group. Used for endpoints that are fine for staff but that Unit
// Owners must not reach (creating or deleting payments, the audit
// trail, per-bill owner breakdowns).
function requireRolesIn(roles) {
  return async (req, res, next) => {
    try {
      const caller = await loadCaller(req);

      if (!caller) {
        return res
          .status(401)
          .json({ success: false, message: "User not found" });
      }

      if (!roles.includes(caller.type)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this resource",
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };
}

// Staff only — admins and super admins.
const requireStaff = requireRolesIn([ROLES.ADMIN, ROLES.SUPER_ADMIN]);

module.exports = {
  ROLES,
  ROUTE_ACCESS,
  requireRoles,
  requireRolesIn,
  requireStaff,
  allowUnitOwners,
  staffOnly,
  loadCaller,
};
