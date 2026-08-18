import { prisma } from '../db/client.js';
import { unauthorized, forbidden } from '../errors.js';
import { authorizationSchema } from '../schemas/auth.js';
import { PUBLIC_USER_SELECT } from '../services/selects.js';
import { verifyToken } from './tokens.js';

export function createAuthenticate({ secret }) {
  return async (request) => {
    const authorization = request.headers?.authorization;
    const result = authorizationSchema.safeParse(authorization);
    if (!result.success) throw unauthorized();

    const [, token] = result.data.split(/\s+/);
    const userId = verifyToken(token, { secret });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_USER_SELECT
    });
    if (!user) throw unauthorized();
    request.user = user;
  };
}

export function createRequireRole(role) {
  return async (request) => {
    if (request.user?.role !== role) throw forbidden();
  };
}
