const { verifyAccessToken } = require("../utils/tokens");

function requireAuth(req, res, next) {
  const token = req.cookies.accessToken;

  if (!token) {
    console.error("No access token found in cookies");
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { user_id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    // Covers both expired and invalid tokens.
    // Client should call /api/auth/refresh and retry.
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = { requireAuth };
