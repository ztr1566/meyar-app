import { prisma } from '../db/client.js';
import { assertOwner, forbidden, notFound } from '../errors.js';
import { PUBLIC_AUTHOR_SELECT } from './selects.js';

const SUPPLY_ITEM_SELECT = {
  id: true,
  title: true,
  category: true,
  price: true,
  unit: true,
  supplierId: true,
  stock: true,
  status: true,
  supplier: { select: PUBLIC_AUTHOR_SELECT }
};

function assertSupplier(actor) {
  if (actor?.role !== 'SUPPLIER') throw forbidden();
}

export function listSupplyItems({ limit, offset }) {
  return prisma.supplyItem.findMany({
    select: SUPPLY_ITEM_SELECT,
    orderBy: { id: 'desc' },
    take: limit,
    skip: offset
  });
}

export async function getSupplyItem(id) {
  const supplyItem = await prisma.supplyItem.findUnique({
    where: { id },
    select: SUPPLY_ITEM_SELECT
  });
  if (!supplyItem) throw notFound('Supply item not found');
  return supplyItem;
}

export function createSupplyItem(actor, supplyData) {
  assertSupplier(actor);
  return prisma.supplyItem.create({
    data: { ...supplyData, supplierId: actor.id },
    select: SUPPLY_ITEM_SELECT
  });
}

export async function updateSupplyItem(id, actor, supplyData) {
  assertSupplier(actor);
  const supplyItem = await prisma.supplyItem.findUnique({
    where: { id },
    select: { supplierId: true }
  });
  if (!supplyItem) throw notFound('Supply item not found');
  assertOwner(actor.id, supplyItem.supplierId);

  return prisma.supplyItem.update({
    where: { id },
    data: supplyData,
    select: SUPPLY_ITEM_SELECT
  });
}

export async function deleteSupplyItem(id, actor) {
  assertSupplier(actor);
  const supplyItem = await prisma.supplyItem.findUnique({
    where: { id },
    select: { supplierId: true }
  });
  if (!supplyItem) throw notFound('Supply item not found');
  assertOwner(actor.id, supplyItem.supplierId);

  return prisma.supplyItem.delete({
    where: { id },
    select: SUPPLY_ITEM_SELECT
  });
}
