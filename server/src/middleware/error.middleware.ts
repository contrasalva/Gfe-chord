import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors'

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      ok: false,
      code: err.code ?? 'APP_ERROR',
      message: err.message,
    })
    return
  }

  console.error('[Unhandled Error]', err)

  res.status(500).json({
    ok: false,
    code: 'INTERNAL_ERROR',
    message: 'Error interno del servidor',
  })
}
