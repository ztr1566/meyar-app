import { prisma } from '../db/client.js';
import { assertOwner, badRequest, notFound } from '../errors.js';
import { PUBLIC_AUTHOR_SELECT } from './selects.js';

const RFQ_SELECT = {
  id: true,
  title: true,
  description: true,
  budget: true,
  deadline: true,
  status: true,
  requesterId: true,
  requester: { select: PUBLIC_AUTHOR_SELECT }
};

export function listRfqs({ limit, offset }) {
  return prisma.rfq.findMany({
    select: RFQ_SELECT,
    orderBy: { deadline: 'asc' },
    take: limit,
    skip: offset
  });
}

export async function getRfq(id) {
  const rfq = await prisma.rfq.findUnique({
    where: { id },
    select: RFQ_SELECT
  });
  if (!rfq) throw notFound('RFQ not found');
  return rfq;
}

export function createRfq(actorId, rfqData) {
  if (rfqData.requesterId !== actorId) {
    throw badRequest('RFQ requester must match authenticated user');
  }

  return prisma.rfq.create({
    data: {
      title: rfqData.title,
      description: rfqData.description,
      budget: rfqData.budget,
      deadline: new Date(rfqData.deadline),
      status: 'OPEN',
      requesterId: actorId
    },
    select: RFQ_SELECT
  });
}

export async function updateRfq(id, actorId, rfqData) {
  const rfq = await prisma.rfq.findUnique({
    where: { id },
    select: { requesterId: true }
  });
  if (!rfq) throw notFound('RFQ not found');
  assertOwner(actorId, rfq.requesterId);

  const updateData = { ...rfqData };
  delete updateData.requesterId;
  if (updateData.deadline) updateData.deadline = new Date(updateData.deadline);

  return prisma.rfq.update({
    where: { id },
    data: updateData,
    select: RFQ_SELECT
  });
}

export async function deleteRfq(id, actorId) {
  const rfq = await prisma.rfq.findUnique({
    where: { id },
    select: { requesterId: true }
  });
  if (!rfq) throw notFound('RFQ not found');
  assertOwner(actorId, rfq.requesterId);

  return prisma.rfq.delete({
    where: { id },
    select: RFQ_SELECT
  });
}
