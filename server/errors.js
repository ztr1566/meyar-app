export class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function mapError(error) {
  if (error instanceof AppError) return error;
  if (error?.code === 'P2002') return new AppError(409, 'CONFLICT', 'Resource already exists');
  if (error?.code === 'P2003') return new AppError(409, 'CONFLICT', 'Resource is still in use');
  if (error?.code === 'P2025') return new AppError(404, 'NOT_FOUND', 'Resource not found');
  return null;
}

export function badRequest(message = 'Bad request') {
  return new AppError(400, 'BAD_REQUEST', message);
}

export function unauthorized(message = 'Authentication required') {
  return new AppError(401, 'UNAUTHORIZED', message);
}

export function forbidden(message = 'You do not have permission to perform this action') {
  return new AppError(403, 'FORBIDDEN', message);
}

export function notFound(message = 'Resource not found') {
  return new AppError(404, 'NOT_FOUND', message);
}

export function assertOwner(actorId, ownerId) {
  if (actorId !== ownerId) throw forbidden();
}
