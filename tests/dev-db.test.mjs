import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { readDatabaseUrl, getLocalDatabaseConfig } = require("../scripts/start-dev-db.cjs");

test("reads a quoted DATABASE_URL without exposing other .env entries", () => {
  assert.equal(
    readDatabaseUrl('AUTH_URL="http://localhost:3000"\nDATABASE_URL="postgresql://vehicle:secret@localhost:55432/vehicle_expenses?schema=public"\n'),
    "postgresql://vehicle:secret@localhost:55432/vehicle_expenses?schema=public",
  );
});

test("local Compose config derives host port and decodes credentials", () => {
  assert.deepEqual(
    getLocalDatabaseConfig("postgresql://myuser:pass%40word@127.0.0.1:55432/vehicle_expenses?schema=public"),
    { username: "myuser", password: "pass@word", database: "vehicle_expenses", port: 55432 },
  );
});

test("default PostgreSQL port is 5432", () => {
  assert.equal(getLocalDatabaseConfig("postgres://vehicle:secret@localhost/data").port, 5432);
});

test("refuses to launch local Compose for remote database", () => {
  assert.throws(
    () => getLocalDatabaseConfig("postgresql://vehicle:secret@db.example.com:5432/data"),
    /máy cục bộ/,
  );
});

test("rejects URLs without required credentials", () => {
  assert.throws(() => getLocalDatabaseConfig("postgresql://vehicle@localhost:5432/data"), /thiếu user/);
});
