import crypto from "node:crypto";

/**
 * Generates a random 6-digit numeric OTP.
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hashes a string using SHA-256.
 * Useful for storing OTPs securely.
 */
export async function hashOTP(otp: string): Promise<string> {
  const hash = crypto.createHash("sha256");
  hash.update(otp);
  return hash.digest("hex");
}

/**
 * Verifies if a plain OTP matches a stored hash.
 */
export async function verifyOTPHash(otp: string, hash: string): Promise<boolean> {
  const currentHash = await hashOTP(otp);
  return currentHash === hash;
}
