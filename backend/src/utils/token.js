import jwt from "jsonwebtoken";
import crypto from "crypto";

const REFRESH_EXPIRES_MS =
  process.env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000;

/**
 * Signs a short-lived JWT access token (default: 15m).
 */
export function signAccessToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });
}

/**
 * Verifies a JWT access token and returns the payload.
 * Throws if invalid or expired.
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

/**
 * Generates a cryptographically random opaque refresh token.
 */
export function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

/**
 * Returns the expiry Date for a new refresh token.
 */
export function refreshTokenExpiresAt() {
  return new Date(Date.now() + REFRESH_EXPIRES_MS);
}