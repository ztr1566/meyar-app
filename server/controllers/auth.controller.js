import { getCurrentUser, loginUser, registerUser } from '../services/auth.service.js';

export async function registerController(request, reply, { secret }) {
  const result = await registerUser(request.validated.body, { secret });
  return reply.code(201).send(result);
}

export async function loginController(request, reply, { secret }) {
  const result = await loginUser(request.validated.body, { secret });
  return reply.send(result);
}

export async function meController(request, reply) {
  return reply.send(await getCurrentUser(request.user.id));
}
