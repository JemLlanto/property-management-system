require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRoutes = require("./routes/auth.route");
const itemRoutes = require("./routes/item.route");
const { requireAuth } = require("./middleware/auth.middleware");
const { testConnection } = require("./lib/prisma");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: (process.env.CLIENT_ORIGIN || "http://localhost:3000").split(","),
    credentials: true,
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/item", itemRoutes);

// Example protected route
app.get("/api/protected", requireAuth, (req, res) => {
  res.json({
    message: `Hello, ${req.user.email}. This is protected data.`,
  });
});

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await testConnection();
  } catch (err) {
    console.error("❌ Failed to connect to MySQL:", err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

start();
