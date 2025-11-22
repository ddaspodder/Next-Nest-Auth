import jwt, { SignOptions, JwtPayload, TokenExpiredError } from 'jsonwebtoken';

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
  isRefresh = false,
): string {
  try {
    const secret = isRefresh
      ? process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_key'
      : process.env.JWT_SECRET || 'default_secret_key';
    return jwt.sign(payload as object, secret, options);
  } catch (err) {
    // Optionally log the error
    throw new Error(`Failed to sign JWT: ${(err as Error).message}`);
  }
}

/**
 * Validate and verify a JWT. Returns an object describing the result.
 */
export function validateJwt(
  token: string,
  isRefresh = false,
): JwtValidateResult {
  try {
    const secret = isRefresh
      ? process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_key'
      : process.env.JWT_SECRET || 'default_secret_key';
    const decoded = jwt.verify(token, secret);
    return { valid: true, expired: false, decoded };
  } catch (err: unknown) {
    // jsonwebtoken exposes TokenExpiredError for expired tokens
    const expired =
      err instanceof TokenExpiredError ||
      (err instanceof Error && err.name === 'TokenExpiredError');
    return { valid: false, expired, decoded: null };
  }
}
