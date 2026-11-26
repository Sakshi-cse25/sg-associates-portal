const crypto = require('node:crypto');

const SCRYPT_KEYLEN = 64;

/**
 * Generates a salted scrypt password hash formatted as "salt:derivedKeyHex".
 * @param {string} plainTextPassword
 * @returns {string}
 */
function hashPassword(plainTextPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plainTextPassword, salt, SCRYPT_KEYLEN).toString('hex');
  return `${salt}:${derived}`;
}

/**
 * Verifies a plaintext password against a stored "salt:derivedKeyHex" hash
 * using constant-time comparison to prevent timing side-channel attacks.
 * @param {string} plainTextPassword
 * @param {string} storedHash
 * @returns {boolean}
 */
function verifyPassword(plainTextPassword, storedHash) {
  if (typeof plainTextPassword !== 'string' || typeof storedHash !== 'string') {
    return false;
  }
  const parts = storedHash.split(':');
  if (parts.length !== 2) {
    return false;
  }
  const [salt, keyHex] = parts;
  const expectedBuffer = Buffer.from(keyHex, 'hex');
  const actualBuffer = crypto.scryptSync(plainTextPassword, salt, SCRYPT_KEYLEN);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

module.exports = { hashPassword, verifyPassword };
