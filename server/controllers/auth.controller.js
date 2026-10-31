const User = require("../models/user.model");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  accessTokenMaxAge,
  refreshTokenMaxAge,
} = require("../utils/tokens");

const isProd = process.env.NODE_ENV === "production";

// Shared cookie options. `secure` requires HTTPS, so it's only forced on in
// production — locally over http:// the cookie wouldn't be set otherwise.
const baseCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax", // use "none" (with secure:true) if frontend is on a different domain
  path: "/",
};

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge: accessTokenMaxAge,
  });
  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions,
    maxAge: refreshTokenMaxAge,
    path: "/api/auth/refresh", // only sent to the refresh endpoint
  });
}

function clearAuthCookies(res) {
  res.clearCookie("accessToken", { ...baseCookieOptions });
  res.clearCookie("refreshToken", {
    ...baseCookieOptions,
    path: "/api/auth/refresh",
  });
}

async function register(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.createUser(email, password);

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    await User.addRefreshToken(user, refreshToken);

    setAuthCookies(res, accessToken, refreshToken);
    return res.status(201).json({
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        type: user.type,
        name: user.name,
        unit_number: user.unit_number,
        building: user.building ?? null,
      },
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function login(req, res) {
  const { email, identifier, password } = req.body;
  // The client may send the identifier as "email" (legacy) or "identifier"
  const loginIdentifier = (identifier || email || "").trim();

  if (!loginIdentifier || !password) {
    return res.status(400).json({
      success: false,
      message: "Email/username and password are required",
    });
  }

  // Matches on email, unit number, or display name
  const user = await User.findByIdentifier(loginIdentifier);
  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
    console.log("User not found for identifier:", loginIdentifier);
  }

  const valid = await User.validatePassword(password, user.password);
  if (!valid) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await User.addRefreshToken(user, refreshToken);

  setAuthCookies(res, accessToken, refreshToken);
  return res.json({
    success: true,
    user: {
      user_id: user.user_id,
      email: user.email,
      type: user.type,
      name: user.name,
      unit_number: user.unit_number,
      building: user.building ?? null,
    },
  });
}

async function refresh(req, res) {
  const token = req.cookies.refreshToken;
  if (!token) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub);

    if (!user || !User.hasRefreshToken(user, token)) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Rotate the refresh token so a stolen old one becomes useless.
    await User.removeRefreshToken(user, token);
    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);
    await User.addRefreshToken(user, newRefreshToken);

    setAuthCookies(res, newAccessToken, newRefreshToken);
    return res.json({ message: "Token refreshed" });
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token" });
  }
}

async function logout(req, res) {
  const token = req.cookies.refreshToken;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      const user = await User.findById(payload.sub);
      if (user) await User.removeRefreshToken(user, token);
    } catch {
      // token was already invalid/expired — nothing to clean up
    }
  }

  clearAuthCookies(res);
  return res.json({ success: true, message: "Logged out" });
}

async function me(req, res) {
  const user = await User.findById(req.user.user_id);
  // console.log("User found in me endpoint:", user);
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({
    success: true,
    user: {
      user_id: user.user_id,
      email: user.email,
      type: user.type,
      name: user.name,
      unit_number: user.unit_number,
      building: user.building ?? null,
    },
  });
}

// Change the signed-in user's own password. All refresh tokens are
// revoked, so every other session must log in again.
async function changePassword(req, res) {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: "Current and new passwords are required",
      });
    }

    await User.changePassword(req.user.user_id, current_password, new_password);

    clearAuthCookies(res);

    return res.json({
      success: true,
      message: "Password changed. Please sign in again.",
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = { register, login, refresh, logout, me, changePassword };
