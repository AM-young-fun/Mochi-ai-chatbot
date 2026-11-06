/**
 * Dashboard admin password.
 *
 * ADMIN_TOKEN in .env holds the password, either as a scrypt hash written by the dashboard
 * ("scrypt$16384$8$1$<salt>$<hash>") or, for older setups and scripts, as plain text.
 *
 * - Empty ADMIN_TOKEN (the default): the dashboard asks for a new password on the first visit
 *   and writes its hash into .env. To reset a forgotten password, empty ADMIN_TOKEN and restart.
 * - When .env can't be written (e.g. Docker with --env-file), the hash goes to data/admin-password
 *   instead; delete that file to reset.
 * - Setting the first password from the same computer just works. From anywhere else it also needs
 *   a one-time setup code printed in the server log, so nobody can claim a fresh public server.
 *
 * The browser never keeps the password: signing in returns a session token derived from the
 * stored hash, which changes whenever the password does.
 */
import crypto from "node:crypto";
import fs from "node:fs";

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32 } as const;
const PREFIX = "scrypt$";
export const MIN_PASSWORD_LENGTH = 8;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `${PREFIX}${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function isHashed(stored: string): boolean {
  return stored.startsWith(PREFIX);
}

/** Checks a password against a stored value: a scrypt hash, or a legacy plain-text token. */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  if (!isHashed(stored)) return safeEqual(Buffer.from(password), Buffer.from(stored));
  const [, n, r, p, saltB64, hashB64] = stored.split("$");
  const want = Buffer.from(hashB64 ?? "", "base64");
  if (!want.length) return false;
  try {
    const got = crypto.scryptSync(password, Buffer.from(saltB64 ?? "", "base64"), want.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 64 * 1024 * 1024,
    });
    return safeEqual(got, want);
  } catch {
    return false;
  }
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Replaces (or adds) ADMIN_TOKEN=... in a .env file's text, leaving every other line alone. */
export function setEnvValue(text: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(text)) return text.replace(re, line);
  return (text && !text.endsWith("\n") ? text + "\n" : text) + line + "\n";
}

export interface AdminAuthOptions {
  /** ADMIN_TOKEN from the environment at startup. */
  envValue?: string;
  /** Path of the .env file to write the hash into (null: don't write .env). */
  envFile?: string | null;
  /** Fallback file for the hash when .env can't be written. */
  fallbackFile?: string | null;
  /** Or any other place for it (the database): its current value, and how to save a new one. */
  fallback?: { value?: string; where: string; save(hash: string): void } | null;
}

export class AdminAuth {
  private stored: string;
  /** One-time code needed to set the first password from another computer. */
  readonly setupCode: string;
  private readonly envFile: string | null;
  private readonly fallbackFile: string | null;
  private readonly fallback: AdminAuthOptions["fallback"];

  constructor(opts: AdminAuthOptions = {}) {
    this.envFile = opts.envFile ?? null;
    this.fallbackFile = opts.fallbackFile ?? null;
    this.fallback = opts.fallback ?? null;
    let stored = (opts.envValue ?? "").trim();
    // The old default is not a password.
    if (stored === "change-me") stored = "";
    if (!stored && this.fallback?.value) stored = this.fallback.value.trim();
    if (!stored && this.fallbackFile && fs.existsSync(this.fallbackFile)) {
      stored = fs.readFileSync(this.fallbackFile, "utf8").trim();
    }
    this.stored = stored;
    this.setupCode = crypto.randomBytes(4).toString("hex").toUpperCase().replace(/(.{4})/, "$1-");
  }

  /** True until a password has been set. */
  get needsSetup(): boolean {
    return !this.stored;
  }

  /** Legacy plain-text ADMIN_TOKEN (still accepted as a bearer token for scripts). */
  get isLegacyPlaintext(): boolean {
    return !!this.stored && !isHashed(this.stored);
  }

  /** Session token for the dashboard: derived from the stored secret, so it rotates with the password. */
  sessionToken(): string {
    return crypto.createHmac("sha256", this.stored).update("mochi-admin-session-v1").digest("base64url");
  }

  /** Is this bearer token a valid session (or, for a legacy setup, the plain-text token itself)? */
  checkBearer(bearer: string): boolean {
    if (!this.stored || !bearer) return false;
    if (safeEqual(Buffer.from(bearer), Buffer.from(this.sessionToken()))) return true;
    return this.isLegacyPlaintext && safeEqual(Buffer.from(bearer), Buffer.from(this.stored));
  }

  login(password: string): string | null {
    return verifyPassword(password, this.stored) ? this.sessionToken() : null;
  }

  /**
   * Sets the first password. Returns where the hash was saved. Throws if a password exists already,
   * if the password is too short, or if a remote request has the wrong setup code.
   */
  setup(password: string, opts: { local: boolean; code?: string }): { token: string; savedTo: string } {
    if (!this.needsSetup) throw new AuthError(409, "A password is already set. Sign in instead.");
    if (!opts.local) {
      const want = Buffer.from(this.setupCode.replace("-", ""));
      const got = Buffer.from(String(opts.code ?? "").replace(/[\s-]/g, "").toUpperCase());
      if (!safeEqual(got, want)) throw new AuthError(403, "Wrong setup code. It's printed in the Mochi server log.");
    }
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH)
      throw new AuthError(400, `Use at least ${MIN_PASSWORD_LENGTH} characters.`);
    const hash = hashPassword(password);
    const savedTo = this.persist(hash);
    this.stored = hash;
    return { token: this.sessionToken(), savedTo };
  }

  private persist(hash: string): string {
    // Only edit a .env that exists: inside Docker (--env-file) there is none, and one created in the
    // container would vanish with it, so the data folder (a volume) is the durable place.
    if (this.envFile && fs.existsSync(this.envFile)) {
      try {
        fs.writeFileSync(this.envFile, setEnvValue(fs.readFileSync(this.envFile, "utf8"), "ADMIN_TOKEN", hash));
        return this.envFile;
      } catch {
        // Read-only or not ours (Docker --env-file): fall back to the data folder.
      }
    }
    if (this.fallback) {
      this.fallback.save(hash);
      return this.fallback.where;
    }
    if (this.fallbackFile) {
      fs.writeFileSync(this.fallbackFile, hash + "\n", { mode: 0o600 });
      return this.fallbackFile;
    }
    throw new AuthError(500, "Couldn't save the password: .env isn't writable and there is no data folder.");
  }
}

export class AuthError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

/** A request is local when it comes straight from this machine, not through a proxy. */
export function isLocalRequest(remoteAddress: string | undefined, headers: Record<string, unknown>): boolean {
  if (headers["x-forwarded-for"] || headers["forwarded"] || headers["x-real-ip"]) return false;
  return remoteAddress === "127.0.0.1" || remoteAddress === "::1" || remoteAddress === "::ffff:127.0.0.1";
}
