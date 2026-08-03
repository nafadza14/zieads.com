import { pbkdf2Sync, randomBytes } from 'crypto';

/**
 * Hash a password using PBKDF2 with a random salt.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored hash.
 */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const verifyHash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  } catch (err) {
    return false;
  }
}
