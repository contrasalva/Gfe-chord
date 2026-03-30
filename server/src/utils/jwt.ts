import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export const signAccessToken = (payload: JWTPayload): string =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)

export const signRefreshToken = (payload: JWTPayload): string =>
  jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions)

export const verifyAccessToken = (token: string): JWTPayload =>
  jwt.verify(token, JWT_SECRET) as JWTPayload

export const verifyRefreshToken = (token: string): JWTPayload =>
  jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload
