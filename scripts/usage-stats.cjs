#!/usr/bin/env node
// Read-only usage statistics for trusted server operators; no web endpoint.
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log("Usage: npm run stats:users [-- --json]");
  console.log("On the server: docker compose exec -T web node scripts/usage-stats.cjs");
  process.exit(0);
}
if (args.some((arg) => arg !== "--json")) {
  console.error("Only --json and --help are supported.");
  process.exit(2);
}

// Docker Compose injects DATABASE_URL. When run from the repository root,
// also support a local .env without printing any secrets.
if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === "function") {
    process.loadEnvFile(envPath);
  }
}
if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL. Run inside the web container or configure .env.");
  process.exit(1);
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Return aggregate counts only; no user IDs, names, e-mail, or session tokens.
  const now = new Date();
  const day1 = new Date(now.getTime() - 86400000);
  const day7 = new Date(now.getTime() - 7 * 86400000);
  const day30 = new Date(now.getTime() - 30 * 86400000);

  const [row] = await prisma.$queryRaw`
    SELECT
      (SELECT COUNT(*) FROM "User") AS "registered",
      (SELECT COUNT(DISTINCT "userId") FROM "Account" WHERE "provider" = 'google') AS "googleLinked",
      (SELECT COUNT(DISTINCT "userId") FROM "Session" WHERE "expires" > ${now}) AS "unexpiredSessions",
      (SELECT COUNT(DISTINCT "actorId") FROM "AuditLog") AS "actorsEver",
      (SELECT COUNT(DISTINCT "actorId") FROM "AuditLog" WHERE "createdAt" >= ${day1}) AS "actors1Day",
      (SELECT COUNT(DISTINCT "actorId") FROM "AuditLog" WHERE "createdAt" >= ${day7}) AS "actors7Days",
      (SELECT COUNT(DISTINCT "actorId") FROM "AuditLog" WHERE "createdAt" >= ${day30}) AS "actors30Days",
      (SELECT COUNT(*) FROM "User" WHERE "createdAt" >= ${day30}) AS "newAccounts30Days"
  `;

  const counts = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, Number(value)]),
  );

  if (args.includes("--json")) {
    console.log(JSON.stringify({ calculatedAt: now.toISOString(), ...counts }, null, 2));
    return;
  }

  console.log(`CarLog – Thống kê sử dụng (${now.toISOString()})`);
  console.log(`Tài khoản đã tạo:                      ${counts.registered}`);
  console.log(`Người dùng đã liên kết Google:         ${counts.googleLinked}`);
  console.log(`Người có session chưa hết hạn:         ${counts.unexpiredSessions}`);
  console.log(`Người từng có thao tác nghiệp vụ:      ${counts.actorsEver}`);
  console.log(`Người có thao tác trong 24 giờ:        ${counts.actors1Day}`);
  console.log(`Người có thao tác trong 7 ngày:        ${counts.actors7Days}`);
  console.log(`Người có thao tác trong 30 ngày:       ${counts.actors30Days}`);
  console.log(`Tài khoản mới trong 30 ngày:          ${counts.newAccounts30Days}`);
  console.log("Lưu ý: Session chưa hết hạn không có nghĩa là đang trực tuyến.");
  console.log("AuditLog ghi thao tác nghiệp vụ, không ghi mọi lần xem trang/đăng nhập.");
}

main()
  .catch((error) => {
    // Error codes suffice for troubleshooting without exposing database URLs.
    console.error(`Không thể lấy thống kê (${error.code || error.name || "unknown"}).`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
