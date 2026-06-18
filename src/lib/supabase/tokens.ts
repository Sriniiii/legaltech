import crypto from 'crypto';

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-jwt-backup-secret-key-256';

export interface TokenPayload {
  partyId: string;
  agreementId: string;
  role: 'landlord' | 'tenant';
}

/**
 * Signs a payload to produce a cryptographically secure JWT string.
 * @param payload The token parameters containing party ID, agreement ID, and role.
 * @param expiresInDays Number of days until token expiration.
 */
export function signToken(
  payload: TokenPayload,
  expiresInDays = 7
): { token: string; expiresAt: Date } {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const headerObj = { alg: 'HS256', typ: 'JWT' };
  const bodyObj = {
    ...payload,
    exp: Math.floor(expiresAt.getTime() / 1000),
  };

  const headerEncoded = Buffer.from(JSON.stringify(headerObj)).toString('base64url');
  const bodyEncoded = Buffer.from(JSON.stringify(bodyObj)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(`${headerEncoded}.${bodyEncoded}`)
    .digest('base64url');

  return {
    token: `${headerEncoded}.${bodyEncoded}.${signature}`,
    expiresAt,
  };
}

/**
 * Decodes and verifies a JWT token's signature and expiration date.
 * Returns decoded payload if valid, otherwise null.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;

    // Verify cryptographic signature
    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      console.warn('Cryptographic signature verification failed for token.');
      return null;
    }

    // Decode and parse payload
    const decodedBodyJson = Buffer.from(body, 'base64url').toString('utf8');
    const bodyObj = JSON.parse(decodedBodyJson);

    // Verify expiration timestamp
    if (bodyObj.exp && Math.floor(Date.now() / 1000) > bodyObj.exp) {
      console.warn('Cryptographic token has expired.');
      return null;
    }

    if (!bodyObj.partyId || !bodyObj.agreementId || !bodyObj.role) {
      return null;
    }

    return {
      partyId: bodyObj.partyId,
      agreementId: bodyObj.agreementId,
      role: bodyObj.role,
    };
  } catch (err) {
    console.error('Error verifying token:', err);
    return null;
  }
}
