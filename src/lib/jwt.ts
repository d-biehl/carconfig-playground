import jwt from 'jsonwebtoken'

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

/**
 * Generates a JWT token for a user
 * @param payload - User information to encode in the token
 * @returns JWT token string
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions)
}

/**
 * Verifies and decodes a JWT token
 * @param token - JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}

/**
 * Decodes a JWT token without verifying the signature
 * Use only for non-security purposes like reading token expiration
 * @param token - JWT token to decode
 * @returns Decoded payload or null if malformed
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload
    return decoded
  } catch (error) {
    console.error('JWT decode error:', error)
    return null
  }
}

/**
 * Checks if a JWT token is expired
 * @param token - JWT token to check
 * @returns true if expired, false if valid
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) {
    return true
  }

  const currentTime = Math.floor(Date.now() / 1000)
  return decoded.exp < currentTime
}
