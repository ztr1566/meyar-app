import {
  createSupplyItem,
  deleteSupplyItem,
  getSupplyItem,
  listSupplyItems,
  updateSupplyItem
} from '../services/supply-item.service.js';

export async function listSupplyItemsController(request, reply) {
  return reply.send(await listSupplyItems(request.validated.query));
}

export async function getSupplyItemController(request, reply) {
  return reply.send(await getSupplyItem(request.validated.params.id));
}

export async function createSupplyItemController(request, reply) {
  const item = await createSupplyItem(request.user, request.validated.body);
  return reply.code(201).send(item);
}

export async function updateSupplyItemController(request, reply) {
  const { id } = request.validated.params;
  return reply.send(await updateSupplyItem(id, request.user, request.validated.body));
}

export async function deleteSupplyItemController(request, reply) {
  const { id } = request.validated.params;
  await deleteSupplyItem(id, request.user);
  return reply.code(204).send();
}
