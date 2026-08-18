import {
  createRfq,
  deleteRfq,
  getRfq,
  listRfqs,
  updateRfq
} from '../services/rfq.service.js';

export async function listRfqsController(request, reply) {
  return reply.send(await listRfqs(request.validated.query));
}

export async function getRfqController(request, reply) {
  return reply.send(await getRfq(request.validated.params.id));
}

export async function createRfqController(request, reply) {
  const rfq = await createRfq(request.user.id, request.validated.body);
  return reply.code(201).send(rfq);
}

export async function updateRfqController(request, reply) {
  const { id } = request.validated.params;
  return reply.send(await updateRfq(id, request.user.id, request.validated.body));
}

export async function deleteRfqController(request, reply) {
  const { id } = request.validated.params;
  await deleteRfq(id, request.user.id);
  return reply.code(204).send();
}
