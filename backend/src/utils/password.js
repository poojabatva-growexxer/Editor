import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;
const PASSWORD_REGEX = /^(?=.*\d).{8,}$/;

/**
 * Throws if password doesn't meet requirements:
 * min 8 chars, at least 1 number.
 */
export function validatePassword(password) {
  if (!password || !PASSWORD_REGEX.test(password)) {
    const err = new Error(
      "Password must be at least 8 characters and contain at least 1 number."
    );
    err.statusCode = 400;
    throw err;
  }
}

export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}