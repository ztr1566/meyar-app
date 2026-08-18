import { prisma } from '../db/client.js';
import { assertOwner, notFound } from '../errors.js';
import { PUBLIC_USER_SELECT } from './selects.js';

export function listUsers({ limit, offset }) {
  return prisma.user.findMany({
    select: PUBLIC_USER_SELECT,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset
  });
}

export async function getUser(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: PUBLIC_USER_SELECT
  });
  if (!user) throw notFound('User not found');
  return user;
}

export function updateUser(id, actorId, profile) {
  assertOwner(actorId, id);
  const { name, handle, avatar, bio, location } = profile;
  return prisma.user.update({
    where: { id },
    data: { name, handle, avatar, bio, location },
    select: PUBLIC_USER_SELECT
  });
}

export function deleteUser(id, actorId) {
  assertOwner(actorId, id);
  return prisma.user.delete({
    where: { id },
    select: PUBLIC_USER_SELECT
  });
}
