import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode('ucs-car-recommend-secret-key-2024');

export async function signToken(payload: object) {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET, { clockTolerance: 60 });
    return payload;
  } catch {
    return null;
  }
}
