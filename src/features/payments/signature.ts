import { createHmac, timingSafeEqual } from "node:crypto";

function safeEqual(expected: string, received: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Razorpay sends a hex HMAC-SHA256 of the raw body in `x-razorpay-signature`. */
export function verifyRazorpaySignature(rawBody: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}

/** Cashfree signs `timestamp + rawBody` and base64-encodes the HMAC-SHA256 digest. */
export function verifyCashfreeSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature || !secret || !timestamp) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}${rawBody}`).digest("base64");
  return safeEqual(expected, signature);
}
