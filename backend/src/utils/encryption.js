/**
 * Encryption Utilities
 * Handles encryption and decryption of sensitive data like API keys
 */

const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const secretKey = (process.env.ENCRYPTION_KEY || 'your-secret-key-change-in-production-32-chars!!').slice(0, 32).padEnd(32, '0');

/**
 * Encrypt API key or sensitive data
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in format "iv:encrypted"
 */
function encryptKey(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);

  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypt API key or sensitive data
 * @param {string} encryptedText - Encrypted text in format "iv:encrypted"
 * @returns {string} - Decrypted plain text
 */
function decryptKey(encryptedText) {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = Buffer.from(parts[1], 'hex');

  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

module.exports = {
  encryptKey,
  decryptKey,
};
