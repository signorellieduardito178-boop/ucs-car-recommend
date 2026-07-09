import jwt from 'jsonwebtoken';

const SECRET = 'ucs-car-recommend-secret-key-2024';

export function signToken(payload: object) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET) as any;
  } catch {
    return null;
  }
}
