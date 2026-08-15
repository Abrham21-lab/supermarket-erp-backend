import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Generate a secure random reset token
 * @returns {string}
 */
export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a password
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Compare plain password with hashed password
 * @param {string} password
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Check password strength
 * Returns:
 * weak | medium | strong
 */
export function passwordStrength(password) {
  let score = 0;

  // Length
  if (password.length >= 8) score++;

  // Uppercase
  if (/[A-Z]/.test(password)) score++;

  // Lowercase
  if (/[a-z]/.test(password)) score++;

  // Number
  if (/\d/.test(password)) score++;

  // Special character
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  if (score <= 2) return "weak";
  if (score <= 4) return "medium";
  return "strong";
}

/**
 * Validate password according to ERP security rules.
 * Returns:
 * {
 *    valid: boolean,
 *    errors: []
 * }
 */
export function validatePassword(password) {
  const errors = [];

  if (!password) {
    errors.push("Password is required.");
  }

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number.");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}