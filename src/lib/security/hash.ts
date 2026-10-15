import { createHash, randomBytes } from "node:crypto";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function visitorHash(ip: string, userAgent: string, salt: string): string {
  return sha256(`${salt}|${ip}|${userAgent}`).slice(0, 32);
}

export function hourBucket(date = new Date()): string {
  return date.toISOString().slice(0, 13);
}

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}
