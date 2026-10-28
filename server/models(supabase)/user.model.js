const bcrypt = require("bcryptjs");
const { supabase } = require("../lib/supabase");
const { customAlphabet } = require("nanoid");

async function createUser(email, password) {
  const existing = await findByEmail(email);
  if (existing) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = customAlphabet("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 12)();
  console.log("Generated User ID:", userId);
  

  const { data, error } = await supabase
    .from("users")
    .insert({ user_id: userId, email, password: passwordHash, refresh_tokens: [] })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function findByEmail(email) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function findById(user_id) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", user_id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function validatePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

async function addRefreshToken(user, token) {
  const updated = [...user.refresh_tokens, token];
  const { error } = await supabase
    .from("users")
    .update({ refresh_tokens: updated })
    .eq("user_id", user.user_id);

  if (error) throw new Error(error.message);
}

async function removeRefreshToken(user, token) {
  const updated = user.refresh_tokens.filter((t) => t !== token);
  const { error } = await supabase
    .from("users")
    .update({ refresh_tokens: updated })
    .eq("user_id", user.user_id);

  if (error) throw new Error(error.message);
}

function hasRefreshToken(user, token) {
  return user.refresh_tokens.includes(token);
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