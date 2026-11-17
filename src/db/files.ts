/**
 * Uploaded files the widget serves to visitors: custom LivLiv characters (.livliv) and peek pictures.
 *
 * They live in the database next to everything else, so a deploy with only DATABASE_URL (no disk)
 * keeps them. Files are named by a hash of their bytes, so the same upload twice is stored once
 * and every URL can be cached forever.
 */
import crypto from "node:crypto";
import zlib from "node:zlib";
import { ddl, type Db } from "./index.ts";

export const MAX_MODEL_BYTES = 20 * 1024 * 1024;
export const MAX_PICTURE_BYTES = 3 * 1024 * 1024;

export interface StoredFile {
  id: string;
  mime: string;
  data: Buffer;
}

const MIME: Record<string, string> = {
  livliv: "application/zip",
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export class FileStore {
  private constructor(private readonly db: Db) {}

  static async open(db: Db): Promise<FileStore> {
    await db.exec(
      ddl(
        db.dialect,
        `CREATE TABLE IF NOT EXISTS mochi_files (id TEXT PRIMARY KEY, mime TEXT NOT NULL, bytes {bigint} NOT NULL, data {blob} NOT NULL, created_at {bigint} NOT NULL)`,
      ),
    );
    return new FileStore(db);
  }

  /** Stores the bytes and returns the file's id, e.g. "3f9a…c1.webp". */
  async put(data: Buffer, ext: keyof typeof MIME): Promise<string> {
    const id = `${crypto.createHash("sha256").update(data).digest("hex").slice(0, 32)}.${ext}`;
    await this.db.run(`INSERT INTO mochi_files (id, mime, bytes, data, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`, [
      id,
      MIME[ext],
      data.length,
      data,
      Date.now(),
    ]);
    return id;
  }

  async get(id: string): Promise<StoredFile | undefined> {
    if (!/^[0-9a-f]{32}\.[a-z]{3,6}$/.test(id)) return undefined;
    const row = await this.db.get<{ id: string; mime: string; data: Uint8Array }>(`SELECT id, mime, data FROM mochi_files WHERE id = ?`, [id]);
    return row && { id: row.id, mime: row.mime, data: Buffer.from(row.data) };
  }
}

/** What kind of picture the bytes are (by their first bytes, not the file name), or null. */
export function pictureType(data: Buffer): "png" | "jpg" | "webp" | "gif" | null {
  if (data.length < 12) return null;
  if (data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "jpg";
  if (data.toString("latin1", 0, 4) === "RIFF" && data.toString("latin1", 8, 12) === "WEBP") return "webp";
  if (data.toString("latin1", 0, 4) === "GIF8") return "gif";
  return null;
}

/** Reads the named entries of a ZIP file (stored or deflated), from its central directory. */
export function readZip(data: Buffer, names: string[]): Map<string, Buffer> {
  const out = new Map<string, Buffer>();
  // End of central directory: the last "PK\5\6" within the final 64 KB + 22 bytes.
  let eocd = -1;
  for (let i = data.length - 22; i >= Math.max(0, data.length - 65_557); i--) {
    if (data.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("not a ZIP file");
  const count = data.readUInt16LE(eocd + 10);
  let p = data.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n++) {
    if (p + 46 > data.length || data.readUInt32LE(p) !== 0x02014b50) throw new Error("damaged ZIP file");
    const method = data.readUInt16LE(p + 10);
    const size = data.readUInt32LE(p + 20);
    const nameLen = data.readUInt16LE(p + 28);
    const extraLen = data.readUInt16LE(p + 30);
    const commentLen = data.readUInt16LE(p + 32);
    const local = data.readUInt32LE(p + 42);
    const name = data.toString("utf8", p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;
    if (!names.includes(name)) continue;
    if (data.readUInt32LE(local) !== 0x04034b50) throw new Error("damaged ZIP file");
    const start = local + 30 + data.readUInt16LE(local + 26) + data.readUInt16LE(local + 28);
    const raw = data.subarray(start, start + size);
    if (method === 0) out.set(name, Buffer.from(raw));
    else if (method === 8) out.set(name, zlib.inflateRawSync(raw, { maxOutputLength: 64 * 1024 * 1024 }));
    else throw new Error(`unsupported compression in ${name}`);
  }
  return out;
}

/**
 * Checks that the bytes are a LivLiv character and returns its name and cover picture (a transparent
 * full-body picture LivLiv puts in every export), which makes a good peek picture.
 */
export function inspectLivliv(data: Buffer): { name: string; cover?: { data: Buffer; ext: "png" | "jpg" | "webp" | "gif" } } {
  let entries: Map<string, Buffer>;
  try {
    entries = readZip(data, ["model.json"]);
  } catch {
    throw new Error("That isn't a .livliv file. Export your character from livliv.ai and upload the file it gives you.");
  }
  const raw = entries.get("model.json");
  let model: any;
  try { model = raw && JSON.parse(raw.toString("utf8")); } catch {}
  if (!model || !Array.isArray(model.layers) || !model.layers.length) {
    throw new Error("That .livliv file has no character in it (model.json is missing or empty).");
  }
  const coverName = typeof model.files?.cover === "string" ? model.files.cover : "";
  if (coverName) {
    try {
      const cover = readZip(data, [coverName]).get(coverName);
      const ext = cover && pictureType(cover);
      if (cover && ext && cover.length <= MAX_PICTURE_BYTES) return { name: String(model.name ?? ""), cover: { data: cover, ext } };
    } catch {}
  }
  return { name: String(model.name ?? "") };
}
