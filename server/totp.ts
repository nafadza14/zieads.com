import { createHmac, randomBytes } from 'crypto';

/**
 * Decode a Base32 string to a Buffer.
 * Supports standard Google Authenticator Base32 alphabet.
 */
export function base32Decode(base32: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = base32.toUpperCase().replace(/=+$/, '');
  let bits = '';
  for (let i = 0; i < cleaned.length; i++) {
    const val = alphabet.indexOf(cleaned[i]);
    if (val === -1) {
      throw new Error('Invalid Base32 character: ' + cleaned[i]);
    }
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * Generate a random 16-character Base32 secret for TOTP.
 */
export function generateTOTPSecret(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  const bytes = randomBytes(10);
  for (let i = 0; i < bytes.length; i++) {
    result += alphabet[bytes[i] % alphabet.length];
  }
  return result;
}

/**
 * Verify a 6-digit TOTP token against a Base32 secret key.
 * Includes a ±1 time step window to account for network/clock latency.
 */
export function verifyTOTP(token: string, secret: string): boolean {
  try {
    if (!token || !secret) return false;
    // Clean up input token (remove spaces, etc.)
    const cleanToken = token.replace(/\s+/g, '');
    if (cleanToken.length !== 6 || isNaN(Number(cleanToken))) return false;

    const key = base32Decode(secret);
    // Time step is 30 seconds
    const counter = Math.floor(Date.now() / 1000 / 30);
    
    // Check current step, and ±1 step for clock drift
    for (let i = -1; i <= 1; i++) {
      const timeStep = counter + i;
      const buffer = Buffer.alloc(8);
      buffer.writeUInt32BE(0, 0); // High 32 bits
      buffer.writeUInt32BE(timeStep, 4); // Low 32 bits
      
      const hmac = createHmac('sha1', key);
      hmac.update(buffer);
      const hash = hmac.digest();
      
      const offset = hash[hash.length - 1] & 0xf;
      const binary = ((hash[offset] & 0x7f) << 24) |
                     ((hash[offset + 1] & 0xff) << 16) |
                     ((hash[offset + 2] & 0xff) << 8) |
                     (hash[offset + 3] & 0xff);
                     
      const code = (binary % 1000000).toString().padStart(6, '0');
      if (code === cleanToken) {
        return true;
      }
    }
  } catch (err) {
    console.error('[TOTP] Verification error:', err);
  }
  return false;
}
