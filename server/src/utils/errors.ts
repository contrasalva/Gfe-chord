export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const createError = (statusCode: number, message: string, code?: string) =>
  new AppError(statusCode, message, code)
