import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { serviceUnavailable } from "./AppError.js";

function key() {
  const configured = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!configured || configured.length < 32) throw serviceUnavailable("INTEGRATION_ENCRYPTION_KEY must be configured with at least 32 characters to store connected account credentials");
  return createHash("sha256").update(configured).digest();
}

export function encryptIntegrationCredentials(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptIntegrationCredentials<T>(value: string): T {
  const [version, iv, authTag, ciphertext] = value.split(".");
  if (version !== "v1" || !iv || !authTag || !ciphertext) throw serviceUnavailable("Connected account credentials could not be read; reconnect the integration");
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(authTag, "base64url"));
    const clear = Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
    return JSON.parse(clear) as T;
  } catch {
    throw serviceUnavailable("Connected account credentials could not be read; verify INTEGRATION_ENCRYPTION_KEY");
  }
}
