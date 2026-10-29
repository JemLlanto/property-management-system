const bcrypt = require("bcryptjs");
const { customAlphabet } = require("nanoid");
const { Decimal } = require("@prisma/client");

const prisma = require("../lib/prisma");

const USER_TYPES = ["Unit Owner", "Admin", "Super Admin"];

async function createUser(email, password, extra = {}) {
  const existing = await findByEmail(email);

  if (existing) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const userId = customAlphabet(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    12,
  )();

  console.log("Generated User ID:", userId);

  const user = await prisma.user.create({
    data: {
      user_id: userId,
      email,
      password: passwordHash,
      type: extra.type || "Unit Owner",
      name: extra.name || null,
      unit_number: extra.unit_number || null,
      refresh_tokens: [],
    },
  });

  return parseUser(user);
}

async function findByEmail(email) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  return parseUser(user);
}

async function findById(user_id) {
  const user = await prisma.user.findUnique({
    where: { user_id },
  });

  if (!user) {
    return null;
  }

  return parseUser(user);
}

async function validatePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

async function addRefreshToken(user, token) {
  const refreshTokens = user.refresh_tokens || [];

  const updated = [...refreshTokens, token];

  await prisma.user.update({
    where: { user_id: user.user_id },
    data: { refresh_tokens: updated },
  });
}

async function removeRefreshToken(user, token) {
  const refreshTokens = user.refresh_tokens || [];

  const updated = refreshTokens.filter((t) => t !== token);

  await prisma.user.update({
    where: { user_id: user.user_id },
    data: { refresh_tokens: updated },
  });
}

function hasRefreshToken(user, token) {
  const refreshTokens = user.refresh_tokens || [];

  return refreshTokens.includes(token);
}

// List all users, newest first, without password hashes
async function getAllUsers() {
  const users = await prisma.user.findMany({
    orderBy: { created_at: "desc" },
  });

  return users.map(toPublicUser);
}

// Admin-facing create: generates a temporary password and returns it once.
// Email is optional — when name AND email are blank, the unit number becomes
// both the username (stored in email) and the password.
async function createUserByAdmin({ email, type, name, unit_number }) {
  const hasEmail = Boolean(email && String(email).trim());
  const hasName = Boolean(name && String(name).trim());

  // Blank name + blank email → unit number is the username and the password
  if (!hasEmail && !hasName) {
    if (!unit_number || !String(unit_number).trim()) {
      throw new Error(
        "Unit number is required when email and name are blank",
      );
    }

    const username = String(unit_number).trim();
    const existing = await findByEmail(username);

    if (existing) {
      throw new Error(`A user with unit number "${username}" already exists`);
    }

    const user = await prisma.user.create({
      data: {
        user_id: customAlphabet(
          "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
          12,
        )(),
        email: username, // unit number doubles as the login identifier
        password: await bcrypt.hash(username, 10), // password = unit number
        type,
        name: null,
        unit_number: type === "Unit Owner" ? username : null,
        refresh_tokens: [],
      },
    });

    // The password is the unit number itself, so nothing else to hand over
    return { user: toPublicUser(parseUser(user)), tempPassword: username };
  }

  // Email provided (or name provided with blank email) — original flow
  if (!hasEmail) {
    throw new Error("Email is required when a name is provided");
  }

  const existing = await findByEmail(email);

  if (existing) {
    throw new Error("A user with this email already exists");
  }

  // Generate a readable temporary password; the user can change it later.
  const tempPassword = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10)();

  const user = await prisma.user.create({
    data: {
      user_id: customAlphabet(
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        12,
      )(),
      email: String(email).trim().toLowerCase(),
      password: await bcrypt.hash(tempPassword, 10),
      type,
      name: name || null,
      unit_number: type === "Unit Owner" ? unit_number || null : null,
      refresh_tokens: [],
    },
  });

  return { user: toPublicUser(parseUser(user)), tempPassword };
}

async function updateUser(user_id, { email, type, name, unit_number }) {
  const data = {};

  if (email !== undefined) data.email = email;
  if (type !== undefined) {
    if (!USER_TYPES.includes(type)) {
      throw new Error("Invalid user type");
    }
    data.type = type;
  }
  if (name !== undefined) data.name = name;
  if (unit_number !== undefined) data.unit_number = unit_number;

  const user = await prisma.user.update({
    where: { user_id },
    data,
  });

  return toPublicUser(parseUser(user));
}

async function deleteUser(user_id, requesterId) {
  if (user_id === requesterId) {
    throw new Error("You cannot delete your own account");
  }

  const user = await prisma.user.findUnique({ where: { user_id } });

  if (!user) {
    return null;
  }

  await prisma.user.delete({ where: { user_id } });

  return true;
}

// Strip password hash and refresh tokens from any user object
function toPublicUser(user) {
  const { password, refresh_tokens, ...safe } = user;

  return safe;
}

function parseUser(user) {
  return {
    ...user,
    refresh_tokens:
      typeof user.refresh_tokens === "string"
        ? JSON.parse(user.refresh_tokens)
        : user.refresh_tokens || [],
  };
}

module.exports = {
  USER_TYPES,
  createUser,
  createUserByAdmin,
  getAllUsers,
  updateUser,
  deleteUser,
  findByEmail,
  findById,
  validatePassword,
  addRefreshToken,
  removeRefreshToken,
  hasRefreshToken,
};
