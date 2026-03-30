import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, JWTPayload } from '../utils/jwt'
import { AppError } from '../utils/errors'

export interface AuthRequest extends Request {
  user?: JWTPayload
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError(401, 'Token requerido', 'UNAUTHORIZED'))
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    req.user = verifyAccessToken(token)
    next()
  } catch {
    next(new AppError(401, 'Token inválido o expirado', 'INVALID_TOKEN'))
  }
}

export const requireRole = (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'No autenticado', 'UNAUTHORIZED'))
      return
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError(403, 'Sin permisos para esta acción', 'FORBIDDEN'))
      return
    }

    next()
  }
