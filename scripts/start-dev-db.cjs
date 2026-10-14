// Start only the local PostgreSQL service using the same database credentials
// and host port as the Next.js/Prisma DATABASE_URL. Never print secrets.
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");

function readDatabaseUrl(envText) {
  const match = envText.match(/^\s*DATABASE_URL\s*=\s*(.*?)\s*$/m);
  if (!match) throw new Error("Thiếu DATABASE_URL trong .env.");
  const raw = match[1].trim();
  return (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))
    ? raw.slice(1, -1)
    : raw;
}

function getLocalDatabaseConfig(rawUrl) {
  let uri;
  try {
    uri = new URL(rawUrl);
  } catch {
    throw new Error("DATABASE_URL không phải PostgreSQL URL hợp lệ.");
  }

  if (!["postgresql:", "postgres:"].includes(uri.protocol)) {
    throw new Error("DATABASE_URL phải sử dụng giao thức PostgreSQL.");
  }
  if (!["127.0.0.1", "localhost", "[::1]"].includes(uri.hostname)) {
    throw new Error("db:up chỉ dành cho DATABASE_URL trỏ đến PostgreSQL trên máy cục bộ.");
  }

  const username = decodeURIComponent(uri.username);
  const password = decodeURIComponent(uri.password);
  const database = decodeURIComponent(uri.pathname.slice(1));
  const port = Number(uri.port || "5432");
  if (!username || !password || !database || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("DATABASE_URL thiếu user, password, database hoặc cổng hợp lệ.");
  }

  return { username, password, database, port };
}

function main() {
  const envFile = path.join(projectRoot, ".env");
  const rawUrl = process.env.DATABASE_URL || readDatabaseUrl(fs.readFileSync(envFile, "utf8"));
  const config = getLocalDatabaseConfig(rawUrl);
  console.log(`PostgreSQL local: 127.0.0.1:${config.port}/${config.database} (user: ${config.username}; mật khẩu được ẩn).`);

  if (process.argv.includes("--check")) return;

  const childEnv = {
    ...process.env,
    POSTGRES_USER: config.username,
    POSTGRES_PASSWORD: config.password,
    POSTGRES_DB: config.database,
    DEV_DB_PORT: String(config.port),
  };
  const docker = process.platform === "win32" ? "docker.exe" : "docker";
  const result = spawnSync(docker, ["compose", "-f", "compose.dev.yaml", "up", "-d", "db"], {
    cwd: projectRoot,
    env: childEnv,
    stdio: "inherit",
  });

  if (result.error) {
    throw new Error(`Không thể chạy Docker CLI (${result.error.code || "unknown"}). Hãy mở Docker Desktop (Linux engine) rồi thử lại.`);
  }
  if (result.status !== 0) {
    throw new Error("Docker Compose chưa khởi động được PostgreSQL. Kiểm tra Docker Desktop (Linux engine) và cổng database đang sử dụng.");
  }
  console.log("Đã yêu cầu Docker khởi động PostgreSQL. Tiếp tục kiểm tra: npx prisma migrate status");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { readDatabaseUrl, getLocalDatabaseConfig };
