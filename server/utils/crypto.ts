import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Encrypts a plaintext string using AES-256-CBC.
 * Expects process.env.ENCRYPTION_KEY to be a 64-character hex string (32 bytes).
 */
export function encrypt(text: string): string {
  if (!text) return '';
  const secretKeyHex = process.env.ENCRYPTION_KEY;
  if (!secretKeyHex || secretKeyHex.length !== 64 || !/^[0-9a-f]+$/i.test(secretKeyHex)) {
    throw new Error('ENCRYPTION_KEY environment variable must be exactly 64 hex characters (32 bytes)');
  }

  const key = Buffer.from(secretKeyHex, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a cipher text string using AES-256-CBC.
 * Expects process.env.ENCRYPTION_KEY to be a 64-character hex string (32 bytes).
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  const secretKeyHex = process.env.ENCRYPTION_KEY;
  if (!secretKeyHex || secretKeyHex.length !== 64 || !/^[0-9a-f]+$/i.test(secretKeyHex)) {
    throw new Error('ENCRYPTION_KEY environment variable must be exactly 64 hex characters (32 bytes)');
  }

  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = Buffer.from(parts[1], 'hex');
  const key = Buffer.from(secretKeyHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
