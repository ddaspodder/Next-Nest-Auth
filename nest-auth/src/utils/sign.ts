import jwt, { SignOptions, JwtPayload, TokenExpiredError } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

export interface JwtValidateResult {
  valid: boolean;
  expired?: boolean;
  decoded?: string | JwtPayload | null;
}

/**
 * Sign a payload into a JWT string.
 * - `payload` should be a plain object containing claims.
 * - `options` are the standard jsonwebtoken `SignOptions`.
 */
export function signJwt(
  payload: Record<string, unknown>,
  options?: SignOptions,
): string {
  try {
    return jwt.sign(payload as object, JWT_SECRET, options);
  } catch (err) {
    // Optionally log the error
    throw new Error(`Failed to sign JWT: ${(err as Error).message}`);
  }
}

/**
 * Validate and verify a JWT. Returns an object describing the result.
 */
export function validateJwt(token: string): JwtValidateResult {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, expired: false, decoded };
  } catch (err: unknown) {
    // jsonwebtoken exposes TokenExpiredError for expired tokens
    const expired =
      err instanceof TokenExpiredError ||
      (err instanceof Error && err.name === 'TokenExpiredError');
    return { valid: false, expired, decoded: null };
  }
}
