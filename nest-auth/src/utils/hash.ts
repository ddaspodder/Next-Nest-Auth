import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

// Properly type the promisified scrypt to return a Buffer
const scrypt = promisify(_scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedBuf = await scrypt(password, salt, 64);
  const stored = `${salt}:${derivedBuf.toString('hex')}`;
  return stored;
}

export async function verifyPassword(
  stored: string,
  suppliedPassword: string,
): Promise<boolean> {
  const [saltFromDb, keyFromDb] = stored.split(':');
  const derivedBuf = await scrypt(suppliedPassword, saltFromDb, 64);
  const keyBuf = Buffer.from(keyFromDb, 'hex');
  if (derivedBuf.length !== keyBuf.length) return false;
  return timingSafeEqual(derivedBuf, keyBuf);
}
