import "server-only";

import { importJWK, CompactEncrypt, compactDecrypt } from "jose";
import { scryptSync } from "crypto";
import db from "./db";
import { cookies } from "next/headers";

const SALT = process.env.SESSION_SALT;
const KEY_LENGTH = 32; // 256-bit key for A256GCM

function base64url(buf) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret)
    throw new Error(
      "SESSION_SECRET environment variable is required for session encryption"
    );
  const keyBuf = scryptSync(secret, SALT, KEY_LENGTH);
  const jwk = { kty: "oct", k: base64url(keyBuf) };
  return importJWK(jwk, "A256GCM");
}

/**
 * Encrypt a JS value (object) for storing in a cookie or DB using JWE (compact serialization).
 * Returns the compact JWE string.
 */
export async function encryptSessionData(data) {
  try {
    const key = await getKey();
    const encoder = new TextEncoder();
    const enc = encoder.encode(JSON.stringify(data));
    const jwe = await new CompactEncrypt(enc)
      .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
      .encrypt(key);
    return jwe;
  } catch (err) {
    console.log("Error in encrypting session data:", err);
    throw err;
  }
}

/**
 * Decrypt a compact JWE string produced by `encryptSessionData` and return the original value.
 */
export async function decryptSessionData(token) {
  if (!token) return null;
  try {
    const key = await getKey();
    const { plaintext } = await compactDecrypt(token, key);
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(plaintext));
  } catch (err) {
    throw new Error("Invalid session token" + err.message);
  }
}

export async function createSession(userId) {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 1 day expiry
  try {
    const stmt = db.prepare(
      "INSERT INTO sessions (expires_at, user_id) VALUES (?, ?)"
    );

    const info = await stmt.run(expiresAt, userId);

    const row = db
      .prepare("SELECT id FROM sessions WHERE rowid = ?")
      .get(info.lastInsertRowid);

    const sessionId = row ? row.id : String(info.lastInsertRowid);

    const encryptedSessionData = await encryptSessionData({
      sessionId,
      expiresAt,
    });

    const cookieStore = await cookies();

    cookieStore.set("session", encryptedSessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(expiresAt), // 1 day
    });

    return null;
  } catch (err) {
    console.log("Error in creating session:", err);
    throw err;
  }
}

export async function getSessionById(sessionId) {
  const stmt = db.prepare("SELECT * FROM sessions WHERE id = ?");
  return stmt.get(sessionId);
}

export async function deleteSession() {
  try {
    throw new Error("Delete session not implemented");
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (sessionCookie) {
      const session = await decryptSessionData(sessionCookie.value);
      if (session) {
        const { sessionId } = session;
        if (sessionId) {
          const stmt = db.prepare("DELETE FROM sessions WHERE id = ?");
          await stmt.run(sessionId);
        }
      }
    }
    cookieStore.delete("session", { path: "/" });
  } catch (err) {
    console.log("Error in deleting session:", err);
    throw err;
  }
}
