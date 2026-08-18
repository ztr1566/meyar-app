import { createRequireRole } from '../auth/guard.js';
import { validate } from '../validation.js';
import { idParamsSchema, listQuerySchema } from '../schemas/common.js';
import { supplyItemCreateSchema, supplyItemUpdateSchema } from '../schemas/supply-item.js';
import {
  createSupplyItemController,
  deleteSupplyItemController,
  getSupplyItemController,
  listSupplyItemsController,
  updateSupplyItemController
} from '../controllers/supply-item.controller.js';

export async function supplyItemRoutes(app, { authenticate }) {
  const requireSupplier = createRequireRole('SUPPLIER');

  app.get('/', {
    preHandler: validate({ query: listQuerySchema })
  }, listSupplyItemsController);
  app.get('/:id', {
    preHandler: validate({ params: idParamsSchema })
  }, getSupplyItemController);
  app.post('/', {
    preHandler: [validate({ body: supplyItemCreateSchema }), authenticate, requireSupplier]
  }, createSupplyItemController);
  app.patch('/:id', {
    preHandler: [validate({ params: idParamsSchema, body: supplyItemUpdateSchema }), authenticate, requireSupplier]
  }, updateSupplyItemController);
  app.delete('/:id', {
    preHandler: [validate({ params: idParamsSchema }), authenticate, requireSupplier]
  }, deleteSupplyItemController);
}
