require("dotenv").config({ quiet: true });

const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const { PrismaClient } = require("@prisma/client");

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  connectionLimit: 10,
  connectTimeout: 5000,
});

const prisma = new PrismaClient({
  adapter,
  log: ["warn", "error"],
});

async function testConnection() {
  await prisma.$queryRaw`SELECT 1`;
  console.log("✅ MySQL connected (Prisma)");
}

async function disconnect() {
  await prisma.$disconnect();
}

module.exports = prisma;
module.exports.testConnection = testConnection;
module.exports.disconnect = disconnect;
