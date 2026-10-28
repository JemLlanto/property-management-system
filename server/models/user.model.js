const bcrypt = require("bcryptjs");
const { customAlphabet } = require("nanoid");
const { Decimal } = require("@prisma/client");

const prisma = require("../lib/prisma");

async function createUser(email, password) {
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
  createUser,
  findByEmail,
  findById,
  validatePassword,
  addRefreshToken,
  removeRefreshToken,
  hasRefreshToken,
};
