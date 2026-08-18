import { deleteUser, getUser, listUsers, updateUser } from '../services/user.service.js';

export async function listUsersController(request, reply) {
  return reply.send(await listUsers(request.validated.query));
}

export async function getUserController(request, reply) {
  return reply.send(await getUser(request.validated.params.id));
}

export async function updateUserController(request, reply) {
  const { id } = request.validated.params;
  return reply.send(await updateUser(id, request.user.id, request.validated.body));
}

export async function deleteUserController(request, reply) {
  const { id } = request.validated.params;
  await deleteUser(id, request.user.id);
  return reply.code(204).send();
}
