import { prisma } from '../db/client.js';
import { notFound, unauthorized } from '../errors.js';
import { hashPassword, signToken, verifyPassword } from '../auth/tokens.js';
import { PUBLIC_USER_SELECT } from './selects.js';

const INVALID_CREDENTIALS = 'Invalid email or password';
const REGISTRATION_ROLES = Object.freeze({
  CHEF: 'CHEF',
  SUPPLIER: 'SUPPLIER',
  USER: 'USER'
});

export async function registerUser(input, { secret }) {
  const email = input.email.toLowerCase();
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: input.name,
      handle: input.handle,
      role: REGISTRATION_ROLES[input.role] ?? REGISTRATION_ROLES.USER
    },
    select: PUBLIC_USER_SELECT
  });

  return { user, token: signToken(user.id, { secret }) };
}

export async function loginUser(input, { secret }) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    select: { ...PUBLIC_USER_SELECT, passwordHash: true }
  });

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw unauthorized(INVALID_CREDENTIALS);
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;
  return { user: publicUser, token: signToken(user.id, { secret }) };
}

export async function getCurrentUser(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: PUBLIC_USER_SELECT
  });
  if (!user) throw notFound('User not found');
  return user;
}
