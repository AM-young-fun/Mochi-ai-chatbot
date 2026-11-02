import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { AdminAuth, hashPassword, isLocalRequest, setEnvValue, verifyPassword } from "../src/core/admin-auth.ts";

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "mochi-auth-"));

test("passwords are stored as salted scrypt hashes and verified the same way", () => {
  const a = hashPassword("correct horse");
  const b = hashPassword("correct horse");
  assert.match(a, /^scrypt\$16384\$8\$1\$/);
  assert.notEqual(a, b, "random salt");
  assert.ok(!a.includes("correct horse"));
  assert.ok(verifyPassword("correct horse", a));
  assert.ok(!verifyPassword("correct hors", a));
  assert.ok(!verifyPassword("anything", ""));
});

test("first visit: empty ADMIN_TOKEN asks for setup; the hash goes into the existing .env, other lines kept", () => {
  const dir = tmp();
  const envFile = path.join(dir, ".env");
  fs.writeFileSync(envFile, "PORT=3000\nADMIN_TOKEN=\nPUBLIC_URL=http://localhost:3000\n");
  const auth = new AdminAuth({ envValue: "", envFile, fallbackFile: path.join(dir, "admin-password") });
  assert.ok(auth.needsSetup);
  const { token, savedTo } = auth.setup("s3cret-pass", { local: true });
  assert.equal(savedTo, envFile);
  const text = fs.readFileSync(envFile, "utf8");
  assert.match(text, /^ADMIN_TOKEN=scrypt\$/m);
  assert.match(text, /^PORT=3000$/m);
  assert.match(text, /^PUBLIC_URL=http:\/\/localhost:3000$/m);
  assert.ok(!text.includes("s3cret-pass"), "the password itself is never written");
  assert.ok(!auth.needsSetup);
  assert.ok(auth.checkBearer(token));

  // After a restart, the hash from .env is what signs people in.
  const stored = text.match(/^ADMIN_TOKEN=(.*)$/m)![1];
  const again = new AdminAuth({ envValue: stored, envFile });
  assert.equal(again.login("s3cret-pass"), token, "same session token across restarts");
  assert.equal(again.login("wrong"), null);
  assert.ok(!again.checkBearer(stored), "the hash itself is not a bearer token");
  assert.ok(!again.checkBearer("s3cret-pass"), "nor is the password");

  // Forgot it: empty ADMIN_TOKEN and restart -> setup again.
  assert.ok(new AdminAuth({ envValue: "", envFile }).needsSetup);
});

test("a second setup is refused, and short passwords are rejected", () => {
  const auth = new AdminAuth({ envValue: "", fallbackFile: path.join(tmp(), "admin-password") });
  assert.throws(() => auth.setup("short", { local: true }), /at least 8/);
  auth.setup("long-enough", { local: true });
  assert.throws(() => auth.setup("another-one", { local: true }), /already set/);
});

test("setting the first password from another computer needs the setup code from the log", () => {
  const auth = new AdminAuth({ envValue: "", fallbackFile: path.join(tmp(), "admin-password") });
  assert.match(auth.setupCode, /^[0-9A-F]{4}-[0-9A-F]{4}$/);
  assert.throws(() => auth.setup("long-enough", { local: false }), /setup code/);
  assert.throws(() => auth.setup("long-enough", { local: false, code: "0000-0000" }), /setup code/);
  assert.ok(auth.needsSetup);
  auth.setup("long-enough", { local: false, code: auth.setupCode.toLowerCase().replace("-", " ") });
  assert.ok(!auth.needsSetup);
});

test("without a .env (Docker --env-file), the hash is kept in the data folder", () => {
  const dir = tmp();
  const fallbackFile = path.join(dir, "admin-password");
  const auth = new AdminAuth({ envValue: "", envFile: path.join(dir, ".env"), fallbackFile });
  assert.equal(auth.setup("long-enough", { local: true }).savedTo, fallbackFile);
  assert.ok(!fs.existsSync(path.join(dir, ".env")), "doesn't create a .env that would vanish with the container");
  const restarted = new AdminAuth({ envValue: "", envFile: path.join(dir, ".env"), fallbackFile });
  assert.ok(!restarted.needsSetup);
  assert.ok(restarted.login("long-enough"));
});

test("old setups keep working: a plain-text ADMIN_TOKEN signs in and works as a bearer token", () => {
  const auth = new AdminAuth({ envValue: "my-old-token" });
  assert.ok(auth.isLegacyPlaintext);
  assert.ok(auth.checkBearer("my-old-token"));
  assert.ok(auth.login("my-old-token"));
  assert.ok(!auth.checkBearer("nope"));
  assert.ok(new AdminAuth({ envValue: "change-me" }).needsSetup, "the old placeholder is not a password");
});

test("changing the password invalidates old sessions", () => {
  const a = new AdminAuth({ envValue: hashPassword("first-password") });
  const b = new AdminAuth({ envValue: hashPassword("second-password") });
  assert.ok(!b.checkBearer(a.login("first-password")!));
});

test("only direct loopback requests count as local", () => {
  assert.ok(isLocalRequest("127.0.0.1", {}));
  assert.ok(isLocalRequest("::1", {}));
  assert.ok(isLocalRequest("::ffff:127.0.0.1", {}));
  assert.ok(!isLocalRequest("10.0.0.5", {}));
  assert.ok(!isLocalRequest("127.0.0.1", { "x-forwarded-for": "203.0.113.9" }), "a reverse proxy on the same host is not local");
});

test("setEnvValue replaces or appends one key", () => {
  assert.equal(setEnvValue("A=1\nADMIN_TOKEN=\nB=2\n", "ADMIN_TOKEN", "x"), "A=1\nADMIN_TOKEN=x\nB=2\n");
  assert.equal(setEnvValue("A=1", "ADMIN_TOKEN", "x"), "A=1\nADMIN_TOKEN=x\n");
});
