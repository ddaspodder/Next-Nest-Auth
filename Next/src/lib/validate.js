import jwt, { TokenExpiredError } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key";

export function validateJwt(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, expired: false, decoded };
  } catch (err) {
    // jsonwebtoken exposes TokenExpiredError for expired tokens
    const expired =
      err instanceof TokenExpiredError ||
      (err instanceof Error && err.name === "TokenExpiredError");
    return { valid: false, expired, decoded: null };
  }
}
