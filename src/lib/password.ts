import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePasswords(
  plain: string,
  hashed: string
): Promise<boolean> {
  if (!hashed) return false;
  return bcrypt.compare(plain, hashed);
}
