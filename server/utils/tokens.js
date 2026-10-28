const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES;
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES;

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.user_id, email: user.email },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRES,
    },
  );
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user.user_id }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
}

// Converts "15m" / "7d" style strings to milliseconds for cookie maxAge.
function expiryToMs(expiry) {
  const match = /^(\d+)([smhd])$/i.exec(expiry);

  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const value = Number(match[1]);

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[match[2].toLowerCase()];
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES,
  accessTokenMaxAge: expiryToMs(ACCESS_TOKEN_EXPIRES),
  refreshTokenMaxAge: expiryToMs(REFRESH_TOKEN_EXPIRES),
};
